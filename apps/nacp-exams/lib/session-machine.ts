/**
 * Exam session state machine — NACP-Exams app.
 *
 * Wires @nzila/commerce-state for deterministic exam session lifecycle transitions.
 * The examSessionMachine enforces: scheduled → opened → in_progress → sealed → exported → closed
 * with NACP role-based guards evaluated at each transition.
 */
import {
  attemptTransition,
  getAvailableTransitions,
  type TransitionContext,
  type TransitionResult,
  type EmittedEvent,
} from '@nzila/commerce-state'
import { examSessionMachine } from '@nzila/nacp-core/machines'
import type { ExamSession } from '@nzila/nacp-core/types'
import type { ExamSessionStatus, NacpRole } from '@nzila/nacp-core/enums'

export { examSessionMachine, attemptTransition, getAvailableTransitions }
export type { TransitionContext, TransitionResult, EmittedEvent }

/**
 * Attempt an exam session status transition with audit context.
 * Returns a discriminated union: { ok: true, from, to, … } | { ok: false, reason }.
 */
export function transitionSession(
  currentStatus: ExamSessionStatus,
  targetStatus: ExamSessionStatus,
  ctx: TransitionContext<NacpRole>,
  resourceEntityId: string,
  session: ExamSession,
): TransitionResult<ExamSessionStatus> {
  return attemptTransition(examSessionMachine, currentStatus, targetStatus, ctx, resourceEntityId, session)
}

/**
 * List valid next transition definitions from a given session status.
 * Useful for UI: "what actions should we show?"
 */
export function availableSessionTransitions(
  currentStatus: ExamSessionStatus,
  ctx: TransitionContext<NacpRole>,
  resourceEntityId: string,
  session: ExamSession,
) {
  return getAvailableTransitions(examSessionMachine, currentStatus, ctx, resourceEntityId, session)
}
