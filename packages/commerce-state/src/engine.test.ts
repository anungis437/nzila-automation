import { describe, it, expect } from 'vitest'
import { OrgRole, QuoteStatus, OrderStatus, InvoiceStatus, FulfillmentStatus } from '@nzila/commerce-core/enums'
import {
  attemptTransition,
  getAvailableTransitions,
  validateMachine,
  type TransitionContext,
} from './engine'
import { quoteMachine } from './machines/quote'
import { orderMachine } from './machines/order'
import { invoiceMachine } from './machines/invoice'
import { fulfillmentMachine } from './machines/fulfillment'

// ── Fixtures ────────────────────────────────────────────────────────────────

const ORG_ID = 'org-001'

const ctx = (role: OrgRole = OrgRole.ADMIN): TransitionContext => ({
  orgId: ORG_ID,
  actorId: 'actor-001',
  role,
  meta: {},
})

// ── Machine Validation ──────────────────────────────────────────────────────

describe('validateMachine', () => {
  it('quoteMachine should be internally consistent', () => {
    const errors = validateMachine(quoteMachine)
    expect(errors).toEqual([])
  })

  it('orderMachine should be internally consistent', () => {
    const errors = validateMachine(orderMachine)
    expect(errors).toEqual([])
  })

  it('invoiceMachine should be internally consistent', () => {
    const errors = validateMachine(invoiceMachine)
    expect(errors).toEqual([])
  })

  it('fulfillmentMachine should be internally consistent', () => {
    const errors = validateMachine(fulfillmentMachine)
    expect(errors).toEqual([])
  })

  it('should detect invalid initialState', () => {
    const bad = { ...quoteMachine, initialState: 'nonexistent' as QuoteStatus }
    const errors = validateMachine(bad)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('initialState')
  })
})

// ── Quote Machine ───────────────────────────────────────────────────────────

describe('quoteMachine transitions', () => {
  it('should transition draft → pricing', () => {
    const result = attemptTransition(quoteMachine, QuoteStatus.DRAFT, QuoteStatus.PRICING, ctx(), ORG_ID, {})
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.from).toBe(QuoteStatus.DRAFT)
      expect(result.to).toBe(QuoteStatus.PRICING)
    }
  })

  it('should reject transition from terminal state', () => {
    const result = attemptTransition(quoteMachine, QuoteStatus.ACCEPTED, QuoteStatus.DRAFT, ctx(), ORG_ID, {})
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('TERMINAL_STATE')
  })

  it('should reject invalid transition', () => {
    const result = attemptTransition(quoteMachine, QuoteStatus.DRAFT, QuoteStatus.ACCEPTED, ctx(), ORG_ID, {})
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('INVALID_TRANSITION')
  })

  it('should reject org mismatch', () => {
    const badCtx = ctx()
    const result = attemptTransition(quoteMachine, QuoteStatus.DRAFT, QuoteStatus.PRICING, badCtx, 'other-org', {})
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('ORG_MISMATCH')
  })

  it('should reject viewer role for pricing submission', () => {
    const result = attemptTransition(quoteMachine, QuoteStatus.DRAFT, QuoteStatus.PRICING, ctx(OrgRole.VIEWER), ORG_ID, {})
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('ROLE_DENIED')
  })

  it('should produce events on quote acceptance', () => {
    const result = attemptTransition(quoteMachine, QuoteStatus.SENT, QuoteStatus.ACCEPTED, ctx(), ORG_ID, {})
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.eventsToEmit.length).toBeGreaterThan(0)
      expect(result.eventsToEmit.some(e => e.type === 'quote.accepted')).toBe(true)
      expect(result.eventsToEmit.some(e => e.type === 'order.create_from_quote')).toBe(true)
    }
  })

  it('should produce actions on quote sent', () => {
    const result = attemptTransition(quoteMachine, QuoteStatus.READY, QuoteStatus.SENT, ctx(OrgRole.SALES), ORG_ID, {})
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.actionsToSchedule.some(a => a.type === 'send_quote_email')).toBe(true)
    }
  })
})

