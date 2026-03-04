"""
Webhook Verification Middleware.

Provides HMAC-SHA256 signature verification, timestamp validation,
and replay protection for inbound webhook requests.

Usage in Django settings.MIDDLEWARE:
    'backend.middleware.webhook_verification.WebhookVerificationMiddleware'

Or apply per-view via the @verify_webhook decorator.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import time
from functools import wraps
from typing import Callable, Optional, Sequence

from django.conf import settings
from django.core.cache import cache
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger("webhook_verification")

# ---------------------------------------------------------------------------
# Configuration defaults (override via Django settings)
# ---------------------------------------------------------------------------
# Maximum age (seconds) for a webhook timestamp to be considered valid.
WEBHOOK_MAX_AGE = getattr(settings, "WEBHOOK_MAX_AGE", 300)  # 5 minutes

# Header names (configurable per provider convention).
WEBHOOK_SIGNATURE_HEADER = getattr(
    settings, "WEBHOOK_SIGNATURE_HEADER", "X-Webhook-Signature"
)
WEBHOOK_TIMESTAMP_HEADER = getattr(
    settings, "WEBHOOK_TIMESTAMP_HEADER", "X-Webhook-Timestamp"
)

# Cache key prefix for replay protection.
WEBHOOK_REPLAY_PREFIX = "wh_replay:"

# How long to remember a nonce (must be >= WEBHOOK_MAX_AGE).
WEBHOOK_REPLAY_TTL = max(WEBHOOK_MAX_AGE * 2, 600)

# URL prefixes that should be verified (empty = disabled as middleware).
WEBHOOK_PROTECTED_PREFIXES: Sequence[str] = getattr(
    settings, "WEBHOOK_PROTECTED_PREFIXES", []
)


# ---------------------------------------------------------------------------
# Core verification functions
# ---------------------------------------------------------------------------


def compute_hmac_sha256(secret: str, payload: bytes) -> str:
    """Compute HMAC-SHA256 hex digest for *payload* using *secret*."""
    return hmac.new(
        secret.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).hexdigest()


def verify_signature(secret: str, payload: bytes, received_signature: str) -> bool:
    """Constant-time comparison of expected vs received HMAC-SHA256."""
    expected = compute_hmac_sha256(secret, payload)
    return hmac.compare_digest(expected, received_signature)


def verify_timestamp(timestamp_str: str, max_age: int = WEBHOOK_MAX_AGE) -> bool:
    """Return True if *timestamp_str* (Unix epoch seconds) is within *max_age*."""
    try:
        ts = int(timestamp_str)
    except (ValueError, TypeError):
        return False
    return abs(time.time() - ts) <= max_age


def check_replay(nonce: str) -> bool:
    """
    Return True if *nonce* has already been seen (= replay).
    Atomically marks the nonce as seen for ``WEBHOOK_REPLAY_TTL`` seconds.
    """
    cache_key = f"{WEBHOOK_REPLAY_PREFIX}{nonce}"
    # cache.add returns False if the key already exists → replay.
    is_new = cache.add(cache_key, 1, timeout=WEBHOOK_REPLAY_TTL)
    return not is_new


def build_nonce(signature: str, timestamp: str) -> str:
    """Deterministic nonce from signature + timestamp."""
    return hashlib.sha256(f"{signature}:{timestamp}".encode()).hexdigest()


# ---------------------------------------------------------------------------
# Django middleware (applies to all requests matching prefixes)
# ---------------------------------------------------------------------------


class WebhookVerificationMiddleware(MiddlewareMixin):
    """
    Middleware that verifies inbound webhook requests.

    Only active for URL paths matching ``WEBHOOK_PROTECTED_PREFIXES``.
    The HMAC secret is resolved per-integration via the IntegrationRegistry,
    or from ``settings.WEBHOOK_DEFAULT_SECRET`` as a fallback.
    """

    def process_request(self, request: HttpRequest) -> Optional[HttpResponse]:
        if request.method not in ("POST", "PUT", "PATCH"):
            return None

        # Only verify paths that match configured prefixes.
        if not any(request.path.startswith(p) for p in WEBHOOK_PROTECTED_PREFIXES):
            return None

        signature = request.META.get(
            f"HTTP_{WEBHOOK_SIGNATURE_HEADER.upper().replace('-', '_')}", ""
        )
        timestamp = request.META.get(
            f"HTTP_{WEBHOOK_TIMESTAMP_HEADER.upper().replace('-', '_')}", ""
        )

        if not signature:
            logger.warning(
                "Webhook rejected: missing signature header — %s", request.path
            )
            return JsonResponse({"error": "Missing webhook signature"}, status=401)

        if not timestamp:
            logger.warning(
                "Webhook rejected: missing timestamp header — %s", request.path
            )
            return JsonResponse({"error": "Missing webhook timestamp"}, status=401)

        # Timestamp freshness.
        if not verify_timestamp(timestamp, max_age=WEBHOOK_MAX_AGE):
            logger.warning("Webhook rejected: stale timestamp — %s", request.path)
            return JsonResponse(
                {"error": "Webhook timestamp too old or too new"}, status=401
            )

        # Replay protection.
        nonce = build_nonce(signature, timestamp)
        if check_replay(nonce):
            logger.warning("Webhook rejected: replay detected — %s", request.path)
            return JsonResponse({"error": "Webhook replay detected"}, status=409)

        # Resolve secret.
        secret = self._resolve_secret(request)
        if not secret:
            logger.error("Webhook rejected: no secret configured — %s", request.path)
            return JsonResponse({"error": "Webhook secret not configured"}, status=500)

        # Signature verification.
        body = request.body
        signed_payload = (
            f"{timestamp}.{body.decode('utf-8', errors='replace')}".encode()
        )
        if not verify_signature(secret, signed_payload, signature):
            logger.warning("Webhook rejected: invalid signature — %s", request.path)
            return JsonResponse({"error": "Invalid webhook signature"}, status=401)

        logger.info("Webhook verified — %s", request.path)
        return None  # allow request to proceed

    # ----- secret resolution -----

    @staticmethod
    def _resolve_secret(request: HttpRequest) -> Optional[str]:
        """Try IntegrationRegistry, then fallback to settings."""
        # Per-integration secret via query param or header.
        integration_id = request.GET.get("integration_id") or request.META.get(
            "HTTP_X_INTEGRATION_ID"
        )
        if integration_id:
            try:
                from services.integration_control_plane.models import (
                    IntegrationRegistry,
                )

                reg = IntegrationRegistry.objects.get(pk=integration_id)
                if reg.secret:
                    return reg.secret
            except Exception:
                pass

        # Fallback to global default.
        return getattr(settings, "WEBHOOK_DEFAULT_SECRET", None)


# ---------------------------------------------------------------------------
# Decorator for per-view webhook verification
# ---------------------------------------------------------------------------


def verify_webhook(
    secret: Optional[str] = None,
    max_age: int = WEBHOOK_MAX_AGE,
) -> Callable:
    """
    Decorator that enforces webhook verification on a single DRF/Django view.

    Usage::

        @verify_webhook(secret="whsec_…")
        def stripe_webhook(request):
            ...
    """

    def decorator(view_func: Callable) -> Callable:
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            sig = request.META.get(
                f"HTTP_{WEBHOOK_SIGNATURE_HEADER.upper().replace('-', '_')}", ""
            )
            ts = request.META.get(
                f"HTTP_{WEBHOOK_TIMESTAMP_HEADER.upper().replace('-', '_')}", ""
            )

            if not sig or not ts:
                return JsonResponse(
                    {"error": "Missing signature or timestamp"}, status=401
                )

            if not verify_timestamp(ts, max_age=max_age):
                return JsonResponse({"error": "Timestamp expired"}, status=401)

            nonce = build_nonce(sig, ts)
            if check_replay(nonce):
                return JsonResponse({"error": "Replay detected"}, status=409)

            resolved_secret = secret or getattr(settings, "WEBHOOK_DEFAULT_SECRET", "")
            body = request.body
            signed_payload = f"{ts}.{body.decode('utf-8', errors='replace')}".encode()
            if not verify_signature(resolved_secret, signed_payload, sig):
                return JsonResponse({"error": "Invalid signature"}, status=401)

            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator
