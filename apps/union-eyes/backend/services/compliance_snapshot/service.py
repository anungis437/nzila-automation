"""
Compliance Snapshot Engine — snapshot capture logic.

``capture_snapshot`` gathers compliance-relevant counters from the database
and creates a hash-chained snapshot record.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional

from django.db.models import Count, Q
from django.utils import timezone

from .models import ComplianceSnapshot

logger = logging.getLogger("compliance_snapshot")


def capture_snapshot(
    *,
    org_id: str,
    snapshot_type: str = "on_demand",
    created_by: str = "system",
    extra_payload: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Capture a compliance snapshot for *org_id*.

    The snapshot payload includes counts for:
      - active members
      - open cases
      - audit events (period)
      - integration health
      - compliance checks passed/failed

    Returns the snapshot summary dict.
    """

    payload = _gather_payload(org_id)
    if extra_payload:
        payload["custom"] = extra_payload

    # Determine chain predecessor.
    last = (
        ComplianceSnapshot.objects.filter(org_id=org_id)
        .order_by("-sequence_number")
        .first()
    )
    previous_hash = last.hash if last else ""
    sequence_number = (last.sequence_number + 1) if last else 1

    snapshot = ComplianceSnapshot(
        org_id=org_id,
        snapshot_type=snapshot_type,
        snapshot_payload=payload,
        previous_hash=previous_hash,
        sequence_number=sequence_number,
        created_by=created_by,
    )
    snapshot.save()  # auto-computes hash

    logger.info(
        "Compliance snapshot captured: org=%s type=%s seq=%d",
        str(org_id)[:8],
        snapshot_type,
        sequence_number,
    )

    # Emit event.
    try:
        from services.events.dispatcher import emit_event

        emit_event(
            event_type="compliance_snapshot_created",
            org_id=str(org_id),
            actor_id=created_by,
            payload={
                "snapshot_id": str(snapshot.id),
                "snapshot_type": snapshot_type,
                "sequence_number": sequence_number,
            },
        )
    except Exception:
        logger.exception("Failed to emit compliance_snapshot_created event")

    return {
        "snapshot_id": str(snapshot.id),
        "org_id": str(org_id),
        "snapshot_type": snapshot_type,
        "sequence_number": sequence_number,
        "hash": snapshot.hash,
        "previous_hash": previous_hash,
        "payload": payload,
    }


def verify_chain(org_id: str) -> Dict[str, Any]:
    """
    Verify the entire hash chain for *org_id*.

    Returns ``{"valid": bool, "total": int, "broken_at": int | None}``.
    """
    snapshots = list(
        ComplianceSnapshot.objects.filter(org_id=org_id).order_by("sequence_number")
    )

    if not snapshots:
        return {"valid": True, "total": 0, "broken_at": None}

    for i, snap in enumerate(snapshots):
        # Verify own hash.
        if not snap.verify_integrity():
            return {
                "valid": False,
                "total": len(snapshots),
                "broken_at": snap.sequence_number,
            }

        # Verify chain linkage.
        if i > 0:
            expected_prev = snapshots[i - 1].hash
            if snap.previous_hash != expected_prev:
                return {
                    "valid": False,
                    "total": len(snapshots),
                    "broken_at": snap.sequence_number,
                }

    return {"valid": True, "total": len(snapshots), "broken_at": None}


# ---------------------------------------------------------------------------
# Payload gatherer
# ---------------------------------------------------------------------------


def _gather_payload(org_id: str) -> Dict[str, Any]:
    """
    Query the database for compliance-relevant counters.

    Gracefully handles missing tables / apps.
    """
    payload: Dict[str, Any] = {
        "captured_at": timezone.now().isoformat(),
        "org_id": str(org_id),
    }

    # Members.
    try:
        from auth_core.models import OrganizationMembers

        members_qs = OrganizationMembers.objects.filter(organization_id=org_id)
        payload["members"] = {
            "total": members_qs.count(),
            "active": (
                members_qs.filter(status="active").count()
                if members_qs.filter(status="active").exists()
                else 0
            ),
        }
    except Exception:
        payload["members"] = {"error": "unavailable"}

    # Cases / Claims.
    try:
        from grievances.models import Claims

        claims_qs = Claims.objects.filter(organization_id=org_id)
        payload["cases"] = {
            "total": claims_qs.count(),
            "open": claims_qs.exclude(
                status__in=["closed", "resolved", "rejected"]
            ).count(),
        }
    except Exception:
        payload["cases"] = {"error": "unavailable"}

    # Audit events (last 30 days).
    try:
        from core.models import AuditLogs

        thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
        payload["audit_events_30d"] = AuditLogs.objects.filter(
            organization_id=org_id,
            created_at__gte=thirty_days_ago,
        ).count()
    except Exception:
        payload["audit_events_30d"] = "unavailable"

    # Integration health.
    try:
        from services.integration_control_plane.models import IntegrationRegistry

        int_qs = IntegrationRegistry.objects.filter(org_id=org_id)
        payload["integrations"] = {
            "total": int_qs.count(),
            "active": int_qs.filter(status="active").count(),
            "degraded": int_qs.filter(status="degraded").count(),
            "failed": int_qs.filter(status="failed").count(),
        }
    except Exception:
        payload["integrations"] = {"error": "unavailable"}

    # Domain events (last 30 days).
    try:
        from services.events.models import Event

        payload["domain_events_30d"] = Event.objects.filter(
            org_id=org_id,
            created_at__gte=timezone.now() - timezone.timedelta(days=30),
        ).count()
    except Exception:
        payload["domain_events_30d"] = "unavailable"

    # Evidence packs.
    try:
        from services.evidence_pack.models import EvidencePack

        payload["evidence_packs"] = {
            "total": EvidencePack.objects.filter(org_id=org_id).count(),
            "sealed": EvidencePack.objects.filter(
                org_id=org_id, status="sealed"
            ).count(),
        }
    except Exception:
        payload["evidence_packs"] = {"error": "unavailable"}

    return payload