// ── Order Machine ───────────────────────────────────────────────────────────

describe('orderMachine transitions', () => {
  it('should transition created → confirmed', () => {
    const result = attemptTransition(orderMachine, OrderStatus.CREATED, OrderStatus.CONFIRMED, ctx(OrgRole.SALES), ORG_ID, {})
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.actionsToSchedule.some(a => a.type === 'create_invoice_from_order')).toBe(true)
      expect(result.actionsToSchedule.some(a => a.type === 'create_fulfillment_tasks')).toBe(true)
    }
  })

  it('should reject completed → any', () => {
    const result = attemptTransition(orderMachine, OrderStatus.COMPLETED, OrderStatus.CONFIRMED, ctx(), ORG_ID, {})
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('TERMINAL_STATE')
  })

  it('should allow return request from delivered', () => {
    const result = attemptTransition(orderMachine, OrderStatus.DELIVERED, OrderStatus.RETURN_REQUESTED, ctx(), ORG_ID, {})
    expect(result.ok).toBe(true)
  })
})

// ── Invoice Machine ─────────────────────────────────────────────────────────

describe('invoiceMachine transitions', () => {
  it('should transition draft → issued → sent', () => {
    const r1 = attemptTransition(invoiceMachine, InvoiceStatus.DRAFT, InvoiceStatus.ISSUED, ctx(OrgRole.FINANCE), ORG_ID, {})
    expect(r1.ok).toBe(true)

    const r2 = attemptTransition(invoiceMachine, InvoiceStatus.ISSUED, InvoiceStatus.SENT, ctx(OrgRole.FINANCE), ORG_ID, {})
    expect(r2.ok).toBe(true)
    if (r2.ok) {
      expect(r2.actionsToSchedule.some(a => a.type === 'send_invoice_email')).toBe(true)
    }
  })

  it('should transition sent → paid (full payment)', () => {
    const result = attemptTransition(invoiceMachine, InvoiceStatus.SENT, InvoiceStatus.PAID, ctx(OrgRole.FINANCE), ORG_ID, {})
    expect(result.ok).toBe(true)
  })

  it('should reject from terminal state (paid)', () => {
    const result = attemptTransition(invoiceMachine, InvoiceStatus.PAID, InvoiceStatus.SENT, ctx(), ORG_ID, {})
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('TERMINAL_STATE')
  })

  it('should handle dispute flow', () => {
    const r1 = attemptTransition(invoiceMachine, InvoiceStatus.SENT, InvoiceStatus.DISPUTED, ctx(), ORG_ID, {})
    expect(r1.ok).toBe(true)

    const r2 = attemptTransition(invoiceMachine, InvoiceStatus.DISPUTED, InvoiceStatus.RESOLVED, ctx(OrgRole.FINANCE), ORG_ID, {})
    expect(r2.ok).toBe(true)
  })
})

// ── Fulfillment Machine ─────────────────────────────────────────────────────

