/**
 * @nzila/agri-intelligence — Analytics Tests
 *
 * Tests yield, loss, and payout pure computation functions (cora vertical).
 */
import { describe, it, expect } from 'vitest'
import {
  computeHistoricalMeanYieldPerHa,
  computeExpectedYield,
  computeYieldEfficiency,
} from './yield'
import { computeLossRate, computeLossRateByCrop } from './loss'
import { simulatePayout, computeFairShare } from './payout'
import type { YieldDataPoint } from './providers'

// ── Yield ───────────────────────────────────────────────────────────────────

describe('Yield Intelligence', () => {
  const dataPoints: YieldDataPoint[] = [
    { cropId: 'coffee', regionId: 'r1', season: '2023', yieldKg: 500, areaHa: 1 },
    { cropId: 'coffee', regionId: 'r1', season: '2024', yieldKg: 600, areaHa: 1 },
    { cropId: 'coffee', regionId: 'r1', season: '2025', yieldKg: 400, areaHa: 1 },
  ]

  describe('computeHistoricalMeanYieldPerHa', () => {
    it('returns 0 for empty data', () => {
      expect(computeHistoricalMeanYieldPerHa([])).toBe(0)
    })

    it('computes mean yield per hectare', () => {
      const mean = computeHistoricalMeanYieldPerHa(dataPoints)
      expect(mean).toBe(500) // (500+600+400)/3
    })

    it('handles multi-hectare fields', () => {
      const data: YieldDataPoint[] = [
        { cropId: 'cocoa', regionId: 'r2', season: '2024', yieldKg: 1000, areaHa: 2 },
        { cropId: 'cocoa', regionId: 'r2', season: '2025', yieldKg: 1500, areaHa: 3 },
      ]
      const mean = computeHistoricalMeanYieldPerHa(data)
      // (1000/2 + 1500/3) / 2 = (500+500)/2 = 500
      expect(mean).toBe(500)
    })

    it('handles zero-area entry gracefully', () => {
      const data: YieldDataPoint[] = [
        { cropId: 'coffee', regionId: 'r1', season: '2024', yieldKg: 100, areaHa: 0 },
        { cropId: 'coffee', regionId: 'r1', season: '2025', yieldKg: 500, areaHa: 1 },
      ]
      const mean = computeHistoricalMeanYieldPerHa(data)
      // (0 + 500) / 2 = 250
      expect(mean).toBe(250)
    })
  })

  describe('computeExpectedYield', () => {
    it('computes expected yield for given area', () => {
      const result = computeExpectedYield('coffee', 'r1', 5, dataPoints)
      expect(result.cropId).toBe('coffee')
      expect(result.regionId).toBe('r1')
      expect(result.areaHa).toBe(5)
      expect(result.historicalMean).toBe(500)
      expect(result.expectedKg).toBe(2500)
      expect(result.sampleSize).toBe(3)
    })

    it('handles empty data (zero expected)', () => {
      const result = computeExpectedYield('sesame', 'r1', 10, [])
      expect(result.expectedKg).toBe(0)
      expect(result.sampleSize).toBe(0)
    })
  })

  describe('computeYieldEfficiency', () => {
    it('100% efficiency when actual equals expected', () => {
      const result = computeYieldEfficiency('coffee', 'r1', 500, 500)
      expect(result.efficiencyPercent).toBe(100)
    })

    it('above 100% when actual exceeds expected', () => {
      const result = computeYieldEfficiency('coffee', 'r1', 600, 500)
      expect(result.efficiencyPercent).toBe(120)
    })

    it('below 100% when actual is less', () => {
      const result = computeYieldEfficiency('coffee', 'r1', 400, 500)
      expect(result.efficiencyPercent).toBe(80)
    })

    it('0% efficiency when expected is zero', () => {
      const result = computeYieldEfficiency('coffee', 'r1', 100, 0)
      expect(result.efficiencyPercent).toBe(0)
    })
  })
})

// ── Loss Rate ───────────────────────────────────────────────────────────────

