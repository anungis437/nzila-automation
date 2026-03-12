/**
 * @nzila/trade-db — Deals repository
 */

import type { TradeDbContext, TradeReadContext } from '../types'
import { db } from '@nzila/db'
import { tradeDeals } from '@nzila/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

export interface TradeDealRow {
  id: string
  orgId: string
  refNumber: string
  sellerPartyId: string
  buyerPartyId: string
  listingId: string | null
  stage: string
  totalValue: string
  currency: string
  notes: string | null
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface CreateDealInput {
  sellerPartyId: string
  buyerPartyId: string
  listingId?: string | null
  totalValue: string
  currency: string
  notes?: string | null
  metadata?: Record<string, unknown>
}

export interface UpdateDealInput {
  id: string
  stage?: string
  totalValue?: string
  notes?: string | null
  metadata?: Record<string, unknown>
}

export interface TradeDealRepository {
  list(ctx: TradeReadContext): Promise<TradeDealRow[]>
  getById(ctx: TradeReadContext, id: string): Promise<TradeDealRow | null>
  create(ctx: TradeDbContext, input: CreateDealInput): Promise<TradeDealRow>
  update(ctx: TradeDbContext, input: UpdateDealInput): Promise<TradeDealRow>
  updateStage(ctx: TradeDbContext, id: string, stage: string): Promise<TradeDealRow>
}

// ── Drizzle implementation ──────────────────────────────────────────────────

function toRow(r: typeof tradeDeals.$inferSelect): TradeDealRow {
  return {
    id: r.id, orgId: r.orgId, refNumber: r.refNumber,
    sellerPartyId: r.sellerPartyId, buyerPartyId: r.buyerPartyId,
    listingId: r.listingId, stage: r.stage, totalValue: r.totalValue,
    currency: r.currency, notes: r.notes,
    metadata: (r.metadata ?? {}) as Record<string, unknown>,
    createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}

function generateRefNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = randomUUID().slice(0, 6).toUpperCase()
  return `TRD-${ts}-${rand}`.slice(0, 30)
}

export function createTradeDealRepository(): TradeDealRepository {
  return {
    async list(ctx) {
      const rows = await db.select().from(tradeDeals).where(eq(tradeDeals.orgId, ctx.orgId))
      return rows.map(toRow)
    },
    async getById(ctx, id) {
      const [row] = await db.select().from(tradeDeals).where(and(eq(tradeDeals.orgId, ctx.orgId), eq(tradeDeals.id, id)))
      return row ? toRow(row) : null
    },
    async create(ctx, input) {
      const [row] = await db.insert(tradeDeals).values({
        orgId: ctx.orgId, refNumber: generateRefNumber(),
        sellerPartyId: input.sellerPartyId, buyerPartyId: input.buyerPartyId,
        listingId: input.listingId ?? null, totalValue: input.totalValue,
        currency: input.currency, notes: input.notes ?? null,
        metadata: input.metadata ?? {},
      }).returning()
      return toRow(row)
    },
    async update(ctx, input) {
      const updates: Record<string, unknown> = { updatedAt: new Date() }
      if (input.stage !== undefined) updates.stage = input.stage
      if (input.totalValue !== undefined) updates.totalValue = input.totalValue
      if (input.notes !== undefined) updates.notes = input.notes
      if (input.metadata !== undefined) updates.metadata = input.metadata
      const [row] = await db.update(tradeDeals).set(updates).where(and(eq(tradeDeals.orgId, ctx.orgId), eq(tradeDeals.id, input.id))).returning()
      return toRow(row)
    },
    async updateStage(ctx, id, stage) {
      const [row] = await db.update(tradeDeals).set({ stage: stage as typeof tradeDeals.$inferInsert.stage, updatedAt: new Date() }).where(and(eq(tradeDeals.orgId, ctx.orgId), eq(tradeDeals.id, id))).returning()
      return toRow(row)
    },
  }
}
