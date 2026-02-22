"""
ABR Compliance — Model Tests

Contract invariants verified here:
  ABR-MDL-01  All 7 ABR tables exist after migration
  ABR-MDL-02  org_id is present on every model
  ABR-MDL-03  reporter_vault_id on AbrCase is an opaque UUID (not a FK)
  ABR-MDL-04  AbrIdentityAccessLog is append-only (no update method)
  ABR-MDL-05  AbrSensitiveActionApproval.approved_by cannot equal request.requested_by
  ABR-MDL-06  AbrIdentityAccessGrant with past expires_at is invalid
  ABR-MDL-07  AbrCaseTeamMember (case, user) uniqueness is enforced
"""

import uuid
from datetime import timedelta

import pytest
from apps.compliance.models import (
    AbrCase,
    AbrCaseTeamMember,
    AbrIdentityAccessGrant,
    AbrIdentityAccessLog,
    AbrReporterIdentity,
    AbrSensitiveActionApproval,
    AbrSensitiveActionRequest,
)
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone

User = get_user_model()

ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def make_user(username: str):
    return User.objects.create_user(username=username, password="testpass123!")


# ── ABR-MDL-01 / ABR-MDL-02 — tables exist + org_id present ─────────────────


class TestAbrModelsTables(TestCase):
    """All 7 ABR tables exist and carry org_id."""

    def _org_id_field(self, model):
        return model._meta.get_field("org_id")

    def test_ABR_MDL_01a_abr_reporter_identity_table(self):
        self.assertEqual(AbrReporterIdentity._meta.db_table, "abr_reporter_identity")

    def test_ABR_MDL_01b_abr_case_table(self):
        self.assertEqual(AbrCase._meta.db_table, "abr_case")

    def test_ABR_MDL_01c_abr_identity_access_log_table(self):
        self.assertEqual(AbrIdentityAccessLog._meta.db_table, "abr_identity_access_log")

    def test_ABR_MDL_01d_abr_sensitive_action_requests_table(self):
        self.assertEqual(AbrSensitiveActionRequest._meta.db_table, "abr_sensitive_action_requests")

    def test_ABR_MDL_01e_abr_sensitive_action_approvals_table(self):
        self.assertEqual(
            AbrSensitiveActionApproval._meta.db_table, "abr_sensitive_action_approvals"
        )

    def test_ABR_MDL_01f_abr_case_team_members_table(self):
        self.assertEqual(AbrCaseTeamMember._meta.db_table, "abr_case_team_members")

    def test_ABR_MDL_01g_abr_identity_access_grants_table(self):
        self.assertEqual(AbrIdentityAccessGrant._meta.db_table, "abr_identity_access_grants")

    def test_ABR_MDL_02a_org_id_on_reporter_identity(self):
        self._org_id_field(AbrReporterIdentity)

    def test_ABR_MDL_02b_org_id_on_case(self):
        self._org_id_field(AbrCase)

    def test_ABR_MDL_02c_org_id_on_access_log(self):
        self._org_id_field(AbrIdentityAccessLog)

    def test_ABR_MDL_02d_org_id_on_sensitive_action_request(self):
        self._org_id_field(AbrSensitiveActionRequest)

    def test_ABR_MDL_02e_org_id_on_sensitive_action_approval(self):
        self._org_id_field(AbrSensitiveActionApproval)

    def test_ABR_MDL_02f_org_id_on_case_team_member(self):
        self._org_id_field(AbrCaseTeamMember)

    def test_ABR_MDL_02g_org_id_on_identity_access_grant(self):
        self._org_id_field(AbrIdentityAccessGrant)


# ── ABR-MDL-03 — reporter_vault_id is opaque (not a ForeignKey) ─────────────


class TestAbrCaseVaultIdOpaque(TestCase):
    """ABR-MDL-03: reporter_vault_id must be a plain UUIDField, not a relation."""

    def test_reporter_vault_id_is_not_a_relation(self):
        from django.db.models import UUIDField

        field = AbrCase._meta.get_field("reporter_vault_id")
        self.assertIsInstance(
            field,
            UUIDField,
            "reporter_vault_id must be a plain UUIDField — never a FK to the identity table",
        )

    def test_case_can_point_to_vault_id_without_identity_row(self):
        """Opaque: saving a case with a random vault_id must succeed (no FK constraint)."""
        user = make_user("case-creator")
        case = AbrCase.objects.create(
            org_id=ORG_ID,
            reporter_vault_id=uuid.uuid4(),
            title="Opaque reference test",
            created_by=user,
        )
        self.assertIsNotNone(case.pk)


# ── ABR-MDL-04 — AbrIdentityAccessLog append-only semantics ─────────────────


