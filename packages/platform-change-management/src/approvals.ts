/**
 * @nzila/platform-change-management — Approval engine
 *
 * Evaluates approval requirements based on change type, risk level,
 * and current approval state.
 *
 * Approval roles: service_owner, change_manager, security_approver, platform_owner
 *
 * Rules:
 *   STANDARD → may auto-approve (no mandatory approvals)
 *   NORMAL   → service_owner + change_manager
 *   NORMAL (HIGH/CRITICAL) → service_owner + change_manager + security_approver
 *   EMERGENCY → reduced path (service_owner only), but PIR required afterward
 *
 * @module @nzila/platform-change-management/approvals
 */
import type { ChangeRecord, ApprovalRequirements, ApprovalRole, PostImplementationReview } from './types'
import { loadChangeRecord, saveChangeRecord } from './service'
import { nowISO } from './utils'

// ── Approval Rules ──────────────────────────────────────────────────────────

/**
 * Determine required approval roles for a given change record.
 */
function getRequiredRoles(change: ChangeRecord): ApprovalRole[] {
  switch (change.change_type) {
    case 'STANDARD':
      // Auto-approve path — no mandatory roles
      return []

    case 'EMERGENCY':
      // Reduced approval path — only service_owner
      return ['service_owner']

    case 'NORMAL': {
      const base: ApprovalRole[] = ['service_owner', 'change_manager']
      if (change.risk_level === 'HIGH' || change.risk_level === 'CRITICAL') {
        base.push('security_approver')
      }
      return base
    }

    default:
      return ['service_owner', 'change_manager']
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Evaluate approval requirements for a change record.
 *
 * Returns the full set of required approvals, which are missing,
 * whether a CAB (Change Advisory Board) review is needed,
 * and whether the current approvals satisfy the requirements.
 */
export function evaluateChangeRequirements(change: ChangeRecord): ApprovalRequirements {
  const requiredApprovals = getRequiredRoles(change)

  const missingApprovals = requiredApprovals.filter(
    (role) => !change.approved_by.includes(role),
  )

  // CAB required for HIGH/CRITICAL normal changes
  const cabRequired =
    change.change_type === 'NORMAL' &&
    (change.risk_level === 'HIGH' || change.risk_level === 'CRITICAL')

  const approvalSatisfied = missingApprovals.length === 0

  return {
    requiredApprovals,
    missingApprovals,
    cabRequired,
    approvalSatisfied,
  }
}

/**
 * Check whether a NORMAL or EMERGENCY change can be closed.
 * NORMAL and EMERGENCY changes cannot be CLOSED until PIR exists.
 */
export function canClosePIR(change: ChangeRecord): { canClose: boolean; reason?: string } {
  if (change.change_type === 'STANDARD') {
    return { canClose: true }
  }

  if (!change.post_implementation_review) {
    return {
      canClose: false,
      reason: `${change.change_type} changes require a Post Implementation Review before closing.`,
    }
  }

  return { canClose: true }
}

/**
 * Record a Post Implementation Review on an existing change.
 */
export function recordPostImplementationReview(
  changeId: string,
  review: PostImplementationReview,
  opts?: { baseDir?: string },
): ChangeRecord {
  const change = loadChangeRecord(changeId, opts)
  if (!change) {
    throw new Error(`Change record ${changeId} not found`)
  }

  if (
    change.status !== 'COMPLETED' &&
    change.status !== 'FAILED' &&
    change.status !== 'ROLLED_BACK'
  ) {
    throw new Error(
      `Cannot record PIR for change ${changeId} in status ${change.status}. ` +
      `Must be COMPLETED, FAILED, or ROLLED_BACK.`,
    )
  }

  const updated: ChangeRecord = {
    ...change,
    post_implementation_review: review,
    updated_at: nowISO(),
  }

  saveChangeRecord(updated, opts)
  return updated
}
