/**
 * Payout State Machine — Zonga
 *
 * Wraps @nzila/commerce-state with zonga-specific payout lifecycle types.
 * Follows the same pattern as nacp-exams/lib/session-machine.ts.
 *
 * Payout lifecycle:
 *   PENDING → PREVIEWED → APPROVED → PROCESSING → COMPLETED
 *                                                → FAILED
 *   Any → CANCELLED
 */
import {
  attemptTransition,
  getAvailableTransitions,
  type TransitionContext,
  type TransitionResult,
  type EmittedEvent,
} from '@nzila/commerce-state'
import { PayoutStatus, type PayoutRail } from '@nzila/zonga-core/enums'

export { attemptTransition, getAvailableTransitions }
export type { TransitionContext, TransitionResult, EmittedEvent }

// ── Payout State Machine Definition ─────────────────────────────────────────

type ZongaRole = 'creator' | 'admin' | 'finance' | 'system'

export const payoutMachine = {
  name: 'zonga-payout',
  states: [
    PayoutStatus.PENDING,
    PayoutStatus.PREVIEWED,
    PayoutStatus.APPROVED,
    PayoutStatus.PROCESSING,
    PayoutStatus.COMPLETED,
    PayoutStatus.FAILED,
    PayoutStatus.CANCELLED,
  ] as PayoutStatus[],
  initialState: PayoutStatus.PENDING as PayoutStatus,
  terminalStates: [PayoutStatus.COMPLETED, PayoutStatus.CANCELLED] as PayoutStatus[],
  transitions: [
    { from: PayoutStatus.PENDING, to: PayoutStatus.PREVIEWED, allowedRoles: ['admin', 'finance', 'system'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Preview payout' },
    { from: PayoutStatus.PREVIEWED, to: PayoutStatus.APPROVED, allowedRoles: ['admin', 'finance'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Approve payout' },
    { from: PayoutStatus.APPROVED, to: PayoutStatus.PROCESSING, allowedRoles: ['system'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Begin processing' },
    { from: PayoutStatus.PROCESSING, to: PayoutStatus.COMPLETED, allowedRoles: ['system'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Complete payout' },
    { from: PayoutStatus.PROCESSING, to: PayoutStatus.FAILED, allowedRoles: ['system'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Mark failed' },
    { from: PayoutStatus.PENDING, to: PayoutStatus.CANCELLED, allowedRoles: ['admin', 'finance', 'creator'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Cancel payout' },
    { from: PayoutStatus.PREVIEWED, to: PayoutStatus.CANCELLED, allowedRoles: ['admin', 'finance'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Cancel previewed' },
    { from: PayoutStatus.APPROVED, to: PayoutStatus.CANCELLED, allowedRoles: ['admin', 'finance'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Cancel approved' },
    { from: PayoutStatus.FAILED, to: PayoutStatus.PENDING, allowedRoles: ['admin', 'finance'] as ZongaRole[], guards: [], events: [], actions: [], label: 'Retry payout' },
  ],
} as const

export function transitionPayout(
  currentStatus: PayoutStatus,
  targetStatus: PayoutStatus,
  ctx: TransitionContext<ZongaRole>,
  resourceEntityId: string,
  payout: { id: string; rail: PayoutRail; amount: number },
): TransitionResult<PayoutStatus> {
  return attemptTransition(payoutMachine, currentStatus, targetStatus, ctx, resourceEntityId, payout)
}

export function availablePayoutTransitions(
  currentStatus: PayoutStatus,
  ctx: TransitionContext<ZongaRole>,
  resourceEntityId: string,
  payout: { id: string; rail: PayoutRail; amount: number },
) {
  return getAvailableTransitions(payoutMachine, currentStatus, ctx, resourceEntityId, payout)
}
