/**
 * Unit tests for tax year close gating & segregation of duties
 * (packages/tax/src/validation.ts).
 */
import { describe, it, expect } from 'vitest'
import {
  evaluateTaxYearCloseGate,
  enforceSoD,
  validateDividendGovernanceLink,
  validateBorrowingGovernanceLink,
} from '../validation'

// ── evaluateTaxYearCloseGate ────────────────────────────────────────────────

describe('evaluateTaxYearCloseGate', () => {
  const baseInput = {
    province: 'ON' as const,
    filings: [
      { filingType: 'T2', documentId: 'doc-1', sha256: 'abc123' },
    ],
    indirectPeriods: [
      { status: 'filed', taxType: 'GST/HST' },
    ],
    notices: [
      { noticeType: 'NOA', documentId: 'doc-2' },
    ],
  }

  it('allows close when all artifacts are present (ON)', () => {
    const result = evaluateTaxYearCloseGate(baseInput)
    expect(result.canClose).toBe(true)
    expect(result.blockers).toHaveLength(0)
    expect(result.artifacts.t2Filed).toBe(true)
  })

  it('blocks when T2 is missing', () => {
    const result = evaluateTaxYearCloseGate({
      ...baseInput,
      filings: [],
    })
    expect(result.canClose).toBe(false)
    expect(result.blockers).toContainEqual(expect.stringContaining('T2'))
    expect(result.artifacts.t2Filed).toBe(false)
  })

  it('blocks QC entity when CO-17 is missing', () => {
    const result = evaluateTaxYearCloseGate({
      ...baseInput,
      province: 'QC',
    })
    expect(result.canClose).toBe(false)
    expect(result.blockers).toContainEqual(expect.stringContaining('CO-17'))
    expect(result.artifacts.co17Required).toBe(true)
    expect(result.artifacts.co17Filed).toBe(false)
  })

  it('allows QC entity when CO-17 is present', () => {
    const result = evaluateTaxYearCloseGate({
      ...baseInput,
      province: 'QC',
      filings: [
        { filingType: 'T2', documentId: 'doc-1', sha256: 'abc' },
        { filingType: 'CO-17', documentId: 'doc-2', sha256: 'def' },
      ],
    })
    expect(result.canClose).toBe(true)
    expect(result.artifacts.co17Filed).toBe(true)
  })

  it('does not require CO-17 for non-QC entity', () => {
    const result = evaluateTaxYearCloseGate(baseInput) // ON province
    expect(result.artifacts.co17Required).toBe(false)
  })

  it('blocks when indirect tax periods are unfiled', () => {
    const result = evaluateTaxYearCloseGate({
      ...baseInput,
      indirectPeriods: [
        { status: 'open', taxType: 'GST/HST' },
        { status: 'open', taxType: 'QST' },
      ],
    })
    expect(result.canClose).toBe(false)
    expect(result.blockers).toContainEqual(expect.stringContaining('indirect tax'))
  })

  it('warns when NOA is missing but does not block', () => {
    const result = evaluateTaxYearCloseGate({
      ...baseInput,
      notices: [],
    })
    expect(result.canClose).toBe(true)
    expect(result.warnings).toContainEqual(expect.stringContaining('NOA'))
    expect(result.artifacts.noaUploaded).toBe(false)
  })
})

// ── enforceSoD ──────────────────────────────────────────────────────────────

describe('enforceSoD', () => {
  it('blocks finance_approver who is also the preparer', () => {
    const result = enforceSoD('user-1', 'finance_approver', 'user-1')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Segregation of duties')
  })

  it('allows finance_approver who is not the preparer', () => {
    const result = enforceSoD('user-2', 'finance_approver', 'user-1')
    expect(result.allowed).toBe(true)
  })

  it('allows finance_preparer regardless', () => {
    const result = enforceSoD('user-1', 'finance_preparer', 'user-1')
    expect(result.allowed).toBe(true)
  })

  it('allows org_admin to override', () => {
    const result = enforceSoD('user-1', 'org_admin', 'user-1')
    expect(result.allowed).toBe(true)
  })
})

// ── validateDividendGovernanceLink ──────────────────────────────────────────

describe('validateDividendGovernanceLink', () => {
  it('requires resolution for T5 filing', () => {
    const result = validateDividendGovernanceLink('T5', [])
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('board resolution')
  })

  it('requires resolution for RL-3 filing', () => {
    const result = validateDividendGovernanceLink('RL-3', [])
    expect(result.valid).toBe(false)
  })

  it('accepts linked resolution', () => {
    const result = validateDividendGovernanceLink('T5', [
      { governanceType: 'resolution', governanceId: 'gov-1' },
    ])
    expect(result.valid).toBe(true)
  })

  it('skips check for non-dividend filings', () => {
    const result = validateDividendGovernanceLink('T2', [])
    expect(result.valid).toBe(true)
  })
})

// ── validateBorrowingGovernanceLink ─────────────────────────────────────────

describe('validateBorrowingGovernanceLink', () => {
  it('allows borrowing below threshold', () => {
    const result = validateBorrowingGovernanceLink(50_000, 100_000, [])
    expect(result.valid).toBe(true)
  })

  it('blocks borrowing above threshold without governance link', () => {
    const result = validateBorrowingGovernanceLink(150_000, 100_000, [])
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('exceeds threshold')
  })

  it('allows borrowing above threshold with resolution', () => {
    const result = validateBorrowingGovernanceLink(150_000, 100_000, [
      { governanceType: 'resolution', sourceType: 'board_meeting' },
    ])
    expect(result.valid).toBe(true)
  })

  it('allows borrowing above threshold with governance_action link', () => {
    const result = validateBorrowingGovernanceLink(150_000, 100_000, [
      { governanceType: 'governance_action', sourceType: 'internal' },
    ])
    expect(result.valid).toBe(true)
  })
})
