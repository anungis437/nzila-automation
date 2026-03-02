"""
Tests for the governance guard runtime enforcement.

Verifies that direct governed writes (audit logs, evidence bundles) are:
  - Blocked (GovernanceBridgeBypassError) in enforced environments
  - Warning-only in dev environments
  - Allowed when originating from the governance bridge
"""

from __future__ import annotations

import os
import unittest
from unittest.mock import MagicMock, patch


class GovernanceGuardEnforcementTest(unittest.TestCase):
    """Guard behaviour in enforced (pilot/prod) mode."""

    def test_guard_module_exists(self):
        """governance_guard.py module can be imported."""
        from compliance import governance_guard

        self.assertTrue(hasattr(governance_guard, "GovernanceBridgeBypassError"))
        self.assertTrue(hasattr(governance_guard, "install_governance_guard"))
        self.assertTrue(hasattr(governance_guard, "governed_write"))
        self.assertTrue(hasattr(governance_guard, "GovernanceGuardMiddleware"))

    def test_governed_write_decorator_blocks_direct_call_in_enforced(self):
        """governed_write raises GovernanceBridgeBypassError in enforced mode."""
        from compliance.governance_guard import (
            GovernanceBridgeBypassError,
            governed_write,
        )

        @governed_write("test_operation")
        def _dummy_write():
            return "written"

        # Patch _ENFORCED to True and _caller_is_bridge to False
        with (
            patch("compliance.governance_guard._ENFORCED", True),
            patch("compliance.governance_guard._caller_is_bridge", return_value=False),
        ):
            with self.assertRaises(GovernanceBridgeBypassError):
                _dummy_write()

    def test_governed_write_allows_bridge_call_in_enforced(self):
        """governed_write permits calls from the governance bridge."""
        from compliance.governance_guard import governed_write

        @governed_write("test_operation")
        def _dummy_write():
            return "written"

        with (
            patch("compliance.governance_guard._ENFORCED", True),
            patch("compliance.governance_guard._caller_is_bridge", return_value=True),
        ):
            result = _dummy_write()
            self.assertEqual(result, "written")

    def test_governed_write_warns_in_dev(self):
        """governed_write logs warning (not exception) in dev mode."""
        from compliance.governance_guard import governed_write

        @governed_write("test_operation")
        def _dummy_write():
            return "written"

        with (
            patch("compliance.governance_guard._ENFORCED", False),
            patch("compliance.governance_guard._caller_is_bridge", return_value=False),
            patch("compliance.governance_guard.logger") as mock_logger,
        ):
            result = _dummy_write()
            self.assertEqual(result, "written")
            mock_logger.warning.assert_called_once()

    def test_caller_is_bridge_detects_bridge_module(self):
        """_caller_is_bridge returns True when governance_bridge is in the call stack."""
        from compliance.governance_guard import _caller_is_bridge

        # Direct call (not from bridge) should return False
        result = _caller_is_bridge()
        self.assertFalse(result)

    def test_middleware_installs_guard(self):
        """GovernanceGuardMiddleware calls install_governance_guard on init."""
        from compliance.governance_guard import GovernanceGuardMiddleware

        with patch(
            "compliance.governance_guard.install_governance_guard"
        ) as mock_install:
            middleware = GovernanceGuardMiddleware(get_response=lambda r: r)
            mock_install.assert_called_once()

    def test_middleware_passes_through_request(self):
        """Middleware is transparent to requests."""
        from compliance.governance_guard import GovernanceGuardMiddleware

        sentinel = object()
        with patch("compliance.governance_guard.install_governance_guard"):
            middleware = GovernanceGuardMiddleware(get_response=lambda r: sentinel)
            result = middleware(MagicMock())
            self.assertIs(result, sentinel)


if __name__ == "__main__":
    unittest.main()
