/**
 * @nzila/commerce-audit — Audit Trail Builder
 *
 * Creates typed, org-scoped audit events from commerce state transitions.
 * Pure functions — no DB, no I/O. The caller persists the returned records.
 *
 * Every state machine transition produces exactly one AuditEntry.
 * The entry contains the full transition context including:
 *  - who (actorId, role)
 *  - what (entity type, target entity, action, from/to state)
 *  - where (entityId = org scope)
 *  - when (timestamp)
 *  - why (metadata from guards/transition label)
 *
 * @module @nzila/commerce-audit
 */
import { createHash } from 'node:crypto'

import type { OrgRole } from '@nzila/commerce-core/enums'
import type { TransitionSuccess } from '@nzila/commerce-state'

// ── Types ───────────────────────────────────────────────────────────────────

/**
 * Entity types that can be audited in the commerce domain.
 */
export const CommerceEntityType = {
  QUOTE: 'quote',
  ORDER: 'order',
  INVOICE: 'invoice',
  FULFILLMENT: 'fulfillment',
  CUSTOMER: 'customer',
  OPPORTUNITY: 'opportunity',
  PAYMENT: 'payment',
  REFUND: 'refund',
  CREDIT_NOTE: 'credit_note',
  DISPUTE: 'dispute',
} as const
export type CommerceEntityType = (typeof CommerceEntityType)[keyof typeof CommerceEntityType]

/**
 * Audit action types for commerce domain operations.
 */
export const AuditAction = {
  STATE_TRANSITION: 'state_transition',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVAL: 'approval',
  REJECTION: 'rejection',
  PAYMENT_RECORDED: 'payment_recorded',
  REFUND_ISSUED: 'refund_issued',
  EVIDENCE_SEALED: 'evidence_sealed',
  SYNC_COMPLETED: 'sync_completed',
} as const
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction]

/**
 * A single audit trail entry. Compatible with the commerce-core AuditEvent
 * type but enriched with structured metadata.
 */
export interface AuditEntry {
  /** Unique audit entry ID (caller generates, typically UUID) */
  readonly id: string
  /** Org scope — entity_id */
  readonly entityId: string
  /** Actor who performed the action */
  readonly actorId: string
  /** Actor's role at time of action */
  readonly role: OrgRole
  /** Entity type being acted upon */
  readonly entityType: CommerceEntityType
  /** ID of the specific entity instance */
  readonly targetEntityId: string
  /** Action performed */
  readonly action: AuditAction
  /** State before action (for transitions) */
  readonly fromState: string | null
  /** State after action (for transitions) */
  readonly toState: string | null
  /** Human-readable label */
  readonly label: string
  /** Structured metadata */
  readonly metadata: Readonly<Record<string, unknown>>
  /** Events emitted by this transition */
  readonly eventsEmitted: readonly string[]
  /** Actions scheduled by this transition */
  readonly actionsScheduled: readonly string[]
  /** ISO 8601 timestamp */
  readonly timestamp: string
}

/**
 * Context required to build an audit entry from a state transition.
 */
export interface TransitionAuditContext {
  /** Unique ID for this audit entry */
  readonly id: string
  /** Org scope */
  readonly entityId: string
  /** Actor performing the transition */
  readonly actorId: string
  /** Actor's role */
  readonly role: OrgRole
  /** Entity type being transitioned */
  readonly entityType: CommerceEntityType
  /** ID of the entity being transitioned */
  readonly targetEntityId: string
  /** Additional metadata to attach */
  readonly metadata?: Record<string, unknown>
  /** Override timestamp (for testing) */
  readonly timestamp?: string
}

/**
 * Context for non-transition audit entries (create, update, delete, etc.)
 */
export interface ActionAuditContext {
  readonly id: string
  readonly entityId: string
  readonly actorId: string
  readonly role: OrgRole
  readonly entityType: CommerceEntityType
  readonly targetEntityId: string
  readonly action: AuditAction
  readonly label: string
  readonly metadata?: Record<string, unknown>
  readonly timestamp?: string
}

// ── Builder Functions ───────────────────────────────────────────────────────

/**
 * Create an audit entry from a successful state machine transition.
 * Pure function — deterministic output from inputs.
 */
