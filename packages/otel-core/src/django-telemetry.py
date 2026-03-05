"""
Nzila Django OpenTelemetry Setup

Provides telemetry initialization for Django backends (ABR, Union-Eyes).
Auto-instruments Django, psycopg2, and adds Nzila-specific attributes.

Usage:
    In manage.py or wsgi.py:
        from telemetry import setup_telemetry
        setup_telemetry()
"""

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)


def setup_telemetry(service_name: Optional[str] = None) -> None:
    """
    Initialize OpenTelemetry for a Django backend.

    Configures:
    - TracerProvider with OTLP HTTP exporter
    - BatchSpanProcessor for async export
    - Django auto-instrumentation
    - psycopg2 auto-instrumentation (DB query tracing)
    - Custom Nzila span attributes (org_id, tenant_id)
    """
    svc_name = service_name or os.environ.get("OTEL_SERVICE_NAME", "nzila-django")
    endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318")
    environment = os.environ.get(
        "DJANGO_ENV", os.environ.get("ENVIRONMENT", "development")
    )

    try:
        from opentelemetry import trace
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
            OTLPSpanExporter,
        )
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.semconv.resource import ResourceAttributes
    except ImportError:
        logger.warning(
            "OpenTelemetry packages not installed. "
            "Install: pip install opentelemetry-sdk opentelemetry-exporter-otlp-proto-http"
        )
        return

    # Configure resource attributes
    resource = Resource.create(
        {
            ResourceAttributes.SERVICE_NAME: svc_name,
            ResourceAttributes.SERVICE_VERSION: os.environ.get("APP_VERSION", "0.1.0"),
            ResourceAttributes.DEPLOYMENT_ENVIRONMENT: environment,
            "nzila.platform": "nzila-os",
            "nzila.stack": "django",
        }
    )

    # Set up tracer provider
    provider = TracerProvider(resource=resource)
    processor = BatchSpanProcessor(
        OTLPSpanExporter(endpoint=f"{endpoint}/v1/traces"),
        max_queue_size=1000,
        max_export_batch_size=100,
    )
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)

    # Auto-instrument Django
    try:
        from opentelemetry.instrumentation.django import DjangoInstrumentor

        DjangoInstrumentor().instrument(
            request_hook=_request_hook,
            response_hook=_response_hook,
        )
        logger.info("Django auto-instrumentation enabled")
    except ImportError:
        logger.warning("opentelemetry-instrumentation-django not installed")

    # Auto-instrument psycopg2 (database queries)
    try:
        from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor

        Psycopg2Instrumentor().instrument(
            enable_commenter=True,
            commenter_options={"db_driver": True, "route": True},
        )
        logger.info("psycopg2 auto-instrumentation enabled")
    except ImportError:
        logger.warning("opentelemetry-instrumentation-psycopg2 not installed")

    # Auto-instrument requests (outbound HTTP)
    try:
        from opentelemetry.instrumentation.requests import RequestsInstrumentor

        RequestsInstrumentor().instrument()
        logger.info("requests auto-instrumentation enabled")
    except ImportError:
        pass

    logger.info(f"OpenTelemetry initialized for {svc_name} → {endpoint}")


def _request_hook(span, request) -> None:
    """
    Inject Nzila-specific attributes from Django request headers.
    """
    if span is None or not span.is_recording():
        return

    # Extract org/tenant context from headers
    org_id = request.META.get("HTTP_X_ORG_ID", "")
    user_id = request.META.get("HTTP_X_USER_ID", "")
    request_id = request.META.get("HTTP_X_REQUEST_ID", "")

    if org_id:
        span.set_attribute("nzila.org.id", org_id)
        span.set_attribute("nzila.tenant.id", org_id)
    if user_id:
        span.set_attribute("nzila.user.id", user_id)
    if request_id:
        span.set_attribute("nzila.request.id", request_id)

    # Set compute attributes
    span.set_attribute("compute.resource.type", "container")
    span.set_attribute("nzila.stack", "django")


def _response_hook(span, request, response) -> None:
    """
    Record response attributes for SLO tracking.
    """
    if span is None or not span.is_recording():
        return

    span.set_attribute("http.response.status_code", response.status_code)


def create_evidence_span(evidence_pack_id: str, action: str):
    """
    Create a span specifically for evidence pack operations.
    Links evidence packs to distributed traces for audit correlation.
    """
    try:
        from opentelemetry import trace

        tracer = trace.get_tracer("nzila.evidence")
        span = tracer.start_span(
            name=f"evidence.{action}",
            attributes={
                "nzila.evidence.pack_id": evidence_pack_id,
                "nzila.evidence.action": action,
                "nzila.evidence.trace_correlation": "active",
            },
        )
        return span
    except ImportError:
        return None
