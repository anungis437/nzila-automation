/**
 * @nzila/commerce-services — Quote Service Tests
 *
 * Tests the full quote lifecycle with an in-memory mock repository.
 * No database, no network — pure unit tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QuoteStatus, OrgRole, PricingTier, ApprovalDecision } from '@nzila/commerce-core/enums'
import type { OrgContext } from '@nzila/commerce-core/types'
import {
  createQuoteService,
  type QuoteRepository,
  type CreateQuoteInput,
  type QuoteEntity,
  type QuoteLineEntity,
  type QuoteLineInput,
  type PricedQuote,
} from './quote-service'
import { AuditAction, CommerceEntityType } from '@nzila/commerce-audit'

// ── Test Fixtures ───────────────────────────────────────────────────────────

const TEST_ORG = 'org-test-001'
const TEST_ACTOR = 'actor-test-001'

function makeCtx(overrides?: Partial<OrgContext>): OrgContext {
  return {
    orgId: TEST_ORG,
    actorId: TEST_ACTOR,
    role: OrgRole.SALES,
    permissions: [],
    requestId: 'req-001',
    ...overrides,
  }
}

function makeQuoteEntity(overrides?: Partial<QuoteEntity>): QuoteEntity {
  return {
    id: 'quote-001',
    orgId: TEST_ORG,
    ref: 'QUO-NZI-000001',
    customerId: 'cust-001',
    opportunityId: null,
    status: QuoteStatus.DRAFT,
    pricingTier: PricingTier.STANDARD,
    currentVersion: 1,
    currency: 'CAD',
    subtotal: '0',
    taxTotal: '0',
    total: '0',
    validUntil: null,
    notes: null,
    createdBy: TEST_ACTOR,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

const sampleLines: QuoteLineInput[] = [
  { description: 'Widget A', sku: 'WID-A', quantity: 100, unitCost: 2.50 },
  { description: 'Widget B', sku: 'WID-B', quantity: 50, unitCost: 5.00 },
]

const sampleInput: CreateQuoteInput = {
  customerId: 'cust-001',
  pricingTier: PricingTier.STANDARD,
  lines: sampleLines,
  validDays: 30,
  notes: 'Test quote',
}

// ── Mock Repository ─────────────────────────────────────────────────────────

function createMockRepo(): QuoteRepository {
  let refCounter = 0
  return {
    nextRef: vi.fn(async () => {
      refCounter++
      return `QUO-NZI-${String(refCounter).padStart(6, '0')}`
    }),
    createQuote: vi.fn(async (_ctx, data) => ({
      id: `quote-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    })) as QuoteRepository['createQuote'],
    createQuoteLines: vi.fn(async (_ctx, _quoteId, lines) =>
      lines.map((line: Record<string, unknown>, idx: number) => ({
        id: `line-${idx}`,
        ...line,
      })),
    ) as QuoteRepository['createQuoteLines'],
    getQuoteById: vi.fn(async () => null),
    updateQuote: vi.fn(async (_ctx, _id, values) =>
      makeQuoteEntity(values),
    ) as QuoteRepository['updateQuote'],
    saveVersion: vi.fn(async () => {}),
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('QuoteService', () => {
  let repo: ReturnType<typeof createMockRepo>
  let service: ReturnType<typeof createQuoteService>
  const ctx = makeCtx()

  beforeEach(() => {
    repo = createMockRepo()
    service = createQuoteService(repo)
  })

  // ── API Surface ─────────────────────────────────────────────────────────

  describe('API surface', () => {
    it('exports createQuoteService factory', () => {
      expect(typeof createQuoteService).toBe('function')
    })

    it('returns object with all lifecycle methods', () => {
      const svc = createQuoteService(repo)
      expect(svc).toHaveProperty('createQuote')
      expect(svc).toHaveProperty('priceQuote')
      expect(svc).toHaveProperty('completePricing')
      expect(svc).toHaveProperty('sendQuote')
      expect(svc).toHaveProperty('acceptQuote')
      expect(svc).toHaveProperty('declineQuote')
      expect(svc).toHaveProperty('cancelQuote')
      expect(svc).toHaveProperty('getAvailableActions')
    })

    it('exposes exactly 8 methods', () => {
      const svc = createQuoteService(repo)
      expect(Object.keys(svc)).toHaveLength(8)
    })
  })

  // ── createQuote ─────────────────────────────────────────────────────────

  describe('createQuote', () => {
    it('creates a draft quote via repository', async () => {
      const result = await service.createQuote(ctx, sampleInput)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.data.status).toBe(QuoteStatus.DRAFT)
      expect(result.data.orgId).toBe(TEST_ORG)
      expect(result.data.customerId).toBe('cust-001')
      expect(result.data.pricingTier).toBe(PricingTier.STANDARD)
      expect(result.data.currency).toBe('CAD')
    })

    it('calls repo.nextRef with ctx', async () => {
      await service.createQuote(ctx, sampleInput)
      expect(repo.nextRef).toHaveBeenCalledWith(ctx)
    })

    it('calls repo.createQuote with org orgId', async () => {
      await service.createQuote(ctx, sampleInput)
      expect(repo.createQuote).toHaveBeenCalledTimes(1)
      const call = (repo.createQuote as ReturnType<typeof vi.fn>).mock.calls[0]!
      expect(call[0]).toBe(ctx)
      expect(call[1].orgId).toBe(TEST_ORG)
    })

    it('stores initial lines via repo', async () => {
      await service.createQuote(ctx, sampleInput)
      expect(repo.createQuoteLines).toHaveBeenCalledTimes(1)
      const lineCall = (repo.createQuoteLines as ReturnType<typeof vi.fn>).mock.calls[0]!
      const lines = lineCall[2]
      expect(lines).toHaveLength(2)
      expect(lines[0].description).toBe('Widget A')
      expect(lines[0].unitPrice).toBe('0') // unpriced initially
    })

    it('produces CREATE audit entry', async () => {
      const result = await service.createQuote(ctx, sampleInput)
      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.auditEntries).toHaveLength(1)
      const entry = result.auditEntries[0]!
      expect(entry.action).toBe(AuditAction.CREATE)
      expect(entry.entityType).toBe(CommerceEntityType.QUOTE)
      expect(entry.orgId).toBe(TEST_ORG)
      expect(entry.actorId).toBe(TEST_ACTOR)
    })

    it('sets validUntil when validDays provided', async () => {
      const before = Date.now()
      const result = await service.createQuote(ctx, { ...sampleInput, validDays: 30 })
      expect(result.ok).toBe(true)
      if (!result.ok) return

      const createCall = (repo.createQuote as ReturnType<typeof vi.fn>).mock.calls[0]!
      const validUntil = createCall[1].validUntil
      expect(validUntil).not.toBeNull()
      const validDate = new Date(validUntil!).getTime()
      expect(validDate).toBeGreaterThan(before + 29 * 86_400_000)
    })

    it('sets validUntil to null when validDays omitted', async () => {
      const { validDays, ...input } = sampleInput
      const result = await service.createQuote(ctx, input)
      expect(result.ok).toBe(true)
      const createCall = (repo.createQuote as ReturnType<typeof vi.fn>).mock.calls[0]!
      expect(createCall[1].validUntil).toBeNull()
    })

    it('generates sequential refs', async () => {
      await service.createQuote(ctx, sampleInput)
      await service.createQuote(ctx, sampleInput)
      expect(repo.nextRef).toHaveBeenCalledTimes(2)
    })
  })

  // ── priceQuote ──────────────────────────────────────────────────────────

  describe('priceQuote', () => {
    it('prices a DRAFT quote and transitions to PRICING', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.DRAFT })
      const result = service.priceQuote(ctx, quote, sampleLines, 100)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.data.quoteId).toBe(quote.id)
      expect(result.data.tier).toBe(PricingTier.STANDARD)
      expect(result.data.subtotal).toBeGreaterThan(0)
      expect(result.data.total).toBeGreaterThan(result.data.subtotal)
    })

    it('returns priced lines with correct structure', () => {
      const quote = makeQuoteEntity()
      const result = service.priceQuote(ctx, quote, sampleLines, 100)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.data.lines).toHaveLength(2)
      const firstLine = result.data.lines[0]!
      expect(firstLine.description).toBe('Widget A')
      expect(firstLine.sku).toBe('WID-A')
      expect(firstLine.quantity).toBe(100)
      expect(firstLine.unitCost).toBe(2.50)
      expect(firstLine.unitPrice).toBeGreaterThan(0)
      expect(firstLine.lineTotal).toBeGreaterThan(0)
      expect(firstLine.margin).toBeGreaterThan(0)
    })

    it('includes tax breakdown with gst + qst', () => {
      const quote = makeQuoteEntity()
      const result = service.priceQuote(ctx, quote, sampleLines, 100)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.data.taxBreakdown.gst).toBeGreaterThan(0)
      expect(result.data.taxBreakdown.qst).toBeGreaterThan(0)
      expect(result.data.taxBreakdown.total).toBeCloseTo(
        result.data.taxBreakdown.gst + result.data.taxBreakdown.qst,
        2,
      )
      expect(result.data.taxBreakdown.finalPrice).toBeGreaterThan(result.data.subtotal)
    })

    it('includes margin validation', () => {
      const quote = makeQuoteEntity()
      const result = service.priceQuote(ctx, quote, sampleLines, 100)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.data.marginValidation).toHaveProperty('isValid')
      expect(result.data.marginValidation).toHaveProperty('floorMargin')
      expect(result.data.marginValidation).toHaveProperty('message')
    })

    it('rejects pricing if quote is not in DRAFT status', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.SENT })
      const result = service.priceQuote(ctx, quote, sampleLines, 100)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBeDefined()
    })

    it('produces STATE_TRANSITION audit entry', () => {
      const quote = makeQuoteEntity()
      const result = service.priceQuote(ctx, quote, sampleLines, 100)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.auditEntries).toHaveLength(1)
      const entry = result.auditEntries[0]!
      expect(entry.orgId).toBe(TEST_ORG)
      expect(entry.actorId).toBe(TEST_ACTOR)
      expect(entry.entityType).toBe(CommerceEntityType.QUOTE)
    })

    it('line totals sum to subtotal', () => {
      const quote = makeQuoteEntity()
      const result = service.priceQuote(ctx, quote, sampleLines, 100)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      const lineTotalSum = result.data.lines.reduce((s, l) => s + l.lineTotal, 0)
      expect(lineTotalSum).toBeCloseTo(result.data.subtotal, 2)
    })

    it('total equals finalPrice from tax breakdown', () => {
      const quote = makeQuoteEntity()
      const result = service.priceQuote(ctx, quote, sampleLines, 100)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      expect(result.data.total).toBeCloseTo(result.data.taxBreakdown.finalPrice, 2)
    })
  })

  // ── completePricing ─────────────────────────────────────────────────────

  describe('completePricing', () => {
    it('transitions PRICING → READY', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.PRICING })
      const result = service.completePricing(ctx, quote)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(QuoteStatus.READY)
    })

    it('rejects if not in PRICING state', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.DRAFT })
      const result = service.completePricing(ctx, quote)

      expect(result.ok).toBe(false)
    })

    it('produces audit entry', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.PRICING })
      const result = service.completePricing(ctx, quote)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.auditEntries).toHaveLength(1)
      expect(result.auditEntries[0]!.orgId).toBe(TEST_ORG)
    })
  })

  // ── sendQuote ───────────────────────────────────────────────────────────

  describe('sendQuote', () => {
    it('transitions READY → SENT', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.READY })
      const result = service.sendQuote(ctx, quote)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(QuoteStatus.SENT)
    })

    it('rejects if not in READY state', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.DRAFT })
      const result = service.sendQuote(ctx, quote)

      expect(result.ok).toBe(false)
    })

    it('produces audit entry', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.READY })
      const result = service.sendQuote(ctx, quote)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.auditEntries).toHaveLength(1)
    })
  })

  // ── acceptQuote ─────────────────────────────────────────────────────────

  describe('acceptQuote', () => {
    it('transitions SENT → ACCEPTED', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.SENT })
      const result = service.acceptQuote(ctx, quote)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(QuoteStatus.ACCEPTED)
    })

    it('includes APPROVED decision in audit metadata', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.SENT })
      const result = service.acceptQuote(ctx, quote)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.auditEntries[0]!.metadata).toHaveProperty('decision', ApprovalDecision.APPROVED)
    })

    it('rejects from terminal CANCELLED state', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.CANCELLED })
      const result = service.acceptQuote(ctx, quote)

      expect(result.ok).toBe(false)
    })
  })

  // ── declineQuote ────────────────────────────────────────────────────────

  describe('declineQuote', () => {
    it('transitions SENT → DECLINED', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.SENT })
      const result = service.declineQuote(ctx, quote, 'Too expensive')

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(QuoteStatus.DECLINED)
    })

    it('stores reason in audit metadata', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.SENT })
      const result = service.declineQuote(ctx, quote, 'Too expensive')

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.auditEntries[0]!.metadata).toHaveProperty('reason', 'Too expensive')
      expect(result.auditEntries[0]!.metadata).toHaveProperty('decision', ApprovalDecision.REJECTED)
    })
  })

  // ── cancelQuote ─────────────────────────────────────────────────────────

  describe('cancelQuote', () => {
    it('cancels a DRAFT quote', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.DRAFT })
      const result = service.cancelQuote(ctx, quote, 'Customer changed mind')

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(QuoteStatus.CANCELLED)
    })

    it('cancels a READY quote (requires MANAGER+)', () => {
      const mgrCtx = makeCtx({ role: OrgRole.MANAGER })
      const quote = makeQuoteEntity({ status: QuoteStatus.READY })
      const result = service.cancelQuote(mgrCtx, quote)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.to).toBe(QuoteStatus.CANCELLED)
    })

    it('rejects cancel of READY quote by SALES role', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.READY })
      const result = service.cancelQuote(ctx, quote) // ctx has SALES role

      expect(result.ok).toBe(false)
    })

    it('rejects cancel from terminal ACCEPTED state', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.ACCEPTED })
      const result = service.cancelQuote(ctx, quote)

      expect(result.ok).toBe(false)
    })

    it('stores reason in audit metadata', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.DRAFT })
      const result = service.cancelQuote(ctx, quote, 'Duplicate')

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.auditEntries[0]!.metadata).toHaveProperty('reason', 'Duplicate')
    })
  })

  // ── getAvailableActions ─────────────────────────────────────────────────

  describe('getAvailableActions', () => {
    it('returns PRICING and CANCELLED for DRAFT quote', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.DRAFT })
      const actions = service.getAvailableActions(ctx, quote)

      expect(actions).toContain(QuoteStatus.PRICING)
      expect(actions).toContain(QuoteStatus.CANCELLED)
    })

    it('returns READY and CANCELLED for PRICING quote', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.PRICING })
      const actions = service.getAvailableActions(ctx, quote)

      expect(actions).toContain(QuoteStatus.READY)
    })

    it('returns no actions for terminal ACCEPTED state', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.ACCEPTED })
      const actions = service.getAvailableActions(ctx, quote)

      expect(actions).toHaveLength(0)
    })

    it('returns no actions for terminal CANCELLED state', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.CANCELLED })
      const actions = service.getAvailableActions(ctx, quote)

      expect(actions).toHaveLength(0)
    })
  })

  // ── Org Isolation ───────────────────────────────────────────────────────

  describe('org isolation', () => {
    it('passes orgId through to all repository calls', async () => {
      const orgCtx = makeCtx({ orgId: 'org-isolated-001' })
      await service.createQuote(orgCtx, sampleInput)

      const createCall = (repo.createQuote as ReturnType<typeof vi.fn>).mock.calls[0]!
      expect(createCall[0].orgId).toBe('org-isolated-001')
      expect(createCall[1].orgId).toBe('org-isolated-001')
    })

    it('transition checks use quote orgId for org match', () => {
      const quote = makeQuoteEntity({ orgId: 'org-A' })
      const orgACtx = makeCtx({ orgId: 'org-A' })
      const result = service.priceQuote(orgACtx, quote, sampleLines, 100)

      // Should succeed — org matches
      expect(result.ok).toBe(true)
    })
  })

  // ── Audit Trail ─────────────────────────────────────────────────────────

  describe('audit trail', () => {
    it('every operation returns at least one audit entry', async () => {
      // createQuote
      const createResult = await service.createQuote(ctx, sampleInput)
      expect(createResult.ok && createResult.auditEntries.length).toBeGreaterThanOrEqual(1)

      // priceQuote
      const quote = makeQuoteEntity()
      const priceResult = service.priceQuote(ctx, quote, sampleLines, 100)
      expect(priceResult.ok && priceResult.auditEntries.length).toBeGreaterThanOrEqual(1)

      // completePricing
      const pricingQuote = makeQuoteEntity({ status: QuoteStatus.PRICING })
      const completeResult = service.completePricing(ctx, pricingQuote)
      expect(completeResult.ok && completeResult.auditEntries.length).toBeGreaterThanOrEqual(1)
    })

    it('audit entries carry correct orgId and actorId', async () => {
      const result = await service.createQuote(ctx, sampleInput)
      expect(result.ok).toBe(true)
      if (!result.ok) return

      for (const entry of result.auditEntries) {
        expect(entry.orgId).toBe(TEST_ORG)
        expect(entry.actorId).toBe(TEST_ACTOR)
      }
    })

    it('transition audits carry from/to states', () => {
      const quote = makeQuoteEntity({ status: QuoteStatus.DRAFT })
      const result = service.priceQuote(ctx, quote, sampleLines, 100)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      const entry = result.auditEntries[0]!
      expect(entry.fromState).toBe(QuoteStatus.DRAFT)
      expect(entry.toState).toBe(QuoteStatus.PRICING)
    })
  })

  // ── Full Lifecycle Integration ──────────────────────────────────────────

  describe('full lifecycle', () => {
    it('DRAFT → PRICING → READY → SENT → ACCEPTED', () => {
      // 1. DRAFT → PRICING
      const draftQuote = makeQuoteEntity({ status: QuoteStatus.DRAFT })
      const priced = service.priceQuote(ctx, draftQuote, sampleLines, 100)
      expect(priced.ok).toBe(true)

      // 2. PRICING → READY
      const pricingQuote = makeQuoteEntity({ status: QuoteStatus.PRICING })
      const ready = service.completePricing(ctx, pricingQuote)
      expect(ready.ok).toBe(true)

      // 3. READY → SENT
      const readyQuote = makeQuoteEntity({ status: QuoteStatus.READY })
      const sent = service.sendQuote(ctx, readyQuote)
      expect(sent.ok).toBe(true)

      // 4. SENT → ACCEPTED
      const sentQuote = makeQuoteEntity({ status: QuoteStatus.SENT })
      const accepted = service.acceptQuote(ctx, sentQuote)
      expect(accepted.ok).toBe(true)
    })

    it('DRAFT → PRICING → READY → SENT → DECLINED', () => {
      const draftQuote = makeQuoteEntity({ status: QuoteStatus.DRAFT })
      expect(service.priceQuote(ctx, draftQuote, sampleLines, 100).ok).toBe(true)

      const pricingQuote = makeQuoteEntity({ status: QuoteStatus.PRICING })
      expect(service.completePricing(ctx, pricingQuote).ok).toBe(true)

      const readyQuote = makeQuoteEntity({ status: QuoteStatus.READY })
      expect(service.sendQuote(ctx, readyQuote).ok).toBe(true)

      const sentQuote = makeQuoteEntity({ status: QuoteStatus.SENT })
      const declined = service.declineQuote(ctx, sentQuote, 'Price too high')
      expect(declined.ok).toBe(true)
    })

    it('cancel at any non-terminal stage (with sufficient role)', () => {
      const mgrCtx = makeCtx({ role: OrgRole.MANAGER })
      for (const status of [QuoteStatus.DRAFT, QuoteStatus.PRICING, QuoteStatus.READY, QuoteStatus.SENT]) {
        const quote = makeQuoteEntity({ status })
        const result = service.cancelQuote(mgrCtx, quote)
        expect(result.ok).toBe(true)
      }
    })

    it('cannot transition from terminal states', () => {
      for (const status of [QuoteStatus.ACCEPTED, QuoteStatus.DECLINED, QuoteStatus.CANCELLED]) {
        const quote = makeQuoteEntity({ status })
        expect(service.cancelQuote(ctx, quote).ok).toBe(false)
        expect(service.sendQuote(ctx, quote).ok).toBe(false)
        expect(service.acceptQuote(ctx, quote).ok).toBe(false)
      }
    })
  })

  // ── Pricing Edge Cases ──────────────────────────────────────────────────

  describe('pricing edge cases', () => {
    it('prices with BUDGET tier', () => {
      const quote = makeQuoteEntity({ pricingTier: PricingTier.BUDGET })
      const result = service.priceQuote(ctx, quote, sampleLines, 100)
      expect(result.ok).toBe(true)
    })

    it('prices with PREMIUM tier (higher margins)', () => {
      const quote = makeQuoteEntity({ pricingTier: PricingTier.PREMIUM })
      const result = service.priceQuote(ctx, quote, sampleLines, 100)
      expect(result.ok).toBe(true)
      if (!result.ok) return

      // Premium tier should have higher subtotal due to higher margin target
      const budgetQuote = makeQuoteEntity({ pricingTier: PricingTier.BUDGET })
      const budgetResult = service.priceQuote(ctx, budgetQuote, sampleLines, 100)
      expect(budgetResult.ok).toBe(true)
      if (!budgetResult.ok) return

      expect(result.data.subtotal).toBeGreaterThan(budgetResult.data.subtotal)
    })

    it('single line quote', () => {
      const quote = makeQuoteEntity()
      const singleLine: QuoteLineInput[] = [
        { description: 'Solo item', quantity: 10, unitCost: 1.00 },
      ]
      const result = service.priceQuote(ctx, quote, singleLine, 10)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.data.lines).toHaveLength(1)
    })
  })

  // ── Custom Template ─────────────────────────────────────────────────────

  describe('custom pricing template', () => {
    it('uses injected template instead of default', () => {
      const customTemplate = {
        budgetMarginTarget: 20,
        standardMarginTarget: 30,
        premiumMarginTarget: 45,
        budgetMarginFloor: 10,
        standardMarginFloor: 20,
        premiumMarginFloor: 30,
        packagingCostPerBox: 1.00,
        laborCostPerBox: 2.00,
        shippingCostPerBox: 3.00,
        gstRate: 0.05,
        qstRate: 0.09975,
      }

      const customService = createQuoteService(repo, customTemplate)
      const quote = makeQuoteEntity()
      const result = customService.priceQuote(ctx, quote, sampleLines, 100)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      // Lower margin target + lower fixed costs → lower subtotal
      const defaultResult = service.priceQuote(ctx, makeQuoteEntity(), sampleLines, 100)
      expect(defaultResult.ok).toBe(true)
      if (!defaultResult.ok) return

      expect(result.data.subtotal).toBeLessThan(defaultResult.data.subtotal)
    })
  })
})
