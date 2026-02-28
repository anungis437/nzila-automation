/**
 * Unit tests for year-end evidence pack builder
 * (packages/tax/src/evidence.ts).
 */
import { describe, it, expect } from 'vitest'
import {
  yearEndPackBasePath,
  yearEndArtifactPath,
  buildYearEndManifest,
  evaluatePackCompleteness,
  serializeManifest,
  YEAR_END_FINANCIAL_ARTIFACTS,
  YEAR_END_GOVERNANCE_ARTIFACTS,
  YEAR_END_TAX_ARTIFACTS,
} from '../evidence'

// ── Path builders ───────────────────────────────────────────────────────────

describe('yearEndPackBasePath', () => {
  it('returns correct blob base path', () => {
    expect(yearEndPackBasePath('ent-001', 'FY2025')).toBe(
      'evidence/ent-001/year/FY2025/finance/pack-index',
    )
  })
})

describe('yearEndArtifactPath', () => {
  it('returns correct artifact blob path', () => {
    expect(yearEndArtifactPath('ent-001', 'FY2025', 'trial_balance', 'tb.xlsx')).toBe(
      'evidence/ent-001/year/FY2025/finance/trial_balance/tb.xlsx',
    )
  })
})

// ── Artifact constants ──────────────────────────────────────────────────────

describe('artifact constants', () => {
  it('has 5 financial artifacts', () => {
    expect(YEAR_END_FINANCIAL_ARTIFACTS).toHaveLength(5)
    expect(YEAR_END_FINANCIAL_ARTIFACTS).toContain('trial_balance')
    expect(YEAR_END_FINANCIAL_ARTIFACTS).toContain('balance_sheet')
  })

  it('has 3 governance artifacts', () => {
    expect(YEAR_END_GOVERNANCE_ARTIFACTS).toHaveLength(3)
    expect(YEAR_END_GOVERNANCE_ARTIFACTS).toContain('fs_approval_resolution')
  })

  it('has 7 tax artifacts', () => {
    expect(YEAR_END_TAX_ARTIFACTS).toHaveLength(7)
    expect(YEAR_END_TAX_ARTIFACTS).toContain('t2_filing')
    expect(YEAR_END_TAX_ARTIFACTS).toContain('co17_filing')
  })
})

// ── Manifest builder ────────────────────────────────────────────────────────

const fullInput = {
  orgId: 'ent-001',
  fiscalYear: 'FY2025',
  financial: {
    trialBalance: 'blob://tb.xlsx',
    profitAndLoss: 'blob://pl.pdf',
    balanceSheet: 'blob://bs.pdf',
    glExport: 'blob://gl.csv',
    cashFlow: 'blob://cf.pdf',
  },
  governance: {
    fsApprovalResolution: 'blob://fs-resolution.pdf',
    shareLedgerSnapshot: 'blob://ledger.pdf',
    dividendResolutions: ['blob://div-res-1.pdf'],
  },
  tax: {
    t2Filing: 'blob://t2.pdf',
    co17Filing: 'blob://co17.pdf',
    schedule50: 'blob://s50.pdf',
    installmentSummary: 'blob://installments.pdf',
    noticeOfAssessment: 'blob://noa.pdf',
    gstHstAnnualSummary: 'blob://gst.pdf',
    qstAnnualSummary: 'blob://qst.pdf',
  },
}

describe('buildYearEndManifest', () => {
  it('produces manifest with sha256 hash', () => {
    const manifest = buildYearEndManifest(fullInput)
    expect(manifest.orgId).toBe('ent-001')
    expect(manifest.fiscalYear).toBe('FY2025')
    expect(manifest.manifestHash).toBeTruthy()
    expect(manifest.manifestHash).toMatch(/^[a-f0-9]{64}$/)
    expect(manifest.generatedAt).toBeTruthy()
  })

  it('produces different hash for different inputs', () => {
    const m1 = buildYearEndManifest(fullInput)
    const m2 = buildYearEndManifest({ ...fullInput, fiscalYear: 'FY2024' })
    expect(m1.manifestHash).not.toBe(m2.manifestHash)
  })
})

// ── Pack completeness ───────────────────────────────────────────────────────

describe('evaluatePackCompleteness', () => {
  it('returns 100% for a complete ON pack', () => {
    const manifest = buildYearEndManifest(fullInput)
    const result = evaluatePackCompleteness(manifest, false)
    expect(result.percentage).toBe(100)
    expect(result.missing).toHaveLength(0)
    expect(result.present).toBe(result.total)
  })

  it('returns 100% for a complete QC pack', () => {
    const manifest = buildYearEndManifest(fullInput)
    const result = evaluatePackCompleteness(manifest, true)
    expect(result.percentage).toBe(100)
    expect(result.missing).toHaveLength(0)
  })

  it('marks missing financial artifacts', () => {
    const manifest = buildYearEndManifest({
      ...fullInput,
      financial: {},
    })
    const result = evaluatePackCompleteness(manifest, false)
    expect(result.missing).toContain('Trial Balance')
    expect(result.missing).toContain('Balance Sheet')
    expect(result.percentage).toBeLessThan(100)
  })

  it('marks missing T2 for ON entity', () => {
    const manifest = buildYearEndManifest({
      ...fullInput,
      tax: {},
    })
    const result = evaluatePackCompleteness(manifest, false)
    expect(result.missing).toContain('T2 Filing')
  })

  it('marks missing CO-17 only for QC entity', () => {
    const manifest = buildYearEndManifest({
      ...fullInput,
      tax: { ...fullInput.tax, co17Filing: undefined },
    })
    const onResult = evaluatePackCompleteness(manifest, false) // ON
    const qcResult = evaluatePackCompleteness(manifest, true) // QC

    expect(onResult.missing).not.toContain('CO-17 Filing')
    expect(qcResult.missing).toContain('CO-17 Filing')
  })
})

// ── Manifest serialization ──────────────────────────────────────────────────

describe('serializeManifest', () => {
  it('produces parseable JSON buffer', () => {
    const manifest = buildYearEndManifest(fullInput)
    const buf = serializeManifest(manifest)
    expect(buf).toBeInstanceOf(Buffer)
    const parsed = JSON.parse(buf.toString('utf-8'))
    expect(parsed.orgId).toBe('ent-001')
    expect(parsed.manifestHash).toBe(manifest.manifestHash)
  })
})
