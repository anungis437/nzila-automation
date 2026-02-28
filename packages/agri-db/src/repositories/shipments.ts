import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { ShipmentPlan, ShipmentMilestone, CreateShipmentInput, UpdateMilestoneInput } from '@nzila/agri-core'

export async function listShipments(
  ctx: AgriReadContext,
  opts: PaginationOpts & { status?: string } = {},
): Promise<PaginatedResult<ShipmentPlan>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  void ctx
  return { rows: [], total: 0, limit, offset }
}

export async function getShipmentById(ctx: AgriReadContext, shipmentId: string): Promise<ShipmentPlan | null> {
  void ctx; void shipmentId
  return null
}

export async function getShipmentMilestones(ctx: AgriReadContext, shipmentId: string): Promise<ShipmentMilestone[]> {
  void ctx; void shipmentId
  return []
}

export async function createShipment(ctx: AgriDbContext, values: CreateShipmentInput): Promise<ShipmentPlan> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  return {
    id,
    orgId: ctx.orgId,
    ref: `SHIP-${id.slice(0, 8).toUpperCase()}`,
    batchId: values.batchId,
    destination: values.destination,
    allocatedWeight: values.allocatedWeight,
    status: 'planned',
    plannedDeparture: values.plannedDeparture,
    plannedArrival: values.plannedArrival,
    createdAt: now,
    updatedAt: now,
  }
}

export async function addMilestone(ctx: AgriDbContext, values: UpdateMilestoneInput): Promise<ShipmentMilestone> {
  const id = crypto.randomUUID()
  return {
    id,
    orgId: ctx.orgId,
    shipmentId: values.shipmentId,
    milestone: values.milestone,
    occurredAt: new Date().toISOString(),
    actorId: ctx.actorId,
    notes: values.notes,
    createdAt: new Date().toISOString(),
  }
}

export async function updateShipmentStatus(ctx: AgriDbContext, shipmentId: string, status: string): Promise<void> {
  void ctx; void shipmentId; void status
}
