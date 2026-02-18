/**
 * @nzila/tax — Shared types for tax governance module
 *
 * Zod schemas and TypeScript types for tax profiles, tax years,
 * filings, installments, notices, and indirect tax.
 */
import { z } from 'zod'

// ── Province codes ──────────────────────────────────────────────────────────

export const Province = z.enum([
  'ON', 'QC', 'BC', 'AB', 'SK', 'MB', 'NB', 'NS', 'PE', 'NL', 'YT', 'NT', 'NU',
])
export type Province = z.infer<typeof Province>

// ── Tax year status ─────────────────────────────────────────────────────────

export const TaxYearStatus = z.enum(['open', 'filed', 'assessed', 'closed'])
export type TaxYearStatus = z.infer<typeof TaxYearStatus>

// ── Filing types ────────────────────────────────────────────────────────────

export const TaxFilingType = z.enum(['T2', 'CO-17', 'Schedule50', 'T5', 'RL-3', 'Other'])
export type TaxFilingType = z.infer<typeof TaxFilingType>

// ── Installment status ──────────────────────────────────────────────────────

export const InstallmentStatus = z.enum(['due', 'paid', 'late'])
export type InstallmentStatus = z.infer<typeof InstallmentStatus>

// ── Notice types ────────────────────────────────────────────────────────────

export const NoticeAuthority = z.enum(['CRA', 'Revenu Quebec'])
export type NoticeAuthority = z.infer<typeof NoticeAuthority>

export const NoticeType = z.enum(['NOA', 'Reassessment', 'InstallmentReminder'])
export type NoticeType = z.infer<typeof NoticeType>

// ── Indirect tax ────────────────────────────────────────────────────────────

export const IndirectTaxType = z.enum(['GST', 'HST', 'QST'])
export type IndirectTaxType = z.infer<typeof IndirectTaxType>

export const IndirectTaxFilingFrequency = z.enum(['monthly', 'quarterly', 'annual'])
export type IndirectTaxFilingFrequency = z.infer<typeof IndirectTaxFilingFrequency>

export const IndirectTaxPeriodStatus = z.enum(['open', 'filed', 'paid', 'closed'])
export type IndirectTaxPeriodStatus = z.infer<typeof IndirectTaxPeriodStatus>

// ── Finance roles (Clerk-based SoD) ─────────────────────────────────────────

export const FinanceRole = z.enum([
  'finance_preparer',
  'finance_approver',
  'entity_admin',
])
export type FinanceRole = z.infer<typeof FinanceRole>

// ── Input schemas ───────────────────────────────────────────────────────────

export const CreateTaxProfileInput = z.object({
  entityId: z.string().uuid(),
  federalBn: z.string().max(15).optional(),
  provinceOfRegistration: Province.optional(),
  fiscalYearEnd: z.string().regex(/^\d{2}-\d{2}$/).optional(), // MM-DD
  accountantName: z.string().optional(),
  accountantEmail: z.string().email().optional(),
  craProgramAccounts: z.record(z.string()).optional(),
  rqProgramAccounts: z.record(z.string()).optional(),
})
export type CreateTaxProfileInput = z.infer<typeof CreateTaxProfileInput>

export const CreateTaxYearInput = z.object({
  entityId: z.string().uuid(),
  fiscalYearLabel: z.string().min(1).max(10),
  startDate: z.string(), // ISO date
  endDate: z.string(),
  federalFilingDeadline: z.string(),
  federalPaymentDeadline: z.string(),
  provincialFilingDeadline: z.string().optional(),
  provincialPaymentDeadline: z.string().optional(),
})
export type CreateTaxYearInput = z.infer<typeof CreateTaxYearInput>

export const CreateTaxFilingInput = z.object({
  entityId: z.string().uuid(),
  taxYearId: z.string().uuid(),
  filingType: TaxFilingType,
  filedDate: z.string().optional(),
  preparedBy: z.string().min(1),
  reviewedBy: z.string().optional(),
  documentId: z.string().uuid().optional(),
  sha256: z.string().optional(),
})
export type CreateTaxFilingInput = z.infer<typeof CreateTaxFilingInput>

export const CreateTaxInstallmentInput = z.object({
  entityId: z.string().uuid(),
  taxYearId: z.string().uuid(),
  dueDate: z.string(),
  requiredAmount: z.string(), // numeric string
  paidAmount: z.string().optional(),
  paymentDocumentId: z.string().uuid().optional(),
})
export type CreateTaxInstallmentInput = z.infer<typeof CreateTaxInstallmentInput>

export const CreateTaxNoticeInput = z.object({
  entityId: z.string().uuid(),
  taxYearId: z.string().uuid(),
  authority: NoticeAuthority,
  noticeType: NoticeType,
  receivedDate: z.string(),
  documentId: z.string().uuid().optional(),
  sha256: z.string().optional(),
})
export type CreateTaxNoticeInput = z.infer<typeof CreateTaxNoticeInput>

export const CreateIndirectTaxAccountInput = z.object({
  entityId: z.string().uuid(),
  taxType: IndirectTaxType,
  filingFrequency: IndirectTaxFilingFrequency,
  programAccountNumber: z.string().max(20).optional(),
})
export type CreateIndirectTaxAccountInput = z.infer<typeof CreateIndirectTaxAccountInput>

export const CreateIndirectTaxPeriodInput = z.object({
  entityId: z.string().uuid(),
  accountId: z.string().uuid(),
  taxType: IndirectTaxType,
  startDate: z.string(),
  endDate: z.string(),
  filingDue: z.string(),
  paymentDue: z.string(),
})
export type CreateIndirectTaxPeriodInput = z.infer<typeof CreateIndirectTaxPeriodInput>

export const UpdateIndirectTaxSummaryInput = z.object({
  periodId: z.string().uuid(),
  totalSales: z.string().optional(),
  taxCollected: z.string().optional(),
  itcs: z.string().optional(),
  netPayable: z.string().optional(),
  reconciled: z.boolean().optional(),
})
export type UpdateIndirectTaxSummaryInput = z.infer<typeof UpdateIndirectTaxSummaryInput>

// ── Deadline urgency ────────────────────────────────────────────────────────

export type DeadlineUrgency = 'green' | 'yellow' | 'red'

export interface DeadlineInfo {
  label: string
  dueDate: string
  daysRemaining: number
  urgency: DeadlineUrgency
  entityId: string
  taxYearId?: string
  type: 'federal_filing' | 'federal_payment' | 'provincial_filing' | 'provincial_payment' | 'installment' | 'indirect_filing' | 'indirect_payment'
}

// ── Tax year close gating result ────────────────────────────────────────────

export interface TaxYearCloseGate {
  canClose: boolean
  blockers: string[]
  warnings: string[]
  artifacts: {
    t2Filed: boolean
    co17Filed: boolean
    co17Required: boolean
    allIndirectPeriodsFiled: boolean
    noaUploaded: boolean
  }
}

// ── Year-end evidence pack manifest ─────────────────────────────────────────

export interface YearEndPackManifest {
  entityId: string
  fiscalYear: string
  generatedAt: string
  financial: {
    trialBalance?: string // blob path
    profitAndLoss?: string
    balanceSheet?: string
    glExport?: string
    cashFlow?: string
  }
  governance: {
    fsApprovalResolution?: string
    shareLedgerSnapshot?: string
    dividendResolutions?: string[]
  }
  tax: {
    t2Filing?: string
    co17Filing?: string
    schedule50?: string
    installmentSummary?: string
    noticeOfAssessment?: string
    gstHstAnnualSummary?: string
    qstAnnualSummary?: string
  }
  manifestHash: string
}
