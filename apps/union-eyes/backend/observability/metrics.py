"""
Prometheus-Compatible Metrics Registry.

Exposes key operational metrics at ``/metrics`` (Prometheus text format)
and provides metric-recording helpers for application code.

Metrics tracked:
  - api_latency (histogram)
  - api_error_rate (counter)
  - integration_failures (counter)
  - queue_depth (gauge — sampled periodically)
  - active_cases (gauge)
"""

from __future__ import annotations

import logging
import threading
import time
from collections import defaultdict
from typing import Dict, List, Optional

from django.http import HttpRequest, HttpResponse

logger = logging.getLogger("observability.metrics")

# ---------------------------------------------------------------------------
# In-process metric store (thread-safe)
# ---------------------------------------------------------------------------
_lock = threading.Lock()

# Counters: metric_name → {labels_tuple: count}
_counters: Dict[str, Dict[tuple, float]] = defaultdict(lambda: defaultdict(float))

# Gauges: metric_name → {labels_tuple: value}
_gauges: Dict[str, Dict[tuple, float]] = defaultdict(lambda: defaultdict(float))

# Histograms: metric_name → {labels_tuple: [observations]}
_histograms: Dict[str, Dict[tuple, List[float]]] = defaultdict(
    lambda: defaultdict(list)
)

# Label names per metric.
_label_names: Dict[str, tuple] = {}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def counter_inc(
    name: str, labels: Optional[Dict[str, str]] = None, value: float = 1
) -> None:
    """Increment a counter."""
    key = _labels_key(labels)
    with _lock:
        _counters[name][key] += value


def gauge_set(
    name: str, labels: Optional[Dict[str, str]] = None, value: float = 0
) -> None:
    """Set a gauge to an absolute value."""
    key = _labels_key(labels)
    with _lock:
        _gauges[name][key] = value


def gauge_inc(
    name: str, labels: Optional[Dict[str, str]] = None, value: float = 1
) -> None:
    key = _labels_key(labels)
    with _lock:
        _gauges[name][key] += value


def gauge_dec(
    name: str, labels: Optional[Dict[str, str]] = None, value: float = 1
) -> None:
    key = _labels_key(labels)
    with _lock:
        _gauges[name][key] -= value


def histogram_observe(
    name: str, value: float, labels: Optional[Dict[str, str]] = None
) -> None:
    """Record an observation in a histogram."""
    key = _labels_key(labels)
    with _lock:
        _histograms[name][key].append(value)


# ---------------------------------------------------------------------------
# Convenience wrappers
# ---------------------------------------------------------------------------


def record_api_latency(method: str, path: str, status: int, latency_ms: float) -> None:
    """Record API request latency and bump error counter if 5xx."""
    histogram_observe(
        "api_latency_ms",
        latency_ms,
        labels={"method": method, "path": _normalize_path(path), "status": str(status)},
    )
    counter_inc(
        "api_requests_total",
        labels={"method": method, "path": _normalize_path(path), "status": str(status)},
    )
    if status >= 500:
        counter_inc(
            "api_errors_total",
            labels={"method": method, "path": _normalize_path(path)},
        )


def record_integration_failure(integration_type: str, org_id: str) -> None:
    counter_inc(
        "integration_failures_total",
        labels={"type": integration_type, "org_id": org_id[:8]},
    )


def set_queue_depth(queue_name: str, depth: int) -> None:
    gauge_set("queue_depth", labels={"queue": queue_name}, value=float(depth))


def set_active_cases(org_id: str, count: int) -> None:
    gauge_set("active_cases", labels={"org_id": org_id[:8]}, value=float(count))


# ---------------------------------------------------------------------------
# Django middleware — auto-record latency for every request
# ---------------------------------------------------------------------------


class MetricsMiddleware:
    """Records api_latency_ms for every request."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        start = time.monotonic()
        response = self.get_response(request)
        elapsed_ms = (time.monotonic() - start) * 1000
        record_api_latency(
            method=request.method or "UNKNOWN",
            path=request.path,
            status=response.status_code,
            latency_ms=elapsed_ms,
        )
        return response


# ---------------------------------------------------------------------------
# Prometheus text-format export
# ---------------------------------------------------------------------------


def render_prometheus() -> str:
    """Render all metrics in Prometheus text exposition format."""
    lines: List[str] = []
    with _lock:
        # Counters
        for name, series in sorted(_counters.items()):
            lines.append(f"# TYPE {name} counter")
            for labels_key, value in sorted(series.items()):
                lbl = _format_labels(labels_key)
                lines.append(f"{name}{lbl} {value}")

        # Gauges
        for name, series in sorted(_gauges.items()):
            lines.append(f"# TYPE {name} gauge")
            for labels_key, value in sorted(series.items()):
                lbl = _format_labels(labels_key)
                lines.append(f"{name}{lbl} {value}")

        # Histograms — simplified (sum, count, quantiles)
        for name, series in sorted(_histograms.items()):
            lines.append(f"# TYPE {name} summary")
            for labels_key, observations in sorted(series.items()):
                lbl = _format_labels(labels_key)
                if observations:
                    sorted_obs = sorted(observations)
                    total = sum(sorted_obs)
                    count = len(sorted_obs)
                    p50 = sorted_obs[int(count * 0.5)] if count else 0
                    p95 = sorted_obs[int(count * 0.95)] if count else 0
                    p99 = sorted_obs[int(count * 0.99)] if count else 0
                    lines.append(f'{name}{_merge_labels(lbl, "quantile", "0.5")} {p50}')
                    lines.append(
                        f'{name}{_merge_labels(lbl, "quantile", "0.95")} {p95}'
                    )
                    lines.append(
                        f'{name}{_merge_labels(lbl, "quantile", "0.99")} {p99}'
                    )
                    lines.append(f"{name}_sum{lbl} {total}")
                    lines.append(f"{name}_count{lbl} {count}")

    return "\n".join(lines) + "\n"


def metrics_view(request: HttpRequest) -> HttpResponse:
    """Django view that serves ``/metrics``."""
    body = render_prometheus()
    return HttpResponse(body, content_type="text/plain; version=0.0.4; charset=utf-8")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _labels_key(labels: Optional[Dict[str, str]]) -> tuple:
    if not labels:
        return ()
    return tuple(sorted(labels.items()))


def _format_labels(labels_key: tuple) -> str:
    if not labels_key:
        return ""
    inner = ",".join(f'{k}="{v}"' for k, v in labels_key)
    return "{" + inner + "}"


def _merge_labels(existing: str, key: str, value: str) -> str:
    """Add an extra label to a formatted label string."""
    pair = f'{key}="{value}"'
    if existing:
        return existing[:-1] + "," + pair + "}"
    return "{" + pair + "}"


def _normalize_path(path: str) -> str:
    """Replace UUID-like segments with ``:id`` to reduce cardinality."""
    import re

    return re.sub(
        r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
        ":id",
        path,
    )
