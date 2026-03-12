/**
 * @nzila/trade-db — Quotes repository
 */

import type { TradeDbContext, TradeReadContext } from '../types'
import { db } from '@nzila/db'
import { tradeQuotes } from '@nzila/db/schema'
import { eq, and } from 'drizzle-orm'

export interface TradeQuoteRow {
  id: string
  orgId: string
  dealId: string
  terms: Record<string, unknown>
  unitPrice: string
  quantity: number
  total: string
  currency: string
  validUntil: Date | null
  status: string
  acceptedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateQuoteInput {
  dealId: string
  terms: Record<string, unknown>
  unitPrice: string
  quantity: number
  currency: string
  validUntil?: Date | null
}

export interface UpdateQuoteInput {
  id: string
  status?: string
  terms?: Record<string, unknown>
  acceptedAt?: Date | null
}

export interface TradeQuoteRepository {
  listByDeal(ctx: TradeReadContext, dealId: string): Promise<TradeQuoteRow[]>
  getById(ctx: TradeReadContext, id: string): Promise<TradeQuoteRow | null>
  create(ctx: TradeDbContext, input: CreateQuoteInput): Promise<TradeQuoteRow>
  update(ctx: TradeDbContext, input: UpdateQuoteInput): Promise<TradeQuoteRow>
}

// ── Drizzle implementation ──────────────────────────────────────────────────

function toRow(r: typeof tradeQuotes.$inferSelect): TradeQuoteRow {
  return {
    id: r.id, orgId: r.orgId, dealId: r.dealId,
    terms: (r.terms ?? {}) as Record<string, unknown>,
    unitPrice: r.unitPrice, quantity: r.quantity, total: r.total,
    currency: r.currency, validUntil: r.validUntil,
    status: r.status, acceptedAt: r.acceptedAt,
    createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}

export function createTradeQuoteRepository(): TradeQuoteRepository {
  return {
    async listByDeal(ctx, dealId) {
      const rows = await db.select().from(tradeQuotes).where(and(eq(tradeQuotes.orgId, ctx.orgId), eq(tradeQuotes.dealId, dealId)))
      return rows.map(toRow)
    },
    async getById(ctx, id) {
      const [row] = await db.select().from(tradeQuotes).where(and(eq(tradeQuotes.orgId, ctx.orgId), eq(tradeQuotes.id, id)))
      return row ? toRow(row) : null
    },
    async create(ctx, input) {
      const total = (Number(input.unitPrice) * input.quantity).toString()
      const [row] = await db.insert(tradeQuotes).values({
        orgId: ctx.orgId, dealId: input.dealId, terms: input.terms,
        unitPrice: input.unitPrice, quantity: input.quantity, total,
        currency: input.currency, validUntil: input.validUntil ?? null,
      }).returning()
      return toRow(row)
    },
    async update(ctx, input) {
      const updates: Record<string, unknown> = { updatedAt: new Date() }
      if (input.status !== undefined) updates.status = input.status
      if (input.terms !== undefined) updates.terms = input.terms
      if (input.acceptedAt !== undefined) updates.acceptedAt = input.acceptedAt
      const [row] = await db.update(tradeQuotes).set(updates).where(and(eq(tradeQuotes.orgId, ctx.orgId), eq(tradeQuotes.id, input.id))).returning()
      return toRow(row)
    },
  }
}
