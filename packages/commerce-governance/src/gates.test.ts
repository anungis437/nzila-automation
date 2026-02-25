/**
 * @nzila/commerce-governance — Gate Tests
 *
 * Tests for all commerce governance guards, the diagnostic evaluator,
 * the machine enhancer, and the governed machine factories.
 */
import { describe, it, expect } from 'vitest'
import { OrgRole, QuoteStatus, OrderStatus, InvoiceStatus } from '@nzila/commerce-core/enums'
import type { TransitionContext } from '@nzila/commerce-state'
import {
  createApprovalRequiredGate,
  createMarginFloorGate,
  createDiscountCapGate,
  createQuoteValidityGate,
  createQuoteCompletenessGate,
  createOrderCompletenessGate,
  createHighValueGate,
  createSnapshotIntegrityGate,
  createEvidenceRequiredGate,
  createInvoiceCompletenessGate,
  evaluateGates,
  withGovernanceGates,
  createGovernedQuoteMachine,
  createGovernedOrderMachine,
  createGovernedInvoiceMachine,
  resolvePolicy,
} from './gates'
import type { GovernancePolicy, QuoteEntity, OrderEntity, InvoiceEntity } from './gates'
import type { MachineDefinition, TransitionDef } from '@nzila/commerce-state'

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<TransitionContext> = {}): TransitionContext {
  return {
    entityId: 'org-001',
    actorId: 'actor-001',
    role: OrgRole.SALES,
    meta: {},
    ...overrides,
  }
}

function makeQuoteEntity(overrides: Partial<QuoteEntity> = {}): QuoteEntity {
  return {
    entityId: 'org-001',
    grandTotal: 5000,
    approvalFlags: [],
    marginPercent: 25,
    discountPercent: 5,
    validUntil: null,
    hasApproval: false,
    lineCount: 3,
    ...overrides,
  }
}

function makeOrderEntity(overrides: Partial<OrderEntity> = {}): OrderEntity {
  return {
    entityId: 'org-001',
    grandTotal: 5000,
    lineCount: 3,
    quoteSnapshotHash: 'abc123hash',
    ...overrides,
  }
}

function makeInvoiceEntity(overrides: Partial<InvoiceEntity> = {}): InvoiceEntity {
  return {
    entityId: 'org-001',
    grandTotal: 5000,
    hasEvidencePack: true,
    lineCount: 2,
    ...overrides,
  }
}

// minimal machine helpers
function makeMinimalQuoteMachine(): MachineDefinition<QuoteStatus, QuoteEntity> {
  return {
    name: 'quote',
    states: [QuoteStatus.DRAFT, QuoteStatus.PRICING, QuoteStatus.READY, QuoteStatus.SENT, QuoteStatus.REVIEWING, QuoteStatus.ACCEPTED, QuoteStatus.DECLINED, QuoteStatus.CANCELLED],
    initialState: QuoteStatus.DRAFT,
    terminalStates: [QuoteStatus.ACCEPTED, QuoteStatus.DECLINED, QuoteStatus.CANCELLED],
    transitions: [
      makeTx<QuoteStatus, QuoteEntity>(QuoteStatus.DRAFT, QuoteStatus.PRICING, 'Submit for pricing'),
      makeTx<QuoteStatus, QuoteEntity>(QuoteStatus.PRICING, QuoteStatus.READY, 'Pricing complete'),
      makeTx<QuoteStatus, QuoteEntity>(QuoteStatus.READY, QuoteStatus.SENT, 'Send to customer'),
      makeTx<QuoteStatus, QuoteEntity>(QuoteStatus.SENT, QuoteStatus.REVIEWING, 'Customer reviewing'),
      makeTx<QuoteStatus, QuoteEntity>(QuoteStatus.REVIEWING, QuoteStatus.ACCEPTED, 'Customer accepted'),
      makeTx<QuoteStatus, QuoteEntity>(QuoteStatus.SENT, QuoteStatus.ACCEPTED, 'Direct accept'),
      makeTx<QuoteStatus, QuoteEntity>(QuoteStatus.REVIEWING, QuoteStatus.DECLINED, 'Customer declined'),
      makeTx<QuoteStatus, QuoteEntity>(QuoteStatus.DRAFT, QuoteStatus.CANCELLED, 'Cancel'),
    ],
  }
}