describe('Loss Rate Intelligence', () => {
  describe('computeLossRate', () => {
    it('returns 0% loss for perfect delivery', () => {
      const result = computeLossRate([{ harvestedKg: 100, deliveredKg: 100 }])
      expect(result.lossPercent).toBe(0)
      expect(result.lossKg).toBe(0)
    })

    it('computes correct loss percentage', () => {
      const result = computeLossRate([
        { harvestedKg: 100, deliveredKg: 90 },
        { harvestedKg: 200, deliveredKg: 180 },
      ])
      expect(result.totalHarvestedKg).toBe(300)
      expect(result.totalDeliveredKg).toBe(270)
      expect(result.lossKg).toBe(30)
      expect(result.lossPercent).toBe(10)
      expect(result.batchCount).toBe(2)
    })

    it('handles empty batch list', () => {
      const result = computeLossRate([])
      expect(result.lossPercent).toBe(0)
      expect(result.batchCount).toBe(0)
    })
  })

  describe('computeLossRateByCrop', () => {
    it('groups by crop and computes per-crop loss', () => {
      const pairs = [
        { cropId: 'coffee', harvestedKg: 100, deliveredKg: 90 },
        { cropId: 'coffee', harvestedKg: 200, deliveredKg: 180 },
        { cropId: 'cocoa', harvestedKg: 50, deliveredKg: 45 },
      ]
      const results = computeLossRateByCrop(pairs)
      expect(results.size).toBe(2)

      const coffee = results.get('coffee')!
      expect(coffee.lossPercent).toBe(10)
      expect(coffee.batchCount).toBe(2)

      const cocoa = results.get('cocoa')!
      expect(cocoa.lossPercent).toBe(10)
      expect(cocoa.batchCount).toBe(1)
    })
  })
})

// ── Payout Simulation ───────────────────────────────────────────────────────

describe('Payout Simulation', () => {
  describe('simulatePayout', () => {
    it('computes gross and net payout with quality bonus', () => {
      const result = simulatePayout(
        [
          { producerId: 'p1', contributionKg: 100, qualityGrade: 'A', pricePerKg: 10 },
          { producerId: 'p2', contributionKg: 200, qualityGrade: 'C', pricePerKg: 10 },
        ],
        'USD',
      )
      expect(result.currency).toBe('USD')
      expect(result.entries).toHaveLength(2)

      // p1: gross = 1000, bonus = 1000*0.15 = 150, net = 1150
      const p1 = result.entries.find((e) => e.producerId === 'p1')!
      expect(p1.grossPayout).toBe(1000)
      expect(p1.qualityBonus).toBe(150)
      expect(p1.netPayout).toBe(1150)

      // p2: gross = 2000, bonus = 0, net = 2000
      const p2 = result.entries.find((e) => e.producerId === 'p2')!
      expect(p2.grossPayout).toBe(2000)
      expect(p2.qualityBonus).toBe(0)
      expect(p2.netPayout).toBe(2000)

      expect(result.totalPayout).toBe(3150)
      expect(result.totalKg).toBe(300)
    })

    it('applies negative bonus for low-quality grades', () => {
      const result = simulatePayout(
        [{ producerId: 'p1', contributionKg: 100, qualityGrade: 'F', pricePerKg: 10 }],
        'XOF',
      )
      const line = result.entries[0]!
      expect(line.qualityBonus).toBe(-100) // 1000 * -0.10
      expect(line.netPayout).toBe(900)
    })

    it('handles custom bonus schedule', () => {
      const result = simulatePayout(
        [{ producerId: 'p1', contributionKg: 100, qualityGrade: 'premium', pricePerKg: 5 }],
        'USD',
        { premium: 0.25 },
      )
      expect(result.entries[0]!.qualityBonus).toBe(125) // 500 * 0.25
    })

    it('handles empty entries', () => {
      const result = simulatePayout([], 'USD')
      expect(result.totalPayout).toBe(0)
      expect(result.totalKg).toBe(0)
    })
  })

  describe('computeFairShare', () => {
    it('distributes pool proportionally', () => {
      const shares = computeFairShare(
        [
          { producerId: 'p1', kg: 100 },
          { producerId: 'p2', kg: 300 },
        ],
        10_000,
      )
      expect(shares).toHaveLength(2)

      const p1 = shares.find((s) => s.producerId === 'p1')!
      expect(p1.share).toBe(0.25)
      expect(p1.payout).toBe(2500)

      const p2 = shares.find((s) => s.producerId === 'p2')!
      expect(p2.share).toBe(0.75)
      expect(p2.payout).toBe(7500)
    })

    it('handles single producer (100% share)', () => {
      const shares = computeFairShare([{ producerId: 'p1', kg: 500 }], 5000)
      expect(shares[0]!.share).toBe(1)
      expect(shares[0]!.payout).toBe(5000)
    })

    it('handles zero total kg', () => {
      const shares = computeFairShare(
        [
          { producerId: 'p1', kg: 0 },
          { producerId: 'p2', kg: 0 },
        ],
        1000,
      )
      expect(shares.every((s) => s.share === 0 && s.payout === 0)).toBe(true)
    })
  })
})
