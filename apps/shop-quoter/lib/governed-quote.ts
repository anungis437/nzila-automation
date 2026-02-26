/**
 * Governed quote machine — Shop-Quoter app.
 *
 * Wires @nzila/commerce-governance to apply approval, margin-floor,
 * discount-cap, and evidence gates to quote transitions.
 */
import {
  createGovernedQuoteMachine,
  createApprovalRequiredGate,
  createMarginFloorGate,
  createDiscountCapGate,
  createQuoteCompletenessGate,
  createEvidenceRequiredGate,
  evaluateGates,
  type GovernancePolicy,
  type GateResult,
} from '@nzila/commerce-governance'
import { quoteMachine } from '@nzila/commerce-state'

export {
  createGovernedQuoteMachine,
  createApprovalRequiredGate,
  createMarginFloorGate,
  createDiscountCapGate,
  createQuoteCompletenessGate,
  createEvidenceRequiredGate,
  evaluateGates,
}
export type { GovernancePolicy, GateResult }

/**
 * Build a governed quote machine with standard NzilaOS policy gates.
 */
export function buildGovernedQuoteMachine(policy?: Partial<GovernancePolicy>) {
  return createGovernedQuoteMachine(quoteMachine, {
    approvalThreshold: 10_000,
    marginFloorPercent: 15,
    maxDiscountWithoutApproval: 25,
    requireEvidenceForInvoice: true,
    ...policy,
  })
}
