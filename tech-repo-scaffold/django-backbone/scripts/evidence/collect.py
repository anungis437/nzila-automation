#!/usr/bin/env python3
"""
ABR Evidence Collector
======================
Collects CI/test artifacts into an artifacts.json manifest with SHA-256
hashes.  Mirrors the NzilaOS evidence pipeline (collect → seal → verify).  # noqa: RUF001
# cSpell:ignore Nzila sarif cyclonedx

Usage:
    python scripts/evidence/collect.py [--output <dir>]

Outputs:
    <output>/artifacts.json  — manifest of hashed artifact files

Environment:
    ARTIFACT_DIR   Override base artifact search directory (default: .)
"""
import argparse
import hashlib
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

# Candidate artifact paths (relative to project root or common CI output dirs).
# Missing files are skipped (not an error); their absence IS noted in the manifest.
ARTIFACT_CANDIDATES: list[tuple[str, str]] = [
    # name                         relative path
    ("pip-audit-report", "audit-report.json"),
    ("pip-audit-report-ci", "ci-outputs/audit-report.json"),
    ("trivy-sarif", "trivy-results.sarif"),  # cSpell:ignore sarif
    ("trivy-sarif-ci", "ci-outputs/trivy-results.sarif"),
    ("sbom-cyclonedx", "sbom.json"),  # cSpell:ignore cyclonedx
    ("sbom-cyclonedx-ci", "ci-outputs/sbom.json"),
    ("django-migration-check", "ci-outputs/migration-check.txt"),
    ("pytest-results", "ci-outputs/pytest-results.xml"),
    ("pytest-coverage", "ci-outputs/coverage.xml"),
    ("bandit-report", "ci-outputs/bandit-report.json"),
    ("safety-report", "ci-outputs/safety-report.json"),
]


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def collect(base_dir: Path, output_dir: Path) -> dict[str, Any]:
    found: list[dict[str, Any]] = []
    missing: list[str] = []

    for name, rel_path in ARTIFACT_CANDIDATES:
        candidate = base_dir / rel_path
        if candidate.exists():
            digest = sha256_file(candidate)
            entry: dict[str, Any] = {
                "name": name,
                "path": rel_path,
                "sha256": digest,
                "size_bytes": candidate.stat().st_size,
            }
            found.append(entry)
            log.info("  ✓  %-35s  %s…", name, digest[:16])
        else:
            missing.append(name)
            log.debug("  –  %-35s  (not found, skipping)", name)

    manifest: dict[str, Any] = {
        "schema_version": "1",
        "generator": "abr-evidence-collect",
        "artifacts": found,
        "missing_artifacts": missing,
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    out_path = output_dir / "artifacts.json"
    out_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    log.info("Wrote %d artifacts to %s", len(found), out_path)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="Collect ABR CI evidence artifacts")
    parser.add_argument("--output", default="evidence-output", help="Output directory")
    parser.add_argument(
        "--base", default=os.environ.get("ARTIFACT_DIR", "."), help="Base search dir"
    )
    args = parser.parse_args()

    base_dir = Path(args.base).resolve()
    output_dir = Path(args.output).resolve()

    log.info("ABR Evidence Collector")
    log.info("  base_dir   : %s", base_dir)
    log.info("  output_dir : %s", output_dir)

    result = collect(base_dir, output_dir)
    n_found = len(result["artifacts"])
    n_missing = len(result["missing_artifacts"])
    log.info("Collection complete — %d found, %d skipped", n_found, n_missing)

    if n_found == 0:
        log.error("No artifacts collected — evidence pack will be empty.")
        sys.exit(1)


if __name__ == "__main__":
    main()
