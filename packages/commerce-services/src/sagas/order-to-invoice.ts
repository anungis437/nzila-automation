/**
 * @nzila/commerce-services — Order-to-Invoice Saga
 *
 * Triggered when an order is confirmed. Fetches the confirmed order
 * and creates a draft Invoice from the order data.
 *
 * Steps:
 *   1. fetch-order — Read + validate the confirmed order + lines
 *   2. create-invoice — Build and persist the invoice from order data
 *
 * Compensation:
 *   - fetch-order: no-op (read-only)
 *   - create-invoice: cancels the draft invoice
 *
 * @module @nzila/commerce-services/sagas/order-to-invoice
 */
import { CommerceEventTypes, type SagaDefinition } from '@nzila/commerce-events'
import type { OrgContext } from '@nzila/commerce-core/types'
import { OrgRole, OrderStatus } from '@nzila/commerce-core/enums'
import type { OrderEntity, OrderLineEntity } from '../order-service'
import type { InvoiceEntity, InvoiceServiceResult, CreateInvoiceInput } from '../invoice-service'

// ── Saga context data ───────────────────────────────────────────────────────

export interface OrderToInvoiceData extends Record<string, unknown> {
  /** Supplied by trigger event payload */
  orderId: string
  /** Set by step 1 */
  order?: OrderEntity
  orderLines?: readonly OrderLineEntity[]
  /** Set by step 2 */
  invoice?: InvoiceEntity
}

// ── Dependency ports ────────────────────────────────────────────────────────

/**
 * Ports the saga needs — injected by the caller.
 */
export interface OrderToInvoicePorts {
  getOrderById(ctx: OrgContext, orderId: string): Promise<OrderEntity | null>
  getOrderLines(ctx: OrgContext, orderId: string): Promise<readonly OrderLineEntity[]>
  createInvoice(ctx: OrgContext, input: CreateInvoiceInput): Promise<InvoiceServiceResult<InvoiceEntity>>
  cancelInvoice(ctx: OrgContext, invoice: InvoiceEntity, reason: string): Promise<void> | void
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function toOrgContext(ctx: { entityId: string; actorId: string; correlationId: string }): OrgContext {
  return {
    entityId: ctx.entityId,
    actorId: ctx.actorId,
    role: OrgRole.ADMIN,
    permissions: [],
    requestId: ctx.correlationId,
  }
}

// ── Saga Factory ────────────────────────────────────────────────────────────

/**
 * Create the order-to-invoice saga definition with injected ports.
 *
 * Register with a SagaOrchestrator to auto-trigger on 'order.confirmed':
 * ```ts
 * const saga = createOrderToInvoiceSaga(ports)
 * orchestrator.register(saga)
 * ```
 */
export function createOrderToInvoiceSaga(ports: OrderToInvoicePorts): SagaDefinition<OrderToInvoiceData> {
  return {
    name: 'order-to-invoice',
    triggerEvent: CommerceEventTypes.ORDER_CONFIRMED,
    steps: [
      // ── Step 1: Fetch Order ─────────────────────────────────────────────
      {
        name: 'fetch-order',
        async execute(ctx) {
          const orgCtx = toOrgContext(ctx)
          const order = await ports.getOrderById(orgCtx, ctx.data.orderId)

          if (!order) {
            return { ok: false, error: `Order ${ctx.data.orderId} not found` }
          }
          if (order.status !== OrderStatus.CONFIRMED) {
            return {
              ok: false,
              error: `Order ${ctx.data.orderId} is not confirmed (status: ${order.status})`,
            }
          }

          const lines = await ports.getOrderLines(orgCtx, ctx.data.orderId)

          ctx.data.order = order
          ctx.data.orderLines = lines

          return { ok: true, data: { orderId: order.id, ref: order.ref } }
        },
        async compensate() {
          // Read-only step — nothing to compensate
          return { ok: true, data: null }
        },
      },

      // ── Step 2: Create Invoice ──────────────────────────────────────────
      {
        name: 'create-invoice',
        async execute(ctx) {
          const orgCtx = toOrgContext(ctx)
          const order = ctx.data.order!
          const lines: readonly OrderLineEntity[] = ctx.data.orderLines ?? []

          const invoiceLines = lines.map((line: OrderLineEntity, idx: number) => ({
            description: line.itemName,
            quantity: line.quantity,
            unitPrice: Number(line.unitPrice),
            lineTotal: Number(line.lineTotal),
            sortOrder: idx,
          }))

          const result = await ports.createInvoice(orgCtx, {
            orderId: order.id,
            customerId: order.customerId,
            lines: invoiceLines,
            subtotal: Number(order.subtotal),
            taxTotal: Number(order.taxTotal),
            grandTotal: Number(order.grandTotal),
            dueDays: 30,
          })

          if (!result.ok) {
            return { ok: false, error: result.error }
          }

          ctx.data.invoice = result.data
          return { ok: true, data: { invoiceId: result.data.id, ref: result.data.ref } }
        },
        async compensate(ctx) {
          // Cancel the draft invoice if it was created
          if (ctx.data.invoice) {
            const orgCtx = toOrgContext(ctx)
            await ports.cancelInvoice(
              orgCtx,
              ctx.data.invoice,
              'Saga compensation — order-to-invoice rolling back',
            )
          }
          return { ok: true, data: null }
        },
      },
    ],
  }
}
