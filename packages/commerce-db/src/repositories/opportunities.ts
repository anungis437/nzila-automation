/**
 * @nzila/commerce-db — Opportunities repository
 *
 * Org-scoped CRUD for commerce_opportunities.
 *
 * @module @nzila/commerce-db/opportunities
 */
import {
  createScopedDb,
  createAuditedScopedDb,
  commerceOpportunities,
} from '@nzila/db'
import { eq } from 'drizzle-orm'
import type { CommerceDbContext, CommerceReadContext, PaginationOpts } from '../types'

// ── Reads ─────────────────────────────────────────────────────────────────

export async function listOpportunities(
  ctx: CommerceReadContext,
  opts: PaginationOpts = {},
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0

  const rows = await db.select(commerceOpportunities)
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

export async function getOpportunityById(
  ctx: CommerceReadContext,
  opportunityId: string,
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  const rows = await db.select(
    commerceOpportunities,
    eq(commerceOpportunities.id, opportunityId),
  )
  return rows[0] ?? null
}

export async function listOpportunitiesByCustomer(
  ctx: CommerceReadContext,
  customerId: string,
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  return db.select(
    commerceOpportunities,
    eq(commerceOpportunities.customerId, customerId),
  )
}

// ── Writes ────────────────────────────────────────────────────────────────

export async function createOpportunity(
  ctx: CommerceDbContext,
  values: {
    customerId: string
    title: string
    description?: string | null
    estimatedValue?: string | null
    metadata?: Record<string, unknown>
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.entityId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.insert(commerceOpportunities, values)
}

export async function updateOpportunity(
  ctx: CommerceDbContext,
  opportunityId: string,
  values: {
    title?: string
    description?: string | null
    estimatedValue?: string | null
    status?: string
    closedAt?: Date | null
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
    commerceOpportunities,
    { ...values, updatedAt: new Date() },
    eq(commerceOpportunities.id, opportunityId),
  )
}
