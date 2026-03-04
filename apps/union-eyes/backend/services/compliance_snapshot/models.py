"""
Compliance Snapshot Engine — Models.

Snapshots capture the compliance state of an organization at a point in time.
Each snapshot is chained to the previous via SHA-256, creating an immutable
append-only compliance ledger.
"""

import hashlib
import json
import uuid

from django.db import models
from django.utils import timezone


class ComplianceSnapshot(models.Model):
    """
    A point-in-time compliance state capture, hash-chained to its predecessor.
    """

    SNAPSHOT_TYPES = [
        ("daily", "Daily"),
        ("weekly", "Weekly"),
        ("monthly", "Monthly"),
        ("quarterly", "Quarterly"),
        ("annual", "Annual"),
        ("on_demand", "On-Demand"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(db_index=True)
    snapshot_type = models.CharField(max_length=16, choices=SNAPSHOT_TYPES)
    snapshot_payload = models.JSONField(
        help_text="Full compliance state at time of capture"
    )

    # Hash chain — immutability guarantee.
    hash = models.CharField(
        max_length=64,
        help_text="SHA-256 of (snapshot_payload + previous_hash)",
    )
    previous_hash = models.CharField(
        max_length=64,
        blank=True,
        default="",
        help_text="Hash of the preceding snapshot (empty for first)",
    )
    sequence_number = models.PositiveIntegerField(
        default=0,
        help_text="Monotonic sequence within org",
    )

    # Metadata.
    created_by = models.CharField(max_length=255, default="system")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "compliance_snapshots"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["org_id", "snapshot_type"], name="idx_compsnap_org_type"
            ),
            models.Index(fields=["org_id", "created_at"], name="idx_compsnap_org_time"),
            models.Index(
                fields=["org_id", "sequence_number"],
                name="idx_compsnap_org_seq",
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["org_id", "sequence_number"],
                name="uq_compsnap_org_seq",
            ),
        ]

    def __str__(self) -> str:
        return (
            f"Snapshot({self.snapshot_type}, org={str(self.org_id)[:8]}…, "
            f"seq={self.sequence_number})"
        )

    def save(self, *args, **kwargs):
        if not self.hash:
            self.hash = self._compute_hash()
        super().save(*args, **kwargs)

    # ---- integrity ----

    def _compute_hash(self) -> str:
        canonical = json.dumps(self.snapshot_payload, sort_keys=True, default=str)
        data = f"{canonical}{self.previous_hash}"
        return hashlib.sha256(data.encode()).hexdigest()

    def verify_integrity(self) -> bool:
        """Return True if stored hash matches a fresh computation."""
        return self.hash == self._compute_hash()
