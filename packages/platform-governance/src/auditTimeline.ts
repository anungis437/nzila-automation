import { randomUUID } from 'node:crypto'
import type { AuditTimelineEntry, GovernanceEventType } from './types'

const timeline: AuditTimelineEntry[] = []

export function recordAuditEvent(params: {
  eventType: GovernanceEventType
  actor: string
  orgId: string
  app: string
  policyResult: 'pass' | 'fail' | 'warn'
  commitHash: string
  details?: Record<string, unknown>
}): AuditTimelineEntry {
  const entry: AuditTimelineEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...params,
  }
  timeline.push(entry)
  return entry
}

export function getAuditTimeline(filters?: {
  orgId?: string
  app?: string
  eventType?: GovernanceEventType
  since?: string
}): AuditTimelineEntry[] {
  let results = [...timeline]

  if (filters?.orgId) {
    results = results.filter((e) => e.orgId === filters.orgId)
  }
  if (filters?.app) {
    results = results.filter((e) => e.app === filters.app)
  }
  if (filters?.eventType) {
    results = results.filter((e) => e.eventType === filters.eventType)
  }
  if (filters?.since) {
    const sinceDate = new Date(filters.since)
    results = results.filter((e) => new Date(e.timestamp) >= sinceDate)
  }

  return results.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

export function clearAuditTimeline(): void {
  timeline.length = 0
}
