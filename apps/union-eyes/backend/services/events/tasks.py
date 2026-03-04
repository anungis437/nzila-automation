"""
Event Bus — Celery tasks for async event processing.
"""

from __future__ import annotations

import logging
from typing import Any, Dict

from celery import shared_task

logger = logging.getLogger("event_tasks")


@shared_task(
    name="events.process_event",
    bind=True,
    queue="notifications",
    acks_late=True,
    max_retries=3,
    default_retry_delay=10,
)
def process_event_task(self, *, event_id: str) -> Dict[str, Any]:
    """
    Async fan-out for a persisted domain event.

    1. Write audit log entry
    2. Trigger matching integrations
    3. Fire registered in-process handlers (future extensibility)
    """
    from services.events.models import Event

    try:
        event = Event.objects.get(pk=event_id)
    except Event.DoesNotExist:
        logger.error("Event %s not found — cannot process", event_id)
        return {"status": "error", "reason": "event_not_found"}

    _fan_out(event)
    return {"status": "processed", "event_id": event_id}


def _fan_out(event) -> None:
    """Execute all side-effects for an event."""
    from services.events.dispatcher import trigger_integrations, write_audit_log

    # 1. Audit log
    write_audit_log(event)

    # 2. Integration dispatch
    triggered = trigger_integrations(event)

    # 3. In-process handlers (pluggable — import and call registered handlers)
    _run_handlers(event)

    logger.info(
        "Event %s fan-out complete: audit=ok, integrations=%d, handlers=%d",
        event.event_type,
        triggered,
        len(_HANDLERS.get(event.event_type, [])),
    )


# ---------------------------------------------------------------------------
# Simple in-process handler registry
# ---------------------------------------------------------------------------
_HANDLERS: Dict[str, list] = {}


def register_handler(event_type: str, handler_fn):
    """
    Register a synchronous handler for *event_type*.

    Usage::

        from services.events.tasks import register_handler

        def on_case_created(event):
            send_notification(event.org_id, f"New case: {event.payload['case_id']}")

        register_handler("case_created", on_case_created)
    """
    _HANDLERS.setdefault(event_type, []).append(handler_fn)


def _run_handlers(event) -> None:
    handlers = _HANDLERS.get(event.event_type, [])
    for handler in handlers:
        try:
            handler(event)
        except Exception:
            logger.exception(
                "Handler %s failed for event %s",
                handler.__name__,
                event.id,
            )
