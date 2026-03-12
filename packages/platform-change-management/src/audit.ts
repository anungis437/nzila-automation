/**
 * @nzila/platform-change-management — Audit & governance event emitter
 *
 * Every change lifecycle event emits governance events through
 * platform-observability and platform-governance systems.
 *
 * @module @nzila/platform-change-management/audit
 */
import { recordAuditEvent } from '@nzila/platform-governance'
import type { ChangeRecord, ChangeGovernanceEventType } from './types'

// ── Governance Event Type → AuditTimeline mapping ───────────────────────────

/**
 * Map change management event types to governance GovernanceEventType.
 * We use 'approval_granted' / 'approval_denied' for approve/reject,
 * and 'compliance_check' for other lifecycle events.
 */
function toGovernanceEventType(
  eventType: ChangeGovernanceEventType,
): 'approval_granted' | 'approval_denied' | 'compliance_check' {
  switch (eventType) {
    case 'change_approved':
      return 'approval_granted'
    case 'change_rejected':
      return 'approval_denied'
    default:
      return 'compliance_check'
  }
}

/**
 * Map change event to a policy result for audit timeline.
 */
function toPolicyResult(
  eventType: ChangeGovernanceEventType,
): 'pass' | 'fail' | 'warn' {
  switch (eventType) {
    case 'change_approved':
    case 'change_completed':
    case 'pir_recorded':
      return 'pass'
    case 'change_rejected':
    case 'change_failed':
      return 'fail'
    case 'change_rolled_back':
      return 'warn'
    default:
      return 'pass'
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Emit a change lifecycle event to the governance audit timeline.
 */
export function emitChangeEvent(
  eventType: ChangeGovernanceEventType,
  change: ChangeRecord,
  actor: string = change.requested_by,
  details?: Record<string, unknown>,
): void {
  recordAuditEvent({
    eventType: toGovernanceEventType(eventType),
    actor,
    orgId: 'platform',
    app: change.service,
    policyResult: toPolicyResult(eventType),
    commitHash: change.linked_commits[0] ?? 'none',
    details: {
      change_event: eventType,
      change_id: change.change_id,
      change_type: change.change_type,
      environment: change.environment,
      status: change.status,
      ...details,
    },
  })
}

/**
 * Emit event for change creation.
 */
export function emitChangeCreated(change: ChangeRecord): void {
  emitChangeEvent('change_created', change)
}

/**
 * Emit event for change approval.
 */
export function emitChangeApproved(change: ChangeRecord, approvedBy: string): void {
  emitChangeEvent('change_approved', change, approvedBy)
}

/**
 * Emit event for change rejection.
 */
export function emitChangeRejected(change: ChangeRecord, rejectedBy: string): void {
  emitChangeEvent('change_rejected', change, rejectedBy)
}

/**
 * Emit event for change scheduling.
 */
export function emitChangeScheduled(change: ChangeRecord): void {
  emitChangeEvent('change_scheduled', change)
}

/**
 * Emit event for change implementation start.
 */
export function emitChangeStarted(change: ChangeRecord): void {
  emitChangeEvent('change_started', change)
}

/**
 * Emit event for change completion.
 */
export function emitChangeCompleted(change: ChangeRecord): void {
  emitChangeEvent('change_completed', change)
}

/**
 * Emit event for change failure.
 */
export function emitChangeFailed(change: ChangeRecord): void {
  emitChangeEvent('change_failed', change)
}

/**
 * Emit event for change rollback.
 */
export function emitChangeRolledBack(change: ChangeRecord): void {
  emitChangeEvent('change_rolled_back', change)
}

/**
 * Emit event for PIR recording.
 */
export function emitPIRRecorded(change: ChangeRecord): void {
  emitChangeEvent('pir_recorded', change, change.requested_by, {
    pir_outcome: change.post_implementation_review?.outcome,
    incidents_triggered: change.post_implementation_review?.incidents_triggered,
  })
}
