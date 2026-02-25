/**
 * @nzila/commerce-db — Quotes repository
 *
 * Org-scoped CRUD for commerce_quotes, commerce_quote_versions,
 * and commerce_quote_lines tables.
 *
 * @module @nzila/commerce-db/quotes
 */
import {
  createScopedDb,
  createAuditedScopedDb,
  commerceQuotes,
  commerceQuoteVersions,
  commerceQuoteLines,
} from '@nzila/db'
import { eq, and } from 'drizzle-orm'
import type { CommerceDbContext, CommerceReadContext, PaginationOpts } from '../types'

// ── Reads ─────────────────────────────────────────────────────────────────

export async function listQuotes(
  ctx: CommerceReadContext,
  opts: PaginationOpts = {},
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0

  const rows = await db.select(commerceQuotes)
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

export async function getQuoteById(
  ctx: CommerceReadContext,
  quoteId: string,
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  const rows = await db.select(
    commerceQuotes,
    eq(commerceQuotes.id, quoteId),
  )
  return rows[0] ?? null
}

export async function getQuoteByRef(
  ctx: CommerceReadContext,
  ref: string,
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  const rows = await db.select(
    commerceQuotes,
    eq(commerceQuotes.ref, ref),
  )
  return rows[0] ?? null
}

export async function listQuoteLines(
  ctx: CommerceReadContext,
  quoteId: string,
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  const rows = await db.select(
    commerceQuoteLines,
    eq(commerceQuoteLines.quoteId, quoteId),
  )
  return rows.sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function listQuoteVersions(
  ctx: CommerceReadContext,
  quoteId: string,
) {
  const db = createScopedDb({ orgId: ctx.entityId })
  const rows = await db.select(
    commerceQuoteVersions,
    eq(commerceQuoteVersions.quoteId, quoteId),
  )
  return rows.sort((a, b) => a.version - b.version)
}

// ── Writes ────────────────────────────────────────────────────────────────

export async function createQuote(
  ctx: CommerceDbContext,
  values: {
    customerId: string
    opportunityId?: string | null
    ref: string
    pricingTier?: string
    currency?: string
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
  return db.insert(commerceQuotes, values)
}

export async function updateQuote(
  ctx: CommerceDbContext,
  quoteId: string,
  values: {
    status?: string
    pricingTier?: string
    currentVersion?: number
    subtotal?: string
    taxTotal?: string
    total?: string
    validUntil?: Date | null
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
    commerceQuotes,
    { ...values, updatedAt: new Date() },
    eq(commerceQuotes.id, quoteId),
  )
}

export async function createQuoteLine(
  ctx: CommerceDbContext,
  values: {
    quoteId: string
    description: string
    sku?: string | null
    quantity?: number
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
  return db.insert(commerceQuoteLines, values)
}

export async function updateQuoteLine(
  ctx: CommerceDbContext,
  lineId: string,
  values: {
    description?: string
    sku?: string | null
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
    commerceQuoteLines,
    { ...values, updatedAt: new Date() },
    eq(commerceQuoteLines.id, lineId),
  )
}

export async function deleteQuoteLine(
  ctx: CommerceDbContext,
  lineId: string,
) {
  const db = createAuditedScopedDb({
    orgId: ctx.entityId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.delete(commerceQuoteLines, eq(commerceQuoteLines.id, lineId))
}

export async function createQuoteVersion(
  ctx: CommerceDbContext,
  values: {
    quoteId: string
    version: number
    snapshot: Record<string, unknown>
    authorId: string
  },
) {
  const db = createAuditedScopedDb({
    orgId: ctx.entityId,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    actorRole: ctx.actorRole,
  })
  return db.insert(commerceQuoteVersions, values)
}
