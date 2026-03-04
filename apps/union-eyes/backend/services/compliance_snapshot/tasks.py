"""
Compliance Snapshot Engine — Celery periodic tasks.

These tasks are registered in settings.CELERY_BEAT_SCHEDULE.
"""

from __future__ import annotations

import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger("compliance_snapshot.tasks")


@shared_task(
    name="compliance_snapshot.capture_daily",
    queue="reports",
    acks_late=True,
)
def capture_daily_snapshots() -> dict:
    """Capture daily compliance snapshots for all active organizations."""
    return _capture_for_all("daily")


@shared_task(
    name="compliance_snapshot.capture_monthly",
    queue="reports",
    acks_late=True,
)
def capture_monthly_snapshots() -> dict:
    """Capture monthly compliance snapshots for all active organizations."""
    return _capture_for_all("monthly")


@shared_task(
    name="compliance_snapshot.capture_quarterly",
    queue="reports",
    acks_late=True,
)
def capture_quarterly_snapshots() -> dict:
    """Capture quarterly compliance snapshots for all active organizations."""
    return _capture_for_all("quarterly")


@shared_task(
    name="compliance_snapshot.capture_on_demand",
    queue="reports",
    acks_late=True,
)
def capture_on_demand(*, org_id: str, created_by: str = "system") -> dict:
    """Capture an on-demand compliance snapshot for a single org."""
    from services.compliance_snapshot.service import capture_snapshot

    return capture_snapshot(
        org_id=org_id,
        snapshot_type="on_demand",
        created_by=created_by,
    )


def _capture_for_all(snapshot_type: str) -> dict:
    """Iterate all active orgs and capture snapshots."""
    from services.compliance_snapshot.service import capture_snapshot

    try:
        from auth_core.models import Organizations

        orgs = Organizations.objects.filter(status="active")
    except Exception:
        logger.exception("Cannot query organizations")
        return {"status": "error", "reason": "cannot_query_orgs"}

    results = {"captured": 0, "failed": 0}
    for org in orgs.iterator():
        try:
            capture_snapshot(
                org_id=str(org.id),
                snapshot_type=snapshot_type,
                created_by="system",
            )
            results["captured"] += 1
        except Exception:
            logger.exception("Snapshot failed for org %s", org.id)
            results["failed"] += 1

    logger.info(
        "Compliance snapshots (%s): captured=%d failed=%d",
        snapshot_type,
        results["captured"],
        results["failed"],
    )
    return results
