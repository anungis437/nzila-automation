import { describe, it, expect } from 'vitest'
import {
  generatePassportTimeline,
  generateAgeOutWarnings,
  buildTimelineSummary,
} from './timeline'

describe('generatePassportTimeline', () => {
  it('generates expiry and renewal events', () => {
    const expiry = new Date('2026-06-15')
    const events = generatePassportTimeline([
      { memberId: 'm1', passportExpiry: expiry },
    ])

    expect(events).toHaveLength(2)
    expect(events.find(e => e.eventType === 'passport_expiry')?.date).toEqual(expiry)
    expect(events.find(e => e.eventType === 'passport_renewal_due')).toBeDefined()
  })

  it('skips members without passport expiry', () => {
    const events = generatePassportTimeline([
      { memberId: 'm1', passportExpiry: null },
    ])
    expect(events).toHaveLength(0)
  })

  it('marks expired passports as action required', () => {
    const events = generatePassportTimeline([
      { memberId: 'm1', passportExpiry: new Date('2020-01-01') },
    ])
    const expiryEvent = events.find(e => e.eventType === 'passport_expiry')
    expect(expiryEvent?.actionRequired).toBe(true)
  })

  it('sorts events chronologically', () => {
    const events = generatePassportTimeline([
      { memberId: 'm1', passportExpiry: new Date('2028-01-01') },
      { memberId: 'm2', passportExpiry: new Date('2026-06-01') },
    ])
    for (let i = 1; i < events.length; i++) {
      expect(events[i].date.getTime()).toBeGreaterThanOrEqual(events[i - 1].date.getTime())
    }
  })
})

describe('generateAgeOutWarnings', () => {
  it('warns when child approaches max age', () => {
    const dob = new Date()
    dob.setFullYear(dob.getFullYear() - 17)
    dob.setMonth(dob.getMonth() - 6)

    const warnings = generateAgeOutWarnings([{ memberId: 'c1', dob }], 18, 12)
    expect(warnings.length).toBeGreaterThanOrEqual(1)
    expect(warnings[0].eventType).toBe('age_out_warning')
    expect(warnings[0].actionRequired).toBe(true)
  })

  it('does not warn for young children', () => {
    const dob = new Date()
    dob.setFullYear(dob.getFullYear() - 5)

    const warnings = generateAgeOutWarnings([{ memberId: 'c1', dob }], 18, 12)
    expect(warnings).toHaveLength(0)
  })
})

describe('buildTimelineSummary', () => {
  it('separates upcoming and overdue actions', () => {
    const now = new Date()
    const past = new Date(now.getTime() - 86_400_000)
    const future = new Date(now.getTime() + 86_400_000 * 30)

    const summary = buildTimelineSummary('client-1', [
      { memberId: 'm1', eventType: 'passport_expiry', date: past, description: 'Expired', actionRequired: true },
      { memberId: 'm2', eventType: 'passport_renewal_due', date: future, description: 'Renew', actionRequired: true },
      { memberId: 'm3', eventType: 'residency_start', date: future, description: 'Start', actionRequired: false },
    ])

    expect(summary.clientId).toBe('client-1')
    expect(summary.overdueActions).toHaveLength(1)
    expect(summary.upcomingActions).toHaveLength(1)
    expect(summary.events).toHaveLength(3)
  })
})
