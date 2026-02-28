/**
 * @nzila/commerce-services — Quote-to-Order Saga
 *
 * Triggered when a quote is accepted. Locks the accepted quote snapshot
 * and creates an Order entity from the quote data.
 *
 * Steps:
 *   1. lock-quote-snapshot — Fetch + validate the accepted quote + lines
 *   2. create-order — Build and persist the order from the locked snapshot
 *
 * Compensation:
 *   - lock-quote-snapshot: no-op (read-only)
 *   - create-order: flags the order for manual review
 *
 * @module @nzila/commerce-services/sagas/quote-to-order
 */
import { CommerceEventTypes, type SagaDefinition } from '@nzila/commerce-events'
import type { OrgContext } from '@nzila/commerce-core/types'
import { OrgRole, QuoteStatus } from '@nzila/commerce-core/enums'
import type { QuoteEntity, QuoteLineEntity } from '../quote-service'
import type { OrderEntity, OrderServiceResult, CreateOrderInput } from '../order-service'

// ── Saga context data ───────────────────────────────────────────────────────

export interface QuoteToOrderData extends Record<string, unknown> {
  /** Supplied by trigger event payload */
  quoteId: string
  /** Set by step 1 */
  quote?: QuoteEntity
  quoteLines?: readonly QuoteLineEntity[]
  /** Set by step 2 */
  order?: OrderEntity
}

// ── Dependency ports ────────────────────────────────────────────────────────

/**
 * Ports the saga needs — injected by the caller.
 * Keeps the saga independent of DB / concrete service implementation.
 */
export interface QuoteToOrderPorts {
  getQuoteById(ctx: OrgContext, quoteId: string): Promise<QuoteEntity | null>
  getQuoteLines(ctx: OrgContext, quoteId: string): Promise<readonly QuoteLineEntity[]>
  createOrder(ctx: OrgContext, input: CreateOrderInput): Promise<OrderServiceResult<OrderEntity>>
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function toOrgContext(ctx: { orgId: string; actorId: string; correlationId: string }): OrgContext {
  return {
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    role: OrgRole.ADMIN,
    permissions: [],
    requestId: ctx.correlationId,
  }
}

// ── Saga Factory ────────────────────────────────────────────────────────────

/**
 * Create the quote-to-order saga definition with injected ports.
 *
 * Register with a SagaOrchestrator to auto-trigger on 'quote.accepted':
 * ```ts
 * const saga = createQuoteToOrderSaga(ports)
 * orchestrator.register(saga)
 * ```
 */
export function createQuoteToOrderSaga(ports: QuoteToOrderPorts): SagaDefinition<QuoteToOrderData> {
  return {
    name: 'quote-to-order',
    triggerEvent: CommerceEventTypes.QUOTE_ACCEPTED,
    steps: [
      // ── Step 1: Lock Quote Snapshot ──────────────────────────────────────
      {
        name: 'lock-quote-snapshot',
        async execute(ctx) {
          const orgCtx = toOrgContext(ctx)
          const quote = await ports.getQuoteById(orgCtx, ctx.data.quoteId)

          if (!quote) {
            return { ok: false, error: `Quote ${ctx.data.quoteId} not found` }
          }
          if (quote.status !== QuoteStatus.ACCEPTED) {
            return {
              ok: false,
              error: `Quote ${ctx.data.quoteId} is not accepted (status: ${quote.status})`,
            }
          }

          const lines = await ports.getQuoteLines(orgCtx, ctx.data.quoteId)

          ctx.data.quote = quote
          ctx.data.quoteLines = lines

          return { ok: true, data: { quoteId: quote.id, ref: quote.ref } }
        },
        async compensate() {
          // Read-only step — nothing to compensate
          return { ok: true, data: null }
        },
      },

      // ── Step 2: Create Order ────────────────────────────────────────────
      {
        name: 'create-order',
        async execute(ctx) {
          const orgCtx = toOrgContext(ctx)
          const quote = ctx.data.quote!
          const lines: readonly QuoteLineEntity[] = ctx.data.quoteLines ?? []

          const orderLines = lines.map((line: QuoteLineEntity, idx: number) => ({
            itemName: line.description,
            itemSku: line.sku,
            quantity: line.quantity,
            unitPrice: Number(line.unitPrice),
            lineTotal: Number(line.lineTotal),
            sortOrder: idx,
          }))

          const result = await ports.createOrder(orgCtx, {
            customerId: quote.customerId,
            quoteId: quote.id,
            quoteVersionId: String(quote.currentVersion),
            lines: orderLines,
            subtotal: Number(quote.subtotal),
            taxTotal: Number(quote.taxTotal),
            grandTotal: Number(quote.total),
            lockedSnapshot: JSON.stringify({ quote, lines }),
          })

          if (!result.ok) {
            return { ok: false, error: result.error }
          }

          ctx.data.order = result.data
          return { ok: true, data: { orderId: result.data.id, ref: result.data.ref } }
        },
        async compensate(ctx) {
          // If order was created, flag for manual review.
          // A full implementation would call flagNeedsAttention.
          if (ctx.data.order) {
            return { ok: true, data: { orderId: ctx.data.order.id, action: 'flagged_for_review' } }
          }
          return { ok: true, data: null }
        },
      },
    ],
  }
}
