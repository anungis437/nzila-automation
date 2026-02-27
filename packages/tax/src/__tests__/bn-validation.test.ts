/**
 * Unit tests — @nzila/tax/bn-validation
 *
 * Covers: Luhn check, validateBusinessNumber(), validateProgramAccount(),
 * formatBusinessNumber(), validateNeq(), Zod schemas
 */
import { describe, it, expect } from 'vitest'
import {
  validateBusinessNumber,
  validateProgramAccount,
  formatBusinessNumber,
  validateNeq,
  BusinessNumberSchema,
  ProgramAccountSchema,
  CRA_PROGRAM_IDS,
} from '../bn-validation'

// Known valid BN: 123456782 passes Luhn
// Luhn check: 1 2 3 4 5 6 7 8 2
// From right: 2,8*2=16→7,7,6*2=12→3,5,4*2=8,3,2*2=4,1 → 2+7+7+3+5+8+3+4+1 = 40 → 40%10=0 ✓

describe('validateBusinessNumber', () => {
  it('validates a correct 9-digit BN', () => {
    const result = validateBusinessNumber('123456782')
    expect(result.valid).toBe(true)
    expect(result.bn9).toBe('123456782')
    expect(result.errors).toHaveLength(0)
  })

  it('validates with spaces', () => {
    const result = validateBusinessNumber('123 456 782')
    expect(result.valid).toBe(true)
    expect(result.bn9).toBe('123456782')
  })

  it('validates with dashes', () => {
    const result = validateBusinessNumber('123-456-782')
    expect(result.valid).toBe(true)
  })

  it('rejects wrong length', () => {
    const result = validateBusinessNumber('12345')
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('9 digits')
  })

  it('rejects invalid Luhn check digit', () => {
    const result = validateBusinessNumber('123456789')
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('Luhn')
  })

  it('rejects non-numeric input', () => {
    const result = validateBusinessNumber('12345ABCD')
    expect(result.valid).toBe(false)
  })
})

describe('validateProgramAccount', () => {
  it('validates a full program account', () => {
    const result = validateProgramAccount('123456782RC0001')
    expect(result.valid).toBe(true)
    expect(result.bn9).toBe('123456782')
    expect(result.programId).toBe('RC')
    expect(result.referenceNumber).toBe('0001')
  })

  it('validates with spaces', () => {
    const result = validateProgramAccount('123 456 782 RC 0001')
    expect(result.valid).toBe(true)
  })

  it('validates lowercase program ID', () => {
    const result = validateProgramAccount('123456782rc0001')
    expect(result.valid).toBe(true)
    expect(result.programId).toBe('RC')
  })

  it('rejects invalid program ID', () => {
    const result = validateProgramAccount('123456782XX0001')
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('Unknown'))).toBe(true)
  })

  it('rejects invalid BN within program account', () => {
    const result = validateProgramAccount('123456789RC0001')
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('Luhn'))).toBe(true)
  })

  it('rejects bad format', () => {
    const result = validateProgramAccount('INVALID')
    expect(result.valid).toBe(false)
  })

  it('validates all CRA program IDs', () => {
    for (const pid of CRA_PROGRAM_IDS) {
      const result = validateProgramAccount(`123456782${pid}0001`)
      expect(result.valid).toBe(true)
      expect(result.programId).toBe(pid)
    }
  })
})

describe('formatBusinessNumber', () => {
  it('formats 9-digit BN', () => {
    expect(formatBusinessNumber('123456789')).toBe('123 456 789')
  })

  it('formats full program account', () => {
    expect(formatBusinessNumber('123456789', 'RC', '0001')).toBe('123 456 789 RC 0001')
  })
})

describe('validateNeq', () => {
  it('validates a 10-digit NEQ', () => {
    const result = validateNeq('1234567890')
    expect(result.valid).toBe(true)
    expect(result.neq).toBe('1234567890')
  })

  it('validates with spaces', () => {
    const result = validateNeq('12 34 56 78 90')
    expect(result.valid).toBe(true)
  })

  it('rejects wrong length', () => {
    const result = validateNeq('12345')
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('10 digits')
  })
})

describe('BusinessNumberSchema (Zod)', () => {
  it('accepts valid BN', () => {
    const result = BusinessNumberSchema.safeParse('123456782')
    expect(result.success).toBe(true)
  })

  it('rejects invalid BN', () => {
    const result = BusinessNumberSchema.safeParse('123456789')
    expect(result.success).toBe(false)
  })
})

describe('ProgramAccountSchema (Zod)', () => {
  it('accepts valid program account', () => {
    const result = ProgramAccountSchema.safeParse('123456782RC0001')
    expect(result.success).toBe(true)
  })

  it('rejects bad program ID', () => {
    const result = ProgramAccountSchema.safeParse('123456782XX0001')
    expect(result.success).toBe(false)
  })
})