function makeMinimalOrderMachine(): MachineDefinition<OrderStatus, OrderEntity> {
  return {
    name: 'order',
    states: [OrderStatus.CREATED, OrderStatus.CONFIRMED, OrderStatus.FULFILLMENT, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    initialState: OrderStatus.CREATED,
    terminalStates: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    transitions: [
      makeTx<OrderStatus, OrderEntity>(OrderStatus.CREATED, OrderStatus.CONFIRMED, 'Confirm order'),
      makeTx<OrderStatus, OrderEntity>(OrderStatus.CONFIRMED, OrderStatus.FULFILLMENT, 'Start fulfillment'),
      makeTx<OrderStatus, OrderEntity>(OrderStatus.FULFILLMENT, OrderStatus.COMPLETED, 'Complete'),
    ],
  }
}

function makeMinimalInvoiceMachine(): MachineDefinition<InvoiceStatus, InvoiceEntity> {
  return {
    name: 'invoice',
    states: [InvoiceStatus.DRAFT, InvoiceStatus.ISSUED, InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.CANCELLED],
    initialState: InvoiceStatus.DRAFT,
    terminalStates: [InvoiceStatus.CANCELLED],
    transitions: [
      makeTx<InvoiceStatus, InvoiceEntity>(InvoiceStatus.DRAFT, InvoiceStatus.ISSUED, 'Issue invoice'),
      makeTx<InvoiceStatus, InvoiceEntity>(InvoiceStatus.ISSUED, InvoiceStatus.SENT, 'Send invoice'),
      makeTx<InvoiceStatus, InvoiceEntity>(InvoiceStatus.SENT, InvoiceStatus.PAID, 'Mark paid'),
    ],
  }
}

function makeTx<TState extends string, TEntity = unknown>(from: TState, to: TState, label: string): TransitionDef<TState, TEntity> {
  return {
    from,
    to,
    label,
    allowedRoles: [],
    guards: [],
    events: [{ type: `${from}.${to}`, payload: {} }],
    actions: [],
  } as TransitionDef<TState, TEntity>
}

// ── resolvePolicy ───────────────────────────────────────────────────────────

describe('resolvePolicy', () => {
  it('should return defaults when no partial is given', () => {
    const policy = resolvePolicy()
    expect(policy.approvalThreshold).toBe(10_000)
    expect(policy.marginFloorPercent).toBe(15)
    expect(policy.highValueThreshold).toBe(50_000)
    expect(policy.minOrderLines).toBe(1)
    expect(policy.requireEvidenceForInvoice).toBe(true)
    expect(policy.maxQuoteValidityDays).toBe(90)
    expect(policy.maxDiscountWithoutApproval).toBe(20)
  })

  it('should override specific fields only', () => {
    const policy = resolvePolicy({ approvalThreshold: 5000, marginFloorPercent: 20 })
    expect(policy.approvalThreshold).toBe(5000)
    expect(policy.marginFloorPercent).toBe(20)
    expect(policy.highValueThreshold).toBe(50_000) // default preserved
  })
})

// ── Approval Required Gate ──────────────────────────────────────────────────

describe('createApprovalRequiredGate', () => {
  const gate = createApprovalRequiredGate({ approvalThreshold: 10_000 })

  it('should pass when total is below threshold', () => {
    const entity = makeQuoteEntity({ grandTotal: 5000 })
    expect(gate(makeCtx(), entity, QuoteStatus.REVIEWING, QuoteStatus.ACCEPTED)).toBe(true)
  })

  it('should pass when total equals threshold', () => {
    const entity = makeQuoteEntity({ grandTotal: 10_000 })
    expect(gate(makeCtx(), entity, QuoteStatus.REVIEWING, QuoteStatus.ACCEPTED)).toBe(true)
  })

  it('should block when total exceeds threshold and no approval', () => {
    const entity = makeQuoteEntity({ grandTotal: 15_000, hasApproval: false })
    expect(gate(makeCtx(), entity, QuoteStatus.REVIEWING, QuoteStatus.ACCEPTED)).toBe(false)
  })

  it('should pass when total exceeds threshold but approval exists', () => {
    const entity = makeQuoteEntity({ grandTotal: 15_000, hasApproval: true })
    expect(gate(makeCtx(), entity, QuoteStatus.REVIEWING, QuoteStatus.ACCEPTED)).toBe(true)
  })

  it('should not apply to non-accepted transitions', () => {
    const entity = makeQuoteEntity({ grandTotal: 15_000, hasApproval: false })
    expect(gate(makeCtx(), entity, QuoteStatus.REVIEWING, QuoteStatus.DECLINED)).toBe(true)
  })
})

// ── Margin Floor Gate ───────────────────────────────────────────────────────

describe('createMarginFloorGate', () => {
  const gate = createMarginFloorGate({ marginFloorPercent: 15 })

  it('should pass when margin is above floor', () => {
    const entity = makeQuoteEntity({ marginPercent: 25 })
    expect(gate(makeCtx(), entity, QuoteStatus.PRICING, QuoteStatus.READY)).toBe(true)
  })

  it('should pass when margin equals floor', () => {
    const entity = makeQuoteEntity({ marginPercent: 15 })
    expect(gate(makeCtx(), entity, QuoteStatus.PRICING, QuoteStatus.READY)).toBe(true)
  })

  it('should block when margin is below floor', () => {
    const entity = makeQuoteEntity({ marginPercent: 10 })
    expect(gate(makeCtx(), entity, QuoteStatus.PRICING, QuoteStatus.READY)).toBe(false)
  })

  it('should not apply when leaving non-pricing states', () => {
    const entity = makeQuoteEntity({ marginPercent: 5 })
    expect(gate(makeCtx(), entity, QuoteStatus.READY, QuoteStatus.SENT)).toBe(true)
  })
})

// ── Discount Cap Gate ───────────────────────────────────────────────────────

describe('createDiscountCapGate', () => {
  const gate = createDiscountCapGate({ maxDiscountWithoutApproval: 20 })

  it('should pass when discount is within cap', () => {
    const entity = makeQuoteEntity({ discountPercent: 15 })
    expect(gate(makeCtx(), entity, QuoteStatus.DRAFT, QuoteStatus.PRICING)).toBe(true)
  })

  it('should pass when discount equals cap', () => {
    const entity = makeQuoteEntity({ discountPercent: 20 })
    expect(gate(makeCtx(), entity, QuoteStatus.DRAFT, QuoteStatus.PRICING)).toBe(true)
  })

  it('should block when discount exceeds cap for non-elevated role', () => {
    const entity = makeQuoteEntity({ discountPercent: 25 })
    expect(gate(makeCtx({ role: OrgRole.SALES }), entity, QuoteStatus.DRAFT, QuoteStatus.PRICING)).toBe(false)
  })

  it('should pass when discount exceeds cap for elevated role', () => {
    const entity = makeQuoteEntity({ discountPercent: 25 })
    expect(gate(makeCtx({ role: OrgRole.MANAGER }), entity, QuoteStatus.DRAFT, QuoteStatus.PRICING)).toBe(true)
  })

  it('should pass for admin role even with high discount', () => {
    const entity = makeQuoteEntity({ discountPercent: 50 })
    expect(gate(makeCtx({ role: OrgRole.ADMIN }), entity, QuoteStatus.DRAFT, QuoteStatus.PRICING)).toBe(true)
  })
})

// ── Quote Validity Gate ─────────────────────────────────────────────────────

describe('createQuoteValidityGate', () => {
  const gate = createQuoteValidityGate({ maxQuoteValidityDays: 90 })

  it('should pass when no validity date is set', () => {
    const entity = makeQuoteEntity({ validUntil: null })
    expect(gate(makeCtx(), entity, QuoteStatus.READY, QuoteStatus.SENT)).toBe(true)
  })

  it('should pass when validity is within limit', () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const entity = makeQuoteEntity({ validUntil: futureDate })
    expect(gate(makeCtx(), entity, QuoteStatus.READY, QuoteStatus.SENT)).toBe(true)
  })

  it('should block when validity exceeds limit', () => {
    const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    const entity = makeQuoteEntity({ validUntil: farFuture })
    expect(gate(makeCtx(), entity, QuoteStatus.READY, QuoteStatus.SENT)).toBe(false)
  })

  it('should not apply to non-sent transitions', () => {
    const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    const entity = makeQuoteEntity({ validUntil: farFuture })
    expect(gate(makeCtx(), entity, QuoteStatus.SENT, QuoteStatus.REVIEWING)).toBe(true)
  })

  it('should pass when maxQuoteValidityDays is 0 (unlimited)', () => {
    const unlimitedGate = createQuoteValidityGate({ maxQuoteValidityDays: 0 })
    const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    const entity = makeQuoteEntity({ validUntil: farFuture })
    expect(unlimitedGate(makeCtx(), entity, QuoteStatus.READY, QuoteStatus.SENT)).toBe(true)
  })
})

