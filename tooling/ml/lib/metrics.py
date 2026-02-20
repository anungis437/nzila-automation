"""
tooling/ml/lib/metrics.py

Standardised metrics collection for ML training runs.
Supports both unsupervised (IsolationForest) and supervised (classification) models.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

import numpy as np


def build_training_metrics(
    *,
    model_key: str,
    dataset_sha256: str,
    dataset_key: str,
    period_start: str,
    period_end: str,
    n_train: int,
    feature_names: list[str],
    scores: np.ndarray,
    threshold: float,
    hyperparams: dict[str, Any],
    feature_spec: dict[str, Any],
) -> dict[str, Any]:
    """Build a standardised metrics JSON for a training run."""
    anomaly_mask = scores < threshold
    return {
        "schema_version": "1.0",
        "model_key": model_key,
        "algorithm": "isolation_forest",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset": {
            "sha256": dataset_sha256,
            "dataset_key": dataset_key,
            "period_start": period_start,
            "period_end": period_end,
            "n_train": n_train,
        },
        "hyperparams": hyperparams,
        "features": {
            "names": feature_names,
            "count": len(feature_names),
        },
        "score_distribution": {
            "min": float(np.min(scores)),
            "max": float(np.max(scores)),
            "mean": float(np.mean(scores)),
            "std": float(np.std(scores)),
            "p5": float(np.percentile(scores, 5)),
            "p25": float(np.percentile(scores, 25)),
            "p50": float(np.percentile(scores, 50)),
            "p75": float(np.percentile(scores, 75)),
            "p95": float(np.percentile(scores, 95)),
        },
        "threshold": float(threshold),
        "anomaly_rate_train": float(anomaly_mask.sum() / len(scores)),
        "feature_spec": feature_spec,
    }


def to_json(metrics: dict[str, Any]) -> str:
    return json.dumps(metrics, indent=2, default=str)


# ── Supervised classification metrics ─────────────────────────────────────────

def build_supervised_multiclass_metrics(
    *,
    model_key: str,
    algorithm: str,
    dataset_sha256: str,
    dataset_key: str,
    period_start: str,
    period_end: str,
    n_train: int,
    n_val: int,
    n_test: int,
    feature_names: list[str],
    classes: list[str],
    accuracy: float,
    macro_f1: float,
    confusion_matrix: list[list[int]],
    per_class_precision: dict[str, float],
    per_class_recall: dict[str, float],
    per_class_f1: dict[str, float],
    hyperparams: dict[str, Any],
    feature_spec: dict[str, Any],
    calibration_summary: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build a standardised metrics JSON for a supervised multi-class training run."""
    return {
        "schema_version": "1.1",
        "model_key": model_key,
        "algorithm": algorithm,
        "task": "multiclass_classification",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset": {
            "sha256": dataset_sha256,
            "dataset_key": dataset_key,
            "period_start": period_start,
            "period_end": period_end,
            "n_train": n_train,
            "n_val": n_val,
            "n_test": n_test,
        },
        "hyperparams": hyperparams,
        "features": {
            "names": feature_names,
            "count": len(feature_names),
        },
        "classes": classes,
        "test_metrics": {
            "accuracy": float(accuracy),
            "macro_f1": float(macro_f1),
            "confusion_matrix": confusion_matrix,
            "per_class_precision": {k: float(v) for k, v in per_class_precision.items()},
            "per_class_recall": {k: float(v) for k, v in per_class_recall.items()},
            "per_class_f1": {k: float(v) for k, v in per_class_f1.items()},
        },
        **({"calibration_summary": calibration_summary} if calibration_summary else {}),
        "feature_spec": feature_spec,
    }


def build_supervised_binary_metrics(
    *,
    model_key: str,
    algorithm: str,
    dataset_sha256: str,
    dataset_key: str,
    period_start: str,
    period_end: str,
    n_train: int,
    n_val: int,
    n_test: int,
    feature_names: list[str],
    roc_auc: float,
    pr_auc: float,
    chosen_threshold: float,
    threshold_rationale: str,
    precision_at_threshold: float,
    recall_at_threshold: float,
    f1_at_threshold: float,
    confusion_matrix: list[list[int]],
    class_balance_train: dict[str, int],
    hyperparams: dict[str, Any],
    feature_spec: dict[str, Any],
) -> dict[str, Any]:
    """Build a standardised metrics JSON for a supervised binary classification run."""
    return {
        "schema_version": "1.1",
        "model_key": model_key,
        "algorithm": algorithm,
        "task": "binary_classification",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset": {
            "sha256": dataset_sha256,
            "dataset_key": dataset_key,
            "period_start": period_start,
            "period_end": period_end,
            "n_train": n_train,
            "n_val": n_val,
            "n_test": n_test,
        },
        "hyperparams": hyperparams,
        "features": {
            "names": feature_names,
            "count": len(feature_names),
        },
        "test_metrics": {
            "roc_auc": float(roc_auc),
            "pr_auc": float(pr_auc),
            "chosen_threshold": float(chosen_threshold),
            "threshold_rationale": threshold_rationale,
            "precision_at_threshold": float(precision_at_threshold),
            "recall_at_threshold": float(recall_at_threshold),
            "f1_at_threshold": float(f1_at_threshold),
            "confusion_matrix": confusion_matrix,
        },
        "class_balance_train": class_balance_train,
        "feature_spec": feature_spec,
    }
