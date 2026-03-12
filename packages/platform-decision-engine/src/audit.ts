/**
 * @nzila/platform-decision-engine — Audit trail
 *
 * Emits and stores audit entries for decision lifecycle events.
 *
 * @module @nzila/platform-decision-engine/audit
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { DecisionAuditEntry, AuditEventType } from './types'
import { nowISO } from './utils'

function findRepoRoot(): string {
  let dir = import.meta.dirname ?? process.cwd()
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir
    dir = path.dirname(dir)
  }
  return process.cwd()
}

function auditDir(): string {
  return path.join(findRepoRoot(), 'ops', 'decision-audit')
}

/**
 * Create an audit entry for a decision event.
 */
export function createAuditEntry(
  decisionId: string,
  eventType: AuditEventType,
  actor: string,
  detail?: string,
): DecisionAuditEntry {
  return {
    decision_id: decisionId,
    event_type: eventType,
    actor,
    timestamp: nowISO(),
    detail,
  }
}

/**
 * Persist an audit entry to disk.
 */
export function saveAuditEntry(entry: DecisionAuditEntry): void {
  const dir = auditDir()
  fs.mkdirSync(dir, { recursive: true })
  const filename = `${entry.decision_id}-${entry.event_type}-${Date.now()}.json`
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(entry, null, 2), 'utf-8')
}

/**
 * Emit (create + save) an audit entry in one call.
 */
export function emitAuditEvent(
  decisionId: string,
  eventType: AuditEventType,
  actor: string,
  detail?: string,
): DecisionAuditEntry {
  const entry = createAuditEntry(decisionId, eventType, actor, detail)
  saveAuditEntry(entry)
  return entry
}

/**
 * Load all audit entries for a specific decision.
 */
export function loadAuditTrail(decisionId: string): DecisionAuditEntry[] {
  const dir = auditDir()
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(decisionId) && f.endsWith('.json'))
    .map((f) => {
      const content = fs.readFileSync(path.join(dir, f), 'utf-8')
      return JSON.parse(content) as DecisionAuditEntry
    })
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}
