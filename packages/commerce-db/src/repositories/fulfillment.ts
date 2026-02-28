/**
 * @nzila/commerce-db — Fulfillment repository
 *
 * Org-scoped CRUD for commerce_fulfillment_tasks.
 *
 * @module @nzila/commerce-db/fulfillment
 */
import {
  createScopedDb,
  createAuditedScopedDb,
  commerceFulfillmentTasks,
} from '@nzila/db'
import { eq } from 'drizzle-orm'
import type { CommerceDbContext, CommerceReadContext, PaginationOpts } from '../types'

// ── Reads ─────────────────────────────────────────────────────────────────

export async function listFulfillmentTasks(
  ctx: CommerceReadContext,
  opts: PaginationOpts = {},
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0

  const rows = await db.select(commerceFulfillmentTasks)
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

export async function getFulfillmentTaskById(
  ctx: CommerceReadContext,
  taskId: string,
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  const rows = await db.select(
    commerceFulfillmentTasks,
    eq(commerceFulfillmentTasks.id, taskId),
  )
  return rows[0] ?? null
}

export async function listFulfillmentTasksByOrder(
  ctx: CommerceReadContext,
  orderId: string,
) {
  const db = createScopedDb({ orgId: ctx.orgId })
  return db.select(
    commerceFulfillmentTasks,
    eq(commerceFulfillmentTasks.orderId, orderId),
  )
}

// ── Writes ────────────────────────────────────────────────────────────────

export async function createFulfillmentTask(
  ctx: CommerceDbContext,
  values: {
    orderId: string
    ref: string
    assignedTo?: string | null
    notes?: string | null
    metadata?: Record<string, unknown>
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.insert(commerceFulfillmentTasks, values)
}

export async function updateFulfillmentTask(
  ctx: CommerceDbContext,
  taskId: string,
  values: {
    status?: string
    assignedTo?: string | null
    notes?: string | null
    shippedAt?: Date | null
    deliveredAt?: Date | null
    trackingNumber?: string | null
    carrier?: string | null
    metadata?: Record<string, unknown>
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.update(
    commerceFulfillmentTasks,
    { ...values, updatedAt: new Date() },
    eq(commerceFulfillmentTasks.id, taskId),
  )
}
