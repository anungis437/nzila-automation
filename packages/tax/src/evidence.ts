/**
 * @nzila/tax — Year-end evidence pack builder
 *
 * Extends the os-core evidence pack system with finance + tax artifacts.
 * Generates the year-end accountant pack with:
 *   Financial: TB, P&L, Balance Sheet, GL, Cash Flow
 *   Governance: FS approval, share ledger, dividend resolutions
 *   Tax: T2, CO-17, Schedule 50, installments, NOA, GST/HST, QST
 *
 * Produces: index JSON, cover PDF metadata, manifest hash.
 * Stores in Blob: evidence/{org_id}/year/{FY}/finance/pack-index/
 */
import { createHash } from 'node:crypto'
import type { YearEndPackManifest } from './types'

// ── Year-end artifact categories ────────────────────────────────────────────

export const YEAR_END_FINANCIAL_ARTIFACTS = [
  'trial_balance',
  'profit_and_loss',
  'balance_sheet',
  'gl_export',
  'cash_flow',
] as const

export const YEAR_END_GOVERNANCE_ARTIFACTS = [
  'fs_approval_resolution',
  'share_ledger_snapshot',
  'dividend_resolutions',
] as const

export const YEAR_END_TAX_ARTIFACTS = [
  't2_filing',
  'co17_filing',
  'schedule50',
  'installment_summary',
  'notice_of_assessment',
  'gst_hst_annual_summary',
  'qst_annual_summary',
] as const

export type FinancialArtifactType = (typeof YEAR_END_FINANCIAL_ARTIFACTS)[number]
export type GovernanceArtifactType = (typeof YEAR_END_GOVERNANCE_ARTIFACTS)[number]
export type TaxArtifactType = (typeof YEAR_END_TAX_ARTIFACTS)[number]
export type YearEndArtifactType = FinancialArtifactType | GovernanceArtifactType | TaxArtifactType

// ── Evidence pack path builder ──────────────────────────────────────────────

/**
 * Compute the blob base path for a year-end evidence pack.
 *
 * Format: evidence/{org_id}/year/{FY}/finance/pack-index/
 */
export function yearEndPackBasePath(orgId: string, fiscalYear: string): string {
  return `evidence/${orgId}/year/${fiscalYear}/finance/pack-index`
}

/**
 * Compute artifact blob path within the year-end pack.
 */
export function yearEndArtifactPath(
  orgId: string,
  fiscalYear: string,
  artifactType: string,
  filename: string,
): string {
  return `evidence/${orgId}/year/${fiscalYear}/finance/${artifactType}/${filename}`
}

// ── Manifest builder ────────────────────────────────────────────────────────

export interface YearEndPackInput {
  orgId: string
  fiscalYear: string
  financial: {
    trialBalance?: string
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
}

/**
 * Build a year-end evidence pack manifest.
 *
 * The manifest is a JSON document that indexes all artifacts in the pack.
 * It is sha256 hashed for integrity and stored in Blob alongside the artifacts.
 */
export function buildYearEndManifest(input: YearEndPackInput): YearEndPackManifest {
  const manifestContent = {
    orgId: input.orgId,
    fiscalYear: input.fiscalYear,
    generatedAt: new Date().toISOString(),
    financial: input.financial,
    governance: input.governance,
    tax: input.tax,
  }

  const manifestHash = createHash('sha256')
    .update(JSON.stringify(manifestContent))
    .digest('hex')

  return {
    ...manifestContent,
    manifestHash,
  }
}

/**
 * Compute the completeness of a year-end pack.
 *
 * Returns percentage and missing items.
 */
export function evaluatePackCompleteness(
  manifest: YearEndPackManifest,
  isQcEntity: boolean,
): {
  percentage: number
  total: number
  present: number
  missing: string[]
} {
  const missing: string[] = []
  let total = 0
  let present = 0

  // Financial (5 items)
  const financialChecks: [string, string | undefined][] = [
    ['Trial Balance', manifest.financial.trialBalance],
    ['Profit & Loss', manifest.financial.profitAndLoss],
    ['Balance Sheet', manifest.financial.balanceSheet],
    ['GL Export', manifest.financial.glExport],
    ['Cash Flow', manifest.financial.cashFlow],
  ]
  for (const [label, val] of financialChecks) {
    total++
    if (val) present++
    else missing.push(label)
  }

  // Governance (2-3 items)
  const govChecks: [string, unknown][] = [
    ['FS Approval Resolution', manifest.governance.fsApprovalResolution],
    ['Share Ledger Snapshot', manifest.governance.shareLedgerSnapshot],
  ]
  for (const [label, val] of govChecks) {
    total++
    if (val) present++
    else missing.push(label)
  }
  // Dividend resolutions are optional — only count if present
  if (manifest.governance.dividendResolutions && manifest.governance.dividendResolutions.length > 0) {
    total++
    present++
  }

  // Tax (5-7 items depending on province)
  const taxChecks: [string, unknown, boolean][] = [
    ['T2 Filing', manifest.tax.t2Filing, true],
    ['CO-17 Filing', manifest.tax.co17Filing, isQcEntity],
    ['Schedule 50', manifest.tax.schedule50, false], // optional
    ['Installment Summary', manifest.tax.installmentSummary, true],
    ['Notice of Assessment', manifest.tax.noticeOfAssessment, false], // optional but tracked
    ['GST/HST Annual Summary', manifest.tax.gstHstAnnualSummary, true],
    ['QST Annual Summary', manifest.tax.qstAnnualSummary, isQcEntity],
  ]
  for (const [label, val, required] of taxChecks) {
    if (required || val) {
      total++
      if (val) present++
      else missing.push(label)
    }
  }

  return {
    percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    total,
    present,
    missing,
  }
}

/**
 * Serialize manifest to JSON buffer for blob upload.
 */
export function serializeManifest(manifest: YearEndPackManifest): Buffer {
  return Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8')
}
