/**
 * Release State Machine — Zonga
 *
 * Wraps @nzila/commerce-state with zonga-specific release lifecycle types.
 * Follows the same pattern as lib/payout-machine.ts.
 *
 * Release lifecycle:
 *   DRAFT → SUBMITTED → UNDER_REVIEW → PUBLISHED
 *                                     → HELD
 *                                     → REJECTED
 *   PUBLISHED → ARCHIVED
 *   HELD → UNDER_REVIEW (re-review)
 *   REJECTED → DRAFT (rework)
 *   Any (non-terminal) → ARCHIVED
 */
import {
  attemptTransition,
  getAvailableTransitions,
  type TransitionContext,
  type TransitionResult,
  type EmittedEvent,
} from '@nzila/commerce-state'
import { ReleaseStatus } from '@nzila/zonga-core/enums'

export { attemptTransition, getAvailableTransitions }
export type { TransitionContext, TransitionResult, EmittedEvent }

type ZongaRole = 'creator' | 'admin' | 'moderator' | 'system'

export const releaseMachine = {
  name: 'zonga-release',
  states: [
    ReleaseStatus.DRAFT,
    ReleaseStatus.SUBMITTED,
    ReleaseStatus.UNDER_REVIEW,
    ReleaseStatus.PUBLISHED,
    ReleaseStatus.HELD,
    ReleaseStatus.REJECTED,
    ReleaseStatus.ARCHIVED,
  ] as ReleaseStatus[],
  initialState: ReleaseStatus.DRAFT as ReleaseStatus,
  terminalStates: [ReleaseStatus.ARCHIVED] as ReleaseStatus[],
  transitions: [
    { from: ReleaseStatus.DRAFT, to: ReleaseStatus.SUBMITTED, allowedRoles: ['creator', 'admin'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Submit for review' },
    { from: ReleaseStatus.SUBMITTED, to: ReleaseStatus.UNDER_REVIEW, allowedRoles: ['admin', 'moderator', 'system'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Begin review' },
    { from: ReleaseStatus.UNDER_REVIEW, to: ReleaseStatus.PUBLISHED, allowedRoles: ['admin', 'moderator'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Approve & publish' },
    { from: ReleaseStatus.UNDER_REVIEW, to: ReleaseStatus.HELD, allowedRoles: ['admin', 'moderator'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Hold for issues' },
    { from: ReleaseStatus.UNDER_REVIEW, to: ReleaseStatus.REJECTED, allowedRoles: ['admin', 'moderator'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Reject release' },
    { from: ReleaseStatus.HELD, to: ReleaseStatus.UNDER_REVIEW, allowedRoles: ['admin', 'moderator'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Re-review' },
    { from: ReleaseStatus.REJECTED, to: ReleaseStatus.DRAFT, allowedRoles: ['creator', 'admin'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Rework draft' },
    { from: ReleaseStatus.PUBLISHED, to: ReleaseStatus.ARCHIVED, allowedRoles: ['admin', 'creator'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Archive release' },
    { from: ReleaseStatus.DRAFT, to: ReleaseStatus.ARCHIVED, allowedRoles: ['admin', 'creator'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Discard draft' },
  ],
} as const

export function transitionRelease(
  currentStatus: ReleaseStatus,
  targetStatus: ReleaseStatus,
  ctx: TransitionContext<ZongaRole>,
  resourceEntityId: string,
  release: { id: string; title: string },
): TransitionResult<ReleaseStatus> {
  return attemptTransition(releaseMachine, currentStatus, targetStatus, ctx, resourceEntityId, release)
}

export function availableReleaseTransitions(
  currentStatus: ReleaseStatus,
  ctx: TransitionContext<ZongaRole>,
  resourceEntityId: string,
  release: { id: string; title: string },
) {
  return getAvailableTransitions(releaseMachine, currentStatus, ctx, resourceEntityId, release)
}
