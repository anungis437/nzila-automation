/**
 * @nzila/trade-db — Commissions repository
 */

import type { TradeDbContext, TradeReadContext } from '../types'

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
