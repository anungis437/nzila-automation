"""
Compliance backbone app models.

This module contains:
  1. NzilaOS backbone compliance models (consent tracking, audit controls)
  2. ABR Insights confidential reporting models (identity vault, dual-control)

ABR models implement the strictest vertical controls:
  - Org-scoped isolation on all tables
  - Encrypted identity at rest (keys managed externally via Azure Key Vault)
  - Every identity read creates an access log entry
  - All sensitive actions require dual-control (request + distinct approver)
  - No identity fields in case listing endpoints

NzilaOS Org terminology: all records are scoped by org_id.
"""

import uuid

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

# ─── ABR: Reporter Identity Vault ────────────────────────────────────────────


class AbrReporterIdentity(models.Model):
    """
    Encrypted reporter identity vault entry.

    The encrypted_payload stores an AES-256-GCM encrypted JSON blob containing
    name, email, phone, and employee ID. The encryption key is managed in
    Azure Key Vault; only the key_id is stored here for rotation tracking.

    NEVER expose this model through a list API endpoint.
    Access requires an explicit AbrIdentityAccessGrant with a valid expiry.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(
        db_index=True,
        help_text="NzilaOS Org boundary — all queries MUST filter by org_id.",
    )
    # The vault entry ID is random and deliberately NOT correlated to case IDs.
    vault_id = models.UUIDField(
        unique=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Opaque random ID; not correlated to any case.",
    )
    encrypted_payload = models.TextField(
        help_text="AES-256-GCM encrypted identity JSON (base64 or hex encoded).",
    )
    iv = models.CharField(
        max_length=64, help_text="Initialization vector (hex, 12 bytes = 24 chars)."
    )
    auth_tag = models.CharField(max_length=64, help_text="GCM authentication tag (hex).")
    key_id = models.CharField(
        max_length=256,
        help_text="Key Vault key identifier — used for rotation tracking only.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "abr_reporter_identity"
        indexes = [
            models.Index(fields=["org_id"], name="abr_identity_org_idx"),
        ]
        verbose_name = "ABR Reporter Identity"
        verbose_name_plural = "ABR Reporter Identities"

    def __str__(self):
        return f"Identity {self.vault_id} (Org {self.org_id})"


# ─── ABR: Case ───────────────────────────────────────────────────────────────


class AbrCase(models.Model):
    """
    ABR confidential case.

    Identity is stored separately in AbrReporterIdentity and referenced only
    by the opaque vault_id (not by name/email). Case API endpoints MUST NOT
    return identity fields.
    """

    STATUS_CHOICES = [
        ("open", "Open"),
        ("under_review", "Under Review"),
        ("pending_close", "Pending Close — awaiting dual-control approval"),
        ("closed", "Closed"),
    ]
    SEVERITY_CHOICES = [
        ("informational", "Informational"),
        ("moderate", "Moderate"),
        ("serious", "Serious"),
        ("critical", "Critical"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(
        db_index=True,
        help_text="NzilaOS Org boundary.",
    )
    # Opaque reference — do NOT expose vault entry in case GET/LIST responses
    reporter_vault_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="Opaque reference to AbrReporterIdentity.vault_id. Never join in list endpoints.",
    )
    title = models.CharField(max_length=512)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="open")
    severity = models.CharField(max_length=50, choices=SEVERITY_CHOICES, default="informational")
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="abr_cases_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "abr_case"
        indexes = [
            models.Index(fields=["org_id"], name="abr_case_org_idx"),
            models.Index(fields=["org_id", "status"], name="abr_case_org_status_idx"),
        ]
        verbose_name = "ABR Case"

    def __str__(self):
        return f"ABR Case {self.id} [{self.status}] (Org {self.org_id})"


# ─── ABR: Identity Access Log (every read) ───────────────────────────────────


class AbrIdentityAccessLog(models.Model):
    """
    Immutable audit log of every identity access.

    Every read of AbrReporterIdentity MUST create a log entry here.
    This table is append-only — no UPDATE or DELETE operations should be
    performed on existing rows.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(db_index=True)
    vault_id = models.UUIDField(
        db_index=True,
        help_text="Identifies which identity record was accessed.",
    )
    case_id = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text="The case this access was related to.",
    )
    accessed_by = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="abr_identity_accesses"
    )
    access_level = models.CharField(max_length=64, default="identity-access")
    justification = models.TextField(help_text="Required: reason for accessing identity.")
    grant_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="The AbrIdentityAccessGrant that authorized this access.",
    )
    accessed_at = models.DateTimeField(auto_now_add=True)
    request_ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = "abr_identity_access_log"
        indexes = [
            models.Index(fields=["org_id", "vault_id"], name="abr_access_log_org_vault_idx"),
            models.Index(fields=["org_id", "case_id"], name="abr_access_log_org_case_idx"),
        ]
        verbose_name = "ABR Identity Access Log"

    def __str__(self):
        return f"Access to vault {self.vault_id} by {self.accessed_by_id} at {self.accessed_at}"


# ─── ABR: Sensitive Action Requests (dual-control step 1) ────────────────────


