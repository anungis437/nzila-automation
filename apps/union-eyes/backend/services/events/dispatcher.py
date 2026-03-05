"""
Event Dispatcher — the central nervous system of the Event Bus.

Responsibilities:
  1. Persist event to database
  2. Publish to Celery for async processing
  3. Trigger matching integrations
  4. Write audit log entry

Usage::

    from services.events.dispatcher import emit_event

    emit_event(
        event_type="case_created",
        org_id=str(org.id),
        actor_id=str(user.id),
        payload={"case_id": str(case.id), "priority": "high"},
    )
"""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any, Dict, Optional
from uuid import uuid4

from django.utils import timezone

logger = logging.getLogger("event_dispatcher")


def emit_event(
    *,
    event_type: str,
    org_id: str,
    actor_id: str,
    payload: Optional[Dict[str, Any]] = None,
    correlation_id: str = "",
    metadata: Optional[Dict[str, Any]] = None,
    sync: bool = False,
) -> str:
    """
    Emit a domain event.

    Parameters
    ----------
    event_type : str
        One of the ``Event.EVENT_TYPES`` values.
    org_id : str
        Organization UUID (org scoping).
    actor_id : str
        User UUID or ``"system"`` for automated events.
    payload : dict, optional
        Event-specific data.
    correlation_id : str, optional
        Request trace / correlation ID.
    metadata : dict, optional
        Extra context (source service, version, etc.).
    sync : bool
        If True, skip Celery and process inline (useful in tests).

    Returns
    -------
    str
        The UUID of the persisted event.
    """
    from services.events.models import Event

    payload = payload or {}
    metadata = metadata or {}

    event = Event(
        event_type=event_type,
        org_id=org_id,
        actor_id=actor_id,
        payload=payload,
        correlation_id=correlation_id,
        metadata=metadata,
        created_at=timezone.now(),
    )
    event.save()  # computes signature_hash automatically

    logger.info(
        "Event emitted: %s (id=%s, org=%s, actor=%s)",
        event_type,
        event.id,
        str(org_id)[:8],
        str(actor_id)[:8],
    )

    if sync:
        _process_event_sync(event)
    else:
        _enqueue_event(event)

    return str(event.id)


def _enqueue_event(event) -> None:
    """Publish event to Celery for async fan-out."""
    from services.events.tasks import process_event_task

    process_event_task.delay(event_id=str(event.id))


def _process_event_sync(event) -> None:
    """Process event inline (testing / critical path)."""
    from services.events.tasks import _fan_out

    _fan_out(event)


# ---------------------------------------------------------------------------
# Audit-log bridge — writes a hash-chained audit entry for each event
# ---------------------------------------------------------------------------


def write_audit_log(event) -> None:
    """
    Create an AuditLog entry (from ``core.models``) linked to the event.
    Preserves the existing hash-chain integrity.
    """
    try:
        from core.models import AuditLogs

        AuditLogs.objects.create(
            organization_id=event.org_id,
            action=f"EVENT:{event.event_type}",
            actor=event.actor_id,
            details=json.dumps(
                {
                    "event_id": str(event.id),
                    "event_type": event.event_type,
                    "payload_summary": _truncate(event.payload, 500),
                    "correlation_id": event.correlation_id,
                },
                default=str,
            ),
        )
    except Exception:
        logger.exception("Failed to write audit log for event %s", event.id)


# ---------------------------------------------------------------------------
# Integration trigger — fan-out to matching integrations
# ---------------------------------------------------------------------------


def trigger_integrations(event) -> int:
    """
    Look up integrations subscribed to ``event.event_type`` and dispatch.

    Returns the number of integrations triggered.
    """
    try:
        from services.integration_control_plane.models import IntegrationRegistry
        from services.integration_control_plane.tasks import dispatch_integration

        integrations = IntegrationRegistry.objects.filter(
            org_id=event.org_id,
            status="active",
            integration_type__in=["webhook_outbound", "api_push"],
        )

        count = 0
        for integration in integrations:
            # Check if integration metadata subscribes to this event type
            subscribed_events = integration.metadata.get("subscribed_events", [])
            if subscribed_events and event.event_type not in subscribed_events:
                continue

            dispatch_integration.delay(
                integration_id=str(integration.id),
                org_id=str(event.org_id),
                payload={
                    "event_id": str(event.id),
                    "event_type": event.event_type,
                    "org_id": str(event.org_id),
                    "actor_id": event.actor_id,
                    "payload": event.payload,
                    "created_at": event.created_at.isoformat(),
                    "signature_hash": event.signature_hash,
                },
            )
            count += 1

        if count:
            logger.info(
                "Triggered %d integration(s) for event %s", count, event.event_type
            )
        return count

    except Exception:
        logger.exception("Failed to trigger integrations for event %s", event.id)
        return 0


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _truncate(obj: Any, max_len: int) -> Any:
    """Truncate a dict/str to *max_len* chars for audit storage."""
    s = json.dumps(obj, default=str) if isinstance(obj, dict) else str(obj)
    return s[:max_len] if len(s) > max_len else s
