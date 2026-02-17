/**
 * Simple audit logger — writes to stdout/stderr.
 * In production, replace with a database / Azure Monitor sink.
 */

interface AuditEvent {
  userId: string | null
  action: string
  resource: string
  metadata?: Record<string, unknown>
  timestamp?: string
}

export function auditLog(event: AuditEvent) {
  const entry = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  }
  console.log('[AUDIT]', JSON.stringify(entry))
}
