/**
 * @nzila/platform-decision-engine — Feedback loop
 *
 * Records human feedback on decisions and applies status transitions.
 *
 * @module @nzila/platform-decision-engine/feedback
 */
import type { DecisionFeedback, DecisionRecord, FeedbackAction, DecisionStatus } from './types'
import { saveDecisionFeedback, loadDecisionRecord, updateDecisionStatus } from './store'
import { emitAuditEvent } from './audit'
import { nowISO } from './utils'

const ACTION_TO_STATUS: Record<FeedbackAction, DecisionStatus | null> = {
  APPROVE: 'APPROVED',
  REJECT: 'REJECTED',
  DEFER: 'DEFERRED',
  EXECUTE: 'EXECUTED',
  COMMENT: null, // no status change
}

const ACTION_TO_AUDIT: Record<FeedbackAction, string> = {
  APPROVE: 'decision_approved',
  REJECT: 'decision_rejected',
  DEFER: 'decision_deferred',
  EXECUTE: 'decision_executed',
  COMMENT: 'decision_feedback_recorded',
}

/**
 * Record human feedback on a decision.
 * Persists feedback, updates decision status, and emits audit event.
 */
export function recordDecisionFeedback(
  decisionId: string,
  actor: string,
  action: FeedbackAction,
  notes?: string,
): { feedback: DecisionFeedback; decision: DecisionRecord | null } {
  const feedback: DecisionFeedback = {
    decision_id: decisionId,
    actor,
    action,
    notes,
    created_at: nowISO(),
  }

  saveDecisionFeedback(feedback)

  const newStatus = ACTION_TO_STATUS[action]
  let decision: DecisionRecord | null = null

  if (newStatus) {
    decision = updateDecisionStatus(decisionId, newStatus, actor, notes)
  } else {
    decision = loadDecisionRecord(decisionId)
  }

  emitAuditEvent(
    decisionId,
    ACTION_TO_AUDIT[action] as import('./types').AuditEventType,
    actor,
    notes,
  )

  return { feedback, decision }
}
