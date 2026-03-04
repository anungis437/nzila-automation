import { describe, it, expect } from 'vitest'
import { nowISO, toISO } from '../time'

describe('nowISO', () => {
  it('returns ISO 8601 UTC without milliseconds', () => {
    const result = nowISO()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
  })

  it('ends with Z (UTC)', () => {
    expect(nowISO()).toMatch(/Z$/)
  })

  it('does not contain milliseconds', () => {
    expect(nowISO()).not.toMatch(/\.\d{3}Z$/)
  })
})

describe('toISO', () => {
  it('strips milliseconds from Date', () => {
    const d = new Date('2026-02-20T14:22:11.123Z')
    expect(toISO(d)).toBe('2026-02-20T14:22:11Z')
  })

  it('strips milliseconds from ISO string', () => {
    expect(toISO('2026-02-20T14:22:11.456Z')).toBe('2026-02-20T14:22:11Z')
  })

  it('handles already-stripped string', () => {
    expect(toISO('2026-02-20T14:22:11Z')).toBe('2026-02-20T14:22:11Z')
  })
})