// ── Quote Completeness Gate ─────────────────────────────────────────────────

describe('createQuoteCompletenessGate', () => {
  const gate = createQuoteCompletenessGate()

  it('should pass when quote has lines', () => {
    const entity = makeQuoteEntity({ lineCount: 3 })
    expect(gate(makeCtx(), entity, QuoteStatus.READY, QuoteStatus.SENT)).toBe(true)
  })

  it('should block when quote has no lines (send)', () => {
    const entity = makeQuoteEntity({ lineCount: 0 })
    expect(gate(makeCtx(), entity, QuoteStatus.READY, QuoteStatus.SENT)).toBe(false)
  })

  it('should block when quote has no lines (ready)', () => {
    const entity = makeQuoteEntity({ lineCount: 0 })
    expect(gate(makeCtx(), entity, QuoteStatus.PRICING, QuoteStatus.READY)).toBe(false)
  })

  it('should not apply to other transitions', () => {
    const entity = makeQuoteEntity({ lineCount: 0 })
    expect(gate(makeCtx(), entity, QuoteStatus.SENT, QuoteStatus.REVIEWING)).toBe(true)
  })
})

// ── Order Completeness Gate ─────────────────────────────────────────────────

describe('createOrderCompletenessGate', () => {
  const gate = createOrderCompletenessGate({ minOrderLines: 2 })

  it('should pass when order has enough lines', () => {
    const entity = makeOrderEntity({ lineCount: 3 })
    expect(gate(makeCtx(), entity, OrderStatus.CREATED, OrderStatus.CONFIRMED)).toBe(true)
  })

  it('should block when order has insufficient lines', () => {
    const entity = makeOrderEntity({ lineCount: 1 })
    expect(gate(makeCtx(), entity, OrderStatus.CREATED, OrderStatus.CONFIRMED)).toBe(false)
  })

  it('should not apply to non-confirmed transitions', () => {
    const entity = makeOrderEntity({ lineCount: 0 })
    expect(gate(makeCtx(), entity, OrderStatus.CONFIRMED, OrderStatus.FULFILLMENT)).toBe(true)
  })
})

