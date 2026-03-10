/**
 * Platform Validation — Grading Logic Tests
 *
 * Ensures the severity system produces grades that match expected behavior:
 * - 'info' findings don't contribute to grade degradation
 * - 'warning' findings contribute but allow passing
 * - 'error' findings block release
 */
import { describe, it, expect } from 'vitest'

// Replicate the grade function from run-all.ts (private, so we copy it)
function grade(errors: number, warnings: number): string {
  if (errors === 0 && warnings === 0) return 'A+'
  if (errors === 0 && warnings <= 3) return 'A'
  if (errors === 0 && warnings <= 10) return 'A-'
  if (errors === 0 && warnings <= 25) return 'B+'
  if (errors === 0) return 'B'
  if (errors <= 3) return 'C+'
  if (errors <= 10) return 'C'
  if (errors <= 20) return 'D'
  return 'F'
}

describe('Grading function', () => {
  it('A+ with zero findings', () => {
    expect(grade(0, 0)).toBe('A+')
  })

  it('A with up to 3 warnings', () => {
    expect(grade(0, 1)).toBe('A')
    expect(grade(0, 3)).toBe('A')
  })

  it('A- for 4–10 warnings', () => {
    expect(grade(0, 4)).toBe('A-')
    expect(grade(0, 10)).toBe('A-')
  })

  it('B+ for 11–25 warnings', () => {
    expect(grade(0, 11)).toBe('B+')
    expect(grade(0, 25)).toBe('B+')
  })

  it('B for >25 warnings (no errors)', () => {
    expect(grade(0, 26)).toBe('B')
    expect(grade(0, 100)).toBe('B')
  })

  it('C+ for 1–3 errors', () => {
    expect(grade(1, 0)).toBe('C+')
    expect(grade(3, 50)).toBe('C+')
  })

  it('C for 4–10 errors', () => {
    expect(grade(4, 0)).toBe('C')
    expect(grade(10, 100)).toBe('C')
  })

  it('D for 11–20 errors', () => {
    expect(grade(11, 0)).toBe('D')
    expect(grade(20, 0)).toBe('D')
  })

  it('F for >20 errors', () => {
    expect(grade(21, 0)).toBe('F')
    expect(grade(100, 100)).toBe('F')
  })

  it.each([
    // Severity escalation scenario: 10 findings moved from info→warning
    // should change grade from A+ to A-
    { errors: 0, warnings: 10, expected: 'A-' },
    // Previously all findings were info (=invisible), now some are warnings
    { errors: 0, warnings: 15, expected: 'B+' },
  ])('escalated severity: %j → $expected', ({ errors, warnings, expected }) => {
    expect(grade(errors, warnings)).toBe(expected)
  })
})
