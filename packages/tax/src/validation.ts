/**
 * @nzila/tax — Validation & close gating
 *
 * Implements the governance enforcement rules for tax year close:
 * - T2 artifact must be uploaded
 * - CO-17 must be uploaded if QC entity
 * - All indirect tax periods must be marked filed
 * - NOA upload tracked (optional but recorded)
 * - Segregation of duties: preparer ≠ approver
 */
import type { TaxYearCloseGate, FinanceRole } from './types'

interface TaxFilingRow {
  filingType: string
  documentId: string | null
  sha256: string | null
}

interface IndirectTaxPeriodRow {
  status: string
  taxType: string
}

interface TaxNoticeRow {
  noticeType: string
  documentId: string | null
}

export interface CloseGateInput {
  province: string | null // ON | QC | null
  filings: TaxFilingRow[]
  indirectPeriods: IndirectTaxPeriodRow[]
  notices: TaxNoticeRow[]
}

/**
 * Evaluate whether a tax year can be closed.
 *
 * Returns detailed blockers and artifact status.
 */
export function evaluateTaxYearCloseGate(input: CloseGateInput): TaxYearCloseGate {
  const blockers: string[] = []
  const warnings: string[] = []

  // T2 check
  const t2 = input.filings.find((f) => f.filingType === 'T2')
  const t2Filed = !!(t2?.documentId && t2.sha256)
  if (!t2Filed) {
    blockers.push('T2 filing artifact not uploaded. Upload the signed T2 PDF before closing.')
  }

  // CO-17 check (QC orgs only)
  const co17Required = input.province === 'QC'
  const co17 = input.filings.find((f) => f.filingType === 'CO-17')
  const co17Filed = !!(co17?.documentId && co17.sha256)
  if (co17Required && !co17Filed) {
    blockers.push('CO-17 filing artifact not uploaded. Quebec orgs must upload CO-17 before closing.')
  }

  // All indirect tax periods filed
  const unfiled = input.indirectPeriods.filter(
    (p) => p.status !== 'filed' && p.status !== 'paid' && p.status !== 'closed',
  )
  const allIndirectPeriodsFiled = unfiled.length === 0
  if (!allIndirectPeriodsFiled) {
    const types = [...new Set(unfiled.map((p) => p.taxType))].join(', ')
    blockers.push(`${unfiled.length} indirect tax period(s) not yet filed (${types}).`)
  }

  // NOA check (optional but tracked)
  const noa = input.notices.find((n) => n.noticeType === 'NOA')
  const noaUploaded = !!(noa?.documentId)
  if (!noaUploaded) {
    warnings.push('Notice of Assessment (NOA) not yet uploaded. This is tracked but not required to close.')
  }

  return {
    canClose: blockers.length === 0,
    blockers,
    warnings,
    artifacts: {
      t2Filed,
      co17Filed,
      co17Required,
      allIndirectPeriodsFiled,
      noaUploaded,
    },
  }
}

/**
 * Enforce segregation of duties: preparer cannot approve same period.
 *
 * @returns true if the actor is allowed to perform the operation
 */
export function enforceSoD(
  actorClerkUserId: string,
  actorRole: FinanceRole,
  preparedByClerkUserId: string,
): { allowed: boolean; reason?: string } {
  // org_admin can override with documented exception
  if (actorRole === 'org_admin') {
    return { allowed: true }
  }

  // finance_preparer can upload/attach but cannot approve
  if (actorRole === 'finance_preparer') {
    return { allowed: true }
  }

  // finance_approver cannot approve if they are the preparer
  if (actorRole === 'finance_approver' && actorClerkUserId === preparedByClerkUserId) {
    return {
      allowed: false,
      reason: 'Segregation of duties: the preparer cannot approve the same period.',
    }
  }

  return { allowed: true }
}

/**
 * Validate that a dividend declaration has a board resolution linked
 * before a tax filing record can be created that references dividends.
 */
export function validateDividendGovernanceLink(
  filingType: string,
  governanceLinks: { governanceType: string; governanceId: string }[],
): { valid: boolean; reason?: string } {
  if (filingType !== 'T5' && filingType !== 'RL-3') {
    return { valid: true }
  }

  const hasResolution = governanceLinks.some(
    (link) => link.governanceType === 'resolution',
  )

  if (!hasResolution) {
    return {
      valid: false,
      reason: 'Dividend declaration requires a board resolution before a T5/RL-3 filing record can be created.',
    }
  }

  return { valid: true }
}

/**
 * Validate borrowing governance link before tax year close.
 * Borrowing above threshold requires governance link.
 */
export function validateBorrowingGovernanceLink(
  borrowingAmount: number,
  threshold: number,
  governanceLinks: { governanceType: string; sourceType: string }[],
): { valid: boolean; reason?: string } {
  if (borrowingAmount <= threshold) {
    return { valid: true }
  }

  const hasBorrowingLink = governanceLinks.some(
    (link) => link.governanceType === 'governance_action' || link.governanceType === 'resolution',
  )

  if (!hasBorrowingLink) {
    return {
      valid: false,
      reason: `Borrowing of $${borrowingAmount.toLocaleString()} exceeds threshold of $${threshold.toLocaleString()}. A governance link (resolution or action) is required before the tax year can close.`,
    }
  }

  return { valid: true }
}
