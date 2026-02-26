/**
 * Tax governance — CFO app.
 *
 * Wires @nzila/tax for deadline tracking, year-end close governance,
 * installment management, and tax evidence packs.
 */
import {
  buildTaxYearDeadlines,
  buildInstallmentDeadline,
  buildIndirectTaxDeadlines,
  sortDeadlines,
  computeUrgency,
  daysUntil,
  evaluateTaxYearCloseGate,
  evaluateFinanceGovernanceRequirements,
  FINANCE_AUDIT_ACTIONS,
  buildYearEndManifest,
  evaluatePackCompleteness,
  YEAR_END_FINANCIAL_ARTIFACTS,
  YEAR_END_GOVERNANCE_ARTIFACTS,
  YEAR_END_TAX_ARTIFACTS,
  type CloseGateInput,
  type FinancePolicyContext,
} from '@nzila/tax'

export {
  buildTaxYearDeadlines,
  buildInstallmentDeadline,
  buildIndirectTaxDeadlines,
  sortDeadlines,
  computeUrgency,
  daysUntil,
  evaluateTaxYearCloseGate,
  evaluateFinanceGovernanceRequirements,
  FINANCE_AUDIT_ACTIONS,
  buildYearEndManifest,
  evaluatePackCompleteness,
  YEAR_END_FINANCIAL_ARTIFACTS,
  YEAR_END_GOVERNANCE_ARTIFACTS,
  YEAR_END_TAX_ARTIFACTS,
}
export type { CloseGateInput, FinancePolicyContext }

/**
 * Get all upcoming tax deadlines for the current fiscal year,
 * sorted by urgency (most urgent first).
 */
export function getUpcomingDeadlines(taxYear: number) {
  const yearLabel = String(taxYear)
  const corporate = buildTaxYearDeadlines({
    id: `ty-${taxYear}`,
    entityId: 'default',
    fiscalYearLabel: yearLabel,
    federalFilingDeadline: `${taxYear + 1}-06-30`,
    federalPaymentDeadline: `${taxYear + 1}-03-31`,
  })
  const installments = buildInstallmentDeadline(
    { entityId: 'default', taxYearId: `ty-${taxYear}`, dueDate: `${taxYear + 1}-03-31`, status: 'pending' },
    `${yearLabel} — Installment`,
  )
  const indirect = buildIndirectTaxDeadlines({
    entityId: 'default',
    taxType: 'GST/HST',
    filingDue: `${taxYear + 1}-03-31`,
    paymentDue: `${taxYear + 1}-03-31`,
    status: 'pending',
  })
  const all = [...corporate, installments, ...indirect]
  return sortDeadlines(all).map((d) => ({
    ...d,
    urgency: computeUrgency(d.dueDate),
    daysRemaining: daysUntil(d.dueDate),
  }))
}
