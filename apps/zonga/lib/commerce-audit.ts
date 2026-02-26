/**
 * Commerce Audit — Zonga
 *
 * Bridges @nzila/commerce-audit for creator payout and content lifecycle
 * audit trails. Every state transition (payout, release, asset) produces
 * a tamper-evident audit entry.
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