describe('fulfillmentMachine transitions', () => {
  it('should follow happy path: pending → allocated → production → QC → packaging → shipped → delivered', () => {
    const steps: [FulfillmentStatus, FulfillmentStatus][] = [
      [FulfillmentStatus.PENDING, FulfillmentStatus.ALLOCATED],
      [FulfillmentStatus.ALLOCATED, FulfillmentStatus.PRODUCTION],
      [FulfillmentStatus.PRODUCTION, FulfillmentStatus.QUALITY_CHECK],
      [FulfillmentStatus.QUALITY_CHECK, FulfillmentStatus.PACKAGING],
      [FulfillmentStatus.PACKAGING, FulfillmentStatus.SHIPPED],
      [FulfillmentStatus.SHIPPED, FulfillmentStatus.DELIVERED],
    ]

    for (const [from, to] of steps) {
      const result = attemptTransition(fulfillmentMachine, from, to, ctx(OrgRole.WAREHOUSE), ORG_ID, {})
      expect(result.ok).toBe(true)
    }
  })

  it('should handle QC failure → blocked → rework', () => {
    const r1 = attemptTransition(fulfillmentMachine, FulfillmentStatus.QUALITY_CHECK, FulfillmentStatus.BLOCKED, ctx(OrgRole.WAREHOUSE), ORG_ID, {})
    expect(r1.ok).toBe(true)

    const r2 = attemptTransition(fulfillmentMachine, FulfillmentStatus.BLOCKED, FulfillmentStatus.PRODUCTION, ctx(OrgRole.MANAGER), ORG_ID, {})
    expect(r2.ok).toBe(true)
  })

  it('should allow on-hold and resume', () => {
    const r1 = attemptTransition(fulfillmentMachine, FulfillmentStatus.PENDING, FulfillmentStatus.ON_HOLD, ctx(OrgRole.MANAGER), ORG_ID, {})
    expect(r1.ok).toBe(true)

    const r2 = attemptTransition(fulfillmentMachine, FulfillmentStatus.ON_HOLD, FulfillmentStatus.PENDING, ctx(OrgRole.MANAGER), ORG_ID, {})
    expect(r2.ok).toBe(true)
  })
})

// ── getAvailableTransitions ─────────────────────────────────────────────────

describe('getAvailableTransitions', () => {
  it('should return transitions for quote DRAFT', () => {
    const available = getAvailableTransitions(quoteMachine, QuoteStatus.DRAFT, ctx(OrgRole.SALES), ORG_ID, {})
    expect(available.length).toBeGreaterThan(0)
    const targetStates = available.map(t => t.to)
    expect(targetStates).toContain(QuoteStatus.PRICING)
  })

  it('should return empty for terminal states', () => {
    const available = getAvailableTransitions(quoteMachine, QuoteStatus.ACCEPTED, ctx(), ORG_ID, {})
    expect(available).toEqual([])
  })

  it('should return empty for org mismatch', () => {
    const available = getAvailableTransitions(quoteMachine, QuoteStatus.DRAFT, ctx(), 'wrong-org', {})
    expect(available).toEqual([])
  })

  it('should filter by role', () => {
    const adminTransitions = getAvailableTransitions(quoteMachine, QuoteStatus.DRAFT, ctx(OrgRole.ADMIN), ORG_ID, {})
    const viewerTransitions = getAvailableTransitions(quoteMachine, QuoteStatus.DRAFT, ctx(OrgRole.VIEWER), ORG_ID, {})
    expect(adminTransitions.length).toBeGreaterThan(viewerTransitions.length)
  })
})

// ── Guard Evaluation ────────────────────────────────────────────────────────

describe('guard evaluation', () => {
  it('should fail transition when guard returns false', () => {
    const guardedMachine = {
      ...quoteMachine,
      transitions: quoteMachine.transitions.map(t =>
        t.from === QuoteStatus.DRAFT && t.to === QuoteStatus.PRICING
          ? { ...t, guards: [() => false] }
          : t,
      ),
    }

    const result = attemptTransition(guardedMachine, QuoteStatus.DRAFT, QuoteStatus.PRICING, ctx(), ORG_ID, {})
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('GUARD_FAILED')
  })

  it('should pass transition when all guards return true', () => {
    const guardedMachine = {
      ...quoteMachine,
      transitions: quoteMachine.transitions.map(t =>
        t.from === QuoteStatus.DRAFT && t.to === QuoteStatus.PRICING
          ? { ...t, guards: [() => true, () => true] }
          : t,
      ),
    }

    const result = attemptTransition(guardedMachine, QuoteStatus.DRAFT, QuoteStatus.PRICING, ctx(), ORG_ID, {})
    expect(result.ok).toBe(true)
  })
})
