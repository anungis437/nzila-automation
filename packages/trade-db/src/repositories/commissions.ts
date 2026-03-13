/**
 * @nzila/trade-db — Commissions repository
 */

import type { TradeDbContext, TradeReadContext } from '../types'
import { db } from '@nzila/db'
import { tradeCommissions } from '@nzila/db/schema'
import { eq, and } from 'drizzle-orm'

export interface TradeCommissionRow {
  id: string
  orgId: string
  dealId: string
  partyId: string
  policy: Record<string, unknown>
  calculatedAmount: string | null
  currency: string
  status: string
  finalizedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateCommissionInput {
  dealId: string
  partyId: string
  policy: Record<string, unknown>
  currency: string
}

export interface FinalizeCommissionInput {
  id: string
  calculatedAmount: string
}

export interface TradeCommissionRepository {
  listByDeal(ctx: TradeReadContext, dealId: string): Promise<TradeCommissionRow[]>
  getById(ctx: TradeReadContext, id: string): Promise<TradeCommissionRow | null>
  create(ctx: TradeDbContext, input: CreateCommissionInput): Promise<TradeCommissionRow>
  finalize(ctx: TradeDbContext, input: FinalizeCommissionInput): Promise<TradeCommissionRow>
}

// ── Drizzle implementation ──────────────────────────────────────────────────

function toRow(r: typeof tradeCommissions.$inferSelect): TradeCommissionRow {
  return {
    id: r.id, orgId: r.orgId, dealId: r.dealId, partyId: r.partyId,
    policy: (r.policy ?? {}) as Record<string, unknown>,
    calculatedAmount: r.calculatedAmount, currency: r.currency,
    status: r.status, finalizedAt: r.finalizedAt,
    createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}

export function createTradeCommissionRepository(): TradeCommissionRepository {
  return {
    async listByDeal(ctx, dealId) {
      const rows = await db.select().from(tradeCommissions).where(and(eq(tradeCommissions.orgId, ctx.orgId), eq(tradeCommissions.dealId, dealId)))
      return rows.map(toRow)
    },
    async getById(ctx, id) {
      const [row] = await db.select().from(tradeCommissions).where(and(eq(tradeCommissions.orgId, ctx.orgId), eq(tradeCommissions.id, id)))
      return row ? toRow(row) : null
    },
    async create(ctx, input) {
      const [row] = await db.insert(tradeCommissions).values({
        orgId: ctx.orgId, dealId: input.dealId,
        partyId: input.partyId, policy: input.policy,
        currency: input.currency,
      }).returning()
      return toRow(row!)
    },
    async finalize(ctx, input) {
      const [row] = await db.update(tradeCommissions).set({
        calculatedAmount: input.calculatedAmount,
        status: 'finalized' as typeof tradeCommissions.$inferInsert.status,
        finalizedAt: new Date(), updatedAt: new Date(),
      }).where(and(eq(tradeCommissions.orgId, ctx.orgId), eq(tradeCommissions.id, input.id))).returning()
      return toRow(row!)
    },
  }
}
