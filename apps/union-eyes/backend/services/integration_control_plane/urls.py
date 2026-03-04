"""
Integration Control Plane — URL configuration.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import IntegrationIdempotencyKeyViewSet, IntegrationRegistryViewSet

router = DefaultRouter()
router.register(
    r"registry", IntegrationRegistryViewSet, basename="integration-registry"
)
router.register(
    r"idempotency-keys",
    IntegrationIdempotencyKeyViewSet,
    basename="integration-idempotency-keys",
)

urlpatterns = [
    path("", include(router.urls)),
]
