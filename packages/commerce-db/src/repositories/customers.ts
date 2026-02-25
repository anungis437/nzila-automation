/**
 * @nzila/commerce-db — Customers repository
 *
 * Org-scoped CRUD for the commerce_customers table.
 * Reads use ReadOnlyScopedDb. Writes use AuditedScopedDb.
 *
 * @module @nzila/commerce-db/customers
 */
import {
  createScopedDb,
  createAuditedScopedDb,
  commerceCustomers,
} from '@nzila/db'
import { eq } from 'drizzle-orm'
import type { CommerceDbContext, CommerceReadContext, PaginationOpts } from '../types'

// ── Reads ─────────────────────────────────────────────────────────────────

export async function listCustomers(
  ctx: CommerceReadContext,
  opts: PaginationOpts = {},
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0

  const rows = await db.select(commerceCustomers)
  // Sort by most-recently-created first and apply pagination in-memory
  // (ScopedDb auto-filters by entity_id)
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

export async function getCustomerById(
  ctx: CommerceReadContext,
  customerId: string,
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  const rows = await db.select(
    commerceCustomers,
    eq(commerceCustomers.id, customerId),
  )
  return rows[0] ?? null
}

// ── Writes ────────────────────────────────────────────────────────────────

export async function createCustomer(
  ctx: CommerceDbContext,
  values: {
    name: string
    email?: string | null
    phone?: string | null
    company?: string | null
    address?: Record<string, unknown> | null
    notes?: string | null
    metadata?: Record<string, unknown>
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.entityId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.insert(commerceCustomers, values)
}

export async function updateCustomer(
  ctx: CommerceDbContext,
  customerId: string,
  values: {
    name?: string
    email?: string | null
    phone?: string | null
    company?: string | null
    address?: Record<string, unknown> | null
    notes?: string | null
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
    commerceCustomers,
    { ...values, updatedAt: new Date() },
    eq(commerceCustomers.id, customerId),
  )
}

export async function deleteCustomer(
  ctx: CommerceDbContext,
  customerId: string,
) {
  const db = createAuditedScopedDb({
    orgId: ctx.entityId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.delete(commerceCustomers, eq(commerceCustomers.id, customerId))
}