// ── High Value Gate ─────────────────────────────────────────────────────────

describe('createHighValueGate', () => {
  const gate = createHighValueGate<OrderStatus, OrderEntity>({ highValueThreshold: 50_000 })

  it('should pass when value is below threshold', () => {
    const entity = makeOrderEntity({ grandTotal: 10_000 })
    expect(gate(makeCtx({ role: OrgRole.SALES }), entity, OrderStatus.CREATED, OrderStatus.CONFIRMED)).toBe(true)
  })

  it('should block for non-elevated role above threshold', () => {
    const entity = makeOrderEntity({ grandTotal: 60_000 })
    expect(gate(makeCtx({ role: OrgRole.SALES }), entity, OrderStatus.CREATED, OrderStatus.CONFIRMED)).toBe(false)
  })

  it('should pass for elevated role above threshold', () => {
    const entity = makeOrderEntity({ grandTotal: 60_000 })
    expect(gate(makeCtx({ role: OrgRole.MANAGER }), entity, OrderStatus.CREATED, OrderStatus.CONFIRMED)).toBe(true)
  })

  it('should pass when total equals threshold', () => {
    const entity = makeOrderEntity({ grandTotal: 50_000 })
    expect(gate(makeCtx({ role: OrgRole.SALES }), entity, OrderStatus.CREATED, OrderStatus.CONFIRMED)).toBe(true)
  })
})

