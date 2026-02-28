/**
 * @nzila/trade-db — Listings repository
 */

import type { TradeDbContext, TradeReadContext } from '../types'

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
