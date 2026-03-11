/**
 * CFO — Financial Report Generation Tests
 */
import { describe, it, expect } from 'vitest'

interface FinancialEntry {
  account: string
  amount: number
  type: 'debit' | 'credit'
  date: string
}

interface FinancialReport {
  orgId: string
  period: { start: string; end: string }
  entries: FinancialEntry[]
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  generatedAt: string
}

function generateReport(orgId: string, period: { start: string; end: string }, entries: FinancialEntry[]): FinancialReport {
  const totalRevenue = entries.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0)
  const totalExpenses = entries.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0)
  return {
    orgId,
    period,
    entries,
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
    generatedAt: new Date().toISOString(),
  }
}

describe('Financial Report Generation', () => {
  const period = { start: '2026-01-01', end: '2026-03-31' }
  const entries: FinancialEntry[] = [
    { account: 'Sales', amount: 50000, type: 'credit', date: '2026-01-15' },
    { account: 'Services', amount: 20000, type: 'credit', date: '2026-02-10' },
    { account: 'Rent', amount: 5000, type: 'debit', date: '2026-01-01' },
    { account: 'Salaries', amount: 30000, type: 'debit', date: '2026-01-31' },
  ]

  it('calculates total revenue from credit entries', () => {
    const report = generateReport('org-1', period, entries)
    expect(report.totalRevenue).toBe(70000)
  })

  it('calculates total expenses from debit entries', () => {
    const report = generateReport('org-1', period, entries)
    expect(report.totalExpenses).toBe(35000)
  })

  it('calculates net income correctly', () => {
    const report = generateReport('org-1', period, entries)
    expect(report.netIncome).toBe(35000)
  })

  it('includes generation timestamp', () => {
    const report = generateReport('org-1', period, entries)
    expect(report.generatedAt).toBeDefined()
    expect(new Date(report.generatedAt).getTime()).not.toBeNaN()
  })

  it('handles zero entries', () => {
    const report = generateReport('org-1', period, [])
    expect(report.totalRevenue).toBe(0)
    expect(report.totalExpenses).toBe(0)
    expect(report.netIncome).toBe(0)
  })
})
