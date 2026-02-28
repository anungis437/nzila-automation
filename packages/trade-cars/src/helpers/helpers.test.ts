import { describe, it, expect } from 'vitest'
import { estimateDuty } from './duty-calculator'
import { estimateShippingLane } from './shipping-lane-estimator'

describe('duty calculator', () => {
  it('calculates South Africa duty + VAT', () => {
    const result = estimateDuty('USA', 'ZAF', '10000.00', 'USD')
    expect(result.dutyRate).toBe(25)
    expect(result.dutyAmount).toBe('2500.00')
    expect(result.vatRate).toBe(15)
    expect(result.vatAmount).toBe('1875.00')
    expect(result.totalLandedCost).toBe('14375.00')
  })

  it('calculates Nigeria duty + VAT', () => {
    const result = estimateDuty('JPN', 'NGA', '8000.00', 'USD')
    expect(result.dutyRate).toBe(35)
    expect(result.dutyAmount).toBe('2800.00')
    expect(result.vatRate).toBe(7.5)
    expect(result.vatAmount).toBe('810.00')
    expect(result.totalLandedCost).toBe('11610.00')
  })

  it('uses default rate for unknown destination', () => {
    const result = estimateDuty('USA', 'XXX', '5000.00', 'USD')
    expect(result.dutyRate).toBe(20)
    expect(result.vatRate).toBe(15)
  })

  it('uppercase normalizes country codes', () => {
    const result = estimateDuty('usa', 'zaf', '1000.00', 'usd')
    expect(result.originCountry).toBe('USA')
    expect(result.destinationCountry).toBe('ZAF')
    expect(result.currency).toBe('USD')
  })

  it('throws on invalid vehicle value', () => {
    expect(() => estimateDuty('USA', 'ZAF', 'abc', 'USD')).toThrow(
      'Invalid vehicle value',
    )
  })

  it('throws on negative vehicle value', () => {
    expect(() => estimateDuty('USA', 'ZAF', '-100', 'USD')).toThrow(
      'Invalid vehicle value',
    )
  })
})

describe('shipping lane estimator', () => {
  it('returns known lane USA → ZAF', () => {
    const result = estimateShippingLane('USA', 'ZAF')
    expect(result.lane).toBe('Trans-Atlantic via Cape Town')
    expect(result.estimatedTransitDays).toBe(28)
    expect(result.carriers.length).toBeGreaterThan(0)
    expect(result.estimatedCostUsd).toBe('3500.00')
  })

  it('returns known lane JPN → KEN', () => {
    const result = estimateShippingLane('JPN', 'KEN')
    expect(result.lane).toBe('Indian Ocean via Mombasa')
    expect(result.estimatedTransitDays).toBe(18)
  })

  it('returns fallback for unknown route', () => {
    const result = estimateShippingLane('BRA', 'COD')
    expect(result.lane).toContain('Custom route')
    expect(result.estimatedTransitDays).toBe(0)
    expect(result.carriers).toHaveLength(0)
  })

  it('uppercase normalizes country codes', () => {
    const result = estimateShippingLane('gbr', 'nga')
    expect(result.originCountry).toBe('GBR')
    expect(result.destinationCountry).toBe('NGA')
  })
})
