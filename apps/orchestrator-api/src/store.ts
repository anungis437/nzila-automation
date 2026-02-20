import type { CommandRecord, CommandStatus } from './contract.js'

/**
 * In-memory command store (v0).
 *
 * Replace with Drizzle + Postgres (automation_commands table)
 * once docker-compose.automation.yml is wired.
 */
const store = new Map<string, CommandRecord>()

export function createCommand(
  record: Omit<CommandRecord, 'created_at' | 'updated_at'>,
): CommandRecord {
  const now = new Date().toISOString()
  const full: CommandRecord = { ...record, created_at: now, updated_at: now }
  store.set(record.correlation_id, full)
  return full
}

export function getCommand(correlationId: string): CommandRecord | undefined {
  return store.get(correlationId)
}

export function updateCommandStatus(
  correlationId: string,
  status: CommandStatus,
  extra?: { run_id?: string; run_url?: string },
): CommandRecord | undefined {
  const existing = store.get(correlationId)
  if (!existing) return undefined
  const updated: CommandRecord = {
    ...existing,
    status,
    run_id: extra?.run_id ?? existing.run_id,
    run_url: extra?.run_url ?? existing.run_url,
    updated_at: new Date().toISOString(),
  }
  store.set(correlationId, updated)
  return updated
}

export function listCommands(): CommandRecord[] {
  return [...store.values()].sort(
    (a, b) => b.created_at.localeCompare(a.created_at),
  )
}
