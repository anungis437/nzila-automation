"""
Event Bus — DRF serializers.
"""

from rest_framework import serializers

from .models import Event


class EventSerializer(serializers.ModelSerializer):
    integrity_valid = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id",
            "event_type",
            "org_id",
            "actor_id",
            "payload",
            "signature_hash",
            "correlation_id",
            "metadata",
            "created_at",
            "integrity_valid",
        ]
        read_only_fields = [
            "id",
            "signature_hash",
            "created_at",
            "integrity_valid",
        ]

    def get_integrity_valid(self, obj) -> bool:
        return obj.verify_integrity()


class EventCreateSerializer(serializers.Serializer):
    """Thin write-serializer for the emit endpoint."""

    event_type = serializers.CharField(max_length=64)
    payload = serializers.JSONField(required=False, default=dict)
    correlation_id = serializers.CharField(max_length=64, required=False, default="")
    metadata = serializers.JSONField(required=False, default=dict)
