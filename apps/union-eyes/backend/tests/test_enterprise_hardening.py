"""
Tests for Enterprise Hardening Systems.

Covers:
  1. Event Bus — emission, dispatch, integrity verification
  2. Webhook Verification — HMAC, timestamp, replay protection
  3. Integration Control Plane — retry logic, idempotency
  4. Compliance Snapshot — hash-chaining, chain verification
  5. Evidence Pack — seal/verify cycle
  6. Rate Limiter — basic throttling logic
  7. Break-Glass — logging and compliance flagging
"""

from __future__ import annotations

import hashlib
import hmac
import json
import time
import uuid
from unittest.mock import MagicMock, patch

from django.http import HttpResponse
from django.test import RequestFactory, TestCase, override_settings

# ============================================================================
# 1. Event Bus Tests
# ============================================================================


class EventModelTest(TestCase):
    """Test Event model integrity verification."""

    def test_event_hash_integrity(self):
        from services.events.models import Event

        event = Event(
            event_type="case_created",
            org_id=uuid.uuid4(),
            actor_id="user-1",
            payload={"case_id": "c-123"},
        )
        event.save()
        self.assertTrue(event.verify_integrity())

    def test_event_tamper_detection(self):
        from services.events.models import Event

        event = Event(
            event_type="case_created",
            org_id=uuid.uuid4(),
            actor_id="user-1",
            payload={"case_id": "c-123"},
        )
        event.save()

        # Tamper with payload.
        event.payload = {"case_id": "TAMPERED"}
        self.assertFalse(event.verify_integrity())


class EventDispatcherTest(TestCase):
    """Test event emission and fan-out."""

    @patch("services.events.tasks.process_event_task.delay")
    def test_emit_event_creates_record(self, mock_delay):
        from services.events.dispatcher import emit_event
        from services.events.models import Event

        org_id = str(uuid.uuid4())
        event_id = emit_event(
            event_type="member_joined",
            org_id=org_id,
            actor_id="user-2",
            payload={"member_id": "m-1"},
        )
        # emit_event returns the UUID string of the persisted event.
        self.assertIsInstance(event_id, str)
        self.assertEqual(Event.objects.filter(org_id=org_id).count(), 1)

    @patch("services.events.tasks.process_event_task.delay")
    def test_emit_event_enqueues_task(self, mock_delay):
        from services.events.dispatcher import emit_event

        event_id = emit_event(
            event_type="case_closed",
            org_id=str(uuid.uuid4()),
            actor_id="user-3",
            payload={},
        )
        mock_delay.assert_called_once_with(event_id=event_id)


# ============================================================================
# 2. Webhook Verification Tests
# ============================================================================


class WebhookVerificationTest(TestCase):
    """Test HMAC signature computation and verification."""

    def test_compute_hmac(self):
        from middleware.webhook_verification import compute_hmac_sha256

        body = b'{"key": "value"}'
        secret = "test-secret"
        sig = compute_hmac_sha256(secret, body)
        expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        self.assertEqual(sig, expected)

    def test_verify_signature_valid(self):
        from middleware.webhook_verification import (
            compute_hmac_sha256,
            verify_signature,
        )

        body = b'{"event": "test"}'
        secret = "my-secret"
        sig = compute_hmac_sha256(secret, body)
        self.assertTrue(verify_signature(secret, body, sig))

    def test_verify_signature_invalid(self):
        from middleware.webhook_verification import verify_signature

        self.assertFalse(verify_signature("secret", b"body", "bad-sig"))

    def test_verify_timestamp_fresh(self):
        from middleware.webhook_verification import verify_timestamp

        ts = str(int(time.time()))
        self.assertTrue(verify_timestamp(ts))

    def test_verify_timestamp_stale(self):
        from middleware.webhook_verification import verify_timestamp

        ts = str(int(time.time()) - 600)  # 10 min old
        self.assertFalse(verify_timestamp(ts, max_age=300))


# ============================================================================
# 3. Integration Control Plane Tests
# ============================================================================


class IntegrationRegistryTest(TestCase):
    """Test IntegrationRegistry model methods."""

    def test_record_success_resets_failures(self):
        from services.integration_control_plane.models import IntegrationRegistry

        reg = IntegrationRegistry.objects.create(
            org_id=uuid.uuid4(),
            name="Test Integration",
            integration_type="webhook",
            endpoint_url="https://example.com/hook",
            status="degraded",
            consecutive_failures=5,
            metadata={"url": "https://example.com"},
        )
        reg.record_success()
        reg.refresh_from_db()
        self.assertEqual(reg.consecutive_failures, 0)
        self.assertEqual(reg.status, "active")

    def test_record_failure_increments_counter(self):
        from services.integration_control_plane.models import IntegrationRegistry

        reg = IntegrationRegistry.objects.create(
            org_id=uuid.uuid4(),
            name="Failing Integration",
            integration_type="api_push",
            metadata={},
        )
        reg.record_failure()
        reg.refresh_from_db()
        self.assertEqual(reg.consecutive_failures, 1)

    def test_record_failure_degrades_after_threshold(self):
        from services.integration_control_plane.models import IntegrationRegistry

        reg = IntegrationRegistry.objects.create(
            org_id=uuid.uuid4(),
            name="Fragile",
            integration_type="api_push",
            metadata={},
            consecutive_failures=2,
        )
        reg.record_failure()  # 3rd failure → degraded (below max_retries=5)
        reg.refresh_from_db()
        self.assertEqual(reg.status, "degraded")


