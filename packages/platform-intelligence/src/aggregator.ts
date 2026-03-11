import { randomUUID } from 'node:crypto'
import type { AggregatedEvent } from './types'

const eventStore: AggregatedEvent[] = []

export function aggregateEvent(params: {
  source: string
  eventType: string
  app: string
  orgId: string
  payload: Record<string, unknown>
}): AggregatedEvent {
  const event: AggregatedEvent = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...params,
  }
  eventStore.push(event)
  return event
}

export function getAggregatedEvents(filters?: {
  app?: string
  orgId?: string
  eventType?: string
  since?: string
}): AggregatedEvent[] {
  let results = [...eventStore]

  if (filters?.app) results = results.filter((e) => e.app === filters.app)
  if (filters?.orgId) results = results.filter((e) => e.orgId === filters.orgId)
  if (filters?.eventType)
    results = results.filter((e) => e.eventType === filters.eventType)
  if (filters?.since) {
    const sinceDate = new Date(filters.since)
    results = results.filter((e) => new Date(e.timestamp) >= sinceDate)
  }

  return results
}

export function clearEventStore(): void {
  eventStore.length = 0
}
