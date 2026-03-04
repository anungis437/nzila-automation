"""
Compliance Snapshot Engine — URL configuration.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ComplianceSnapshotViewSet

router = DefaultRouter()
router.register(r"", ComplianceSnapshotViewSet, basename="compliance-snapshots")

urlpatterns = [
    path("", include(router.urls)),
]
