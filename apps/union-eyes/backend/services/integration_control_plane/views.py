"""
Integration Control Plane — DRF viewsets.

All endpoints enforce tenant isolation via ``request.organization_id``.
"""

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import IntegrationIdempotencyKey, IntegrationRegistry
from .serializers import (
    IntegrationIdempotencyKeySerializer,
    IntegrationRegistryCreateSerializer,
    IntegrationRegistrySerializer,
)


class IntegrationRegistryViewSet(viewsets.ModelViewSet):
    """
    CRUD for integration registrations, scoped to the calling org.
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IntegrationRegistrySerializer

    def get_queryset(self):
        org_id = getattr(self.request, "organization_id", None)
        if not org_id:
            return IntegrationRegistry.objects.none()
        return IntegrationRegistry.objects.filter(org_id=org_id)

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return IntegrationRegistryCreateSerializer
        return IntegrationRegistrySerializer

    def perform_create(self, serializer):
        serializer.save(org_id=self.request.organization_id)

    # ----- custom actions -----

    @action(detail=True, methods=["post"], url_path="pause")
    def pause(self, request, pk=None):
        integration = self.get_object()
        integration.status = "paused"
        integration.save(update_fields=["status", "updated_at"])
        return Response(IntegrationRegistrySerializer(integration).data)

    @action(detail=True, methods=["post"], url_path="resume")
    def resume(self, request, pk=None):
        integration = self.get_object()
        integration.status = "active"
        integration.consecutive_failures = 0
        integration.save(update_fields=["status", "consecutive_failures", "updated_at"])
        return Response(IntegrationRegistrySerializer(integration).data)

    @action(detail=True, methods=["post"], url_path="reset-failures")
    def reset_failures(self, request, pk=None):
        integration = self.get_object()
        integration.failure_count = 0
        integration.consecutive_failures = 0
        integration.status = "active"
        integration.save(
            update_fields=[
                "failure_count",
                "consecutive_failures",
                "status",
                "updated_at",
            ]
        )
        return Response(IntegrationRegistrySerializer(integration).data)

    @action(detail=False, methods=["get"], url_path="health")
    def health_summary(self, request):
        qs = self.get_queryset()
        summary = {
            "total": qs.count(),
            "active": qs.filter(status="active").count(),
            "degraded": qs.filter(status="degraded").count(),
            "failed": qs.filter(status="failed").count(),
            "paused": qs.filter(status="paused").count(),
            "disabled": qs.filter(status="disabled").count(),
        }
        return Response(summary)


class IntegrationIdempotencyKeyViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only view of idempotency keys for debugging / audit."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IntegrationIdempotencyKeySerializer

    def get_queryset(self):
        org_id = getattr(self.request, "organization_id", None)
        if not org_id:
            return IntegrationIdempotencyKey.objects.none()
        return IntegrationIdempotencyKey.objects.filter(org_id=org_id).order_by(
            "-created_at"
        )
