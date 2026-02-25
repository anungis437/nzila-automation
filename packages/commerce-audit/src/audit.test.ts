import { describe, it, expect } from 'vitest'
import { OrgRole, QuoteStatus } from '@nzila/commerce-core/enums'
import { attemptTransition } from '@nzila/commerce-state'
import { quoteMachine } from '@nzila/commerce-state/machines'
import {
  CommerceEntityType,
  AuditAction,
  buildTransitionAuditEntry,
  buildActionAuditEntry,
  validateAuditEntry,
  hashAuditEntry,
  summarizeAuditTrail,
  type TransitionAuditContext,
  type ActionAuditContext,
  type AuditEntry,
} from './audit'

// ── Fixtures ────────────────────────────────────────────────────────────────

const ORG_ID = 'org-001'
const ACTOR_ID = 'actor-001'
const TIMESTAMP = '2026-01-15T10:00:00.000Z'

function makeTransitionCtx(overrides?: Partial<TransitionAuditContext>): TransitionAuditContext {
  return {
    id: 'audit-001',
    entityId: ORG_ID,
    actorId: ACTOR_ID,
    role: OrgRole.SALES,
    entityType: CommerceEntityType.QUOTE,
    targetEntityId: 'quote-001',
    timestamp: TIMESTAMP,
    ...overrides,
  }
}

function makeActionCtx(overrides?: Partial<ActionAuditContext>): ActionAuditContext {
  return {
    id: 'audit-action-001',
    entityId: ORG_ID,
    actorId: ACTOR_ID,
    role: OrgRole.FINANCE,
    entityType: CommerceEntityType.PAYMENT,
    targetEntityId: 'payment-001',
    action: AuditAction.PAYMENT_RECORDED,
    label: 'Record payment',
    timestamp: TIMESTAMP,
    ...overrides,
  }
}

// ── buildTransitionAuditEntry ───────────────────────────────────────────────

