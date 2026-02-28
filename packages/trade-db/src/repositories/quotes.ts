/**
 * @nzila/trade-db — Quotes repository
 */

import type { TradeDbContext, TradeReadContext } from '../types'

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
