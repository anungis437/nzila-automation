"""
Celery tasks for the core app.

Migrated from BullMQ workers:
  - frontend/lib/workers/cleanup-worker.ts → cleanup_task

Queue routing:
  cleanup queue → cleanup_task

Cleanup targets (mirrors BullMQ CleanupJobData):
  logs        → Archive audit logs older than N days (immutable audit trail)
  sessions    → Delete expired / inactive DB sessions
  temp-files  → Delete temp files on disk older than N days
  exports     → Delete generated report files on disk older than N days
"""

import logging
import os
import tempfile
from datetime import timedelta
from pathlib import Path
from typing import Optional

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)

REPORTS_DIR = os.environ.get("REPORTS_DIR", "/tmp/reports")
TEMP_DIR = os.environ.get("TEMP_DIR", "/tmp/ue_temp")


# ---------------------------------------------------------------------------
# Task: cleanup_task
# BullMQ equivalent: cleanupQueue / cleanup-worker.ts → processCleanupJob()
# Options: concurrency=1 (sequential) — enforced at worker level via autoscale=1,1
# ---------------------------------------------------------------------------

@shared_task(
    bind=True,
    name="core.tasks.cleanup_task",
    queue="cleanup",
    max_retries=1,
    default_retry_delay=60,
    acks_late=True,
)
def cleanup_task(
    self,
    *,
    target: str,
    older_than_days: int = 30,
):
    """
    Run a maintenance cleanup operation.

    Args:
        target:         One of 'logs', 'sessions', 'temp-files', 'exports'.
        older_than_days: Age threshold for deletion/archival.
    """
    logger.info("Running cleanup task: target=%s older_than_days=%d", target, older_than_days)

    try:
        dispatch = {
            "logs":       _cleanup_logs,
            "sessions":   _cleanup_sessions,
            "temp-files": _cleanup_temp_files,
            "exports":    _cleanup_exports,
        }
        handler = dispatch.get(target)
        if not handler:
            raise ValueError(f"Unknown cleanup target: {target}")

        result = handler(older_than_days=older_than_days)
        logger.info("Cleanup complete: target=%s result=%s", target, result)
        return {"success": True, "target": target, **result}

    except Exception as exc:  # noqa: BLE001
        logger.error("Cleanup task failed: target=%s error=%s", target, exc)
        raise self.retry(exc=exc, countdown=60)


# ---------------------------------------------------------------------------
# Cleanup handlers
# ---------------------------------------------------------------------------

def _cleanup_logs(older_than_days: int, **_) -> dict:
    """
    Mark audit logs older than N days as archived.

    Mirrors cleanup-worker.ts → cleanupLogs():
    Uses ARCHIVE not DELETE to preserve immutable audit trail.
    """
    cutoff = timezone.now() - timedelta(days=older_than_days)
    archived = 0

    try:
        # Use the auth_core audit-log model if available
        from django.db import connection

        with connection.cursor() as cur:
            cur.execute(
                """
                UPDATE audit_logs
                SET    archived    = TRUE,
                       updated_at  = NOW()
                WHERE  created_at  < %s
                  AND  archived    IS DISTINCT FROM TRUE
                """,
                [cutoff],
            )
            archived = cur.rowcount
    except Exception as exc:  # noqa: BLE001
        logger.warning("audit_logs table not available for archival: %s", exc)

    logger.info("Archived %d audit log rows older than %d days", archived, older_than_days)
    return {"archived": archived}


def _cleanup_sessions(older_than_days: int = 90, **_) -> dict:
    """
    Delete expired and long-inactive DB sessions.

    Mirrors cleanup-worker.ts → cleanupSessions().
    """
    deleted = 0

    # 1. Django's built-in session table (if using DB sessions)
    try:
        from django.contrib.sessions.backends.db import SessionStore
        from django.contrib.sessions.models import Session
        from django.db.models import Q

        now = timezone.now()
        inactive_cutoff = now - timedelta(days=older_than_days)

        result = Session.objects.filter(
            Q(expire_date__lt=now) | Q(expire_date__lt=inactive_cutoff)
        ).delete()
        deleted += result[0]
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not clean Django sessions: %s", exc)

    logger.info("Deleted %d sessions", deleted)
    return {"deleted": deleted}


def _cleanup_temp_files(older_than_days: int, **_) -> dict:
    """
    Delete temporary files older than N days from TEMP_DIR.

    Mirrors cleanup-worker.ts → cleanupTempFiles().
    """
    deleted = 0
    cutoff = timezone.now().timestamp() - (older_than_days * 86400)
    temp_path = Path(TEMP_DIR)

    if not temp_path.exists():
        return {"deleted": 0}

    for filepath in temp_path.iterdir():
        try:
            if filepath.is_file() and filepath.stat().st_mtime < cutoff:
                filepath.unlink()
                deleted += 1
        except Exception as exc:  # noqa: BLE001
            logger.warning("Could not delete temp file %s: %s", filepath, exc)

    logger.info("Deleted %d temp files older than %d days", deleted, older_than_days)
    return {"deleted": deleted}


def _cleanup_exports(older_than_days: int, **_) -> dict:
    """
    Delete generated report files older than N days from REPORTS_DIR.

    Mirrors cleanup-worker.ts → cleanupExports().
    """
    deleted = 0
    cutoff = timezone.now().timestamp() - (older_than_days * 86400)
    reports_path = Path(REPORTS_DIR)

    if not reports_path.exists():
        return {"deleted": 0}

    for filepath in reports_path.iterdir():
        try:
            if filepath.is_file() and filepath.stat().st_mtime < cutoff:
                filepath.unlink()
                deleted += 1
        except Exception as exc:  # noqa: BLE001
            logger.warning("Could not delete export file %s: %s", filepath, exc)

    logger.info("Deleted %d export files older than %d days", deleted, older_than_days)
    return {"deleted": deleted}
