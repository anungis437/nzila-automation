/**
 * @nzila/commerce-db — Disputes repository
 *
 * Org-scoped CRUD for commerce_disputes.
 *
 * @module @nzila/commerce-db/disputes
 */
import {
  createScopedDb,
  createAuditedScopedDb,
  commerceDisputes,
} from '@nzila/db'
import { eq } from 'drizzle-orm'
import type { CommerceDbContext, CommerceReadContext, PaginationOpts } from '../types'

// ── Reads ─────────────────────────────────────────────────────────────────

export async function listDisputes(
  ctx: CommerceReadContext,
  opts: PaginationOpts = {},
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0

  const rows = await db.select(commerceDisputes)
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

export async function getDisputeById(
  ctx: CommerceReadContext,
  disputeId: string,
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  const rows = await db.select(
    commerceDisputes,
    eq(commerceDisputes.id, disputeId),
  )
  return rows[0] ?? null
}

export async function listDisputesByInvoice(
  ctx: CommerceReadContext,
  invoiceId: string,
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  return db.select(
    commerceDisputes,
    eq(commerceDisputes.invoiceId, invoiceId),
  )
}

// ── Writes ────────────────────────────────────────────────────────────────

export async function createDispute(
  ctx: CommerceDbContext,
  values: {
    invoiceId: string
    reason: string
    description: string
    metadata?: Record<string, unknown>
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.entityId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.insert(commerceDisputes, values)
}

export async function updateDispute(
  ctx: CommerceDbContext,
  disputeId: string,
  values: {
    status?: string
    resolution?: string | null
    resolvedAt?: Date | null
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
    commerceDisputes,
    { ...values, updatedAt: new Date() },
    eq(commerceDisputes.id, disputeId),
  )
}
