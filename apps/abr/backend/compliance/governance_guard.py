"""
ABR Governance Guard — Runtime Enforcement

Blocks direct audit writes, evidence sealing, and integration dispatches
that do NOT originate from the governance bridge. Enforced in pilot/prod;
disabled in dev to allow low-friction local testing.

This guard inspects the call stack at write time. If a governed write
does not pass through `compliance.governance_bridge`, the guard raises
`GovernanceBridgeBypassError` in enforced environments and logs a
warning in dev.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Activation:
    Add to MIDDLEWARE in settings/base.py (or conditionally in
    settings for pilot/prod):

        MIDDLEWARE += ["compliance.governance_guard.GovernanceGuardMiddleware"]

    Or call `install_governance_guard()` directly from AppConfig.ready().

Runtime behaviour:
    - NZILA_ENV=dev       → logs warning on bypass (no exception)
    - NZILA_ENV=pilot|prod → raises GovernanceBridgeBypassError (fail-closed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@module compliance.governance_guard
"""

from __future__ import annotations

import inspect
import logging
import os
from functools import wraps
from typing import Any, Callable

logger = logging.getLogger(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────

_NZILA_ENV = os.environ.get("NZILA_ENV", "dev").lower()
_ENFORCED = _NZILA_ENV in ("pilot", "prod", "production")

# Modules that are allowed to perform governed writes directly.
_ALLOWED_CALLERS = frozenset(
    {
        "compliance.governance_bridge",
        "compliance.services",
    }
)


class GovernanceBridgeBypassError(Exception):
    """Raised when a governed write is attempted outside the governance bridge."""


# ── Stack inspection ──────────────────────────────────────────────────────────


def _caller_is_bridge() -> bool:
    """Return True if the governance bridge (or compliance.services) is in the call stack."""
    for frame_info in inspect.stack():
        module = frame_info.frame.f_globals.get("__name__", "")
        if module in _ALLOWED_CALLERS:
            return True
    return False


# ── Guard decorator ───────────────────────────────────────────────────────────


def governed_write(operation_name: str) -> Callable:
    """
    Decorator that guards a function so it can only be called through
    the governance bridge.

    Usage:
        @governed_write("audit_log_create")
        def create_audit_log(...):
            ...
    """

    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            if not _caller_is_bridge():
                msg = (
                    f"[GOVERNANCE GUARD] Direct call to `{operation_name}` detected. "
                    f"All governed writes must originate from compliance.governance_bridge. "
                    f"Caller: {inspect.stack()[1].filename}:{inspect.stack()[1].lineno}"
                )
                if _ENFORCED:
                    raise GovernanceBridgeBypassError(msg)
                else:
                    logger.warning(msg)

            return fn(*args, **kwargs)

        return wrapper

    return decorator


# ── Guard installation ────────────────────────────────────────────────────────

_guard_installed = False


def install_governance_guard() -> None:
    """
    Monkey-patch governed operations so they check the call stack at runtime.

    Safe to call multiple times — only installs once.

    Guarded operations:
      - auth_core.models.AuditLogs.save()
      - compliance.models.EvidenceBundles.save()
    """
    global _guard_installed
    if _guard_installed:
        return
    _guard_installed = True

    try:
        from auth_core.models import AuditLogs

        _original_audit_save = AuditLogs.save

        @wraps(_original_audit_save)
        def _guarded_audit_save(self: Any, *args: Any, **kwargs: Any) -> Any:
            if not self._state.adding:
                # Only guard new record creation (INSERT), not updates
                return _original_audit_save(self, *args, **kwargs)

            if not _caller_is_bridge():
                msg = (
                    "[GOVERNANCE GUARD] Direct AuditLogs.save() — "
                    "must use governance.emit_audit(). "
                    f"Caller: {inspect.stack()[1].filename}:{inspect.stack()[1].lineno}"
                )
                if _ENFORCED:
                    raise GovernanceBridgeBypassError(msg)
                else:
                    logger.warning(msg)

            return _original_audit_save(self, *args, **kwargs)

        AuditLogs.save = _guarded_audit_save  # type: ignore[assignment]

    except ImportError:
        logger.debug("auth_core.models.AuditLogs not available — guard skipped")

    try:
        from compliance.models import EvidenceBundles

        _original_evidence_save = EvidenceBundles.save

        @wraps(_original_evidence_save)
        def _guarded_evidence_save(self: Any, *args: Any, **kwargs: Any) -> Any:
            if not self._state.adding:
                return _original_evidence_save(self, *args, **kwargs)

            if not _caller_is_bridge():
                msg = (
                    "[GOVERNANCE GUARD] Direct EvidenceBundles.save() — "
                    "must use governance.seal_evidence(). "
                    f"Caller: {inspect.stack()[1].filename}:{inspect.stack()[1].lineno}"
                )
                if _ENFORCED:
                    raise GovernanceBridgeBypassError(msg)
                else:
                    logger.warning(msg)

            return _original_evidence_save(self, *args, **kwargs)

        EvidenceBundles.save = _guarded_evidence_save  # type: ignore[assignment]

    except ImportError:
        logger.debug("compliance.models.EvidenceBundles not available — guard skipped")

    env_note = "ENFORCED (fail-closed)" if _ENFORCED else "WARNING-ONLY (dev)"
    logger.info(f"[GOVERNANCE GUARD] Installed — mode: {env_note}")


# ── Django Middleware (optional activation path) ──────────────────────────────


class GovernanceGuardMiddleware:
    """
    Django middleware that installs the governance guard on first request.

    Add to MIDDLEWARE:
        "compliance.governance_guard.GovernanceGuardMiddleware"
    """

    def __init__(self, get_response: Callable) -> None:
        self.get_response = get_response
        install_governance_guard()

    def __call__(self, request: Any) -> Any:
        return self.get_response(request)
