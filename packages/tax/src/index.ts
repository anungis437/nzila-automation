/**
 * @nzila/tax — barrel export
 */

// Types
export * from './types'

// Deadline calculator
export {
  computeUrgency,
  daysUntil,
  buildTaxYearDeadlines,
  buildInstallmentDeadline,
  buildIndirectTaxDeadlines,
  sortDeadlines,
} from './deadlines'

// Validation & close gating
export {
  evaluateTaxYearCloseGate,
  enforceSoD,
  validateDividendGovernanceLink,
  validateBorrowingGovernanceLink,
} from './validation'
export type { CloseGateInput } from './validation'

// Governance integration
export {
  evaluateFinanceGovernanceRequirements,
  FINANCE_AUDIT_ACTIONS,
} from './governance'
export type { FinancePolicyContext, FinanceAuditAction } from './governance'

// Year-end evidence pack
export {
  YEAR_END_FINANCIAL_ARTIFACTS,
  YEAR_END_GOVERNANCE_ARTIFACTS,
  YEAR_END_TAX_ARTIFACTS,
  yearEndPackBasePath,
  yearEndArtifactPath,
  buildYearEndManifest,
  evaluatePackCompleteness,
  serializeManifest,
} from './evidence'
export type {
  FinancialArtifactType,
  GovernanceArtifactType,
  TaxArtifactType,
  YearEndArtifactType,
  YearEndPackInput,
} from './evidence'
