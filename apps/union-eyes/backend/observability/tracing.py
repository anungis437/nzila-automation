"""
OpenTelemetry Instrumentation — traces for API requests, DB queries,
Celery jobs, and integration calls.

Call ``configure_tracing()`` once at Django startup (e.g. in ``config/__init__.py``
or ``config/settings.py``).
"""

from __future__ import annotations

import logging
import os
from typing import Optional

logger = logging.getLogger("observability.tracing")

_tracer = None  # cached global tracer


def configure_tracing(
    service_name: str = "union-eyes-backend",
    otlp_endpoint: Optional[str] = None,
    sample_rate: float = 0.1,
) -> None:
    """
    Bootstrap OpenTelemetry SDK with OTLP exporter.

    Safe to call even if ``opentelemetry`` is not installed — degrades to no-op.
    """
    global _tracer

    otlp_endpoint = otlp_endpoint or os.environ.get(
        "OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318"
    )

    try:
        from opentelemetry import trace
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.sdk.trace.sampling import TraceIdRatioBased

        resource = Resource.create({"service.name": service_name})
        sampler = TraceIdRatioBased(sample_rate)
        provider = TracerProvider(resource=resource, sampler=sampler)

        # OTLP exporter — try gRPC first, fall back to HTTP.
        try:
            from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import (
                OTLPSpanExporter,
            )

            exporter = OTLPSpanExporter(endpoint=otlp_endpoint)
        except ImportError:
            try:
                from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
                    OTLPSpanExporter,
                )

                exporter = OTLPSpanExporter(endpoint=f"{otlp_endpoint}/v1/traces")
            except ImportError:
                logger.warning(
                    "No OTLP exporter available — tracing will be local only"
                )
                exporter = None

        if exporter:
            provider.add_span_processor(BatchSpanProcessor(exporter))

        trace.set_tracer_provider(provider)
        _tracer = trace.get_tracer(service_name)

        # Auto-instrument Django + psycopg2 + Celery if instrumentation packages are present.
        _auto_instrument()

        logger.info(
            "OpenTelemetry configured: service=%s endpoint=%s sample_rate=%.2f",
            service_name,
            otlp_endpoint,
            sample_rate,
        )

    except ImportError:
        logger.info("opentelemetry SDK not installed — tracing disabled")
    except Exception:
        logger.exception("Failed to configure OpenTelemetry")


def get_tracer():
    """Return the global tracer (may be a no-op proxy)."""
    global _tracer
    if _tracer is None:
        try:
            from opentelemetry import trace

            _tracer = trace.get_tracer("union-eyes-backend")
        except ImportError:
            _tracer = _NoOpTracer()
    return _tracer


# ---------------------------------------------------------------------------
# Auto-instrumentation helpers
# ---------------------------------------------------------------------------


def _auto_instrument() -> None:
    """Attempt to auto-instrument common libraries."""
    _try_instrument("opentelemetry.instrumentation.django", "DjangoInstrumentor")
    _try_instrument("opentelemetry.instrumentation.psycopg2", "Psycopg2Instrumentor")
    _try_instrument("opentelemetry.instrumentation.celery", "CeleryInstrumentor")
    _try_instrument("opentelemetry.instrumentation.requests", "RequestsInstrumentor")
    _try_instrument("opentelemetry.instrumentation.redis", "RedisInstrumentor")


def _try_instrument(module_path: str, class_name: str) -> None:
    try:
        mod = __import__(module_path, fromlist=[class_name])
        instrumentor = getattr(mod, class_name)()
        if not instrumentor.is_instrumented_by_opentelemetry:
            instrumentor.instrument()
            logger.info("Auto-instrumented %s", class_name)
    except Exception:
        pass  # library not installed or already instrumented


# ---------------------------------------------------------------------------
# No-op fallback
# ---------------------------------------------------------------------------


class _NoOpSpan:
    def __enter__(self):
        return self

    def __exit__(self, *a):
        pass

    def set_attribute(self, *a):
        pass

    def set_status(self, *a):
        pass

    def add_event(self, *a):
        pass

    def record_exception(self, *a):
        pass


class _NoOpTracer:
    def start_as_current_span(self, name, **kw):
        return _NoOpSpan()

    def start_span(self, name, **kw):
        return _NoOpSpan()
