/**
 * @nzila/commerce-audit — Barrel export
 * @module @nzila/commerce-audit
 */
export {
  CommerceEntityType,
  AuditAction,
  buildTransitionAuditEntry,
  buildActionAuditEntry,
  validateAuditEntry,
  hashAuditEntry,
  summarizeAuditTrail,
} from './audit'
export type {
  AuditEntry,
  TransitionAuditContext,
  ActionAuditContext,
} from './audit'

export {
  COMMERCE_CONTROL_MAPPINGS,
  buildCommerceEvidencePack,
  computeAuditTrailHash,
  generateCommercePackId,
} from './evidence'
export type {
  CommerceControlMapping,
  CommerceArtifactDescriptor,
  CommerceEvidenceRequest,
  CommerceEvidencePackResult,
} from './evidence'
