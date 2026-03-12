/**
 * @nzila/trade-db — Financing repository
 */

import type { TradeDbContext, TradeReadContext } from '../types'
import { db } from '@nzila/db'
import { tradeFinancingTerms } from '@nzila/db/schema'
import { eq, and } from 'drizzle-orm'

export interface TradeFinancingRow {
  id: string
  orgId: string
  dealId: string
  terms: Record<string, unknown>
  provider: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateFinancingInput {
  dealId: string
  terms: Record<string, unknown>
  provider?: string | null
}

export interface UpdateFinancingInput {
  id: string
  status?: string
  terms?: Record<string, unknown>
}

export interface TradeFinancingRepository {
  listByDeal(ctx: TradeReadContext, dealId: string): Promise<TradeFinancingRow[]>
  getById(ctx: TradeReadContext, id: string): Promise<TradeFinancingRow | null>
  create(ctx: TradeDbContext, input: CreateFinancingInput): Promise<TradeFinancingRow>
  update(ctx: TradeDbContext, input: UpdateFinancingInput): Promise<TradeFinancingRow>
}

// ── Drizzle implementation ──────────────────────────────────────────────────

function toRow(r: typeof tradeFinancingTerms.$inferSelect): TradeFinancingRow {
  return {
    id: r.id, orgId: r.orgId, dealId: r.dealId,
    terms: (r.terms ?? {}) as Record<string, unknown>,
    provider: r.provider, status: r.status,
    createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}

export function createTradeFinancingRepository(): TradeFinancingRepository {
  return {
    async listByDeal(ctx, dealId) {
      const rows = await db.select().from(tradeFinancingTerms).where(and(eq(tradeFinancingTerms.orgId, ctx.orgId), eq(tradeFinancingTerms.dealId, dealId)))
      return rows.map(toRow)
    },
    async getById(ctx, id) {
      const [row] = await db.select().from(tradeFinancingTerms).where(and(eq(tradeFinancingTerms.orgId, ctx.orgId), eq(tradeFinancingTerms.id, id)))
      return row ? toRow(row) : null
    },
    async create(ctx, input) {
      const [row] = await db.insert(tradeFinancingTerms).values({
        orgId: ctx.orgId, dealId: input.dealId,
        terms: input.terms, provider: input.provider ?? null,
      }).returning()
      return toRow(row)
    },
    async update(ctx, input) {
      const updates: Record<string, unknown> = { updatedAt: new Date() }
      if (input.status !== undefined) updates.status = input.status
      if (input.terms !== undefined) updates.terms = input.terms
      const [row] = await db.update(tradeFinancingTerms).set(updates).where(and(eq(tradeFinancingTerms.orgId, ctx.orgId), eq(tradeFinancingTerms.id, input.id))).returning()
      return toRow(row)
    },
  }
}
