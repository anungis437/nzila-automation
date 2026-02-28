/**
 * @nzila/trade-core — Deal FSM Engine
 *
 * Pure functions for trade deal state machine transitions.
 * Follows the same pattern as @nzila/commerce-state/engine.
 * No side effects — engine evaluates transitions and returns results.
 */

import type { TradeDealStage, TradeOrgRole } from '../enums'

// ── Types ───────────────────────────────────────────────────────────────────

export interface TradeTransitionContext {
  readonly orgId: string
  readonly actorId: string
  readonly role: TradeOrgRole
  readonly meta?: Record<string, unknown>
}

export type TradeGuard<TEntity = unknown> = (
  ctx: TradeTransitionContext,
  entity: TEntity,
  from: TradeDealStage,
  to: TradeDealStage,
) => boolean

export interface TradeEmittedEvent {
  readonly type: string
  readonly payload?: Record<string, unknown>
}

export interface TradeScheduledAction {
  readonly type: string
  readonly payload?: Record<string, unknown>
  readonly delayMs?: number
}

export interface TradeDealTransitionDef {
  readonly from: TradeDealStage
  readonly to: TradeDealStage
  readonly allowedRoles: readonly TradeOrgRole[]
  readonly guards: readonly TradeGuard[]
  readonly events: readonly TradeEmittedEvent[]
  readonly actions: readonly TradeScheduledAction[]
  readonly label: string
  readonly evidenceRequired: boolean
}

export interface TradeDealMachine {
  readonly name: string
  readonly states: readonly TradeDealStage[]
  readonly initialState: TradeDealStage
  readonly terminalStates: readonly TradeDealStage[]
  readonly transitions: readonly TradeDealTransitionDef[]
}

// ── Transition Result ───────────────────────────────────────────────────────

export type TradeTransitionFailureReason =
  | 'TERMINAL_STATE'
  | 'INVALID_TRANSITION'
  | 'ORG_MISMATCH'
  | 'ROLE_DENIED'
  | 'GUARD_FAILED'

export interface TradeTransitionSuccess {
  readonly ok: true
  readonly from: TradeDealStage
  readonly to: TradeDealStage
  readonly label: string
  readonly eventsToEmit: readonly TradeEmittedEvent[]
  readonly actionsToSchedule: readonly TradeScheduledAction[]
  readonly evidenceRequired: boolean
}

export interface TradeTransitionFailure {
  readonly ok: false
  readonly reason: TradeTransitionFailureReason
  readonly from: TradeDealStage
  readonly to: TradeDealStage
  readonly detail?: string
}

export type TradeTransitionResult = TradeTransitionSuccess | TradeTransitionFailure

// ── Engine ──────────────────────────────────────────────────────────────────

export function attemptDealTransition(
  machine: TradeDealMachine,
  ctx: TradeTransitionContext,
  entity: { orgId: string; stage: TradeDealStage },
  toStage: TradeDealStage,
): TradeTransitionResult {
  const from = entity.stage
  const to = toStage

  // 1. Terminal state check
  if (machine.terminalStates.includes(from)) {
    return { ok: false, reason: 'TERMINAL_STATE', from, to }
  }

  // 2. Find matching transition
  const def = machine.transitions.find((t) => t.from === from && t.to === to)
  if (!def) {
    return { ok: false, reason: 'INVALID_TRANSITION', from, to }
  }

  // 3. Org match
  if (ctx.orgId !== entity.orgId) {
    return { ok: false, reason: 'ORG_MISMATCH', from, to }
  }

  // 4. Role check
  if (!def.allowedRoles.includes(ctx.role)) {
    return {
      ok: false,
      reason: 'ROLE_DENIED',
      from,
      to,
      detail: `Role '${ctx.role}' not in [${def.allowedRoles.join(', ')}]`,
    }
  }

  // 5. Guard evaluation
  for (const guard of def.guards) {
    if (!guard(ctx, entity, from, to)) {
      return { ok: false, reason: 'GUARD_FAILED', from, to }
    }
  }

  // 6. Success
  return {
    ok: true,
    from,
    to,
    label: def.label,
    eventsToEmit: def.events,
    actionsToSchedule: def.actions,
    evidenceRequired: def.evidenceRequired,
  }
}

export function getAvailableDealTransitions(
  machine: TradeDealMachine,
  ctx: TradeTransitionContext,
  entity: { orgId: string; stage: TradeDealStage },
): readonly TradeDealTransitionDef[] {
  if (machine.terminalStates.includes(entity.stage)) return []
  if (ctx.orgId !== entity.orgId) return []

  return machine.transitions.filter(
    (t) => t.from === entity.stage && t.allowedRoles.includes(ctx.role),
  )
}

export function validateDealMachine(machine: TradeDealMachine): string[] {
  const errors: string[] = []

  if (!machine.states.includes(machine.initialState)) {
    errors.push(`Initial state '${machine.initialState}' not in states array`)
  }

  for (const ts of machine.terminalStates) {
    if (!machine.states.includes(ts)) {
      errors.push(`Terminal state '${ts}' not in states array`)
    }
  }

  for (const t of machine.transitions) {
    if (!machine.states.includes(t.from)) {
      errors.push(`Transition from '${t.from}' — state not in states array`)
    }
    if (!machine.states.includes(t.to)) {
      errors.push(`Transition to '${t.to}' — state not in states array`)
    }
    if (machine.terminalStates.includes(t.from)) {
      errors.push(`Transition from terminal state '${t.from}' is invalid`)
    }
  }

  // Dead state check — every non-initial state must be reachable
  const reachable = new Set<TradeDealStage>([machine.initialState])
  let changed = true
  while (changed) {
    changed = false
    for (const t of machine.transitions) {
      if (reachable.has(t.from) && !reachable.has(t.to)) {
        reachable.add(t.to)
        changed = true
      }
    }
  }

  for (const s of machine.states) {
    if (!reachable.has(s)) {
      errors.push(`State '${s}' is unreachable (dead state)`)
    }
  }

  return errors
}
