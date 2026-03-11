/**
 * Partners — Partner Revenue Calculation Tests
 */
import { describe, it, expect } from 'vitest'

interface RevenueRecord {
  partnerId: string
  month: string
  grossRevenue: number
  commissionRate: number
}

function calculateCommission(record: RevenueRecord): number {
  return Math.round(record.grossRevenue * record.commissionRate * 100) / 100
}

function calculatePartnerRevenue(records: RevenueRecord[]): {
  totalGross: number
  totalCommission: number
  netRevenue: number
} {
  const totalGross = records.reduce((s, r) => s + r.grossRevenue, 0)
  const totalCommission = records.reduce((s, r) => s + calculateCommission(r), 0)
  return {
    totalGross: Math.round(totalGross * 100) / 100,
    totalCommission: Math.round(totalCommission * 100) / 100,
    netRevenue: Math.round((totalGross - totalCommission) * 100) / 100,
  }
}

function calculateTierBonus(tier: string, annualRevenue: number): number {
  const bonusRates: Record<string, number> = {
    BRONZE: 0,
    SILVER: 0.02,
    GOLD: 0.05,
    PLATINUM: 0.08,
  }
  const rate = bonusRates[tier] ?? 0
  return Math.round(annualRevenue * rate * 100) / 100
}

describe('Partner Revenue Calculation', () => {
  it('calculates commission from gross revenue', () => {
    const record: RevenueRecord = {
      partnerId: 'p-1',
      month: '2026-01',
      grossRevenue: 10000,
      commissionRate: 0.15,
    }
    expect(calculateCommission(record)).toBe(1500)
  })

  it('aggregates multi-month revenue', () => {
    const records: RevenueRecord[] = [
      { partnerId: 'p-1', month: '2026-01', grossRevenue: 5000, commissionRate: 0.1 },
      { partnerId: 'p-1', month: '2026-02', grossRevenue: 8000, commissionRate: 0.1 },
    ]
    const result = calculatePartnerRevenue(records)
    expect(result.totalGross).toBe(13000)
    expect(result.totalCommission).toBe(1300)
    expect(result.netRevenue).toBe(11700)
  })

  it('handles zero revenue', () => {
    const result = calculatePartnerRevenue([])
    expect(result.totalGross).toBe(0)
    expect(result.totalCommission).toBe(0)
  })

  it('calculates tier bonus for GOLD', () => {
    expect(calculateTierBonus('GOLD', 100000)).toBe(5000)
  })

  it('returns zero bonus for BRONZE', () => {
    expect(calculateTierBonus('BRONZE', 100000)).toBe(0)
  })

  it('handles unknown tier gracefully', () => {
    expect(calculateTierBonus('UNKNOWN', 50000)).toBe(0)
  })
})
