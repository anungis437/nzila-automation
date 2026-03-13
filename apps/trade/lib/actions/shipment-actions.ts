/**
 * Trade Server Actions — Shipments.
 *
 * Shipment creation and milestone updates.
 * Every action calls `resolveOrgContext()` first and emits audit.
 */
'use server'

import { resolveOrgContext } from '@/lib/resolve-org'
import { revalidatePath } from 'next/cache'
import {
  createShipmentSchema,
  updateShipmentMilestoneSchema,
  buildActionAuditEntry,
  type TradeServiceResult,
  type TradeShipment,
} from '@nzila/trade-core'
import { createTradeShipmentRepository } from '@nzila/trade-db'

const repo = createTradeShipmentRepository()

export async function createShipment(
  data: unknown,
): Promise<TradeServiceResult<{ shipmentId: string }>> {
  const ctx = await resolveOrgContext()
  const parsed = createShipmentSchema.safeParse(data)

  if (!parsed.success) {
    return { ok: false, data: null, error: parsed.error.message, auditEntries: [] }
  }

  const dbCtx = { orgId: ctx.orgId, actorId: ctx.actorId }
  const row = await repo.create(dbCtx, {
    ...parsed.data,
    estimatedDeparture: parsed.data.estimatedDeparture ? new Date(parsed.data.estimatedDeparture) : null,
    estimatedArrival: parsed.data.estimatedArrival ? new Date(parsed.data.estimatedArrival) : null,
  })

  const entry = buildActionAuditEntry({
    id: crypto.randomUUID(),
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    role: ctx.role,
    entityType: 'trade_shipment',
    targetEntityId: row.id,
    action: 'shipment.created',
    label: `Created shipment ${parsed.data.originCountry} → ${parsed.data.destinationCountry}`,
    metadata: {
      dealId: parsed.data.dealId,
      originCountry: parsed.data.originCountry,
      destinationCountry: parsed.data.destinationCountry,
      carrier: parsed.data.carrier,
    },
  })

  revalidatePath('/trade/shipments')

  return { ok: true, data: { shipmentId: row.id }, error: null, auditEntries: [entry] }
}

export async function updateShipmentMilestone(
  data: unknown,
): Promise<TradeServiceResult<{ shipmentId: string; milestone: string }>> {
  const ctx = await resolveOrgContext()
  const parsed = updateShipmentMilestoneSchema.safeParse(data)

  if (!parsed.success) {
    return { ok: false, data: null, error: parsed.error.message, auditEntries: [] }
  }

  const dbCtx = { orgId: ctx.orgId, actorId: ctx.actorId }
  const existing = await repo.getById({ orgId: ctx.orgId }, parsed.data.shipmentId)
  const milestones = [...((existing?.milestones ?? []) as Record<string, unknown>[]), {
    name: parsed.data.milestoneName,
    completedAt: parsed.data.completedAt,
    recordedAt: new Date().toISOString(),
  }]
  await repo.update(dbCtx, { id: parsed.data.shipmentId, milestones })

  const entry = buildActionAuditEntry({
    id: crypto.randomUUID(),
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    role: ctx.role,
    entityType: 'trade_shipment',
    targetEntityId: parsed.data.shipmentId,
    action: 'shipment.milestone_updated',
    label: `Milestone "${parsed.data.milestoneName}" on shipment ${parsed.data.shipmentId}`,
    metadata: {
      milestoneName: parsed.data.milestoneName,
      completedAt: parsed.data.completedAt,
    },
  })

  revalidatePath('/trade/shipments')

  return {
    ok: true,
    data: { shipmentId: parsed.data.shipmentId, milestone: parsed.data.milestoneName },
    error: null,
    auditEntries: [entry],
  }
}

export async function listShipments(opts?: {
  page?: number
  pageSize?: number
  status?: string
  dealId?: string
}): Promise<TradeServiceResult<{ shipments: TradeShipment[]; total: number }>> {
  const ctx = await resolveOrgContext()

  // listByDeal requires a dealId; if none provided, return empty
  if (!opts?.dealId) {
    return { ok: true, data: { shipments: [], total: 0 }, error: null, auditEntries: [] }
  }

  const rows = await repo.listByDeal({ orgId: ctx.orgId }, opts.dealId)

  return {
    ok: true,
    data: { shipments: rows as unknown as TradeShipment[], total: rows.length },
    error: null,
    auditEntries: [],
  }
}
