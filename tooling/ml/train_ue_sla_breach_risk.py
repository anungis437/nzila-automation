#!/usr/bin/env python3
"""
tooling/ml/train_ue_sla_breach_risk.py

Trains a binary GradientBoostingClassifier on ue_case_sla_dataset_v1
to predict SLA breach risk (P(breach) ∈ 0..1).

Threshold selection:
  We choose a threshold that maximises recall ≥ 0.80 while keeping
  precision reasonably high. This prioritises surfacing at-risk cases
  early ('high recall') over false-positive minimisation.
  The chosen threshold and its rationale are documented in metrics.json.

Steps:
  1.  Download dataset CSV from Blob
  2.  Feature engineering + encoding
  3.  Train/val/test split via split_key
  4.  Train GradientBoostingClassifier (fixed random_state=42)
  5.  Evaluate ROC-AUC, PR-AUC on test split
  6.  Select threshold for target recall ≥ 0.80
  7.  Compute precision/recall/f1/confusion matrix at threshold
  8.  Upload artifacts + register model

Usage:
  python tooling/ml/train_ue_sla_breach_risk.py \\
    --entity-id <uuid> \\
    --dataset-id <uuid> \\
    --dataset-blob-path exports/.../dataset.csv \\
    [--n-estimators 200] \\
    [--max-depth 3] \\
    [--learning-rate 0.05] \\
    [--target-recall 0.80] \\
    [--version 1] \\
    [--created-by system]

Requires: DATABASE_URL, AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY
"""
from __future__ import annotations

import argparse
import io
import json
import sys
import traceback
from pathlib import Path
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    precision_recall_curve,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
)
from sklearn.preprocessing import OrdinalEncoder

sys.path.insert(0, str(Path(__file__).parent))
from lib.io_blob import download_blob, upload_bytes
from lib.metrics import build_supervised_binary_metrics, to_json
from lib import db_write

MODEL_KEY = "ue.sla_breach_risk_v1"
DATASET_KEY = "ue_case_sla_dataset_v1"
CONTAINER = "exports"
RANDOM_STATE = 42

CATEGORICAL_FEATURES = ["category", "channel", "currentStatus", "assignedQueue"]
NUMERIC_FEATURES = [
    "reopenCount",
    "messageCount",
    "attachmentCount",
    "dayOfWeek",
    "hourOfDay",
    "ageHoursAtSnapshot",
]

log_lines: list[str] = []


def log(msg: str) -> None:
    ts = datetime.now(timezone.utc).isoformat()
    line = f"[{ts}] {msg}"
    print(line, file=sys.stderr)
    log_lines.append(line)


def choose_threshold_by_recall(
    proba: np.ndarray,
    y_true: np.ndarray,
    target_recall: float = 0.80,
) -> tuple[float, str]:
    """
    Select the lowest threshold that achieves recall ≥ target_recall.
    Falls back to the threshold maximising F1 if target recall is unachievable.
    Returns (threshold, rationale_string).
    """
    precisions, recalls, thresholds = precision_recall_curve(y_true, proba)
    # precision_recall_curve returns len(thresholds) = len(precisions) - 1
    # We ignore the last point (threshold=1.0 appended by sklearn)
    for prec, rec, thr in sorted(
        zip(precisions[:-1], recalls[:-1], thresholds), key=lambda x: x[2]
    ):
        if rec >= target_recall:
            return float(thr), (
                f"Lowest threshold achieving recall ≥ {target_recall:.0%}; "
                f"precision={prec:.3f}, recall={rec:.3f} at threshold={thr:.4f}"
            )

    # Fallback: maximise F1
    f1s = 2 * precisions[:-1] * recalls[:-1] / (precisions[:-1] + recalls[:-1] + 1e-10)
    best_idx = int(np.argmax(f1s))
    thr = float(thresholds[best_idx])
    rationale = (
        f"Target recall {target_recall:.0%} not achievable; "
        f"using F1-maximising threshold={thr:.4f} "
        f"(precision={precisions[best_idx]:.3f}, recall={recalls[best_idx]:.3f})"
    )
    return thr, rationale