export function buildTransitionAuditEntry<TState extends string>(
  transition: TransitionSuccess<TState>,
  ctx: TransitionAuditContext,
): AuditEntry {
  return {
    id: ctx.id,
    entityId: ctx.entityId,
    actorId: ctx.actorId,
    role: ctx.role,
    entityType: ctx.entityType,
    targetEntityId: ctx.targetEntityId,
    action: AuditAction.STATE_TRANSITION,
    fromState: transition.from,
    toState: transition.to,
    label: transition.label,
    metadata: {
      ...ctx.metadata,
      transitionLabel: transition.label,
      hasTimeout: transition.timeout !== undefined,
    },
    eventsEmitted: transition.eventsToEmit.map((e) => e.type),
    actionsScheduled: transition.actionsToSchedule.map((a) => a.type),
    timestamp: ctx.timestamp ?? new Date().toISOString(),
  }
}

/**
 * Create an audit entry for non-transition actions (CRUD, payments, etc.)
 * Pure function — no I/O.
 */
export function buildActionAuditEntry(ctx: ActionAuditContext): AuditEntry {
  return {
    id: ctx.id,
    entityId: ctx.entityId,
    actorId: ctx.actorId,
    role: ctx.role,
    entityType: ctx.entityType,
    targetEntityId: ctx.targetEntityId,
    action: ctx.action,
    fromState: null,
    toState: null,
    label: ctx.label,
    metadata: ctx.metadata ?? {},
    eventsEmitted: [],
    actionsScheduled: [],
    timestamp: ctx.timestamp ?? new Date().toISOString(),
  }
}

/**
 * Validate that an audit entry has all required fields populated.
 * Returns an array of error messages (empty = valid).
 */
export function validateAuditEntry(entry: AuditEntry): string[] {
  const errors: string[] = []

  if (!entry.id) errors.push('id is required')
  if (!entry.entityId) errors.push('entityId is required (org scope)')
  if (!entry.actorId) errors.push('actorId is required')
  if (!entry.role) errors.push('role is required')
  if (!entry.entityType) errors.push('entityType is required')
  if (!entry.targetEntityId) errors.push('targetEntityId is required')
  if (!entry.action) errors.push('action is required')
  if (!entry.timestamp) errors.push('timestamp is required')

  if (entry.action === AuditAction.STATE_TRANSITION) {
    if (!entry.fromState) errors.push('fromState is required for state transitions')
    if (!entry.toState) errors.push('toState is required for state transitions')
  }

  return errors
}

/**
 * Compute a deterministic hash of an audit entry for integrity verification.
 * Uses JSON serialization with sorted keys.
 */
export function hashAuditEntry(entry: AuditEntry): string {
  const canonical = JSON.stringify(entry, Object.keys(entry).sort())
  return createHash('sha256').update(canonical).digest('hex')
}

/**
 * Create an audit trail (ordered list of entries) summary for evidence packs.
 */
export function summarizeAuditTrail(entries: readonly AuditEntry[]): {
  entityId: string
  entryCount: number
  firstEntry: string
  lastEntry: string
  actors: string[]
  entityTypes: string[]
  actions: string[]
  stateTransitions: Array<{ from: string | null; to: string | null; label: string }>
} {
  if (entries.length === 0) {
    return {
      entityId: '',
      entryCount: 0,
      firstEntry: '',
      lastEntry: '',
      actors: [],
      entityTypes: [],
      actions: [],
      stateTransitions: [],
    }
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )

  const first = sorted[0]!
  const last = sorted[sorted.length - 1]!

  return {
    entityId: first.entityId,
    entryCount: sorted.length,
    firstEntry: first.timestamp,
    lastEntry: last.timestamp,
    actors: [...new Set(sorted.map((e) => e.actorId))],
    entityTypes: [...new Set(sorted.map((e) => e.entityType))],
    actions: [...new Set(sorted.map((e) => e.action))],
    stateTransitions: sorted
      .filter((e) => e.action === AuditAction.STATE_TRANSITION)
      .map((e) => ({ from: e.fromState, to: e.toState, label: e.label })),
  }
}
