/**
 * Unit tests for the deadline calculator (packages/tax/src/deadlines.ts).
 *
 * Tests urgency computation, days-until, and deadline builders
 * for federal/provincial tax years, installments, and indirect tax.
 */
import { describe, it, expect } from 'vitest'
import {
  computeUrgency,
  daysUntil,
  buildTaxYearDeadlines,
  buildInstallmentDeadline,
  buildIndirectTaxDeadlines,
  sortDeadlines,
} from '../deadlines'

const refDate = new Date('2026-03-01')

describe('computeUrgency', () => {
  it('returns green when > 30 days remain', () => {
    expect(computeUrgency('2026-04-15', refDate)).toBe('green')
  })

  it('returns yellow when ≤ 30 days but not overdue', () => {
    expect(computeUrgency('2026-03-25', refDate)).toBe('yellow')
  })

  it('returns yellow at exactly 30 days', () => {
    expect(computeUrgency('2026-03-31', refDate)).toBe('yellow')
  })

  it('returns red when overdue (past due)', () => {
    expect(computeUrgency('2026-02-15', refDate)).toBe('red')
  })

  it('returns red on the due date itself', () => {
    expect(computeUrgency('2026-03-01', refDate)).toBe('red')
  })
})

describe('daysUntil', () => {
  it('returns positive for future dates', () => {
    expect(daysUntil('2026-03-11', refDate)).toBe(10)
  })

  it('returns 0 on the due date', () => {
    expect(daysUntil('2026-03-01', refDate)).toBe(0)
  })

  it('returns negative for past dates', () => {
    expect(daysUntil('2026-02-20', refDate)).toBeLessThan(0)
  })
})

describe('buildTaxYearDeadlines', () => {
  const taxYear = {
    id: 'ty-001',
    orgId: 'ent-001',
    fiscalYearLabel: 'FY2025',
    federalFilingDeadline: '2026-06-30',
    federalPaymentDeadline: '2026-02-28',
    provincialFilingDeadline: '2026-06-30',
    provincialPaymentDeadline: '2026-02-28',
  }

  it('returns 4 deadlines with provincial data', () => {
    const result = buildTaxYearDeadlines(taxYear, refDate)
    expect(result).toHaveLength(4)
    expect(result.map((d) => d.type)).toEqual([
      'federal_filing',
      'federal_payment',
      'provincial_filing',
      'provincial_payment',
    ])
  })

  it('returns 2 deadlines without provincial data', () => {
    const { provincialFilingDeadline, provincialPaymentDeadline, ...fedOnly } = taxYear
    const result = buildTaxYearDeadlines(fedOnly, refDate)
    expect(result).toHaveLength(2)
  })

  it('correctly computes urgency per deadline', () => {
    const result = buildTaxYearDeadlines(taxYear, refDate)
    const fedFiling = result.find((d) => d.type === 'federal_filing')!
    expect(fedFiling.urgency).toBe('green') // Jun 30 is >30d from Mar 1
    const fedPayment = result.find((d) => d.type === 'federal_payment')!
    expect(fedPayment.urgency).toBe('red') // Feb 28 is overdue
  })

  it('populates orgId and taxYearId on each deadline', () => {
    const result = buildTaxYearDeadlines(taxYear, refDate)
    for (const d of result) {
      expect(d.orgId).toBe('ent-001')
      expect(d.taxYearId).toBe('ty-001')
    }
  })
})

describe('buildInstallmentDeadline', () => {
  it('sets urgency green for paid installment even if overdue', () => {
    const result = buildInstallmentDeadline(
      { orgId: 'e1', taxYearId: 'ty1', dueDate: '2026-01-15', status: 'paid' },
      'Q4 Installment',
      refDate,
    )
    expect(result.urgency).toBe('green') // paid → always green
    expect(result.label).toBe('Q4 Installment')
    expect(result.type).toBe('installment')
  })

  it('sets urgency red for unpaid overdue installment', () => {
    const result = buildInstallmentDeadline(
      { orgId: 'e1', taxYearId: 'ty1', dueDate: '2026-01-15', status: 'due' },
      'Q4 Installment',
      refDate,
    )
    expect(result.urgency).toBe('red')
  })
})

describe('buildIndirectTaxDeadlines', () => {
  it('returns 2 deadlines (filing + payment)', () => {
    const result = buildIndirectTaxDeadlines(
      { orgId: 'e1', taxType: 'GST/HST', filingDue: '2026-04-30', paymentDue: '2026-04-30', status: 'open' },
      refDate,
    )
    expect(result).toHaveLength(2)
    expect(result[0].type).toBe('indirect_filing')
    expect(result[1].type).toBe('indirect_payment')
  })

  it('marks filed period filing as green', () => {
    const result = buildIndirectTaxDeadlines(
      { orgId: 'e1', taxType: 'GST/HST', filingDue: '2026-01-15', paymentDue: '2026-01-15', status: 'filed' },
      refDate,
    )
    expect(result[0].urgency).toBe('green') // filed
    expect(result[1].urgency).toBe('red') // filed but not paid, overdue
  })

  it('marks paid period as green for both filing and payment', () => {
    const result = buildIndirectTaxDeadlines(
      { orgId: 'e1', taxType: 'GST/HST', filingDue: '2026-01-15', paymentDue: '2026-01-15', status: 'paid' },
      refDate,
    )
    expect(result[0].urgency).toBe('green')
    expect(result[1].urgency).toBe('green')
  })
})

describe('sortDeadlines', () => {
  it('sorts red before yellow before green', () => {
    const deadlines = [
      { label: 'A', dueDate: '2026-06-01', daysRemaining: 92, urgency: 'green' as const, orgId: 'e', type: 'federal_filing' as const },
      { label: 'B', dueDate: '2026-01-01', daysRemaining: -59, urgency: 'red' as const, orgId: 'e', type: 'federal_payment' as const },
      { label: 'C', dueDate: '2026-03-15', daysRemaining: 14, urgency: 'yellow' as const, orgId: 'e', type: 'installment' as const },
    ]
    const sorted = sortDeadlines(deadlines)
    expect(sorted.map((d) => d.urgency)).toEqual(['red', 'yellow', 'green'])
  })

  it('sorts by days remaining within same urgency', () => {
    const deadlines = [
      { label: 'B', dueDate: '2026-03-25', daysRemaining: 24, urgency: 'yellow' as const, orgId: 'e', type: 'federal_filing' as const },
      { label: 'A', dueDate: '2026-03-10', daysRemaining: 9, urgency: 'yellow' as const, orgId: 'e', type: 'federal_payment' as const },
    ]
    const sorted = sortDeadlines(deadlines)
    expect(sorted[0].label).toBe('A')
    expect(sorted[1].label).toBe('B')
  })

  it('does not mutate the original array', () => {
    const original = [
      { label: 'A', dueDate: '2026-06-01', daysRemaining: 92, urgency: 'green' as const, orgId: 'e', type: 'federal_filing' as const },
      { label: 'B', dueDate: '2026-01-01', daysRemaining: -59, urgency: 'red' as const, orgId: 'e', type: 'federal_payment' as const },
    ]
    const sorted = sortDeadlines(original)
    expect(original[0].label).toBe('A') // unchanged
    expect(sorted[0].label).toBe('B')
  })
})
