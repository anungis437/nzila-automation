#!/usr/bin/env python3
# cSpell:ignore merkle digestmod
"""
ABR Evidence Verifier
=====================
Reads pack.json + seal.json and verifies the HMAC-SHA256 seal.
Exits 1 (blocking) on any verification failure — use as a CI gate.

Usage:
    python scripts/evidence/verify.py [--output <dir>]

Environment:
    EVIDENCE_SEAL_KEY   HMAC secret key used in seal.py (required)

Exit codes:
    0   Seal is valid
    1   Seal is missing, tampered, or key mismatch — CI MUST fail
"""
import argparse
import hashlib
import hmac
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

_FAIL_BANNER = """
╔══════════════════════════════════════════════════════════════════════╗
║  ABR EVIDENCE SEAL VERIFICATION FAILED                              ║
║  This CI run CANNOT proceed — the evidence pack is untrusted.       ║
║                                                                      ║
║  Remediation:                                                        ║
║    1. Re-run the evidence:collect → evidence:seal pipeline           ║
║    2. Verify EVIDENCE_SEAL_KEY is correctly set as a CI secret       ║
║    3. Ensure no artifact was modified after sealing                  ║
╚══════════════════════════════════════════════════════════════════════╝
"""


def recompute_seal(pack: dict[str, Any], secret_key: str) -> str:
    canonical = json.dumps(pack, sort_keys=True, separators=(",", ":"))
    return hmac.new(
        key=secret_key.encode("utf-8"),
        msg=canonical.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()


def fail(reason: str) -> None:
    log.error("VERIFICATION FAILED: %s", reason)
    print(_FAIL_BANNER, file=sys.stderr)
    sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Verify ABR evidence seal")
    parser.add_argument(
        "--output", default="evidence-output", help="Directory with pack.json + seal.json"
    )
    args = parser.parse_args()

    output_dir = Path(args.output).resolve()
    pack_path = output_dir / "pack.json"
    seal_path = output_dir / "seal.json"

    log.info("ABR Evidence Verifier")
    log.info("  output_dir : %s", output_dir)

    if not pack_path.exists():
        fail(f"pack.json not found at {pack_path}")

    if not seal_path.exists():
        fail(
            f"seal.json not found at {seal_path} — "
            "a pack without a seal is untrusted and MUST be rejected"
        )

    seal_key = os.environ.get("EVIDENCE_SEAL_KEY", "")
    if len(seal_key) < 32:
        fail("EVIDENCE_SEAL_KEY is not set or too short — cannot verify seal")

    pack: dict[str, Any] = json.loads(pack_path.read_text(encoding="utf-8"))
    seal: dict[str, Any] = json.loads(seal_path.read_text(encoding="utf-8"))

    expected_mac = seal.get("mac", "")
    if not expected_mac:
        fail("seal.json is missing the 'mac' field")

    actual_mac = recompute_seal(pack, seal_key)

    if not hmac.compare_digest(actual_mac, expected_mac):
        fail(
            "HMAC mismatch — pack.json has been tampered with after sealing, "
            "or the wrong EVIDENCE_SEAL_KEY was used"
        )

    # Cross-check merkle root
    pack_root = pack.get("merkle_root", "")
    seal_root = seal.get("pack_merkle_root", "")
    if pack_root != seal_root:
        fail(
            f"Merkle root mismatch: pack says {pack_root[:16]}… "
            f"but seal records {seal_root[:16]}…"
        )

    n_artifacts = pack.get("artifact_count", 0)
    log.info("  ✓  HMAC-SHA256 seal is VALID")
    log.info("  ✓  Merkle root : %s…", pack_root[:32])
    log.info("  ✓  Artifacts   : %d", n_artifacts)
    log.info("ABR evidence pack verified — CI gate PASSED")


if __name__ == "__main__":
    main()
