"""
ABR — Org Context Isolation Tests

Covers:
  - Org ID is never read from query params or request body for Org scoping
  - Endpoints derive Org context exclusively from authenticated session
  - Cross-Org access via query param injection is blocked

These tests validate the BLOCKER fix for B2_OrgContextServerSide.
"""

import uuid
from unittest.mock import MagicMock, patch

import pytest
from compliance.abr_views import AbrCaseListView
from django.test import RequestFactory, TestCase
from rest_framework import status

ORG_A = uuid.uuid4()
ORG_B = uuid.uuid4()
USER_ID = str(uuid.uuid4())


class _FakeUser:
    """Minimal user stub for DRF request injection."""

    def __init__(self, organization_id=None, clerk_user_id=None, is_authenticated=True):
        self.organization_id = organization_id
        self.clerk_user_id = clerk_user_id or USER_ID
        self.is_authenticated = is_authenticated
        self.is_superuser = False
        self.pk = 1
        self.abr_roles = []


class TestOrgContextIsolation(TestCase):
    """Ensures Org ID is never derived from query params or request body."""

    def setUp(self):
        self.factory = RequestFactory()
        self.view = AbrCaseListView()

    def test_org_id_from_session_context_succeeds(self):
        """Server-derived org_id (from user.organization_id) must work."""
        user = _FakeUser(organization_id=ORG_A)
        request = self.factory.get("/api/abr/cases/")
        request.user = user
        request.query_params = {}  # type: ignore[attr-defined]

        result = self.view._get_org_id(request)
        assert result == ORG_A

    def test_query_param_org_id_is_ignored(self):
        """
        If user belongs to Org A but ?org_id=<OrgB> is supplied,
        the view must use Org A (from session), NOT Org B (from query).
        """
        user = _FakeUser(organization_id=ORG_A)
        request = self.factory.get(f"/api/abr/cases/?org_id={ORG_B}")
        request.user = user

        result = self.view._get_org_id(request)
        assert result == ORG_A, (
            "Org ID must come from server context, not query params. "
            f"Expected {ORG_A}, got {result}."
        )

    def test_no_org_in_session_raises_403(self):
        """If the authenticated user has no organization_id, 403 is raised."""
        user = _FakeUser(organization_id=None)
        request = self.factory.get("/api/abr/cases/")
        request.user = user
        request.query_params = {}  # type: ignore[attr-defined]

        from rest_framework.exceptions import PermissionDenied

        with pytest.raises(PermissionDenied):
            self.view._get_org_id(request)

    def test_no_org_context_even_with_query_param_raises_403(self):
        """
        Even if ?org_id= is supplied, if user has no session org context,
        the view MUST raise 403 — never fall through to query params.
        """
        user = _FakeUser(organization_id=None)
        request = self.factory.get(f"/api/abr/cases/?org_id={ORG_B}")
        request.user = user

        from rest_framework.exceptions import PermissionDenied

        with pytest.raises(PermissionDenied):
            self.view._get_org_id(request)

    def test_body_org_id_cannot_override_session(self):
        """
        POST with org_id in body must not change the scoping org.
        The Org used for scoping always comes from user.organization_id.
        """
        user = _FakeUser(organization_id=ORG_A)
        request = self.factory.post(
            "/api/abr/cases/",
            data={"org_id": str(ORG_B), "title": "injected"},
            content_type="application/json",
        )
        request.user = user
        request.query_params = {}  # type: ignore[attr-defined]

        result = self.view._get_org_id(request)
        assert result == ORG_A


class TestOrgContextContractScan(TestCase):
    """
    Static scan: no ABR backend file reads org_id from query_params
    for scoping purposes (contract gate).
    """

    def test_no_query_params_org_id_in_abr_views(self):
        """
        The source code of abr_views.py must NOT contain
        'query_params.get("org_id")' or 'request.GET.get("org'.
        """
        import inspect

        import compliance.abr_views as views_module

        source = inspect.getsource(views_module)

        forbidden_patterns = [
            'query_params.get("org_id")',
            "query_params.get('org_id')",
            'request.GET.get("org',
            "request.GET.get('org",
            'request.GET["org',
            "request.GET['org",
        ]

        for pattern in forbidden_patterns:
            assert pattern not in source, (
                f"BLOCKER: ABR views must not derive Org context from query params.\n"
                f"Found forbidden pattern: {pattern!r}\n"
                f"Org ID must come exclusively from authenticated session (user.organization_id)."
            )
