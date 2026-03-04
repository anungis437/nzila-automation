"""
Integration Control Plane — DRF serializers.
"""

from rest_framework import serializers

from .models import IntegrationIdempotencyKey, IntegrationRegistry


class IntegrationRegistrySerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegrationRegistry
        fields = [
            "id",
            "org_id",
            "integration_type",
            "name",
            "endpoint_url",
            "status",
            "retry_policy",
            "max_retries",
            "failure_count",
            "consecutive_failures",
            "last_success_at",
            "last_failure_at",
            "last_failure_reason",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "failure_count",
            "consecutive_failures",
            "last_success_at",
            "last_failure_at",
            "last_failure_reason",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        # Inject org_id from request context (tenant isolation)
        request = self.context.get("request")
        if request and hasattr(request, "organization_id"):
            validated_data["org_id"] = request.organization_id
        return super().create(validated_data)


class IntegrationRegistryCreateSerializer(serializers.ModelSerializer):
    """Write-only — excludes secret from reads."""

    class Meta:
        model = IntegrationRegistry
        fields = [
            "integration_type",
            "name",
            "endpoint_url",
            "secret",
            "retry_policy",
            "max_retries",
            "metadata",
        ]


class IntegrationIdempotencyKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegrationIdempotencyKey
        fields = [
            "id",
            "request_hash",
            "integration",
            "org_id",
            "response_status",
            "created_at",
            "expires_at",
            "is_expired",
        ]
        read_only_fields = ["id", "created_at", "is_expired"]