// ── Snapshot Integrity Gate ─────────────────────────────────────────────────

describe('createSnapshotIntegrityGate', () => {
  const gate = createSnapshotIntegrityGate()

  it('should pass when snapshot hash exists', () => {
    const entity = makeOrderEntity({ quoteSnapshotHash: 'abc123' })
    expect(gate(makeCtx(), entity, OrderStatus.CREATED, OrderStatus.CONFIRMED)).toBe(true)
  })

  it('should block when snapshot hash is null', () => {
    const entity = makeOrderEntity({ quoteSnapshotHash: null })
    expect(gate(makeCtx(), entity, OrderStatus.CREATED, OrderStatus.CONFIRMED)).toBe(false)
  })

  it('should block when snapshot hash is empty', () => {
    const entity = makeOrderEntity({ quoteSnapshotHash: '' })
    expect(gate(makeCtx(), entity, OrderStatus.CREATED, OrderStatus.CONFIRMED)).toBe(false)
  })

  it('should not apply to non-confirmed transitions', () => {
    const entity = makeOrderEntity({ quoteSnapshotHash: null })
    expect(gate(makeCtx(), entity, OrderStatus.CONFIRMED, OrderStatus.FULFILLMENT)).toBe(true)
  })
})

// ── Evidence Required Gate ──────────────────────────────────────────────────

describe('createEvidenceRequiredGate', () => {
  it('should pass when evidence pack exists', () => {
    const gate = createEvidenceRequiredGate()
    const entity = makeInvoiceEntity({ hasEvidencePack: true })
    expect(gate(makeCtx(), entity, InvoiceStatus.DRAFT, InvoiceStatus.ISSUED)).toBe(true)
  })

  it('should block when evidence pack is missing', () => {
    const gate = createEvidenceRequiredGate()
    const entity = makeInvoiceEntity({ hasEvidencePack: false })
    expect(gate(makeCtx(), entity, InvoiceStatus.DRAFT, InvoiceStatus.ISSUED)).toBe(false)
  })

  it('should pass when policy disables evidence requirement', () => {
    const gate = createEvidenceRequiredGate({ requireEvidenceForInvoice: false })
    const entity = makeInvoiceEntity({ hasEvidencePack: false })
    expect(gate(makeCtx(), entity, InvoiceStatus.DRAFT, InvoiceStatus.ISSUED)).toBe(true)
  })

  it('should not apply to non-issued transitions', () => {
    const gate = createEvidenceRequiredGate()
    const entity = makeInvoiceEntity({ hasEvidencePack: false })
    expect(gate(makeCtx(), entity, InvoiceStatus.ISSUED, InvoiceStatus.SENT)).toBe(true)
  })
})

// ── Invoice Completeness Gate ───────────────────────────────────────────────

describe('createInvoiceCompletenessGate', () => {
  const gate = createInvoiceCompletenessGate()

  it('should pass when invoice has lines', () => {
    const entity = makeInvoiceEntity({ lineCount: 2 })
    expect(gate(makeCtx(), entity, InvoiceStatus.DRAFT, InvoiceStatus.ISSUED)).toBe(true)
  })

  it('should block when invoice has no lines', () => {
    const entity = makeInvoiceEntity({ lineCount: 0 })
    expect(gate(makeCtx(), entity, InvoiceStatus.DRAFT, InvoiceStatus.ISSUED)).toBe(false)
  })

  it('should not apply to non-issued transitions', () => {
    const entity = makeInvoiceEntity({ lineCount: 0 })
    expect(gate(makeCtx(), entity, InvoiceStatus.ISSUED, InvoiceStatus.SENT)).toBe(true)
  })
})

// ── evaluateGates ───────────────────────────────────────────────────────────

