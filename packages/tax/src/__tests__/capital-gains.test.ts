/**
 * Unit tests — @nzila/tax/rates (capital gains additions)
 */
import { describe, it, expect } from 'vitest'
import {
  CAPITAL_GAINS_INCLUSION_RATE,
  CAPITAL_GAINS_HIGHER_INCLUSION_RATE,
  CAPITAL_GAINS_INDIVIDUAL_THRESHOLD,
  calculateTaxableCapitalGain,
} from '../rates'

describe('capital gains constants', () => {
  it('inclusion rate is 50%', () => {
    expect(CAPITAL_GAINS_INCLUSION_RATE).toBe(0.50)
  })

  it('higher inclusion rate is 2/3', () => {
    expect(CAPITAL_GAINS_HIGHER_INCLUSION_RATE).toBeCloseTo(0.6667, 3)
  })

  it('individual threshold is $250K', () => {
    expect(CAPITAL_GAINS_INDIVIDUAL_THRESHOLD).toBe(250_000)
  })
})

describe('calculateTaxableCapitalGain', () => {
  it('50% inclusion under current rules', () => {
    const r = calculateTaxableCapitalGain(100_000)
    expect(r.taxableAmount).toBe(50_000)
    expect(r.inclusionRate).toBe(0.50)
  })

  it('handles capital losses', () => {
    const r = calculateTaxableCapitalGain(-50_000)
    expect(r.taxableAmount).toBe(-25_000)
  })

  it('50% for corps under current rules', () => {
    const r = calculateTaxableCapitalGain(500_000, false)
    expect(r.taxableAmount).toBe(250_000)
  })

  it('66.67% for corps under proposed rules', () => {
    const r = calculateTaxableCapitalGain(300_000, false, true)
    expect(r.taxableAmount).toBeCloseTo(200_000, 0)
    expect(r.inclusionRate).toBeCloseTo(0.6667, 3)
  })

  it('tiered for individuals under proposed rules', () => {
    // $300K gain: $250K * 50% = $125K, $50K * 66.67% = $33,333
    const r = calculateTaxableCapitalGain(300_000, true, true)
    expect(r.taxableAmount).toBeCloseTo(158_333.33, 0)
    expect(r.inclusionRate).toBeGreaterThan(0.50)
    expect(r.inclusionRate).toBeLessThan(0.6667)
  })

  it('50% for individuals under proposed rules when below threshold', () => {
    const r = calculateTaxableCapitalGain(100_000, true, true)
    expect(r.taxableAmount).toBe(50_000)
  })
})
