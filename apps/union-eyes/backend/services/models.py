from django.db import models
from services.compliance_snapshot.models import ComplianceSnapshot  # noqa: F401
from services.events.models import Event  # noqa: F401
from services.evidence_pack.models import EvidenceArtifact, EvidencePack  # noqa: F401

# Import sub-package models so Django discovers them for migrations.
from services.integration_control_plane.models import (  # noqa: F401
    IntegrationIdempotencyKey,
    IntegrationRegistry,
)
