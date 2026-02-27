/**
 * Unit tests — @nzila/tax/data-versions
 */
import { describe, it, expect } from 'vitest'
import {
  DATA_VERSIONS,
  STALENESS_THRESHOLD_DAYS,
  isModuleStale,
  getStaleModules,
  getModuleVersion,
  getLatestVerificationDate,
} from '../data-versions'

describe('DATA_VERSIONS', () => {
  it('has entries for all CRA data modules', () => {
    const moduleNames = DATA_VERSIONS.map((m) => m.module)
    expect(moduleNames).toContain('rates')
    expect(moduleNames).toContain('cra-deadlines')
    expect(moduleNames).toContain('bn-validation')
    expect(moduleNames).toContain('installments')
    expect(moduleNames).toContain('prescribed-interest')
    expect(moduleNames).toContain('gst-hst')
    expect(moduleNames).toContain('payroll-thresholds')
    expect(moduleNames).toContain('penalties')
    expect(moduleNames).toContain('personal-rates')
    expect(moduleNames).toContain('dividend-tax')
  })

  it('has 10 module entries', () => {
    expect(DATA_VERSIONS).toHaveLength(10)
  })

  it('every entry has lastVerified as ISO date', () => {
    for (const m of DATA_VERSIONS) {
      expect(m.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe('STALENESS_THRESHOLD_DAYS', () => {
  it('is 90 days', () => {
    expect(STALENESS_THRESHOLD_DAYS).toBe(90)
  })
})

describe('isModuleStale', () => {
  it('returns false when recently verified', () => {
    const mod = { module: 'test', taxYear: 2025, lastVerified: new Date().toISOString().split('T')[0], source: 'test' }
    expect(isModuleStale(mod)).toBe(false)
  })

  it('returns true when verification is old', () => {
    const mod = { module: 'test', taxYear: 2025, lastVerified: '2024-01-01', source: 'test' }
    expect(isModuleStale(mod)).toBe(true)
  })
})

describe('getStaleModules', () => {
  it('returns array', () => {
    const stale = getStaleModules()
    expect(Array.isArray(stale)).toBe(true)
  })
})

describe('getModuleVersion', () => {
  it('returns version for known module', () => {
    const v = getModuleVersion('rates')
    expect(v).toBeDefined()
    expect(v!.module).toBe('rates')
  })

  it('returns undefined for unknown module', () => {
    expect(getModuleVersion('nonexistent')).toBeUndefined()
  })
})

describe('getLatestVerificationDate', () => {
  it('returns a valid ISO date string', () => {
    const d = getLatestVerificationDate()
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(new Date(d).getTime()).toBeGreaterThan(0)
  })
})
