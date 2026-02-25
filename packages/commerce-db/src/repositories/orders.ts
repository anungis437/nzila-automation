/**
 * @nzila/commerce-db — Orders repository
 *
 * Org-scoped CRUD for commerce_orders and commerce_order_lines.
 *
 * @module @nzila/commerce-db/orders
 */
import {
  createScopedDb,
  createAuditedScopedDb,
  commerceOrders,
  commerceOrderLines,
} from '@nzila/db'
import { eq } from 'drizzle-orm'
import type { CommerceDbContext, CommerceReadContext, PaginationOpts } from '../types'

// ── Reads ─────────────────────────────────────────────────────────────────

export async function listOrders(
  ctx: CommerceReadContext,
  opts: PaginationOpts = {},
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0

  const rows = await db.select(commerceOrders)
  const sorted = rows.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  return {
    rows: sorted.slice(offset, offset + limit),
    total: sorted.length,
    limit,
    offset,
  }
}

export async function getOrderById(
  ctx: CommerceReadContext,
  orderId: string,
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  const rows = await db.select(
    commerceOrders,
    eq(commerceOrders.id, orderId),
  )
  return rows[0] ?? null
}

export async function getOrderByRef(
  ctx: CommerceReadContext,
  ref: string,
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  const rows = await db.select(
    commerceOrders,
    eq(commerceOrders.ref, ref),
  )
  return rows[0] ?? null
}

export async function listOrderLines(
  ctx: CommerceReadContext,
  orderId: string,
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  const rows = await db.select(
    commerceOrderLines,
    eq(commerceOrderLines.orderId, orderId),
  )
  return rows.sort((a, b) => a.sortOrder - b.sortOrder)
}

// ── Writes ────────────────────────────────────────────────────────────────

export async function createOrder(
  ctx: CommerceDbContext,
  values: {
    customerId: string
    quoteId?: string | null
    ref: string
    currency?: string
    subtotal: string
    taxTotal: string
    total: string
    shippingAddress?: Record<string, unknown> | null
    billingAddress?: Record<string, unknown> | null
    notes?: string | null
    metadata?: Record<string, unknown>
    createdBy: string
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.entityId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.insert(commerceOrders, values)
}

export async function updateOrder(
  ctx: CommerceDbContext,
  orderId: string,
  values: {
    status?: string
    shippingAddress?: Record<string, unknown> | null
    billingAddress?: Record<string, unknown> | null
    notes?: string | null
    orderLockedAt?: Date | null
    metadata?: Record<string, unknown>
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.entityId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.update(
    commerceOrders,
    { ...values, updatedAt: new Date() },
    eq(commerceOrders.id, orderId),
  )
}

export async function createOrderLine(
  ctx: CommerceDbContext,
  values: {
    orderId: string
    quoteLineId?: string | null
    description: string
    sku?: string | null
    quantity: number
    unitPrice: string
    discount?: string
    lineTotal: string
    sortOrder?: number
    metadata?: Record<string, unknown>
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.entityId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.insert(commerceOrderLines, values)
}

export async function updateOrderLine(
  ctx: CommerceDbContext,
  lineId: string,
  values: {
    description?: string
    quantity?: number
    unitPrice?: string
    discount?: string
    lineTotal?: string
    sortOrder?: number
    metadata?: Record<string, unknown>
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.entityId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.update(
    commerceOrderLines,
    { ...values, updatedAt: new Date() },
    eq(commerceOrderLines.id, lineId),
  )
}

export async function deleteOrderLine(
  ctx: CommerceDbContext,
  lineId: string,
) {
  const db = createAuditedScopedDb({
    orgId: ctx.entityId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.delete(commerceOrderLines, eq(commerceOrderLines.id, lineId))
}
