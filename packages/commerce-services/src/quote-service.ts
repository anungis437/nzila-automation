/**
 * @nzila/commerce-services — Quote Service
 *
 * Orchestrates the full quote lifecycle:
 *   create → price → approve → send → convert to order
 *
 * DESIGN:
 *   - Pure orchestration — no direct DB imports
 *   - State transitions via @nzila/commerce-state (declarative machine)
 *   - Pricing via @nzila/pricing-engine (pure math)
 *   - Audit trail via @nzila/commerce-audit (pure builders)
 *   - All DB operations injected via QuoteRepository port
 *
 * This keeps the service testable without any database connection.
 *
 * @module @nzila/commerce-services/quote
 */
import { QuoteStatus, OrgRole, PricingTier, ApprovalDecision } from '@nzila/commerce-core/enums'
import type { OrgContext } from '@nzila/commerce-core/types'
import {
  attemptTransition,
  getAvailableTransitions,
  quoteMachine,
  type TransitionContext,
  type TransitionResult,
  type TransitionSuccess,
} from '@nzila/commerce-state'
import {
  calculateTierPricing,
  calculateQuebecTaxes,
  validateMarginFloor,
  type PricingItem,
  type PricingTemplate,
  type MarginCalculation,
  type TaxBreakdown,
  type MarginFloorValidation,
} from '@nzila/pricing-engine'
import {
  buildTransitionAuditEntry,
  buildActionAuditEntry,
  CommerceEntityType,
  AuditAction,
  type AuditEntry,
} from '@nzila/commerce-audit'

// ── Types ───────────────────────────────────────────────────────────────────

/**
 * Input for creating a new quote.
 */
export interface CreateQuoteInput {
  readonly customerId: string
  readonly opportunityId?: string
  readonly pricingTier: PricingTier
  readonly lines: readonly QuoteLineInput[]
  readonly notes?: string
  readonly validDays?: number
  readonly metadata?: Record<string, unknown>
}

export interface QuoteLineInput {
  readonly description: string
  readonly sku?: string
  readonly quantity: number
  readonly unitCost: number
}

/**
 * Minimal quote entity used by the service.
 * The actual DB shape may differ — the repository maps between them.
 */
export interface QuoteEntity {
  readonly id: string
  readonly orgId: string
  readonly ref: string
  readonly customerId: string
  readonly opportunityId: string | null
  readonly status: QuoteStatus
  readonly pricingTier: PricingTier
  readonly currentVersion: number
  readonly currency: string
  readonly subtotal: string
  readonly taxTotal: string
  readonly total: string
  readonly validUntil: string | null
  readonly notes: string | null
  readonly createdBy: string
  readonly createdAt: string
  readonly updatedAt: string
}

export interface QuoteLineEntity {
  readonly id: string
  readonly quoteId: string
  readonly description: string
  readonly sku: string | null
  readonly quantity: number
  readonly unitPrice: string
  readonly discount: string
  readonly lineTotal: string
  readonly sortOrder: number
}

/**
 * Priced quote version snapshot.
 */
export interface PricedQuote {
  readonly quoteId: string
  readonly version: number
  readonly tier: PricingTier
  readonly lines: readonly PricedLine[]
  readonly subtotal: number
  readonly taxBreakdown: TaxBreakdown
  readonly total: number
  readonly marginValidation: MarginFloorValidation
  readonly requiresApproval: boolean
}

export interface PricedLine {
  readonly description: string
  readonly sku: string | null
  readonly quantity: number
  readonly unitCost: number
  readonly unitPrice: number
  readonly lineTotal: number
  readonly margin: number
}

/**
 * Result of a quote service operation.
 */
export type QuoteServiceResult<T> =
  | { readonly ok: true; readonly data: T; readonly auditEntries: readonly AuditEntry[] }
  | { readonly ok: false; readonly error: string; readonly code: string }

// ── Repository Port ──────────────────────────────────────────────────────────

/**
 * Port interface — injected by the caller (typically from @nzila/commerce-db).
 * Keeps the service independent of Drizzle, Postgres, or any persistence.
 */
