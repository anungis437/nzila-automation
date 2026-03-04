"""
Event Bus — Domain event model.

Every meaningful state change in the platform produces an ``Event`` record.
Events are persisted, published to Celery for async processing, and used
to trigger integrations and write audit logs.
"""

import hashlib
import json
import uuid

from django.db import models
from django.utils import timezone


class Event(models.Model):
    """
    Immutable domain event.

    The ``signature_hash`` field is a SHA-256 of the canonical event
    representation, providing tamper-evidence for the event log.
    """

    EVENT_TYPES = [
        # Case / Grievance lifecycle
        ("case_created", "Case Created"),
        ("case_updated", "Case Updated"),
        ("case_assigned", "Case Assigned"),
        ("case_escalated", "Case Escalated"),
        ("case_resolved", "Case Resolved"),
        ("case_closed", "Case Closed"),
        ("case_reopened", "Case Reopened"),
        # Member lifecycle
        ("member_created", "Member Created"),
        ("member_updated", "Member Updated"),
        ("member_deactivated", "Member Deactivated"),
        ("member_reinstated", "Member Reinstated"),
        # Financial
        ("dues_payment_received", "Dues Payment Received"),
        ("dues_payment_failed", "Dues Payment Failed"),
        ("strike_fund_updated", "Strike Fund Updated"),
        ("settlement_recorded", "Settlement Recorded"),
        # Governance
        ("vote_cast", "Vote Cast"),
        ("election_started", "Election Started"),
        ("election_completed", "Election Completed"),
        ("governance_action", "Governance Action"),
        ("policy_changed", "Policy Changed"),
        # Integration
        ("integration_registered", "Integration Registered"),
        ("integration_dispatched", "Integration Dispatched"),
        ("integration_failed", "Integration Failed"),
        ("integration_dead_lettered", "Integration Dead-Lettered"),
        ("webhook_received", "Webhook Received"),
        # Compliance
        ("compliance_snapshot_created", "Compliance Snapshot Created"),
        ("evidence_pack_exported", "Evidence Pack Exported"),
        ("data_subject_request", "Data Subject Request"),
        # Security
        ("break_glass_activated", "Break-Glass Activated"),
        ("privilege_escalation_attempt", "Privilege Escalation Attempt"),
        ("rate_limit_exceeded", "Rate Limit Exceeded"),
        ("suspicious_activity", "Suspicious Activity"),
        # System
        ("system_health_degraded", "System Health Degraded"),
        ("system_health_recovered", "System Health Recovered"),
        ("custom", "Custom Event"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=64, choices=EVENT_TYPES, db_index=True)
    org_id = models.UUIDField(db_index=True, help_text="Tenant organization ID")
    actor_id = models.CharField(
        max_length=255,
        help_text="User ID or 'system' for automated events",
    )
    payload = models.JSONField(default=dict, help_text="Event-specific data")
    signature_hash = models.CharField(
        max_length=64,
        help_text="SHA-256 of canonical event representation",
    )
    correlation_id = models.CharField(
        max_length=64,
        blank=True,
        default="",
        help_text="Request correlation ID for tracing",
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional context (source, version, etc.)",
    )
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = "domain_events"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["org_id", "event_type"], name="idx_events_org_type"),
            models.Index(fields=["org_id", "created_at"], name="idx_events_org_time"),
            models.Index(
                fields=["actor_id", "created_at"], name="idx_events_actor_time"
            ),
            models.Index(fields=["correlation_id"], name="idx_events_correlation"),
        ]

    def __str__(self) -> str:
        return f"Event({self.event_type}, org={str(self.org_id)[:8]}…, {self.created_at:%Y-%m-%d %H:%M})"

    def save(self, *args, **kwargs):
        if not self.signature_hash:
            self.signature_hash = self._compute_hash()
        super().save(*args, **kwargs)

    # ----- integrity -----

    def _compute_hash(self) -> str:
        canonical = json.dumps(
            {
                "event_type": self.event_type,
                "org_id": str(self.org_id),
                "actor_id": self.actor_id,
                "payload": self.payload,
                "created_at": self.created_at.isoformat() if self.created_at else "",
            },
            sort_keys=True,
            default=str,
        )
        return hashlib.sha256(canonical.encode()).hexdigest()

    def verify_integrity(self) -> bool:
        """Return True if the stored hash matches a freshly computed one."""
        return self.signature_hash == self._compute_hash()
