# pyright: reportMissingModuleSource=false
# cSpell:ignore Nzila abrreporteridentity abrcase abridentityaccesslog abrsensitiveactionrequest abrsensitiveactionapproval abrcaseteammember abridentityaccessgrant
"""
ABR Insights — Initial Django Migration

Creates all ABR compliance tables:
  - abr_reporter_identity    : Encrypted identity vault (Org-scoped)
  - abr_case                 : Confidential case records
  - abr_identity_access_log  : Immutable audit log of every identity read
  - abr_sensitive_action_requests   : Dual-control request ledger
  - abr_sensitive_action_approvals  : Dual-control approval ledger
  - abr_case_team_members    : Need-to-know membership
  - abr_identity_access_grants      : Time-bounded identity access grants

All tables include:
  - org_id field (NzilaOS Org boundary)
  - Indexes on (org_id, ...) for isolation and performance
"""

import uuid

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── ABR Reporter Identity ─────────────────────────────────────────
        migrations.CreateModel(
            name="AbrReporterIdentity",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                (
                    "org_id",
                    models.UUIDField(
                        db_index=True,
                        help_text="NzilaOS Org boundary — all queries MUST filter by org_id.",
                    ),
                ),
                (
                    "vault_id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        help_text="Opaque random ID; not correlated to any case.",
                        unique=True,
                    ),
                ),
                (
                    "encrypted_payload",
                    models.TextField(
                        help_text="AES-256-GCM encrypted identity JSON (base64 or hex encoded)."
                    ),
                ),
                (
                    "iv",
                    models.CharField(
                        help_text="Initialization vector (hex, 12 bytes = 24 chars).", max_length=64
                    ),
                ),
                (
                    "auth_tag",
                    models.CharField(help_text="GCM authentication tag (hex).", max_length=64),
                ),
                (
                    "key_id",
                    models.CharField(
                        help_text="Key Vault key identifier — used for rotation tracking only.",
                        max_length=256,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "ABR Reporter Identity",
                "verbose_name_plural": "ABR Reporter Identities",
                "db_table": "abr_reporter_identity",
            },
        ),
        migrations.AddIndex(
            model_name="abrreporteridentity",
            index=models.Index(fields=["org_id"], name="abr_identity_org_idx"),
        ),
        # ── ABR Case ─────────────────────────────────────────────────────
        migrations.CreateModel(
            name="AbrCase",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("org_id", models.UUIDField(db_index=True, help_text="NzilaOS Org boundary.")),
                (
                    "reporter_vault_id",
                    models.UUIDField(
                        blank=True,
                        help_text="Opaque reference to AbrReporterIdentity.vault_id. Never join in list endpoints.",
                        null=True,
                    ),
                ),
                ("title", models.CharField(max_length=512)),
                ("description", models.TextField(blank=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("open", "Open"),
                            ("under_review", "Under Review"),
                            ("pending_close", "Pending Close — awaiting dual-control approval"),
                            ("closed", "Closed"),
                        ],
                        default="open",
                        max_length=50,
                    ),
                ),
                (
                    "severity",
                    models.CharField(
                        choices=[
                            ("informational", "Informational"),
                            ("moderate", "Moderate"),
                            ("serious", "Serious"),
                            ("critical", "Critical"),
                        ],
                        default="informational",
                        max_length=50,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="abr_cases_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "ABR Case",
                "db_table": "abr_case",
            },
        ),
        migrations.AddIndex(
            model_name="abrcase",
            index=models.Index(fields=["org_id"], name="abr_case_org_idx"),
        ),
        migrations.AddIndex(
            model_name="abrcase",
            index=models.Index(fields=["org_id", "status"], name="abr_case_org_status_idx"),
        ),
        # ── ABR Identity Access Log ───────────────────────────────────────
        migrations.CreateModel(
            name="AbrIdentityAccessLog",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("org_id", models.UUIDField(db_index=True)),
                (
                    "vault_id",
                    models.UUIDField(
                        db_index=True, help_text="Identifies which identity record was accessed."
                    ),
                ),
                (
                    "case_id",
                    models.UUIDField(
                        blank=True,
                        db_index=True,
                        help_text="The case this access was related to.",
                        null=True,
                    ),
                ),
                ("access_level", models.CharField(default="identity-access", max_length=64)),
                (
                    "justification",
                    models.TextField(help_text="Required: reason for accessing identity."),
                ),
                (
                    "grant_id",
                    models.UUIDField(
                        blank=True,
                        help_text="The AbrIdentityAccessGrant that authorized this access.",
                        null=True,
                    ),
                ),
                ("accessed_at", models.DateTimeField(auto_now_add=True)),
                ("request_ip", models.GenericIPAddressField(blank=True, null=True)),
                (
                    "accessed_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="abr_identity_accesses",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "ABR Identity Access Log",
                "db_table": "abr_identity_access_log",
            },
        ),
        migrations.AddIndex(
            model_name="abridentityaccesslog",
            index=models.Index(fields=["org_id", "vault_id"], name="abr_access_log_org_vault_idx"),
        ),
        migrations.AddIndex(
            model_name="abridentityaccesslog",
            index=models.Index(fields=["org_id", "case_id"], name="abr_access_log_org_case_idx"),
        ),
        # ── ABR Sensitive Action Requests ────────────────────────────────
        migrations.CreateModel(
            name="AbrSensitiveActionRequest",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("org_id", models.UUIDField(db_index=True)),
                ("case_id", models.UUIDField(db_index=True)),
                (
                    "action",
                    models.CharField(
                        choices=[
                            ("case-close", "Close Case"),
                            ("severity-change", "Change Severity"),
                            ("identity-unmask", "Unmask Reporter Identity"),
                        ],
                        max_length=64,
                    ),
                ),
                ("justification", models.TextField()),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending Approval"),
                            ("approved", "Approved"),
                            ("rejected", "Rejected"),
                            ("executed", "Executed"),
                            ("expired", "Expired"),
                        ],
                        default="pending",
                        max_length=32,
                    ),
                ),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                ("action_metadata", models.JSONField(blank=True, default=dict)),
                ("requested_at", models.DateTimeField(auto_now_add=True)),
                (
                    "requested_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="abr_actions_requested",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "ABR Sensitive Action Request",
                "db_table": "abr_sensitive_action_requests",
            },
        ),
        migrations.AddIndex(
            model_name="abrsensitiveactionrequest",
            index=models.Index(fields=["org_id", "case_id"], name="abr_sar_org_case_idx"),
        ),
        migrations.AddIndex(
            model_name="abrsensitiveactionrequest",
            index=models.Index(fields=["org_id", "status"], name="abr_sar_org_status_idx"),
        ),
        # ── ABR Sensitive Action Approvals ───────────────────────────────
        migrations.CreateModel(
            name="AbrSensitiveActionApproval",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("org_id", models.UUIDField(db_index=True)),
                ("notes", models.TextField(blank=True)),
                (
                    "is_rejection",
                    models.BooleanField(
                        default=False,
                        help_text="True if this record represents a rejection rather than an approval.",
                    ),
                ),
                ("approved_at", models.DateTimeField(auto_now_add=True)),
                (
                    "request",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="approval",
                        to="compliance.abrsensitiveactionrequest",
                    ),
                ),
                (
                    "approved_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="abr_actions_approved",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "ABR Sensitive Action Approval",
                "db_table": "abr_sensitive_action_approvals",
            },
        ),
        migrations.AddIndex(
            model_name="abrsensitiveactionapproval",
            index=models.Index(fields=["org_id"], name="abr_saa_org_idx"),
        ),
        # ── ABR Case Team Members ─────────────────────────────────────────
        migrations.CreateModel(
            name="AbrCaseTeamMember",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("org_id", models.UUIDField(db_index=True)),
                (
                    "role",
                    models.CharField(
                        choices=[
                            ("case-manager", "Case Manager"),
                            ("compliance-officer", "Compliance Officer"),
                            ("reviewer", "Reviewer"),
                            ("observer", "Observer"),
                        ],
                        default="reviewer",
                        max_length=64,
                    ),
                ),
                ("added_at", models.DateTimeField(auto_now_add=True)),
                ("removed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "case",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="team_members",
                        to="compliance.abrcase",
                    ),
                ),
                (
                    "added_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="abr_memberships_added",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="abr_case_memberships",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "ABR Case Team Member",
                "db_table": "abr_case_team_members",
                "unique_together": {("case", "user")},
            },
        ),
        migrations.AddIndex(
            model_name="abrcaseteammember",
            index=models.Index(fields=["org_id", "case_id"], name="abr_team_org_case_idx"),
        ),
        # ── ABR Identity Access Grants ────────────────────────────────────
        migrations.CreateModel(
            name="AbrIdentityAccessGrant",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("org_id", models.UUIDField(db_index=True)),
                ("vault_id", models.UUIDField(db_index=True)),
                ("case_id", models.UUIDField(blank=True, db_index=True, null=True)),
                ("reason", models.TextField()),
                ("granted_at", models.DateTimeField(auto_now_add=True)),
                (
                    "expires_at",
                    models.DateTimeField(help_text="Grant is invalid after this timestamp."),
                ),
                ("is_revoked", models.BooleanField(default=False)),
                (
                    "granted_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="abr_identity_grants_issued",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "source_request",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="identity_grant",
                        to="compliance.abrsensitiveactionrequest",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="abr_identity_grants",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "ABR Identity Access Grant",
                "db_table": "abr_identity_access_grants",
            },
        ),
        migrations.AddIndex(
            model_name="abridentityaccessgrant",
            index=models.Index(fields=["org_id", "vault_id"], name="abr_grant_org_vault_idx"),
        ),
        migrations.AddIndex(
            model_name="abridentityaccessgrant",
            index=models.Index(fields=["org_id", "user_id"], name="abr_grant_org_user_idx"),
        ),
    ]
