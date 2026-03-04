"""
Evidence Pack System — URL configuration.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EvidencePackViewSet

router = DefaultRouter()
router.register(r"", EvidencePackViewSet, basename="evidence-pack")

urlpatterns = [
    path("", include(router.urls)),
]
