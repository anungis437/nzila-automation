"""
Request Signing Middleware.

HMAC-SHA256 request signing for sensitive mutations (governance votes,
financial operations, compliance actions).

The client signs the request body with a shared secret and includes
headers: ``X-Signature``, ``X-Timestamp``.  This middleware verifies
the signature on designated URL prefixes.

Separate from webhook verification — this protects *outgoing* client
requests to the API, not inbound webhooks from third parties.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import time

from django.conf import settings
from django.http import HttpRequest, JsonResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger("request_signing")

# Paths that require signed requests.
REQUEST_SIGNING_REQUIRED_PREFIXES: list[str] = [
    "/api/bargaining/votes/",
    "/api/billing/payments/",
    "/api/compliance/snapshots/capture",
    "/api/governance/evidence-pack/export",
]

# Max age for a signed request (seconds).
MAX_TIMESTAMP_AGE = 300  # 5 minutes


def _get_secret() -> str:
    return getattr(settings, "REQUEST_SIGNING_SECRET", settings.SECRET_KEY)


def _compute_signature(body: bytes, timestamp: str) -> str:
    msg = f"{timestamp}.{body.decode('utf-8', errors='replace')}"
    return hmac.new(_get_secret().encode(), msg.encode(), hashlib.sha256).hexdigest()


class RequestSigningMiddleware(MiddlewareMixin):
    """
    Verify HMAC-SHA256 signatures on sensitive mutation endpoints.
    """

    def process_request(self, request: HttpRequest):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return None

        path = request.path
        if not any(
            path.startswith(prefix) for prefix in REQUEST_SIGNING_REQUIRED_PREFIXES
        ):
            return None

        signature = request.META.get("HTTP_X_SIGNATURE")
        timestamp = request.META.get("HTTP_X_TIMESTAMP")

        if not signature or not timestamp:
            logger.warning("Missing signature headers for %s", path)
            return JsonResponse(
                {
                    "error": "request_signing_required",
                    "detail": "X-Signature and X-Timestamp headers required",
                },
                status=401,
            )

        # Timestamp freshness.
        try:
            ts = float(timestamp)
        except (TypeError, ValueError):
            return JsonResponse({"error": "invalid_timestamp"}, status=401)

        if abs(time.time() - ts) > MAX_TIMESTAMP_AGE:
            logger.warning(
                "Stale signed request: age=%ds path=%s", int(time.time() - ts), path
            )
            return JsonResponse({"error": "timestamp_expired"}, status=401)

        # Signature verification.
        body = request.body
        expected = _compute_signature(body, timestamp)
        if not hmac.compare_digest(signature, expected):
            logger.warning("Invalid request signature for %s", path)
            return JsonResponse({"error": "invalid_signature"}, status=401)

        # Mark request as signed.
        request.is_signed = True
        return None
