/**
 * @nzila/platform-decision-engine — Status transitions
 *
 * Governs valid status transitions for decision records.
 *
 * @module @nzila/platform-decision-engine/status
 */
import type { DecisionStatus } from './types'

const VALID_TRANSITIONS: Record<DecisionStatus, readonly DecisionStatus[]> = {
  GENERATED: ['PENDING_REVIEW', 'EXPIRED', 'CLOSED'],
  PENDING_REVIEW: ['APPROVED', 'REJECTED', 'DEFERRED', 'EXPIRED', 'CLOSED'],
  APPROVED: ['EXECUTED', 'DEFERRED', 'EXPIRED', 'CLOSED'],
  REJECTED: ['CLOSED'],
  DEFERRED: ['PENDING_REVIEW', 'EXPIRED', 'CLOSED'],
  EXECUTED: ['CLOSED'],
  EXPIRED: ['CLOSED'],
  CLOSED: [],
}

/**
 * Check whether a status transition is valid.
 */
export function isValidTransition(from: DecisionStatus, to: DecisionStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}

/**
 * Get all valid next statuses from a given status.
 */
export function nextValidStatuses(current: DecisionStatus): readonly DecisionStatus[] {
  return VALID_TRANSITIONS[current]
}
