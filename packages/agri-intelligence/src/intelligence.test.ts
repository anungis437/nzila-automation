import { describe, it, expect } from 'vitest'
import {
  computeHistoricalMeanYieldPerHa,
  computeExpectedYield,
  computeYieldEfficiency,
  getExpectedYield,
} from './yield'
import { computeLossRate, computeLossRateByCrop } from './loss'
import { simulatePayout, computeFairShare } from './payout'
import { createStubYieldProvider } from './providers'

// ---------------------------------------------------------------------------
// Yield
// ---------------------------------------------------------------------------
describe('yield intelligence', () => {
  const data = [
    { cropId: 'maize', regionId: 'r1', season: '2023A', yieldKg: 5000, areaHa: 2 },
    { cropId: 'maize', regionId: 'r1', season: '2023B', yieldKg: 6000, areaHa: 3 },
    { cropId: 'maize', regionId: 'r1', season: '2024A', yieldKg: 4000, areaHa: 2 },
  ]

  it('computes mean yield per ha', () => {
    // (5000/2 + 6000/3 + 4000/2) / 3 = (2500 + 2000 + 2000) / 3 = 2166.67
    const mean = computeHistoricalMeanYieldPerHa(data)
    expect(mean).toBeCloseTo(2166.67, 1)
  })

  it('returns 0 for empty data', () => {
    expect(computeHistoricalMeanYieldPerHa([])).toBe(0)
  })

  it('computes expected yield', () => {
    const result = computeExpectedYield('maize', 'r1', 5, data)
    expect(result.areaHa).toBe(5)
    expect(result.expectedKg).toBeCloseTo(2166.67 * 5, 0)
    expect(result.sampleSize).toBe(3)
  })

  it('computes yield efficiency', () => {
    const result = computeYieldEfficiency('maize', 'r1', 4500, 5000)
    expect(result.efficiencyPercent).toBe(90)
  })

  it('handles zero expected yield', () => {
    const result = computeYieldEfficiency('maize', 'r1', 1000, 0)
    expect(result.efficiencyPercent).toBe(0)
  })

  it('works with provider', async () => {
    const provider = createStubYieldProvider(data)
    const result = await getExpectedYield(provider, 'maize', 'r1', 10, 5)
    expect(result.expectedKg).toBeCloseTo(2166.67 * 10, 0)
  })
})

// ---------------------------------------------------------------------------
// Loss
// ---------------------------------------------------------------------------
describe('loss rate', () => {
  it('computes aggregate loss rate', () => {
    const result = computeLossRate([
      { harvestedKg: 1000, deliveredKg: 900 },
      { harvestedKg: 2000, deliveredKg: 1800 },
    ])
    expect(result.lossKg).toBe(300)
    expect(result.lossPercent).toBe(10)
    expect(result.batchCount).toBe(2)
  })

  it('handles zero harvest', () => {
    const result = computeLossRate([])
    expect(result.lossPercent).toBe(0)
  })

  it('computes loss by crop', () => {
    const results = computeLossRateByCrop([
      { cropId: 'maize', harvestedKg: 1000, deliveredKg: 900 },
      { cropId: 'cassava', harvestedKg: 2000, deliveredKg: 1600 },
      { cropId: 'maize', harvestedKg: 500, deliveredKg: 450 },
    ])
    expect(results.get('maize')!.lossPercent).toBeCloseTo(10, 1)
    expect(results.get('cassava')!.lossPercent).toBe(20)
  })
})

// ---------------------------------------------------------------------------
// Payout
// ---------------------------------------------------------------------------
describe('payout simulation', () => {
  it('simulates payout with quality bonuses', () => {
    const result = simulatePayout(
      [
        { producerId: 'p1', contributionKg: 100, qualityGrade: 'A', pricePerKg: 2 },
        { producerId: 'p2', contributionKg: 200, qualityGrade: 'C', pricePerKg: 2 },
      ],
      'USD',
    )
    // p1: gross=200, bonus=200*0.15=30, net=230
    // p2: gross=400, bonus=0, net=400
    expect(result.entries[0]!.netPayout).toBe(230)
    expect(result.entries[1]!.netPayout).toBe(400)
    expect(result.totalPayout).toBe(630)
    expect(result.totalKg).toBe(300)
    expect(result.currency).toBe('USD')
  })

  it('handles empty entries', () => {
    const result = simulatePayout([], 'CDF')
    expect(result.totalPayout).toBe(0)
    expect(result.averagePricePerKg).toBe(0)
  })

  it('applies negative bonus for D grade', () => {
    const result = simulatePayout(
      [{ producerId: 'p1', contributionKg: 100, qualityGrade: 'D', pricePerKg: 3 }],
      'CDF',
    )
    // gross=300, bonus=300*(-0.05)=-15, net=285
    expect(result.entries[0]!.netPayout).toBe(285)
  })
})

describe('fair share', () => {
  it('distributes proportionally', () => {
    const result = computeFairShare(
      [
        { producerId: 'p1', kg: 100 },
        { producerId: 'p2', kg: 300 },
      ],
      1000,
    )
    expect(result[0]!.payout).toBe(250)
    expect(result[1]!.payout).toBe(750)
    expect(result[0]!.share).toBeCloseTo(0.25)
  })

  it('handles empty contributions', () => {
    const result = computeFairShare([], 1000)
    expect(result).toEqual([])
  })
})
