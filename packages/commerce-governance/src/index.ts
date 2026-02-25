/**
 * @nzila/commerce-governance — Barrel Export
 * @module @nzila/commerce-governance
 */

// ── Guard factories ─────────────────────────────────────────────────────────
export {
  // Quote guards
  createApprovalRequiredGate,
  createMarginFloorGate,
  createDiscountCapGate,
  createQuoteValidityGate,
  createQuoteCompletenessGate,
  // Order guards
  createOrderCompletenessGate,
  createHighValueGate,
  createSnapshotIntegrityGate,
  // Invoice guards
  createEvidenceRequiredGate,
  createInvoiceCompletenessGate,
  // Diagnostic
  evaluateGates,
  // Machine enhancers
  withGovernanceGates,
  createGovernedQuoteMachine,
  createGovernedOrderMachine,
  createGovernedInvoiceMachine,
  // Policy
  resolvePolicy,
} from './gates'

// ── Types ───────────────────────────────────────────────────────────────────
export type {
  GovernancePolicy,
  GateResult,
  QuoteEntity,
  OrderEntity,
  InvoiceEntity,
} from './gates'
