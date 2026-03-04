"""
Evidence Pack System — Models.

An evidence pack bundles:
  - audit logs
  - domain events
  - case history
  - governance actions
  - vote records

into a signed, checksum-verified archive for regulatory / procurement review.
"""

import hashlib
import json
import uuid

from django.db import models
from django.utils import timezone


class EvidencePack(models.Model):
    """
    A sealed governance evidence archive.

    Once ``status`` transitions to ``sealed``, the pack becomes immutable.
    """

    STATUS_CHOICES = [
        ("draft", "Draft — collecting artifacts"),
        ("sealed", "Sealed — integrity verified"),
        ("exported", "Exported — delivered to requester"),
        ("expired", "Expired — retention period elapsed"),
    ]

    PACK_TYPES = [
        ("governance_full", "Full Governance Pack"),
        ("grievance_case", "Grievance Case Pack"),
        ("compliance_audit", "Compliance Audit Pack"),
        ("election_record", "Election Record Pack"),
        ("financial_review", "Financial Review Pack"),
        ("data_subject_request", "Data Subject Request Pack"),
        ("custom", "Custom Pack"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(db_index=True)
    pack_type = models.CharField(max_length=32, choices=PACK_TYPES)
    title = models.CharField(max_length=512)
    description = models.TextField(blank=True, default="")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="draft")

    # Time range covered by this pack.
    period_start = models.DateTimeField(null=True, blank=True)
    period_end = models.DateTimeField(null=True, blank=True)

    # Integrity.
    checksum_manifest = models.JSONField(
        default=dict,
        help_text="SHA-256 checksums for each artifact in the pack",
    )
    pack_hash = models.CharField(
        max_length=64,
        blank=True,
        default="",
        help_text="SHA-256 of the entire manifest (seal hash)",
    )
    sealed_at = models.DateTimeField(null=True, blank=True)
    sealed_by = models.CharField(max_length=255, blank=True, default="")

    # Content.
    artifact_count = models.PositiveIntegerField(default=0)
    total_size_bytes = models.BigIntegerField(default=0)

    # Metadata.
    requested_by = models.CharField(max_length=255, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "evidence_packs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["org_id", "status"], name="idx_evpack_org_status"),
            models.Index(fields=["org_id", "pack_type"], name="idx_evpack_org_type"),
        ]

    def __str__(self) -> str:
        return f"EvidencePack({self.title[:40]}, {self.status})"

    def seal(self, actor_id: str) -> None:
        """
        Seal the pack — computes pack_hash from checksum_manifest.

        Raises ValueError if already sealed.
        """
        if self.status != "draft":
            raise ValueError(f"Cannot seal pack in status '{self.status}'")

        canonical = json.dumps(self.checksum_manifest, sort_keys=True, default=str)
        self.pack_hash = hashlib.sha256(canonical.encode()).hexdigest()
        self.sealed_at = timezone.now()
        self.sealed_by = actor_id
        self.status = "sealed"
        self.save()

    def verify_seal(self) -> bool:
        """Return True if the stored pack_hash matches the manifest."""
        if not self.pack_hash:
            return False
        canonical = json.dumps(self.checksum_manifest, sort_keys=True, default=str)
        return hashlib.sha256(canonical.encode()).hexdigest() == self.pack_hash


class EvidenceArtifact(models.Model):
    """
    Individual artifact within an evidence pack (one row per collected record).
    """

    ARTIFACT_TYPES = [
        ("audit_log", "Audit Log Entry"),
        ("domain_event", "Domain Event"),
        ("case_record", "Case Record"),
        ("governance_action", "Governance Action"),
        ("vote_record", "Vote Record"),
        ("compliance_check", "Compliance Check"),
        ("attachment", "File Attachment"),
        ("summary", "Generated Summary"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pack = models.ForeignKey(
        EvidencePack,
        on_delete=models.CASCADE,
        related_name="artifacts",
    )
    artifact_type = models.CharField(max_length=32, choices=ARTIFACT_TYPES)
    source_id = models.CharField(
        max_length=255,
        help_text="UUID or identifier of the source record",
    )
    content = models.JSONField(help_text="Serialized artifact content")
    content_hash = models.CharField(
        max_length=64,
        help_text="SHA-256 of serialized content",
    )
    size_bytes = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "evidence_artifacts"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["pack", "artifact_type"], name="idx_evart_pack_type"),
        ]

    def __str__(self) -> str:
        return f"Artifact({self.artifact_type}, {self.source_id[:12]}…)"

    def save(self, *args, **kwargs):
        if not self.content_hash:
            canonical = json.dumps(self.content, sort_keys=True, default=str)
            self.content_hash = hashlib.sha256(canonical.encode()).hexdigest()
            self.size_bytes = len(canonical.encode())
        super().save(*args, **kwargs)
