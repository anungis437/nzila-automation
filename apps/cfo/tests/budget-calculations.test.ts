/**
 * CFO — Budget Calculations Tests
 */
import { describe, it, expect } from 'vitest'

interface BudgetLine {
  category: string
  allocated: number
  spent: number
}

function calculateBudgetUtilization(line: BudgetLine): number {
  if (line.allocated === 0) return 0
  return Math.round((line.spent / line.allocated) * 10000) / 100
}

function calculateTotalBudget(lines: BudgetLine[]): { allocated: number; spent: number; remaining: number } {
  const allocated = lines.reduce((s, l) => s + l.allocated, 0)
  const spent = lines.reduce((s, l) => s + l.spent, 0)
  return { allocated, spent, remaining: allocated - spent }
}

function isBudgetOverrun(line: BudgetLine): boolean {
  return line.spent > line.allocated
}

function projectAnnualSpend(monthlySpend: number, monthsElapsed: number): number {
  if (monthsElapsed === 0) return 0
  return Math.round((monthlySpend / monthsElapsed) * 12 * 100) / 100
}

describe('Budget Calculations', () => {
  const budgetLines: BudgetLine[] = [
    { category: 'Marketing', allocated: 50000, spent: 35000 },
    { category: 'Operations', allocated: 100000, spent: 80000 },
    { category: 'R&D', allocated: 75000, spent: 90000 },
  ]

  it('calculates budget utilization percentage', () => {
    expect(calculateBudgetUtilization(budgetLines[0])).toBe(70)
    expect(calculateBudgetUtilization(budgetLines[1])).toBe(80)
  })

  it('detects budget overrun', () => {
    expect(isBudgetOverrun(budgetLines[0])).toBe(false)
    expect(isBudgetOverrun(budgetLines[2])).toBe(true)
  })

  it('calculates total budget summary', () => {
    const total = calculateTotalBudget(budgetLines)
    expect(total.allocated).toBe(225000)
    expect(total.spent).toBe(205000)
    expect(total.remaining).toBe(20000)
  })

  it('handles zero allocation gracefully', () => {
    expect(calculateBudgetUtilization({ category: 'Empty', allocated: 0, spent: 0 })).toBe(0)
  })

  it('projects annual spend from partial year', () => {
    // 30000 spent over 3 months → projected 120000/year
    expect(projectAnnualSpend(30000, 3)).toBe(120000)
  })

  it('handles zero months elapsed', () => {
    expect(projectAnnualSpend(0, 0)).toBe(0)
  })
})
