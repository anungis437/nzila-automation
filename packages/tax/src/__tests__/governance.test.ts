/**
 * Unit tests for finance governance policy engine
 * (packages/tax/src/governance.ts).
 */
import { describe, it, expect } from 'vitest'
import {
  evaluateFinanceGovernanceRequirements,
  FINANCE_AUDIT_ACTIONS,
  type FinancePolicyContext,
} from '../governance'

function baseCtx(overrides?: Partial<FinancePolicyContext>): FinancePolicyContext {
  return {
    province: 'ON',
    hasFsApprovalResolution: true,
    hasDividendResolution: true,
    dividendsDeclared: false,
    borrowingAmount: 0,
    borrowingThreshold: 100_000,
    hasBorrowingGovernanceLink: false,
    ...overrides,
  }
}

describe('evaluateFinanceGovernanceRequirements', () => {
  it('returns no blockers when all governance is satisfied', () => {
    const result = evaluateFinanceGovernanceRequirements(baseCtx())
    expect(result.blockers).toHaveLength(0)
    expect(result.requirements).toHaveLength(0)
    expect(result.warnings).toHaveLength(0) // ON entity → no QC warning
  })

  it('blocks when FS approval resolution is missing', () => {
    const result = evaluateFinanceGovernanceRequirements(
      baseCtx({ hasFsApprovalResolution: false }),
    )
    expect(result.blockers.length).toBeGreaterThan(0)
    expect(result.blockers[0]).toContain('Financial statement')
    expect(result.requirements[0].kind).toBe('board_approval')
  })

  it('blocks when dividends declared without resolution', () => {
    const result = evaluateFinanceGovernanceRequirements(
      baseCtx({ dividendsDeclared: true, hasDividendResolution: false }),
    )
    expect(result.blockers).toContainEqual(expect.stringContaining('Dividend'))
  })

  it('does not block dividends when resolution is present', () => {
    const result = evaluateFinanceGovernanceRequirements(
      baseCtx({ dividendsDeclared: true, hasDividendResolution: true }),
    )
    expect(result.blockers).toHaveLength(0)
  })

  it('blocks borrowing above threshold without governance link', () => {
    const result = evaluateFinanceGovernanceRequirements(
      baseCtx({ borrowingAmount: 200_000, borrowingThreshold: 100_000 }),
    )
    expect(result.blockers).toContainEqual(expect.stringContaining('Borrowing'))
    expect(result.requirements.length).toBeGreaterThan(0)
  })

  it('allows borrowing above threshold with governance link', () => {
    const result = evaluateFinanceGovernanceRequirements(
      baseCtx({
        borrowingAmount: 200_000,
        borrowingThreshold: 100_000,
        hasBorrowingGovernanceLink: true,
      }),
    )
    const borrowingBlockers = result.blockers.filter((b) => b.includes('Borrowing'))
    expect(borrowingBlockers).toHaveLength(0)
  })

  it('allows borrowing at threshold', () => {
    const result = evaluateFinanceGovernanceRequirements(
      baseCtx({ borrowingAmount: 100_000, borrowingThreshold: 100_000 }),
    )
    const borrowingBlockers = result.blockers.filter((b) => b.includes('Borrowing'))
    expect(borrowingBlockers).toHaveLength(0)
  })

  it('adds QC warning for Quebec orgs', () => {
    const result = evaluateFinanceGovernanceRequirements(baseCtx({ province: 'QC' }))
    expect(result.warnings).toContainEqual(expect.stringContaining('CO-17'))
  })

  it('does not add QC warning for non-QC orgs', () => {
    const result = evaluateFinanceGovernanceRequirements(baseCtx({ province: 'ON' }))
    const qcWarnings = result.warnings.filter((w) => w.includes('CO-17'))
    expect(qcWarnings).toHaveLength(0)
  })
})

describe('FINANCE_AUDIT_ACTIONS', () => {
  it('has all expected action categories', () => {
    expect(FINANCE_AUDIT_ACTIONS.CLOSE_PERIOD_OPEN).toBe('close_period.open')
    expect(FINANCE_AUDIT_ACTIONS.QBO_CONNECT).toBe('qbo.connect')
    expect(FINANCE_AUDIT_ACTIONS.TAX_PROFILE_CREATE).toBe('tax.profile.create')
    expect(FINANCE_AUDIT_ACTIONS.INDIRECT_TAX_PERIOD_FILE).toBe('indirect_tax.period.file')
    expect(FINANCE_AUDIT_ACTIONS.GOVERNANCE_LINK_CREATE).toBe('governance_link.create')
    expect(FINANCE_AUDIT_ACTIONS.EVIDENCE_PACK_GENERATED).toBe('evidence_pack.generated')
  })

  it('contains 30 actions', () => {
    expect(Object.keys(FINANCE_AUDIT_ACTIONS)).toHaveLength(30)
  })
})