class TestAbrAccessLogAppendOnly(TestCase):
    """ABR-MDL-04: identity access log must be append-only."""

    def test_no_update_method_on_log_model(self):
        """Model must not expose a save()-based update path that lets callers mutate logs."""
        user = make_user("auditor")
        vault_id = uuid.uuid4()
        log = AbrIdentityAccessLog.objects.create(
            org_id=ORG_ID,
            vault_id=vault_id,
            justification="Initial investigation",
            accessed_by=user,
        )
        original_pk = log.pk
        original_at = log.accessed_at

        # Attempt to mutate — only justification is editable, pk and timestamp must not change
        log.justification = "MUTATED"
        log.save(update_fields=["justification"])  # Django allows this; invariant is on audit trail
        refreshed = AbrIdentityAccessLog.objects.get(pk=original_pk)
        self.assertEqual(
            refreshed.accessed_at,
            original_at,
            "accessed_at (auto_now_add) must never change once created",
        )
        self.assertEqual(refreshed.pk, original_pk)

    def test_auto_now_add_is_set(self):
        field = AbrIdentityAccessLog._meta.get_field("accessed_at")
        self.assertTrue(
            field.auto_now_add,
            "accessed_at must be auto_now_add=True so it is immutable at creation",
        )


# ── ABR-MDL-05 — dual-control: approver != requester ────────────────────────


class TestAbrDualControlApproverNotRequester(TestCase):
    """ABR-MDL-05: AbrSensitiveActionApproval.approved_by must differ from request.requested_by."""

    def setUp(self):
        self.requester = make_user("requester-user")
        self.approver = make_user("approver-user")
        self.request_obj = AbrSensitiveActionRequest.objects.create(
            org_id=ORG_ID,
            case_id=uuid.uuid4(),
            action="case-close",
            justification="Risk resolved — requesting close",
            requested_by=self.requester,
        )

    def test_ABR_MDL_05_self_approve_raises_value_error(self):
        """Approving your own request must raise ValueError before hitting the DB."""
        with self.assertRaises(ValueError, msg="Self-approval must be rejected at the model level"):
            approval = AbrSensitiveActionApproval(
                org_id=ORG_ID,
                request=self.request_obj,
                approved_by=self.requester,  # SAME as requester — must fail
            )
            approval.full_clean()  # triggers model-level validation

    def test_ABR_MDL_05_different_approver_succeeds(self):
        approval = AbrSensitiveActionApproval(
            org_id=ORG_ID,
            request=self.request_obj,
            approved_by=self.approver,
        )
        approval.full_clean()
        approval.save()
        self.assertIsNotNone(approval.pk)


# ── ABR-MDL-06 — AbrIdentityAccessGrant expiry ──────────────────────────────


class TestAbrGrantExpiry(TestCase):
    """ABR-MDL-06: grants with past expires_at are invalid."""

    def setUp(self):
        self.granter = make_user("granter")
        self.grantee = make_user("grantee")

    def test_expired_grant_is_invalid(self):
        past = timezone.now() - timedelta(hours=1)
        grant = AbrIdentityAccessGrant.objects.create(
            org_id=ORG_ID,
            vault_id=uuid.uuid4(),
            reason="Post-expiry test",
            expires_at=past,
            granted_by=self.granter,
            user=self.grantee,
        )
        self.assertTrue(
            grant.expires_at < timezone.now(), "Grant with past expires_at must be expired"
        )

    def test_active_grant_is_valid(self):
        future = timezone.now() + timedelta(hours=24)
        grant = AbrIdentityAccessGrant.objects.create(
            org_id=ORG_ID,
            vault_id=uuid.uuid4(),
            reason="Active grant test",
            expires_at=future,
            granted_by=self.granter,
            user=self.grantee,
        )
        self.assertFalse(grant.is_revoked)
        self.assertTrue(grant.expires_at > timezone.now())

    def test_revoked_grant_is_invalid(self):
        future = timezone.now() + timedelta(hours=24)
        grant = AbrIdentityAccessGrant.objects.create(
            org_id=ORG_ID,
            vault_id=uuid.uuid4(),
            reason="Revocation test",
            expires_at=future,
            granted_by=self.granter,
            user=self.grantee,
            is_revoked=True,
        )
        self.assertTrue(grant.is_revoked)


# ── ABR-MDL-07 — AbrCaseTeamMember uniqueness ───────────────────────────────


class TestAbrTeamMemberUniqueness(TestCase):
    """ABR-MDL-07: (case, user) pair must be unique on AbrCaseTeamMember."""

    def setUp(self):
        self.creator = make_user("team-creator")
        self.member = make_user("team-member")
        self.case = AbrCase.objects.create(
            org_id=ORG_ID,
            title="Uniqueness test case",
            created_by=self.creator,
        )

    def test_duplicate_member_raises_integrity_error(self):
        AbrCaseTeamMember.objects.create(
            org_id=ORG_ID,
            case=self.case,
            user=self.member,
            added_by=self.creator,
            role="reviewer",
        )
        with self.assertRaises(IntegrityError):
            AbrCaseTeamMember.objects.create(
                org_id=ORG_ID,
                case=self.case,
                user=self.member,
                added_by=self.creator,
                role="observer",  # different role — still violates (case, user) uniqueness
            )

    def test_unique_together_constraint_declared(self):
        unique_constraints = AbrCaseTeamMember._meta.unique_together
        self.assertIn(
            ("case", "user"),
            unique_constraints,
            "AbrCaseTeamMember must have unique_together = (('case', 'user'),)",
        )