class AbrSensitiveActionRequest(models.Model):
    """
    A request to perform a sensitive action (requires dual-control approval).

    Sensitive actions: case-close, severity-change, identity-unmask.
    A request CANNOT be approved by the same user who created it.
    """

    ACTION_CHOICES = [
        ("case-close", "Close Case"),
        ("severity-change", "Change Severity"),
        ("identity-unmask", "Unmask Reporter Identity"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending Approval"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("executed", "Executed"),
        ("expired", "Expired"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(db_index=True)
    case_id = models.UUIDField(db_index=True)
    action = models.CharField(max_length=64, choices=ACTION_CHOICES)
    requested_by = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="abr_actions_requested"
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    justification = models.TextField()
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="pending")
    expires_at = models.DateTimeField(null=True, blank=True)
    # Metadata payload for the action (e.g., new severity level for severity-change)
    action_metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "abr_sensitive_action_requests"
        indexes = [
            models.Index(fields=["org_id", "case_id"], name="abr_sar_org_case_idx"),
            models.Index(fields=["org_id", "status"], name="abr_sar_org_status_idx"),
        ]
        verbose_name = "ABR Sensitive Action Request"

    def __str__(self):
        return f"SAR {self.id}: {self.action} on case {self.case_id} [{self.status}]"


# ─── ABR: Sensitive Action Approvals (dual-control step 2) ───────────────────


class AbrSensitiveActionApproval(models.Model):
    """
    Approval record for an AbrSensitiveActionRequest.

    CONSTRAINT: approved_by MUST differ from request.requested_by.
    This constraint is enforced at the model/view layer; the DB schema
    provides the data for auditing.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(db_index=True)
    request = models.OneToOneField(
        AbrSensitiveActionRequest,
        on_delete=models.PROTECT,
        related_name="approval",
    )
    approved_by = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="abr_actions_approved"
    )
    approved_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    is_rejection = models.BooleanField(
        default=False,
        help_text="True if this record represents a rejection rather than an approval.",
    )

    class Meta:
        db_table = "abr_sensitive_action_approvals"
        indexes = [
            models.Index(fields=["org_id"], name="abr_saa_org_idx"),
        ]
        verbose_name = "ABR Sensitive Action Approval"

    def clean(self):
        """Enforce dual-control: approver must differ from requester."""
        from django.core.exceptions import ValidationError

        if self.request_id and self.approved_by_id:
            if str(self.approved_by_id) == str(self.request.requested_by_id):
                raise ValidationError(
                    "Self-approval is not permitted. "
                    "The approver must be a different user from the requester. "
                    "(ABR dual-control invariant)"
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        action = "Rejected" if self.is_rejection else "Approved"
        return f"{action} request {self.request_id} by {self.approved_by_id}"


# ─── ABR: Case Team Members (need-to-know membership) ────────────────────────


class AbrCaseTeamMember(models.Model):
    """
    Tracks which users are assigned to a case (need-to-know access).

    Only users with an active team membership can access case details.
    Identity access still requires a separate dual-controlled grant.
    """

    ROLE_CHOICES = [
        ("case-manager", "Case Manager"),
        ("compliance-officer", "Compliance Officer"),
        ("reviewer", "Reviewer"),
        ("observer", "Observer"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(db_index=True)
    case = models.ForeignKey(AbrCase, on_delete=models.CASCADE, related_name="team_members")
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name="abr_case_memberships")
    role = models.CharField(max_length=64, choices=ROLE_CHOICES, default="reviewer")
    added_by = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="abr_memberships_added"
    )
    added_at = models.DateTimeField(auto_now_add=True)
    removed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "abr_case_team_members"
        unique_together = [("case", "user")]
        indexes = [
            models.Index(fields=["org_id", "case_id"], name="abr_team_org_case_idx"),
        ]
        verbose_name = "ABR Case Team Member"

    def __str__(self):
        return f"{self.user_id} ({self.role}) on case {self.case_id}"


# ─── ABR: Identity Access Grant (dual-control result for identity reads) ──────


class AbrIdentityAccessGrant(models.Model):
    """
    A time-bounded, dual-control-approved grant to access reporter identity.

    Grants are produced by the dual-control approval workflow and expire
    automatically. An expired grant MUST be rejected by evaluateCaseAccess().
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(db_index=True)
    vault_id = models.UUIDField(db_index=True)
    case_id = models.UUIDField(null=True, blank=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name="abr_identity_grants")
    granted_by = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="abr_identity_grants_issued"
    )
    source_request = models.ForeignKey(
        AbrSensitiveActionRequest,
        on_delete=models.PROTECT,
        related_name="identity_grant",
        null=True,
        blank=True,
    )
    reason = models.TextField()
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(help_text="Grant is invalid after this timestamp.")
    is_revoked = models.BooleanField(default=False)

    class Meta:
        db_table = "abr_identity_access_grants"
        indexes = [
            models.Index(fields=["org_id", "vault_id"], name="abr_grant_org_vault_idx"),
            models.Index(fields=["org_id", "user_id"], name="abr_grant_org_user_idx"),
        ]
        verbose_name = "ABR Identity Access Grant"

    def is_valid(self):
        from django.utils import timezone

        return not self.is_revoked and self.expires_at > timezone.now()

    def __str__(self):
        return f"Grant for {self.user_id} on vault {self.vault_id} (expires {self.expires_at})"
