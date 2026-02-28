/**
 * Finance audit helpers
 *
 * Thin wrappers around `recordAuditEvent` that use the tax
 * governance action taxonomy (`FINANCE_AUDIT_ACTIONS`) and
 * enforce governance gates before mutating finance data.
 */
import { recordAuditEvent } from '@/lib/audit-db'
import { FINANCE_AUDIT_ACTIONS, type FinanceAuditAction } from '@nzila/tax/governance'

// Re-export for convenience
export { FINANCE_AUDIT_ACTIONS }
export type { FinanceAuditAction }

// ── Record a finance-scoped audit event ─────────────────────────────────────

export interface FinanceAuditInput {
  orgId: string
  actorClerkUserId: string
  actorRole?: string
  action: FinanceAuditAction
  targetType: string
  targetId?: string
  beforeJson?: Record<string, unknown>
  afterJson?: Record<string, unknown>
}

/**
 * Record a hash-chained audit event for a finance / tax action.
 *
 * Uses the same `recordAuditEvent` from `@/lib/audit-db` but enforces
 * that the action key belongs to `FINANCE_AUDIT_ACTIONS`.
 */
export async function recordFinanceAuditEvent(input: FinanceAuditInput) {
  return recordAuditEvent({
    orgId: input.orgId,
    actorClerkUserId: input.actorClerkUserId,
    actorRole: input.actorRole,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    beforeJson: input.beforeJson,
    afterJson: input.afterJson,
  })
}
