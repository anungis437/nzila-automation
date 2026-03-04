"""
Break-Glass Logging.

Captures critical administrative actions (elevated-privilege ops) with
immutable, hash-chained audit entries.  Used when an administrator
overrides normal access controls or performs emergency operations.

The break-glass event:
  1. Writes an immutable hash-chained log entry.
  2. Emits a domain event for notification fan-out.
  3. Flags the action in the compliance snapshot ledger.
"""

from __future__ import annotations

import hashlib
import json
import logging
import uuid
from typing import Any, Dict, Optional

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger("break_glass")


def log_break_glass(
    *,
    org_id: str,
    actor_id: str,
    action: str,
    reason: str,
    target_resource: str = "",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Log a break-glass (emergency override) action.

    Creates a hash-chained audit record and emits notifications.

    Returns the break-glass event summary dict.
    """

    event_id = str(uuid.uuid4())
    now = timezone.now()

    payload = {
        "event_id": event_id,
        "org_id": org_id,
        "actor_id": actor_id,
        "action": action,
        "reason": reason,
        "target_resource": target_resource,
        "metadata": metadata or {},
        "timestamp": now.isoformat(),
    }

    # ----- Persistent audit log -----
    try:
        from core.models import AuditLogs

        # Get previous hash for chain.
        last_entry = (
            AuditLogs.objects.filter(organization_id=org_id)
            .order_by("-created_at")
            .values_list("hash", flat=True)
            .first()
        )
        previous_hash = last_entry or ""

        canonical = json.dumps(payload, sort_keys=True, default=str)
        entry_hash = hashlib.sha256(f"{canonical}{previous_hash}".encode()).hexdigest()

        AuditLogs.objects.create(
            organization_id=org_id,
            user_id=actor_id,
            action=f"BREAK_GLASS:{action}",
            resource_type="break_glass",
            resource_id=event_id,
            details={
                **payload,
                "previous_hash": previous_hash,
            },
            hash=entry_hash,
            ip_address="",
        )
        payload["hash"] = entry_hash
    except Exception:
        logger.exception("Failed to write break-glass audit log")

    # ----- Emit domain event -----
    try:
        from services.events.dispatcher import emit_event

        emit_event(
            event_type="break_glass_action",
            org_id=org_id,
            actor_id=actor_id,
            payload=payload,
        )
    except Exception:
        logger.exception("Failed to emit break-glass domain event")

    # ----- Flag in compliance ledger -----
    try:
        _flag_compliance(org_id, payload)
    except Exception:
        logger.exception("Failed to flag break-glass in compliance ledger")

    # ----- Admin notification via cache flag (picked up by notification workers) -----
    cache.set(
        f"break_glass:pending:{org_id}:{event_id}",
        json.dumps(payload, default=str),
        timeout=86400,  # 24 h TTL
    )

    logger.critical(
        "BREAK-GLASS: org=%s actor=%s action=%s reason=%s",
        org_id,
        actor_id,
        action,
        reason,
    )

    return payload


def _flag_compliance(org_id: str, payload: Dict[str, Any]) -> None:
    """Record a break-glass flag in the compliance snapshot metadata."""
    from services.compliance_snapshot.service import capture_snapshot

    capture_snapshot(
        org_id=org_id,
        snapshot_type="on_demand",
        created_by=payload["actor_id"],
        extra_payload={
            "break_glass": {
                "event_id": payload["event_id"],
                "action": payload["action"],
                "reason": payload["reason"],
                "timestamp": payload["timestamp"],
            }
        },
    )