def main() -> None:
    parser = argparse.ArgumentParser(description="Train UE SLA breach binary classifier")
    parser.add_argument("--entity-id", required=True)
    parser.add_argument("--dataset-id", required=True)
    parser.add_argument("--dataset-blob-path", required=True)
    parser.add_argument("--n-estimators", type=int, default=200)
    parser.add_argument("--max-depth", type=int, default=3)
    parser.add_argument("--learning-rate", type=float, default=0.05)
    parser.add_argument("--target-recall", type=float, default=0.80,
                        help="Desired minimum recall for SLA breach detection (default 0.80)")
    parser.add_argument("--version", type=int, default=1)
    parser.add_argument("--created-by", default="system")
    args = parser.parse_args()

    org_id = args.org_id
    dataset_id = args.dataset_id
    blob_path = args.dataset_blob_path
    version = args.version
    created_by = args.created_by
    target_recall = args.target_recall

    run_id = db_write.start_training_run(org_id, MODEL_KEY, dataset_id)
    db_write.insert_audit_event(
        org_id=org_id,
        actor=created_by,
        action="ml.training_started",
        target_type="ml_training_run",
        target_id=run_id,
        after_json={"modelKey": MODEL_KEY, "datasetId": dataset_id, "version": version},
    )

    try:
        log(f"Training {MODEL_KEY} v{version} for entity {org_id}")
        log(f"Target recall: {target_recall:.0%}")

        # ── 1. Download dataset ───────────────────────────────────────────────
        tmp_csv = Path(f"/tmp/ue_sla_{run_id}.csv")
        dataset_sha256 = download_blob(CONTAINER, blob_path, tmp_csv)
        log(f"Dataset sha256: {dataset_sha256}")

        # ── 2. Load + validate ────────────────────────────────────────────────
        df = pd.read_csv(tmp_csv)
        log(f"Loaded {len(df)} rows, {df.shape[1]} columns")

        required_cols = CATEGORICAL_FEATURES + NUMERIC_FEATURES + ["y_sla_breached", "split_key"]
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise ValueError(f"Dataset missing columns: {missing}")

        df[NUMERIC_FEATURES] = df[NUMERIC_FEATURES].fillna(0)
        for col in CATEGORICAL_FEATURES:
            df[col] = df[col].fillna("unknown").str.lower().str.strip()

        df["y_sla_breached"] = df["y_sla_breached"].fillna(0).astype(int)

        # ── 3. Deterministic split ────────────────────────────────────────────
        train_df = df[df["split_key"] <= 7].copy()
        val_df   = df[df["split_key"] == 8].copy()
        test_df  = df[df["split_key"] == 9].copy()
        log(f"Split: train={len(train_df)}, val={len(val_df)}, test={len(test_df)}")

        if len(train_df) == 0:
            raise ValueError("Train split is empty.")
        if len(test_df) == 0:
            raise ValueError("Test split is empty; cannot evaluate.")

        # Class balance
        breach_count = int(train_df["y_sla_breached"].sum())
        no_breach_count = int(len(train_df) - breach_count)
        log(f"Train class balance: breach={breach_count}, no_breach={no_breach_count}")
        class_balance_train = {"breach": breach_count, "no_breach": no_breach_count}

        # ── 4. Encode categoricals ────────────────────────────────────────────
        enc = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
        enc.fit(train_df[CATEGORICAL_FEATURES])

        encoding_maps: dict[str, dict[str, int]] = {}
        for i, col in enumerate(CATEGORICAL_FEATURES):
            encoding_maps[col] = {
                str(cat): int(idx)
                for idx, cat in enumerate(enc.categories_[i])
            }

        def transform_X(frame: pd.DataFrame) -> np.ndarray:
            cat_enc = enc.transform(frame[CATEGORICAL_FEATURES])
            num = frame[NUMERIC_FEATURES].values.astype(float)
            return np.hstack([num, cat_enc])

        X_train = transform_X(train_df)
        X_test  = transform_X(test_df)
        y_train = train_df["y_sla_breached"].values
        y_test  = test_df["y_sla_breached"].values

        # ── 5. Train ──────────────────────────────────────────────────────────
        hyperparams = {
            "n_estimators": args.n_estimators,
            "max_depth": args.max_depth,
            "learning_rate": args.learning_rate,
            "random_state": RANDOM_STATE,
            "subsample": 0.8,
        }
        log(f"Training GradientBoostingClassifier: {hyperparams}")
        clf = GradientBoostingClassifier(**hyperparams)
        clf.fit(X_train, y_train)
        log("Training complete")

        # ── 6. Test evaluation ─────────────────────────────────────────────────
        proba_test = clf.predict_proba(X_test)[:, 1]
        roc_auc = float(roc_auc_score(y_test, proba_test))
        pr_auc  = float(average_precision_score(y_test, proba_test))
        log(f"ROC-AUC: {roc_auc:.4f}  PR-AUC: {pr_auc:.4f}")

        # ── 7. Threshold selection ────────────────────────────────────────────
        threshold, threshold_rationale = choose_threshold_by_recall(
            proba_test, y_test, target_recall=target_recall
        )
        log(f"Selected threshold: {threshold:.4f}")
        log(f"Rationale: {threshold_rationale}")

        y_pred = (proba_test >= threshold).astype(int)
        test_prec = float(precision_score(y_test, y_pred, zero_division=0))
        test_rec  = float(recall_score(y_test, y_pred, zero_division=0))
        test_f1   = float(f1_score(y_test, y_pred, zero_division=0))
        cm        = confusion_matrix(y_test, y_pred, labels=[0, 1]).tolist()

        log(f"At threshold {threshold:.4f}: precision={test_prec:.3f} recall={test_rec:.3f} f1={test_f1:.3f}")
        log(f"Confusion matrix (no_breach/breach): {cm}")

        # ── 8. Feature spec ────────────────────────────────────────────────────
        all_features = NUMERIC_FEATURES + CATEGORICAL_FEATURES
        feature_spec = {
            "numeric_features": NUMERIC_FEATURES,
            "categorical_features": CATEGORICAL_FEATURES,
            "all_features": all_features,
            "encoding_maps": encoding_maps,
            "chosen_threshold": float(threshold),
        }

        # ── 9. Serialise artifacts ─────────────────────────────────────────────
        model_obj = {
            "clf": clf,
            "ordinal_encoder": enc,
            "feature_spec": feature_spec,
            "threshold": threshold,
        }
        model_bytes_io = io.BytesIO()
        joblib.dump(model_obj, model_bytes_io)
        model_bytes = model_bytes_io.getvalue()

        metrics = build_supervised_binary_metrics(
            model_key=MODEL_KEY,
            algorithm="gradient_boosting_classifier",
            dataset_sha256=dataset_sha256,
            dataset_key=DATASET_KEY,
            period_start="",
            period_end="",
            n_train=len(train_df),
            n_val=len(val_df),
            n_test=len(test_df),
            feature_names=all_features,
            roc_auc=roc_auc,
            pr_auc=pr_auc,
            chosen_threshold=threshold,
            threshold_rationale=threshold_rationale,
            precision_at_threshold=test_prec,
            recall_at_threshold=test_rec,
            f1_at_threshold=test_f1,
            confusion_matrix=cm,
            class_balance_train=class_balance_train,
            hyperparams=hyperparams,
            feature_spec=feature_spec,
        )
        metrics_json_bytes = to_json(metrics).encode()
        log_bytes = "\n".join(log_lines).encode()

        # ── 10. Upload to Blob ─────────────────────────────────────────────────
        run_blob_prefix = f"exports/{org_id}/ml/models/{MODEL_KEY}/{run_id}"
        model_sha, model_size = upload_bytes(CONTAINER, f"{run_blob_prefix}/model.joblib", model_bytes)
        metrics_sha, metrics_size = upload_bytes(CONTAINER, f"{run_blob_prefix}/metrics.json", metrics_json_bytes, "application/json")
        log_sha, log_size = upload_bytes(CONTAINER, f"{run_blob_prefix}/train.log", log_bytes, "text/plain")

        # ── 11. Register documents ─────────────────────────────────────────────
        artifact_doc_id = db_write.insert_document(
            org_id=org_id, category="other",
            title=f"UE SLA Risk Model v{version} — model.joblib ({MODEL_KEY})",
            blob_container=CONTAINER, blob_path=f"{run_blob_prefix}/model.joblib",
            content_type="application/octet-stream", size_bytes=model_size,
            sha256=model_sha, uploaded_by=created_by, linked_type="ml_model_artifact",
        )
        metrics_doc_id = db_write.insert_document(
            org_id=org_id, category="other",
            title=f"UE SLA Risk Model v{version} — metrics.json ({MODEL_KEY})",
            blob_container=CONTAINER, blob_path=f"{run_blob_prefix}/metrics.json",
            content_type="application/json", size_bytes=metrics_size,
            sha256=metrics_sha, uploaded_by=created_by, linked_type="ml_metrics",
        )
        logs_doc_id = db_write.insert_document(
            org_id=org_id, category="other",
            title=f"UE SLA Risk Model v{version} — train.log ({MODEL_KEY})",
            blob_container=CONTAINER, blob_path=f"{run_blob_prefix}/train.log",
            content_type="text/plain", size_bytes=log_size,
            sha256=log_sha, uploaded_by=created_by, linked_type="ml_training_log",
        )

        # ── 12. Register model (draft) ─────────────────────────────────────────
        model_id = db_write.register_model(
            org_id=org_id,
            model_key=MODEL_KEY,
            algorithm="gradient_boosting_classifier",
            version=version,
            training_dataset_id=dataset_id,
            artifact_document_id=artifact_doc_id,
            metrics_document_id=metrics_doc_id,
            hyperparams=hyperparams,
            feature_spec=feature_spec,
        )

        # ── 13. Finish training run ────────────────────────────────────────────
        db_write.finish_training_run(
            run_id, status="success",
            artifact_document_id=artifact_doc_id,
            metrics_document_id=metrics_doc_id,
            logs_document_id=logs_doc_id,
        )

        for action, extra in [
            ("ml.training_completed", {"modelKey": MODEL_KEY, "modelId": model_id, "status": "success",
                                        "rocAuc": roc_auc, "prAuc": pr_auc,
                                        "chosenThreshold": threshold}),
            ("ml.model_registered", {"modelKey": MODEL_KEY, "version": version, "status": "draft",
                                      "artifactDocumentId": artifact_doc_id,
                                      "metricsDocumentId": metrics_doc_id}),
        ]:
            db_write.insert_audit_event(
                org_id=org_id, actor=created_by, action=action,
                target_type="ml_training_run" if "completed" in action else "ml_model",
                target_id=run_id if "completed" in action else model_id,
                after_json=extra,
            )

        log(f"✔ Model registered: {model_id} (status=draft)")
        log(f"  ROC-AUC={roc_auc:.4f}  PR-AUC={pr_auc:.4f}  threshold={threshold:.4f}")

    except Exception as exc:  # noqa: BLE001
        tb = traceback.format_exc()
        log(f"ERROR: {exc}\n{tb}")
        db_write.finish_training_run(run_id, status="failed", error=str(exc))
        db_write.insert_audit_event(
            org_id=org_id, actor=created_by,
            action="ml.training_failed", target_type="ml_training_run", target_id=run_id,
            after_json={"modelKey": MODEL_KEY, "error": str(exc)},
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
