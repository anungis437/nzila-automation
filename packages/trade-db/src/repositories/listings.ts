/**
 * @nzila/trade-db — Listings repository
 */

import type { TradeDbContext, TradeReadContext } from '../types'
import { db } from '@nzila/db'
import { tradeListings } from '@nzila/db/schema'
import { eq, and } from 'drizzle-orm'

export interface TradeListingRow {
  id: string
  orgId: string
  partyId: string
  listingType: string
  title: string
  description: string
  currency: string
  askingPrice: string
  quantity: number
  status: string
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface CreateListingInput {
  partyId: string
  listingType: string
  title: string
  description?: string
  currency: string
  askingPrice: string
  quantity?: number
  metadata?: Record<string, unknown>
}

export interface UpdateListingInput {
  id: string
  title?: string
  description?: string
  currency?: string
  askingPrice?: string
  quantity?: number
  status?: string
  metadata?: Record<string, unknown>
}

export interface TradeListingRepository {
  list(ctx: TradeReadContext): Promise<TradeListingRow[]>
  getById(ctx: TradeReadContext, id: string): Promise<TradeListingRow | null>
  create(ctx: TradeDbContext, input: CreateListingInput): Promise<TradeListingRow>
  update(ctx: TradeDbContext, input: UpdateListingInput): Promise<TradeListingRow>
}

// ── Drizzle implementation ──────────────────────────────────────────────────

function toRow(r: typeof tradeListings.$inferSelect): TradeListingRow {
  return {
    id: r.id, orgId: r.orgId, partyId: r.partyId, listingType: r.listingType,
    title: r.title, description: r.description ?? '', currency: r.currency,
    askingPrice: r.askingPrice, quantity: r.quantity, status: r.status,
    metadata: (r.metadata ?? {}) as Record<string, unknown>,
    createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}

export function createTradeListingRepository(): TradeListingRepository {
  return {
    async list(ctx) {
      const rows = await db.select().from(tradeListings).where(eq(tradeListings.orgId, ctx.orgId))
      return rows.map(toRow)
    },
    async getById(ctx, id) {
      const [row] = await db.select().from(tradeListings).where(and(eq(tradeListings.orgId, ctx.orgId), eq(tradeListings.id, id)))
      return row ? toRow(row) : null
    },
    async create(ctx, input) {
      const [row] = await db.insert(tradeListings).values({
        orgId: ctx.orgId, partyId: input.partyId,
        listingType: input.listingType as typeof tradeListings.$inferInsert.listingType,
        title: input.title, description: input.description ?? '',
        currency: input.currency, askingPrice: input.askingPrice,
        quantity: input.quantity ?? 1, metadata: input.metadata ?? {},
      }).returning()
      return toRow(row)
    },
    async update(ctx, input) {
      const updates: Record<string, unknown> = { updatedAt: new Date() }
      if (input.title !== undefined) updates.title = input.title
      if (input.description !== undefined) updates.description = input.description
      if (input.currency !== undefined) updates.currency = input.currency
      if (input.askingPrice !== undefined) updates.askingPrice = input.askingPrice
      if (input.quantity !== undefined) updates.quantity = input.quantity
      if (input.status !== undefined) updates.status = input.status
      if (input.metadata !== undefined) updates.metadata = input.metadata
      const [row] = await db.update(tradeListings).set(updates).where(and(eq(tradeListings.orgId, ctx.orgId), eq(tradeListings.id, input.id))).returning()
      return toRow(row)
    },
  }
}
