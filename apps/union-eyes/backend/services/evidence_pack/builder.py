"""
Evidence Pack System — collection and export logic.

The ``build_evidence_pack`` function:
  1. Queries audit logs, domain events, cases, and governance records
  2. Hashes each artifact
  3. Builds a checksum manifest
  4. Seals the pack
  5. Returns a JSON archive + PDF summary + manifest
"""

from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from django.utils import timezone

from .models import EvidenceArtifact, EvidencePack

logger = logging.getLogger("evidence_pack")


def build_evidence_pack(
    *,
    org_id: str,
    pack_type: str = "governance_full",
    title: str = "",
    period_start: Optional[datetime] = None,
    period_end: Optional[datetime] = None,
    requested_by: str = "system",
    include_events: bool = True,
    include_audit_logs: bool = True,
    include_cases: bool = True,
    include_governance: bool = True,
    include_votes: bool = True,
    seal: bool = True,
) -> Dict[str, Any]:
    """
    Build and optionally seal an evidence pack.

    Returns a dict with ``pack_id``, ``manifest``, ``artifact_count``, and
    ``status``.
    """

    period_end = period_end or timezone.now()
    if not title:
        title = f"Evidence Pack — {pack_type} — {period_end:%Y-%m-%d}"

    pack = EvidencePack.objects.create(
        org_id=org_id,
        pack_type=pack_type,
        title=title,
        period_start=period_start,
        period_end=period_end,
        requested_by=requested_by,
    )

    manifest: Dict[str, str] = {}  # artifact_id → content_hash

    # ---- Collect artifacts ----

    if include_audit_logs:
        _collect_audit_logs(pack, org_id, period_start, period_end, manifest)

    if include_events:
        _collect_domain_events(pack, org_id, period_start, period_end, manifest)

    if include_cases:
        _collect_cases(pack, org_id, period_start, period_end, manifest)

    if include_governance:
        _collect_governance(pack, org_id, period_start, period_end, manifest)

    if include_votes:
        _collect_votes(pack, org_id, period_start, period_end, manifest)

    # ---- Finalize ----
    pack.checksum_manifest = manifest
    pack.artifact_count = len(manifest)
    pack.save()

    if seal:
        pack.seal(actor_id=requested_by)

    logger.info(
        "Evidence pack built: id=%s artifacts=%d sealed=%s",
        pack.id,
        len(manifest),
        pack.status == "sealed",
    )

    return {
        "pack_id": str(pack.id),
        "title": pack.title,
        "artifact_count": len(manifest),
        "status": pack.status,
        "pack_hash": pack.pack_hash,
        "manifest": manifest,
    }


# ---------------------------------------------------------------------------
# Artifact collectors
# ---------------------------------------------------------------------------


def _collect_audit_logs(pack, org_id, start, end, manifest) -> None:
    try:
        from core.models import AuditLogs

        qs = AuditLogs.objects.filter(organization_id=org_id)
        if start:
            qs = qs.filter(created_at__gte=start)
        if end:
            qs = qs.filter(created_at__lte=end)

        for log in qs.order_by("created_at").iterator(chunk_size=200):
            content = {
                "id": str(log.id),
                "action": getattr(log, "action", ""),
                "actor": getattr(log, "actor", ""),
                "details": getattr(log, "details", ""),
                "content_hash": getattr(log, "content_hash", ""),
                "created_at": str(log.created_at),
            }
            artifact = EvidenceArtifact(
                pack=pack,
                artifact_type="audit_log",
                source_id=str(log.id),
                content=content,
            )
            artifact.save()
            manifest[str(artifact.id)] = artifact.content_hash

    except Exception:
        logger.exception("Failed to collect audit logs")


def _collect_domain_events(pack, org_id, start, end, manifest) -> None:
    try:
        from services.events.models import Event

        qs = Event.objects.filter(org_id=org_id)
        if start:
            qs = qs.filter(created_at__gte=start)
        if end:
            qs = qs.filter(created_at__lte=end)

        for event in qs.order_by("created_at").iterator(chunk_size=200):
            content = {
                "id": str(event.id),
                "event_type": event.event_type,
                "actor_id": event.actor_id,
                "payload": event.payload,
                "signature_hash": event.signature_hash,
                "created_at": str(event.created_at),
            }
            artifact = EvidenceArtifact(
                pack=pack,
                artifact_type="domain_event",
                source_id=str(event.id),
                content=content,
            )
            artifact.save()
            manifest[str(artifact.id)] = artifact.content_hash

    except Exception:
        logger.exception("Failed to collect domain events")


