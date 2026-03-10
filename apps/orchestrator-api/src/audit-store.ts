/**
 * Audit event store — read side for querying command lifecycle events.
 *
 * Events are written by store.ts during command creation and status updates.
 * This module provides read-only access for the /jobs/:id/events endpoint.
 */
import { eq, desc } from 'drizzle-orm'
import { getDb } from './db.js'

export interface AuditEvent {
  id: string
  commandId: string
  correlationId: string
  event: string
  actor: string
  payload: Record<string, unknown>
  hash: string
  previousHash: string | null
  createdAt: string
}

export async function getAuditEvents(correlationId: string): Promise<AuditEvent[]> {
  if (!process.env.DATABASE_URL) {
    return [] // In-memory mode has no audit events
  }

  const { db, schema } = getDb()
  const rows = await db
    .select()
    .from(schema.automationEvents)
    .where(eq(schema.automationEvents.correlationId, correlationId))
    .orderBy(desc(schema.automationEvents.createdAt))

  return rows.map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ''),
    commandId: String(row.commandId ?? ''),
    correlationId: String(row.correlationId ?? ''),
    event: String(row.event ?? ''),
    actor: String(row.actor ?? ''),
    payload: (row.payload as Record<string, unknown>) ?? {},
    hash: String(row.hash ?? ''),
    previousHash: row.previousHash ? String(row.previousHash) : null,
    createdAt: row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : String(row.createdAt ?? ''),
  }))
}
