/* ── Family Mobility Timeline ─────────────────────────────
 *
 * Tracks citizenship/residency acquisition timelines
 * for each family member. Monitors passport expiry,
 * renewal deadlines, and programme milestones.
 *
 * @module @nzila/mobility-family/timeline
 */

/* ── Types ────────────────────────────────────────────────── */

export interface TimelineEvent {
  memberId: string
  eventType: TimelineEventType
  date: Date
  description: string
  actionRequired: boolean
}

export const TIMELINE_EVENT_TYPES = [
  'passport_expiry',
  'passport_renewal_due',
  'residency_start',
  'residency_renewal',
  'citizenship_eligible',
  'citizenship_granted',
  'visa_expiry',
  'age_out_warning',
  'physical_presence_deadline',
] as const
export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number]

export interface TimelineSummary {
  clientId: string
  events: TimelineEvent[]
  upcomingActions: TimelineEvent[]
  overdueActions: TimelineEvent[]
}

/* ── Timeline Functions ───────────────────────────────────── */

/**
 * Generate passport-related timeline events for all family members.
 */
export function generatePassportTimeline(
  members: Array<{
    memberId: string
    passportExpiry: Date | null
  }>,
): TimelineEvent[] {
  const events: TimelineEvent[] = []
  const now = new Date()

  for (const member of members) {
    if (!member.passportExpiry) continue

    // Passport expiry event
    events.push({
      memberId: member.memberId,
      eventType: 'passport_expiry',
      date: member.passportExpiry,
      description: 'Passport expires',
      actionRequired: member.passportExpiry <= now,
    })

    // Renewal reminder — 6 months before expiry
    const renewalDate = new Date(member.passportExpiry)
    renewalDate.setMonth(renewalDate.getMonth() - 6)

    events.push({
      memberId: member.memberId,
      eventType: 'passport_renewal_due',
      date: renewalDate,
      description: 'Passport renewal recommended (6-month buffer)',
      actionRequired: renewalDate <= now,
    })
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Generate age-out warnings for child dependents approaching the
 * programme's maximum inclusion age.
 */
export function generateAgeOutWarnings(
  children: Array<{
    memberId: string
    dob: Date
  }>,
  maxAge: number,
  warningMonths = 12,
): TimelineEvent[] {
  const events: TimelineEvent[] = []
  const now = new Date()

  for (const child of children) {
    const ageOutDate = new Date(child.dob)
    ageOutDate.setFullYear(ageOutDate.getFullYear() + maxAge)

    const warningDate = new Date(ageOutDate)
    warningDate.setMonth(warningDate.getMonth() - warningMonths)

    if (warningDate <= now && ageOutDate > now) {
      events.push({
        memberId: child.memberId,
        eventType: 'age_out_warning',
        date: ageOutDate,
        description: `Child will exceed maximum dependent age of ${maxAge}`,
        actionRequired: true,
      })
    }
  }

  return events
}

/**
 * Build a complete timeline summary for a client's family.
 */
export function buildTimelineSummary(
  clientId: string,
  events: TimelineEvent[],
): TimelineSummary {
  const now = new Date()
  const sorted = [...events].sort((a, b) => a.date.getTime() - b.date.getTime())

  return {
    clientId,
    events: sorted,
    upcomingActions: sorted.filter((e) => e.actionRequired && e.date > now),
    overdueActions: sorted.filter((e) => e.actionRequired && e.date <= now),
  }
}