describe('evaluateGates', () => {
  it('should return structured results for all gates', () => {
    const gates = [
      { name: 'approval', guard: createApprovalRequiredGate({ approvalThreshold: 1000 }) },
      { name: 'margin', guard: createMarginFloorGate({ marginFloorPercent: 30 }) },
    ]
    const ctx = makeCtx()
    const entity = makeQuoteEntity({ grandTotal: 5000, hasApproval: false, marginPercent: 25 })
    const results = evaluateGates(gates, ctx, entity, QuoteStatus.PRICING, QuoteStatus.READY)

    expect(results).toHaveLength(2)
    // approval gate doesn't apply (not going to accepted), so passes
    expect(results[0]).toEqual({ gate: 'approval', passed: true, reason: 'passed' })
    // margin gate applies (leaving pricing) and fails (25 < 30)
    expect(results[1]).toEqual({
      gate: 'margin',
      passed: false,
      reason: 'Gate "margin" blocked transition pricing → ready',
    })
  })

  it('should return all-passed for valid state', () => {
    const gates = [
      { name: 'approval', guard: createApprovalRequiredGate() },
    ]
    const entity = makeQuoteEntity({ grandTotal: 5000 })
    const results = evaluateGates(gates, makeCtx(), entity, QuoteStatus.REVIEWING, QuoteStatus.ACCEPTED)
    expect(results.every((r) => r.passed)).toBe(true)
  })
})

// ── withGovernanceGates ─────────────────────────────────────────────────────

describe('withGovernanceGates', () => {
  it('should inject guards into matching transitions', () => {
    const machine = makeMinimalQuoteMachine()
    const dummyGuard = () => true
    const enhanced = withGovernanceGates(
      machine,
      (t) => t.to === QuoteStatus.ACCEPTED,
      [dummyGuard],
    )

    // Acceptance transitions should have the guard
    const acceptTransitions = enhanced.transitions.filter((t) => t.to === QuoteStatus.ACCEPTED)
    expect(acceptTransitions.length).toBeGreaterThan(0)
    for (const t of acceptTransitions) {
      expect(t.guards).toContain(dummyGuard)
    }

    // Non-acceptance transitions should be unchanged
    const otherTransitions = enhanced.transitions.filter((t) => t.to !== QuoteStatus.ACCEPTED)
    for (const t of otherTransitions) {
      expect(t.guards).not.toContain(dummyGuard)
    }
  })

  it('should not mutate the original machine', () => {
    const machine = makeMinimalQuoteMachine()
    const original = machine.transitions.map((t) => t.guards.length)
    withGovernanceGates(machine, () => true, [() => true])
    const after = machine.transitions.map((t) => t.guards.length)
    expect(after).toEqual(original)
  })
})

// ── Governed Machine Factories ──────────────────────────────────────────────

describe('createGovernedQuoteMachine', () => {
  it('should add guards to acceptance transitions', () => {
    const base = makeMinimalQuoteMachine()
    const governed = createGovernedQuoteMachine(base)
    const acceptTx = governed.transitions.filter((t) => t.to === QuoteStatus.ACCEPTED)
    // Should have at least approval + discount cap guards
    for (const t of acceptTx) {
      expect(t.guards.length).toBeGreaterThan(0)
    }
  })

  it('should add margin guard to pricing transitions', () => {
    const base = makeMinimalQuoteMachine()
    const governed = createGovernedQuoteMachine(base)
    const pricingTx = governed.transitions.filter((t) => t.from === QuoteStatus.PRICING)
    for (const t of pricingTx) {
      expect(t.guards.length).toBeGreaterThan(0)
    }
  })

  it('should block high-discount acceptance for sales role', () => {
    const base = makeMinimalQuoteMachine()
    const governed = createGovernedQuoteMachine(base, { maxDiscountWithoutApproval: 10 })
    const acceptTx = governed.transitions.find(
      (t) => t.from === QuoteStatus.REVIEWING && t.to === QuoteStatus.ACCEPTED,
    )!
    const entity = makeQuoteEntity({ discountPercent: 15, grandTotal: 5000 })
    const allPass = acceptTx.guards.every((g) => g(makeCtx({ role: OrgRole.SALES }), entity, QuoteStatus.REVIEWING, QuoteStatus.ACCEPTED))
    expect(allPass).toBe(false)
  })

  it('should preserve machine name and states', () => {
    const base = makeMinimalQuoteMachine()
    const governed = createGovernedQuoteMachine(base)
    expect(governed.name).toBe('quote')
    expect(governed.states).toEqual(base.states)
    expect(governed.terminalStates).toEqual(base.terminalStates)
  })
})

