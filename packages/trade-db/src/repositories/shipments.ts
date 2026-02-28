/**
 * @nzila/trade-db — Shipments repository
 */

import type { TradeDbContext, TradeReadContext } from '../types'

export interface TradeShipmentRow {
  id: string
  orgId: string
  dealId: string
  originCountry: string
  destinationCountry: string
  lane: string | null
  carrier: string | null
  trackingNumber: string | null
  status: string
  milestones: unknown[]
  estimatedDeparture: Date | null
  estimatedArrival: Date | null
  actualDeparture: Date | null
  actualArrival: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateShipmentInput {
  dealId: string
  originCountry: string
  destinationCountry: string
  lane?: string | null
  carrier?: string | null
  trackingNumber?: string | null
  estimatedDeparture?: Date | null
  estimatedArrival?: Date | null
}

export interface UpdateShipmentInput {
  id: string
  status?: string
  milestones?: unknown[]
  trackingNumber?: string | null
  carrier?: string | null
  actualDeparture?: Date | null
  actualArrival?: Date | null
}

export interface TradeShipmentRepository {
  listByDeal(ctx: TradeReadContext, dealId: string): Promise<TradeShipmentRow[]>
  getById(ctx: TradeReadContext, id: string): Promise<TradeShipmentRow | null>
  create(ctx: TradeDbContext, input: CreateShipmentInput): Promise<TradeShipmentRow>
  update(ctx: TradeDbContext, input: UpdateShipmentInput): Promise<TradeShipmentRow>
}