def _collect_cases(pack, org_id, start, end, manifest) -> None:
    try:
        from grievances.models import Claims

        qs = Claims.objects.filter(organization_id=org_id)
        if start:
            qs = qs.filter(created_at__gte=start)
        if end:
            qs = qs.filter(created_at__lte=end)

        for claim in qs.order_by("created_at").iterator(chunk_size=200):
            content = {
                "id": str(claim.id),
                "status": getattr(claim, "status", ""),
                "claim_type": getattr(claim, "claim_type", ""),
                "created_at": str(claim.created_at),
                "updated_at": str(claim.updated_at),
            }
            artifact = EvidenceArtifact(
                pack=pack,
                artifact_type="case_record",
                source_id=str(claim.id),
                content=content,
            )
            artifact.save()
            manifest[str(artifact.id)] = artifact.content_hash

    except Exception:
        logger.exception("Failed to collect cases")


def _collect_governance(pack, org_id, start, end, manifest) -> None:
    """Collect governance-related events from the domain event store."""
    try:
        from services.events.models import Event

        governance_types = [
            "governance_action",
            "policy_changed",
            "break_glass_activated",
        ]
        qs = Event.objects.filter(
            org_id=org_id,
            event_type__in=governance_types,
        )
        if start:
            qs = qs.filter(created_at__gte=start)
        if end:
            qs = qs.filter(created_at__lte=end)

        for event in qs.order_by("created_at").iterator(chunk_size=200):
            content = {
                "id": str(event.id),
                "event_type": event.event_type,
                "actor_id": event.actor_id,
                "payload": event.payload,
                "created_at": str(event.created_at),
            }
            artifact = EvidenceArtifact(
                pack=pack,
                artifact_type="governance_action",
                source_id=str(event.id),
                content=content,
            )
            artifact.save()
            manifest[str(artifact.id)] = artifact.content_hash

    except Exception:
        logger.exception("Failed to collect governance actions")


def _collect_votes(pack, org_id, start, end, manifest) -> None:
    """Collect vote events from the domain event store."""
    try:
        from services.events.models import Event

        qs = Event.objects.filter(org_id=org_id, event_type="vote_cast")
        if start:
            qs = qs.filter(created_at__gte=start)
        if end:
            qs = qs.filter(created_at__lte=end)

        for event in qs.order_by("created_at").iterator(chunk_size=200):
            content = {
                "id": str(event.id),
                "actor_id": event.actor_id,
                "payload": event.payload,
                "created_at": str(event.created_at),
            }
            artifact = EvidenceArtifact(
                pack=pack,
                artifact_type="vote_record",
                source_id=str(event.id),
                content=content,
            )
            artifact.save()
            manifest[str(artifact.id)] = artifact.content_hash

    except Exception:
        logger.exception("Failed to collect votes")


# ---------------------------------------------------------------------------
# Export helpers
# ---------------------------------------------------------------------------


def export_pack_json(pack_id: str) -> Dict[str, Any]:
    """
    Export a sealed evidence pack as a JSON archive.

    Raises ValueError if the pack is not sealed or integrity check fails.
    """
    pack = EvidencePack.objects.get(pk=pack_id)
    if pack.status not in ("sealed", "exported"):
        raise ValueError(f"Pack must be sealed before export (current: {pack.status})")
    if not pack.verify_seal():
        raise ValueError("Pack integrity check failed — seal hash mismatch")

    artifacts = EvidenceArtifact.objects.filter(pack=pack).order_by("created_at")

    archive = {
        "pack_id": str(pack.id),
        "org_id": str(pack.org_id),
        "pack_type": pack.pack_type,
        "title": pack.title,
        "period_start": str(pack.period_start) if pack.period_start else None,
        "period_end": str(pack.period_end) if pack.period_end else None,
        "sealed_at": str(pack.sealed_at) if pack.sealed_at else None,
        "sealed_by": pack.sealed_by,
        "pack_hash": pack.pack_hash,
        "artifact_count": pack.artifact_count,
        "checksum_manifest": pack.checksum_manifest,
        "artifacts": [
            {
                "id": str(a.id),
                "artifact_type": a.artifact_type,
                "source_id": a.source_id,
                "content": a.content,
                "content_hash": a.content_hash,
                "created_at": str(a.created_at),
            }
            for a in artifacts
        ],
    }

    # Mark as exported.
    pack.status = "exported"
    pack.save(update_fields=["status", "updated_at"])

    return archive
