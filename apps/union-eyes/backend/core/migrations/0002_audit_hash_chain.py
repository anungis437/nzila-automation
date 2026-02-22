"""
Migration: Add hash chain fields to UE core AuditLogs.

Adds action, resource_type, resource_id, ip_address, correlation_id,
details, changes, content_hash, previous_hash fields to audit_logs table.

Implements the NzilaOS tamper-evident audit invariant:
  SHA-256( action | resource_type | resource_id | user_id |
           correlation_id | details | previous_hash )
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
        ("auth_core", "0002_add_clerk_organization_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="auditlogs",
            name="action",
            field=models.CharField(
                blank=True,
                max_length=100,
                null=True,
                help_text="Verb: create, update, delete, initiate, cancel, …",
            ),
        ),
        migrations.AddField(
            model_name="auditlogs",
            name="resource_type",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="auditlogs",
            name="resource_id",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="auditlogs",
            name="ip_address",
            field=models.GenericIPAddressField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="auditlogs",
            name="user_agent",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="auditlogs",
            name="correlation_id",
            field=models.UUIDField(
                blank=True,
                null=True,
                help_text="Ties this event to a request or workflow",
            ),
        ),
        migrations.AddField(
            model_name="auditlogs",
            name="details",
            field=models.JSONField(blank=True, default=dict, null=True),
        ),
        migrations.AddField(
            model_name="auditlogs",
            name="changes",
            field=models.JSONField(blank=True, default=dict, null=True),
        ),
        # ── Hash chain fields ──────────────────────────────────────────────
        migrations.AddField(
            model_name="auditlogs",
            name="content_hash",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name="auditlogs",
            name="previous_hash",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        # ── Indexes ───────────────────────────────────────────────────────
        migrations.AddIndex(
            model_name="auditlogs",
            index=models.Index(
                fields=["organization_id", "created_at"],
                name="idx_ue_audit_logs_org_created",
            ),
        ),
        migrations.AddIndex(
            model_name="auditlogs",
            index=models.Index(
                fields=["correlation_id"],
                name="idx_ue_audit_logs_correlation",
            ),
        ),
    ]