export interface QuoteRepository {
  /** Generate the next sequential ref for this org (e.g. QUO-NZI-000001). */
  nextRef(ctx: OrgContext): Promise<string>
  /** Persist a new quote. */
  createQuote(ctx: OrgContext, quote: Omit<QuoteEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuoteEntity>
  /** Persist quote lines for a given quote. */
  createQuoteLines(ctx: OrgContext, quoteId: string, lines: readonly Omit<QuoteLineEntity, 'id'>[]): Promise<QuoteLineEntity[]>
  /** Get a quote by ID. */
  getQuoteById(ctx: OrgContext, quoteId: string): Promise<QuoteEntity | null>
  /** Update quote fields. */
  updateQuote(ctx: OrgContext, quoteId: string, values: Partial<QuoteEntity>): Promise<QuoteEntity>
  /** Save a version snapshot. */
  saveVersion(ctx: OrgContext, quoteId: string, version: number, snapshot: Record<string, unknown>): Promise<void>
}

// ── Default Pricing Template ──────────────────────────────────────────────────

const DEFAULT_TEMPLATE: PricingTemplate = {
  budgetMarginTarget: 25,
  standardMarginTarget: 38,
  premiumMarginTarget: 55,
  budgetMarginFloor: 15,
  standardMarginFloor: 25,
  premiumMarginFloor: 35,
  packagingCostPerBox: 2.50,
  laborCostPerBox: 5.00,
  shippingCostPerBox: 8.00,
  gstRate: 0.05,
  qstRate: 0.09975,
}

// ── Service Implementation ──────────────────────────────────────────────────

/**
 * Create the quote service with an injected repository.
 *
 * Returns an object with all quote lifecycle operations.
 */
export function createQuoteService(repo: QuoteRepository, template?: PricingTemplate) {
  const pricingTemplate = template ?? DEFAULT_TEMPLATE

  // ── Helpers ────────────────────────────────────────────────────────────

  function buildTransitionCtx(ctx: OrgContext): TransitionContext {
    return {
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      meta: {},
    }
  }

  function transitionQuote(
    quote: QuoteEntity,
    targetStatus: QuoteStatus,
    ctx: OrgContext,
  ): TransitionResult<QuoteStatus> {
    return attemptTransition(
      quoteMachine,
      quote.status,
      targetStatus,
      buildTransitionCtx(ctx),
      quote.orgId,
      quote,
    )
  }

  // ── 1. Create Quote ─────────────────────────────────────────────────────

  async function createQuote(
    ctx: OrgContext,
    input: CreateQuoteInput,
  ): Promise<QuoteServiceResult<QuoteEntity>> {
    const ref = await repo.nextRef(ctx)

    const validUntil = input.validDays
      ? new Date(Date.now() + input.validDays * 86_400_000).toISOString()
      : null

    const quote = await repo.createQuote(ctx, {
      orgId: ctx.orgId,
      ref,
      customerId: input.customerId,
      opportunityId: input.opportunityId ?? null,
      status: QuoteStatus.DRAFT,
      pricingTier: input.pricingTier,
      currentVersion: 1,
      currency: 'CAD',
      subtotal: '0',
      taxTotal: '0',
      total: '0',
      validUntil,
      notes: input.notes ?? null,
      createdBy: ctx.actorId,
    })

    // Store initial lines
    const lineEntities = input.lines.map((line, idx) => ({
      quoteId: quote.id,
      description: line.description,
      sku: line.sku ?? null,
      quantity: line.quantity,
      unitPrice: '0', // Will be priced in the pricing step
      discount: '0',
      lineTotal: '0',
      sortOrder: idx,
    }))
    await repo.createQuoteLines(ctx, quote.id, lineEntities)

    const auditEntry = buildActionAuditEntry({
      id: crypto.randomUUID(),
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.QUOTE,
      targetEntityId: quote.id,
      action: AuditAction.CREATE,
      label: 'Created draft quote',
      metadata: { ref, customerId: input.customerId, tier: input.pricingTier },
    })

    return { ok: true, data: quote, auditEntries: [auditEntry] }
  }

  // ── 2. Price Quote ──────────────────────────────────────────────────────

  function priceQuote(
    ctx: OrgContext,
    quote: QuoteEntity,
    lines: readonly QuoteLineInput[],
    boxCount: number,
  ): QuoteServiceResult<PricedQuote> {
    // Validate transition: must be DRAFT → PRICING
    const result = transitionQuote(quote, QuoteStatus.PRICING, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const pricingItems: PricingItem[] = lines.map((line) => ({
      productId: line.sku ?? line.description,
      quantity: line.quantity,
      unitCost: line.unitCost,
    }))

    // Calculate pricing for the selected tier
    const pricing = calculateTierPricing(pricingItems, boxCount, quote.pricingTier, pricingTemplate)
    if (!pricing.success) {
      return { ok: false, error: pricing.error, code: 'PRICING_FAILED' }
    }

    const taxes = calculateQuebecTaxes(
      pricing.data.priceBeforeTax,
      pricingTemplate.gstRate,
      pricingTemplate.qstRate,
    )
    const marginValidation = validateMarginFloor(
      pricing.data.actualMargin,
      quote.pricingTier,
      pricingTemplate,
    )

    // Distribute pricing proportionally across lines
    const totalComponentCost = lines.reduce((sum, l) => sum + l.unitCost * l.quantity, 0)
    const pricedLines: PricedLine[] = lines.map((line) => {
      const lineCost = line.unitCost * line.quantity
      const fraction = totalComponentCost > 0 ? lineCost / totalComponentCost : 1 / lines.length
      const lineTotal = pricing.data.priceBeforeTax * fraction
      const unitPrice = lineTotal / line.quantity
      return {
        description: line.description,
        sku: line.sku ?? null,
        quantity: line.quantity,
        unitCost: line.unitCost,
        unitPrice,
        lineTotal,
        margin: pricing.data.actualMargin,
      }
    })

    const subtotal = pricing.data.priceBeforeTax
    const taxBreakdown: TaxBreakdown = taxes

    const pricedQuote: PricedQuote = {
      quoteId: quote.id,
      version: quote.currentVersion,
      tier: quote.pricingTier,
      lines: pricedLines,
      subtotal,
      taxBreakdown,
      total: taxes.finalPrice,
      marginValidation,
      requiresApproval: !marginValidation.isValid,
    }

    const transitionAudit = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.QUOTE,
      targetEntityId: quote.id,
      metadata: {
        tier: quote.pricingTier,
        subtotal,
        total: pricedQuote.total,
        requiresApproval: pricedQuote.requiresApproval,
      },
    })

    return { ok: true, data: pricedQuote, auditEntries: [transitionAudit] }
  }

