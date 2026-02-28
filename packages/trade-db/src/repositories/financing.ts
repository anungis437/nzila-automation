/**
 * @nzila/trade-db — Financing repository
 */

import type { TradeDbContext, TradeReadContext } from '../types'

export interface TradeFinancingRow {
  id: string
  entityId: string
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