# ============================================================================
# 4. Compliance Snapshot Tests
# ============================================================================


class ComplianceSnapshotTest(TestCase):
    """Test snapshot creation, hash-chaining, and chain verification."""

    def test_single_snapshot_integrity(self):
        from services.compliance_snapshot.models import ComplianceSnapshot

        snap = ComplianceSnapshot(
            org_id=uuid.uuid4(),
            snapshot_type="on_demand",
            snapshot_payload={"members": 42, "cases": 7},
            sequence_number=1,
        )
        snap.save()
        self.assertTrue(snap.verify_integrity())

    def test_hash_chain_two_entries(self):
        from services.compliance_snapshot.service import capture_snapshot, verify_chain

        org_id = str(uuid.uuid4())

        capture_snapshot(org_id=org_id, snapshot_type="daily")
        capture_snapshot(org_id=org_id, snapshot_type="daily")

        result = verify_chain(org_id)
        self.assertTrue(result["valid"])
        self.assertEqual(result["total"], 2)

    def test_tamper_breaks_chain(self):
        from services.compliance_snapshot.models import ComplianceSnapshot
        from services.compliance_snapshot.service import capture_snapshot, verify_chain

        org_id = str(uuid.uuid4())
        capture_snapshot(org_id=org_id, snapshot_type="daily")
        capture_snapshot(org_id=org_id, snapshot_type="daily")

        # Tamper with first snapshot.
        first = (
            ComplianceSnapshot.objects.filter(org_id=org_id)
            .order_by("sequence_number")
            .first()
        )
        first.snapshot_payload = {"tampered": True}
        first.save(update_fields=["snapshot_payload"])

        result = verify_chain(org_id)
        self.assertFalse(result["valid"])

    def test_empty_org_chain_is_valid(self):
        from services.compliance_snapshot.service import verify_chain

        result = verify_chain(str(uuid.uuid4()))
        self.assertTrue(result["valid"])
        self.assertEqual(result["total"], 0)


# ============================================================================
# 5. Evidence Pack Tests
# ============================================================================


class EvidencePackTest(TestCase):
    """Test evidence pack seal and verify cycle."""

    def test_seal_and_verify(self):
        from services.evidence_pack.models import EvidencePack

        pack = EvidencePack(
            org_id=uuid.uuid4(),
            pack_type="compliance_audit",
            title="Test Compliance Pack",
            checksum_manifest={"artifacts": ["audit_logs"]},
        )
        pack.save()
        pack.seal(actor_id="test-user")
        pack.refresh_from_db()
        self.assertEqual(pack.status, "sealed")
        self.assertTrue(pack.verify_seal())

    def test_tampered_manifest_fails_verify(self):
        from services.evidence_pack.models import EvidencePack

        pack = EvidencePack(
            org_id=uuid.uuid4(),
            pack_type="governance_full",
            title="Test Governance Pack",
            checksum_manifest={"artifacts": ["votes"]},
        )
        pack.save()
        pack.seal(actor_id="test-user")

        pack.checksum_manifest = {"artifacts": ["TAMPERED"]}
        self.assertFalse(pack.verify_seal())


# ============================================================================
# 6. Rate Limiter Tests
# ============================================================================


class RateLimiterTest(TestCase):
    """Test rate-limiter sliding-window logic."""

    @override_settings(
        CACHES={
            "default": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            }
        }
    )
    def test_under_limit_passes(self):
        from middleware.rate_limiter import _is_rate_limited

        result = _is_rate_limited("ip", "127.0.0.1", limit=10, window=60)
        self.assertFalse(result)

    @override_settings(
        CACHES={
            "default": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            }
        }
    )
    def test_exceeding_limit_blocks(self):
        from middleware.rate_limiter import _is_rate_limited

        ident = f"test-{uuid.uuid4()}"
        for _ in range(5):
            _is_rate_limited("ip", ident, limit=5, window=60)
        result = _is_rate_limited("ip", ident, limit=5, window=60)
        self.assertTrue(result)


# ============================================================================
# 7. Break-Glass Tests
# ============================================================================


class BreakGlassTest(TestCase):
    """Test break-glass logging function."""

    @patch("middleware.break_glass._flag_compliance")
    @patch("services.events.dispatcher.emit_event")
    def test_log_break_glass_returns_payload(self, mock_emit, mock_flag):
        from middleware.break_glass import log_break_glass

        result = log_break_glass(
            org_id=str(uuid.uuid4()),
            actor_id="admin-1",
            action="override_access_control",
            reason="Emergency member data export",
        )
        self.assertIn("event_id", result)
        self.assertEqual(result["action"], "override_access_control")
