#!/usr/bin/env python3
# cSpell:ignore Nzila merkle digestmod
"""
ABR Evidence Sealer
===================
Reads artifacts.json produced by collect.py, builds a canonical pack.json,
computes an HMAC-SHA256 seal, and writes seal.json.

Mirrors the NzilaOS os-core evidence seal pipeline.

Usage:
    python scripts/evidence/seal.py [--output <dir>]

Environment:
    EVIDENCE_SEAL_KEY   HMAC secret key (required — must be ≥ 32 bytes)
    ABR_ORG_ID          Org UUID to embed in the pack (optional)

Outputs:
    <output>/pack.json
    <output>/seal.json
"""
import argparse
import hashlib
import hmac
import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)


def compute_merkle_root(artifact_hashes: list[str]) -> str:
    """
    Simple Merkle root: iteratively pair-hash sorted leaf digests.
    Produces a deterministic 64-char hex string.
    Compatible with the NzilaOS os-core computeMerkleRoot implementation.
    """
    if not artifact_hashes:
        return hashlib.sha256(b"empty").hexdigest()

    leaves = sorted(artifact_hashes)

    def _hash_pair(a: str, b: str) -> str:
        return hashlib.sha256((a + b).encode()).hexdigest()

    layer = leaves
    while len(layer) > 1:
        next_layer: list[str] = []
        for i in range(0, len(layer) - 1, 2):
            next_layer.append(_hash_pair(layer[i], layer[i + 1]))
        if len(layer) % 2 == 1:
            # Odd node: promote without pairing
            next_layer.append(layer[-1])
        layer = next_layer

    return layer[0]


def build_pack(artifacts_manifest: dict[str, Any], org_id: str | None) -> dict[str, Any]:
    artifact_hashes = [a["sha256"] for a in artifacts_manifest.get("artifacts", [])]
    merkle_root = compute_merkle_root(artifact_hashes)

    return {
        "schema_version": "1",
        "generator": "abr-evidence-seal",
        "org_id": org_id,
        "sealed_at": datetime.now(timezone.utc).isoformat(),
        "artifact_count": len(artifact_hashes),
        "merkle_root": merkle_root,
        "artifacts": artifacts_manifest.get("artifacts", []),
        "missing_artifacts": artifacts_manifest.get("missing_artifacts", []),
    }


def generate_seal(pack: dict[str, Any], secret_key: str) -> dict[str, Any]:
    canonical = json.dumps(pack, sort_keys=True, separators=(",", ":"))
    mac = hmac.new(
        key=secret_key.encode("utf-8"),
        msg=canonical.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()

    return {
        "schema_version": "1",
        "algorithm": "hmac-sha256",
        "mac": mac,
        "pack_merkle_root": pack["merkle_root"],
        "sealed_at": pack["sealed_at"],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Seal ABR evidence pack")
    parser.add_argument("--output", default="evidence-output", help="Directory with artifacts.json")
    parser.add_argument(
        "--org-id",
        default=os.environ.get("ABR_ORG_ID"),
        help="Org UUID to embed in the pack",
    )
    args = parser.parse_args()

    output_dir = Path(args.output).resolve()
    artifacts_path = output_dir / "artifacts.json"

    if not artifacts_path.exists():
        log.error("artifacts.json not found at %s — run collect.py first.", artifacts_path)
        sys.exit(1)

    seal_key = os.environ.get("EVIDENCE_SEAL_KEY", "")
    if len(seal_key) < 32:
        log.error("EVIDENCE_SEAL_KEY must be set and at least 32 bytes. " "Set it as a CI secret.")
        sys.exit(1)

    artifacts_manifest = json.loads(artifacts_path.read_text(encoding="utf-8"))

    log.info("ABR Evidence Sealer")
    log.info(
        "  artifacts  : %d found, %d missing",
        len(artifacts_manifest.get("artifacts", [])),
        len(artifacts_manifest.get("missing_artifacts", [])),
    )

    pack = build_pack(artifacts_manifest, args.org_id)
    seal = generate_seal(pack, seal_key)

    pack_path = output_dir / "pack.json"
    seal_path = output_dir / "seal.json"
    pack_path.write_text(json.dumps(pack, indent=2), encoding="utf-8")
    seal_path.write_text(json.dumps(seal, indent=2), encoding="utf-8")

    log.info("Merkle root : %s", pack["merkle_root"])
    log.info("HMAC (mac)  : %s…", seal["mac"][:24])
    log.info("Wrote pack  → %s", pack_path)
    log.info("Wrote seal  → %s", seal_path)


if __name__ == "__main__":
    main()
