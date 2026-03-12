/**
 * @nzila/trade-db — Shipments repository
 */

import type { TradeDbContext, TradeReadContext } from '../types'
import { db } from '@nzila/db'
import { tradeShipments } from '@nzila/db/schema'
import { eq, and } from 'drizzle-orm'

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

// ── Drizzle implementation ──────────────────────────────────────────────────

function toRow(r: typeof tradeShipments.$inferSelect): TradeShipmentRow {
  return {
    id: r.id, orgId: r.orgId, dealId: r.dealId,
    originCountry: r.originCountry, destinationCountry: r.destinationCountry,
    lane: r.lane, carrier: r.carrier, trackingNumber: r.trackingNumber,
    status: r.status, milestones: (r.milestones ?? []) as unknown[],
    estimatedDeparture: r.estimatedDeparture, estimatedArrival: r.estimatedArrival,
    actualDeparture: r.actualDeparture, actualArrival: r.actualArrival,
    createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}

export function createTradeShipmentRepository(): TradeShipmentRepository {
  return {
    async listByDeal(ctx, dealId) {
      const rows = await db.select().from(tradeShipments).where(and(eq(tradeShipments.orgId, ctx.orgId), eq(tradeShipments.dealId, dealId)))
      return rows.map(toRow)
    },
    async getById(ctx, id) {
      const [row] = await db.select().from(tradeShipments).where(and(eq(tradeShipments.orgId, ctx.orgId), eq(tradeShipments.id, id)))
      return row ? toRow(row) : null
    },
    async create(ctx, input) {
      const [row] = await db.insert(tradeShipments).values({
        orgId: ctx.orgId, dealId: input.dealId,
        originCountry: input.originCountry, destinationCountry: input.destinationCountry,
        lane: input.lane ?? null, carrier: input.carrier ?? null,
        trackingNumber: input.trackingNumber ?? null,
        estimatedDeparture: input.estimatedDeparture ?? null,
        estimatedArrival: input.estimatedArrival ?? null,
      }).returning()
      return toRow(row)
    },
    async update(ctx, input) {
      const updates: Record<string, unknown> = { updatedAt: new Date() }
      if (input.status !== undefined) updates.status = input.status
      if (input.milestones !== undefined) updates.milestones = input.milestones
      if (input.trackingNumber !== undefined) updates.trackingNumber = input.trackingNumber
      if (input.carrier !== undefined) updates.carrier = input.carrier
      if (input.actualDeparture !== undefined) updates.actualDeparture = input.actualDeparture
      if (input.actualArrival !== undefined) updates.actualArrival = input.actualArrival
      const [row] = await db.update(tradeShipments).set(updates).where(and(eq(tradeShipments.orgId, ctx.orgId), eq(tradeShipments.id, input.id))).returning()
      return toRow(row)
    },
  }
}