  // ── 3. Complete Pricing (PRICING → READY) ──────────────────────────────

  function completePricing(
    ctx: OrgContext,
    quote: QuoteEntity,
  ): QuoteServiceResult<TransitionSuccess<QuoteStatus>> {
    const result = transitionQuote(quote, QuoteStatus.READY, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.QUOTE,
      targetEntityId: quote.id,
      metadata: {},
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 4. Send Quote (READY → SENT) ──────────────────────────────────────

  function sendQuote(
    ctx: OrgContext,
    quote: QuoteEntity,
  ): QuoteServiceResult<TransitionSuccess<QuoteStatus>> {
    const result = transitionQuote(quote, QuoteStatus.SENT, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.QUOTE,
      targetEntityId: quote.id,
      metadata: {},
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 5. Accept Quote (REVIEWING/SENT → ACCEPTED) ───────────────────────

  function acceptQuote(
    ctx: OrgContext,
    quote: QuoteEntity,
  ): QuoteServiceResult<TransitionSuccess<QuoteStatus>> {
    // Can accept from REVIEWING or directly from SENT
    const result = transitionQuote(quote, QuoteStatus.ACCEPTED, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.QUOTE,
      targetEntityId: quote.id,
      metadata: { decision: ApprovalDecision.APPROVED },
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 6. Decline Quote (REVIEWING/SENT → DECLINED) ──────────────────────

  function declineQuote(
    ctx: OrgContext,
    quote: QuoteEntity,
    reason?: string,
  ): QuoteServiceResult<TransitionSuccess<QuoteStatus>> {
    const result = transitionQuote(quote, QuoteStatus.DECLINED, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.QUOTE,
      targetEntityId: quote.id,
      metadata: { decision: ApprovalDecision.REJECTED, reason },
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 7. Cancel Quote (any non-terminal → CANCELLED) ─────────────────────

  function cancelQuote(
    ctx: OrgContext,
    quote: QuoteEntity,
    reason?: string,
  ): QuoteServiceResult<TransitionSuccess<QuoteStatus>> {
    const result = transitionQuote(quote, QuoteStatus.CANCELLED, ctx)
    if (!result.ok) {
      return { ok: false, error: result.reason, code: result.code }
    }

    const auditEntry = buildTransitionAuditEntry(result, {
      id: crypto.randomUUID(),
      orgId: ctx.orgId,
      actorId: ctx.actorId,
      role: ctx.role as OrgRole,
      entityType: CommerceEntityType.QUOTE,
      targetEntityId: quote.id,
      metadata: { reason },
    })

    return { ok: true, data: result, auditEntries: [auditEntry] }
  }

  // ── 8. Get Available Actions ──────────────────────────────────────────

  function getAvailableActions(
    ctx: OrgContext,
    quote: QuoteEntity,
  ): readonly string[] {
    const tctx = buildTransitionCtx(ctx)
    const transitions = getAvailableTransitions(quoteMachine, quote.status, tctx, quote.orgId, quote)
    return transitions.map((t) => t.to)
  }

  // ── Return service object ─────────────────────────────────────────────

  return {
    createQuote,
    priceQuote,
    completePricing,
    sendQuote,
    acceptQuote,
    declineQuote,
    cancelQuote,
    getAvailableActions,
  }
}
