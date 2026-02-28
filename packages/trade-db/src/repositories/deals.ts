/**
 * @nzila/trade-db — Deals repository
 */

import type { TradeDbContext, TradeReadContext } from '../types'

export interface TradeDealRow {
  id: string
  entityId: string
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
