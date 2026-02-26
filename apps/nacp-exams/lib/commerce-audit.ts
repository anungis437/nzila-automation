/**
 * Commerce Audit — NACP Exams
 *
 * Bridges @nzila/commerce-audit for exam session and submission
 * audit trails. Every lifecycle transition produces a tamper-evident
 * audit entry alongside the commerce-observability telemetry.
 */
export {
  buildTransitionAuditEntry,
  buildActionAuditEntry,
  validateAuditEntry,
  hashAuditEntry,
  summarizeAuditTrail,
  CommerceEntityType,
  AuditAction,
  type AuditEntry,
  type TransitionAuditContext,
  type ActionAuditContext,
} from '@nzila/commerce-audit'

export {
  buildCommerceEvidencePack,
  computeAuditTrailHash,
  type CommerceEvidencePackResult,
} from '@nzila/commerce-audit/evidence'
