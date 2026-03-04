"""
Evidence Pack System — DRF serializers.
"""

from rest_framework import serializers

from .models import EvidenceArtifact, EvidencePack


class EvidenceArtifactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvidenceArtifact
        fields = [
            "id",
            "artifact_type",
            "source_id",
            "content_hash",
            "size_bytes",
            "created_at",
        ]
        read_only_fields = fields


class EvidencePackSerializer(serializers.ModelSerializer):
    seal_valid = serializers.SerializerMethodField()

    class Meta:
        model = EvidencePack
        fields = [
            "id",
            "org_id",
            "pack_type",
            "title",
            "description",
            "status",
            "period_start",
            "period_end",
            "artifact_count",
            "total_size_bytes",
            "pack_hash",
            "sealed_at",
            "sealed_by",
            "requested_by",
            "metadata",
            "created_at",
            "updated_at",
            "seal_valid",
        ]
        read_only_fields = [
            "id",
            "artifact_count",
            "total_size_bytes",
            "pack_hash",
            "sealed_at",
            "sealed_by",
            "created_at",
            "updated_at",
            "seal_valid",
        ]

    def get_seal_valid(self, obj) -> bool | None:
        if obj.status in ("sealed", "exported"):
            return obj.verify_seal()
        return None


class EvidencePackExportSerializer(serializers.Serializer):
    """Request params for the export endpoint."""

    pack_type = serializers.CharField(max_length=32, default="governance_full")
    title = serializers.CharField(max_length=512, required=False, default="")
    period_start = serializers.DateTimeField(required=False, allow_null=True)
    period_end = serializers.DateTimeField(required=False, allow_null=True)
    include_events = serializers.BooleanField(default=True)
    include_audit_logs = serializers.BooleanField(default=True)
    include_cases = serializers.BooleanField(default=True)
    include_governance = serializers.BooleanField(default=True)
    include_votes = serializers.BooleanField(default=True)