describe('buildTransitionAuditEntry', () => {
  it('should create audit entry from successful transition', () => {
    const result = attemptTransition(
      quoteMachine,
      QuoteStatus.DRAFT,
      QuoteStatus.PRICING,
      { entityId: ORG_ID, actorId: ACTOR_ID, role: OrgRole.SALES, meta: {} },
      ORG_ID,
      {},
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const entry = buildTransitionAuditEntry(result, makeTransitionCtx())

    expect(entry.id).toBe('audit-001')
    expect(entry.entityId).toBe(ORG_ID)
    expect(entry.actorId).toBe(ACTOR_ID)
    expect(entry.role).toBe(OrgRole.SALES)
    expect(entry.entityType).toBe(CommerceEntityType.QUOTE)
    expect(entry.targetEntityId).toBe('quote-001')
    expect(entry.action).toBe(AuditAction.STATE_TRANSITION)
    expect(entry.fromState).toBe(QuoteStatus.DRAFT)
    expect(entry.toState).toBe(QuoteStatus.PRICING)
    expect(entry.timestamp).toBe(TIMESTAMP)
  })

  it('should capture emitted events', () => {
    const result = attemptTransition(
      quoteMachine,
      QuoteStatus.SENT,
      QuoteStatus.ACCEPTED,
      { entityId: ORG_ID, actorId: ACTOR_ID, role: OrgRole.ADMIN, meta: {} },
      ORG_ID,
      {},
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const entry = buildTransitionAuditEntry(result, makeTransitionCtx())

    expect(entry.eventsEmitted).toContain('quote.accepted')
    expect(entry.eventsEmitted).toContain('order.create_from_quote')
  })

  it('should capture scheduled actions', () => {
    const result = attemptTransition(
      quoteMachine,
      QuoteStatus.READY,
      QuoteStatus.SENT,
      { entityId: ORG_ID, actorId: ACTOR_ID, role: OrgRole.SALES, meta: {} },
      ORG_ID,
      {},
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const entry = buildTransitionAuditEntry(result, makeTransitionCtx())

    expect(entry.actionsScheduled).toContain('send_quote_email')
  })

  it('should include metadata', () => {
    const result = attemptTransition(
      quoteMachine,
      QuoteStatus.DRAFT,
      QuoteStatus.PRICING,
      { entityId: ORG_ID, actorId: ACTOR_ID, role: OrgRole.SALES, meta: {} },
      ORG_ID,
      {},
    )
    if (!result.ok) return

    const entry = buildTransitionAuditEntry(result, makeTransitionCtx({
      metadata: { reason: 'Customer requested urgency' },
    }))

    expect(entry.metadata).toHaveProperty('reason', 'Customer requested urgency')
    expect(entry.metadata).toHaveProperty('transitionLabel')
  })
})

// ── buildActionAuditEntry ───────────────────────────────────────────────────

describe('buildActionAuditEntry', () => {
  it('should create audit entry for non-transition action', () => {
    const entry = buildActionAuditEntry(makeActionCtx())

    expect(entry.id).toBe('audit-action-001')
    expect(entry.entityId).toBe(ORG_ID)
    expect(entry.action).toBe(AuditAction.PAYMENT_RECORDED)
    expect(entry.fromState).toBeNull()
    expect(entry.toState).toBeNull()
    expect(entry.eventsEmitted).toEqual([])
    expect(entry.actionsScheduled).toEqual([])
  })

  it('should support create action', () => {
    const entry = buildActionAuditEntry(makeActionCtx({
      action: AuditAction.CREATE,
      entityType: CommerceEntityType.CUSTOMER,
      label: 'Create customer',
    }))

    expect(entry.action).toBe(AuditAction.CREATE)
    expect(entry.entityType).toBe(CommerceEntityType.CUSTOMER)
  })
})

// ── validateAuditEntry ──────────────────────────────────────────────────────

describe('validateAuditEntry', () => {
  it('should return empty for valid transition entry', () => {
    const result = attemptTransition(
      quoteMachine,
      QuoteStatus.DRAFT,
      QuoteStatus.PRICING,
      { entityId: ORG_ID, actorId: ACTOR_ID, role: OrgRole.SALES, meta: {} },
      ORG_ID,
      {},
    )
    if (!result.ok) return

    const entry = buildTransitionAuditEntry(result, makeTransitionCtx())
    const errors = validateAuditEntry(entry)
    expect(errors).toEqual([])
  })

  it('should return empty for valid action entry', () => {
    const entry = buildActionAuditEntry(makeActionCtx())
    const errors = validateAuditEntry(entry)
    expect(errors).toEqual([])
  })

  it('should detect missing fields', () => {
    const bad = {
      id: '',
      entityId: '',
      actorId: '',
      role: '' as OrgRole,
      entityType: '' as CommerceEntityType,
      targetEntityId: '',
      action: '' as AuditAction,
      fromState: null,
      toState: null,
      label: '',
      metadata: {},
      eventsEmitted: [],
      actionsScheduled: [],
      timestamp: '',
    } satisfies AuditEntry

    const errors = validateAuditEntry(bad)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors).toContain('id is required')
    expect(errors).toContain('entityId is required (org scope)')
  })

  it('should require fromState/toState for state transitions', () => {
    const bad = buildActionAuditEntry(makeActionCtx({
      action: AuditAction.STATE_TRANSITION,
    }))
    const errors = validateAuditEntry(bad)
    expect(errors).toContain('fromState is required for state transitions')
    expect(errors).toContain('toState is required for state transitions')
  })
})

// ── hashAuditEntry ──────────────────────────────────────────────────────────

describe('hashAuditEntry', () => {
  it('should produce deterministic hash', () => {
    const entry = buildActionAuditEntry(makeActionCtx())
    const hash1 = hashAuditEntry(entry)
    const hash2 = hashAuditEntry(entry)
    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(64) // SHA-256 hex
  })

  it('should produce different hash for different entries', () => {
    const entry1 = buildActionAuditEntry(makeActionCtx())
    const entry2 = buildActionAuditEntry(makeActionCtx({ id: 'audit-action-002' }))
    expect(hashAuditEntry(entry1)).not.toBe(hashAuditEntry(entry2))
  })
})

// ── summarizeAuditTrail ─────────────────────────────────────────────────────

describe('summarizeAuditTrail', () => {
  it('should summarize empty trail', () => {
    const summary = summarizeAuditTrail([])
    expect(summary.entryCount).toBe(0)
    expect(summary.actors).toEqual([])
  })

  it('should aggregate trail metadata', () => {
    const result = attemptTransition(
      quoteMachine,
      QuoteStatus.DRAFT,
      QuoteStatus.PRICING,
      { entityId: ORG_ID, actorId: ACTOR_ID, role: OrgRole.SALES, meta: {} },
      ORG_ID,
      {},
    )
    if (!result.ok) return

    const entry1 = buildTransitionAuditEntry(result, makeTransitionCtx({
      timestamp: '2026-01-15T10:00:00.000Z',
    }))
    const entry2 = buildActionAuditEntry(makeActionCtx({
      actorId: 'actor-002',
      timestamp: '2026-01-15T11:00:00.000Z',
    }))

    const summary = summarizeAuditTrail([entry1, entry2])

    expect(summary.entryCount).toBe(2)
    expect(summary.entityId).toBe(ORG_ID)
    expect(summary.actors).toContain(ACTOR_ID)
    expect(summary.actors).toContain('actor-002')
    expect(summary.firstEntry).toBe('2026-01-15T10:00:00.000Z')
    expect(summary.lastEntry).toBe('2026-01-15T11:00:00.000Z')
    expect(summary.stateTransitions.length).toBe(1)
    expect(summary.stateTransitions[0].from).toBe(QuoteStatus.DRAFT)
    expect(summary.stateTransitions[0].to).toBe(QuoteStatus.PRICING)
  })
})

// ── Enum values ─────────────────────────────────────────────────────────────

describe('enum values', () => {
  it('CommerceEntityType should use lowercase values', () => {
    expect(CommerceEntityType.QUOTE).toBe('quote')
    expect(CommerceEntityType.ORDER).toBe('order')
    expect(CommerceEntityType.INVOICE).toBe('invoice')
  })

  it('AuditAction should use lowercase values', () => {
    expect(AuditAction.STATE_TRANSITION).toBe('state_transition')
    expect(AuditAction.CREATE).toBe('create')
    expect(AuditAction.PAYMENT_RECORDED).toBe('payment_recorded')
  })
})
