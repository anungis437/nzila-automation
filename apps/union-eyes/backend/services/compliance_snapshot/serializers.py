"""
Compliance Snapshot Engine — DRF serializers.
"""

from rest_framework import serializers

from .models import ComplianceSnapshot


class ComplianceSnapshotSerializer(serializers.ModelSerializer):
    integrity_valid = serializers.SerializerMethodField()

    class Meta:
        model = ComplianceSnapshot
        fields = [
            "id",
            "org_id",
            "snapshot_type",
            "snapshot_payload",
            "hash",
            "previous_hash",
            "sequence_number",
            "created_by",
            "metadata",
            "created_at",
            "integrity_valid",
        ]
        read_only_fields = fields

    def get_integrity_valid(self, obj) -> bool:
        return obj.verify_integrity()
