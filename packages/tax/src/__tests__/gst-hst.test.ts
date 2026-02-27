/**
 * Unit tests — @nzila/tax/gst-hst
 *
 * Covers: rate lookup, calculateSalesTax(), regime detection, ITC recoverability
 */
import { describe, it, expect } from 'vitest'
import {
  GST_RATE,
  PROVINCIAL_SALES_TAX,
  getSalesTax,
  getTotalSalesTaxRate,
  calculateSalesTax,
  getRequiredIndirectTaxTypes,
  requiresProvincialSalesTaxReturn,
  GST_REGISTRATION_THRESHOLD,
  GST_QUICK_METHOD_THRESHOLD,
} from '../gst-hst'

describe('GST_RATE', () => {
  it('is 5%', () => {
    expect(GST_RATE).toBe(0.05)
  })
})

describe('GST_REGISTRATION_THRESHOLD', () => {
  it('is $30,000', () => {
    expect(GST_REGISTRATION_THRESHOLD).toBe(30_000)
  })
})

describe('GST_QUICK_METHOD_THRESHOLD', () => {
  it('is $400,000', () => {
    expect(GST_QUICK_METHOD_THRESHOLD).toBe(400_000)
  })
})

describe('PROVINCIAL_SALES_TAX', () => {
  it('has all 13 provinces/territories', () => {
    expect(Object.keys(PROVINCIAL_SALES_TAX)).toHaveLength(13)
  })

  it('Ontario is HST at 13%', () => {
    const on = PROVINCIAL_SALES_TAX.ON
    expect(on.regime).toBe('HST')
    expect(on.hstRate).toBe(0.13)
    expect(on.totalRate).toBe(0.13)
    expect(on.provincialPortionRecoverable).toBe(true)
  })

  it('Quebec is GST+QST at 14.975%', () => {
    const qc = PROVINCIAL_SALES_TAX.QC
    expect(qc.regime).toBe('GST+QST')
    expect(qc.gstRate).toBe(0.05)
    expect(qc.pstRate).toBe(0.09975)
    expect(qc.totalRate).toBeCloseTo(0.14975, 5)
    expect(qc.provincialPortionRecoverable).toBe(false)
  })

  it('Alberta is GST-only at 5%', () => {
    const ab = PROVINCIAL_SALES_TAX.AB
    expect(ab.regime).toBe('GST')
    expect(ab.totalRate).toBe(0.05)
    expect(ab.pstRate).toBeNull()
  })

  it('BC is GST+PST at 12%', () => {
    const bc = PROVINCIAL_SALES_TAX.BC
    expect(bc.regime).toBe('GST+PST')
    expect(bc.pstRate).toBe(0.07)
    expect(bc.totalRate).toBe(0.12)
    expect(bc.provincialPortionRecoverable).toBe(false)
  })
})

describe('getSalesTax', () => {
  it('returns details for a province', () => {
    const on = getSalesTax('ON')
    expect(on.regime).toBe('HST')
    expect(on.province).toBe('ON')
  })
})

describe('getTotalSalesTaxRate', () => {
  it('returns correct total for each regime type', () => {
    expect(getTotalSalesTaxRate('ON')).toBe(0.13)
    expect(getTotalSalesTaxRate('AB')).toBe(0.05)
    expect(getTotalSalesTaxRate('QC')).toBeCloseTo(0.14975, 5)
    expect(getTotalSalesTaxRate('BC')).toBe(0.12)
  })
})

describe('calculateSalesTax', () => {
  it('calculates HST correctly (Ontario)', () => {
    const result = calculateSalesTax(1000, 'ON')
    expect(result.subtotal).toBe(1000)
    expect(result.hst).toBe(130)
    expect(result.gst).toBe(0) // HST replaces GST
    expect(result.pst).toBeNull()
    expect(result.total).toBe(1130)
    expect(result.effectiveRate).toBe(0.13)
  })

  it('calculates GST+QST correctly (Quebec)', () => {
    const result = calculateSalesTax(1000, 'QC')
    expect(result.gst).toBe(50)
    expect(result.pst).toBeCloseTo(99.75, 2)
    expect(result.hst).toBeNull()
    expect(result.total).toBeCloseTo(1149.75, 2)
  })

  it('calculates GST+PST correctly (BC)', () => {
    const result = calculateSalesTax(1000, 'BC')
    expect(result.gst).toBe(50)
    expect(result.pst).toBe(70)
    expect(result.total).toBe(1120)
  })

  it('calculates GST-only correctly (Alberta)', () => {
    const result = calculateSalesTax(1000, 'AB')
    expect(result.gst).toBe(50)
    expect(result.hst).toBeNull()
    expect(result.pst).toBeNull()
    expect(result.total).toBe(1050)
  })
})

describe('getRequiredIndirectTaxTypes', () => {
  it('returns HST for Ontario', () => {
    expect(getRequiredIndirectTaxTypes('ON')).toEqual(['HST'])
  })

  it('returns GST + QST for Quebec', () => {
    expect(getRequiredIndirectTaxTypes('QC')).toEqual(['GST', 'QST'])
  })

  it('returns GST for Alberta', () => {
    expect(getRequiredIndirectTaxTypes('AB')).toEqual(['GST'])
  })

  it('returns GST for BC (PST is provincial, not CRA)', () => {
    expect(getRequiredIndirectTaxTypes('BC')).toEqual(['GST'])
  })
})

describe('requiresProvincialSalesTaxReturn', () => {
  it('true for GST+PST provinces', () => {
    expect(requiresProvincialSalesTaxReturn('BC')).toBe(true)
    expect(requiresProvincialSalesTaxReturn('SK')).toBe(true)
    expect(requiresProvincialSalesTaxReturn('MB')).toBe(true)
  })

  it('false for HST provinces', () => {
    expect(requiresProvincialSalesTaxReturn('ON')).toBe(false)
    expect(requiresProvincialSalesTaxReturn('NB')).toBe(false)
  })

  it('false for GST-only provinces', () => {
    expect(requiresProvincialSalesTaxReturn('AB')).toBe(false)
  })

  it('false for Quebec (QST via Revenu Québec, separate system)', () => {
    expect(requiresProvincialSalesTaxReturn('QC')).toBe(false)
  })
})
