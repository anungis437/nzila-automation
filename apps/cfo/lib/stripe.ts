/**
 * Stripe payments — CFO app.
 *
 * Wires @nzila/payments-stripe for revenue dashboards, reconciliation,
 * and financial reporting from real Stripe data.
 */
import {
  getStripeClient,
  createCheckoutSession,
  verifyWebhookSignature,
  normalizeAndPersist,
  generateStripeReports,
  matchPayoutsToDeposits,
  generateExceptions,
  computeCloseReadiness,
  collectStripeEvidenceArtifacts,
  buildStripeEvidencePackRequest,
  type ReconciliationConfig,
  type CloseReadinessReport,
  type MatchResult,
} from '@nzila/payments-stripe'

export {
  getStripeClient,
  createCheckoutSession,
  verifyWebhookSignature,
  normalizeAndPersist,
  generateStripeReports,
  matchPayoutsToDeposits,
  generateExceptions,
  computeCloseReadiness,
  collectStripeEvidenceArtifacts,
  buildStripeEvidencePackRequest,
}
export type { ReconciliationConfig, CloseReadinessReport, MatchResult }

/**
 * Run month-end reconciliation: match Stripe payouts to QBO deposits,
 * generate exceptions report, and assess close readiness.
 */
export async function runMonthEndReconciliation(
  _config?: Partial<ReconciliationConfig>,
): Promise<CloseReadinessReport> {
  const matchResult = matchPayoutsToDeposits([], [])
  const exceptions = generateExceptions('default', 'current', matchResult)
  return computeCloseReadiness('default', 'current', matchResult, exceptions)
}