describe('createGovernedOrderMachine', () => {
  it('should add guards to confirmation transitions', () => {
    const base = makeMinimalOrderMachine()
    const governed = createGovernedOrderMachine(base)
    const confirmTx = governed.transitions.filter((t) => t.to === OrderStatus.CONFIRMED)
    for (const t of confirmTx) {
      expect(t.guards.length).toBeGreaterThan(0)
    }
  })

  it('should block confirmation without snapshot', () => {
    const base = makeMinimalOrderMachine()
    const governed = createGovernedOrderMachine(base)
    const confirmTx = governed.transitions.find(
      (t) => t.from === OrderStatus.CREATED && t.to === OrderStatus.CONFIRMED,
    )!
    const entity = makeOrderEntity({ quoteSnapshotHash: null })
    const allPass = confirmTx.guards.every((g) => g(makeCtx(), entity, OrderStatus.CREATED, OrderStatus.CONFIRMED))
    expect(allPass).toBe(false)
  })

  it('should block high-value orders for sales role', () => {
    const base = makeMinimalOrderMachine()
    const governed = createGovernedOrderMachine(base, { highValueThreshold: 10_000 })
    const confirmTx = governed.transitions.find(
      (t) => t.from === OrderStatus.CREATED && t.to === OrderStatus.CONFIRMED,
    )!
    const entity = makeOrderEntity({ grandTotal: 20_000 })
    const allPass = confirmTx.guards.every((g) => g(makeCtx({ role: OrgRole.SALES }), entity, OrderStatus.CREATED, OrderStatus.CONFIRMED))
    expect(allPass).toBe(false)
  })
})

describe('createGovernedInvoiceMachine', () => {
  it('should add guards to issue transitions', () => {
    const base = makeMinimalInvoiceMachine()
    const governed = createGovernedInvoiceMachine(base)
    const issueTx = governed.transitions.filter((t) => t.to === InvoiceStatus.ISSUED)
    for (const t of issueTx) {
      expect(t.guards.length).toBeGreaterThan(0)
    }
  })

  it('should block issuance without evidence', () => {
    const base = makeMinimalInvoiceMachine()
    const governed = createGovernedInvoiceMachine(base)
    const issueTx = governed.transitions.find(
      (t) => t.from === InvoiceStatus.DRAFT && t.to === InvoiceStatus.ISSUED,
    )!
    const entity = makeInvoiceEntity({ hasEvidencePack: false })
    const allPass = issueTx.guards.every((g) => g(makeCtx(), entity, InvoiceStatus.DRAFT, InvoiceStatus.ISSUED))
    expect(allPass).toBe(false)
  })

  it('should block issuance without line items', () => {
    const base = makeMinimalInvoiceMachine()
    const governed = createGovernedInvoiceMachine(base)
    const issueTx = governed.transitions.find(
      (t) => t.from === InvoiceStatus.DRAFT && t.to === InvoiceStatus.ISSUED,
    )!
    const entity = makeInvoiceEntity({ lineCount: 0 })
    const allPass = issueTx.guards.every((g) => g(makeCtx(), entity, InvoiceStatus.DRAFT, InvoiceStatus.ISSUED))
    expect(allPass).toBe(false)
  })

  it('should pass when all requirements met', () => {
    const base = makeMinimalInvoiceMachine()
    const governed = createGovernedInvoiceMachine(base)
    const issueTx = governed.transitions.find(
      (t) => t.from === InvoiceStatus.DRAFT && t.to === InvoiceStatus.ISSUED,
    )!
    const entity = makeInvoiceEntity({ hasEvidencePack: true, lineCount: 2 })
    const allPass = issueTx.guards.every((g) => g(makeCtx(), entity, InvoiceStatus.DRAFT, InvoiceStatus.ISSUED))
    expect(allPass).toBe(true)
  })
})
