import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { ShipmentPlan, ShipmentMilestone, CreateShipmentInput, UpdateMilestoneInput } from '@nzila/agri-core'
import { db } from '@nzila/db'
import { agriShipments, agriShipmentMilestones } from '@nzila/db/schema'
import { eq, and, count, type SQL } from 'drizzle-orm'

function toShipment(row: typeof agriShipments.$inferSelect): ShipmentPlan {
  return {
    id: row.id,
    orgId: row.orgId,
    ref: row.ref,
    batchId: row.batchId,
    destination: row.destination as ShipmentPlan['destination'],
    allocatedWeight: Number(row.allocatedWeight),
    status: row.status,
    plannedDeparture: row.plannedDeparture?.toISOString() ?? null,
    plannedArrival: row.plannedArrival?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toMilestone(row: typeof agriShipmentMilestones.$inferSelect): ShipmentMilestone {
  return {
    id: row.id,
    orgId: row.orgId,
    shipmentId: row.shipmentId,
    milestone: row.milestone,
    occurredAt: row.occurredAt.toISOString(),
    actorId: row.actorId,
    notes: row.notes ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listShipments(
  ctx: AgriReadContext,
  opts: PaginationOpts & { status?: string } = {},
): Promise<PaginatedResult<ShipmentPlan>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  const conditions: SQL[] = [eq(agriShipments.orgId, ctx.orgId)]
  if (opts.status) conditions.push(eq(agriShipments.status, opts.status as typeof agriShipments.$inferSelect.status))
  const where = and(...conditions)!

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(agriShipments).where(where).limit(limit).offset(offset),
    db.select({ value: count() }).from(agriShipments).where(where),
  ])

  return { rows: rows.map(toShipment), total, limit, offset }
}

export async function getShipmentById(ctx: AgriReadContext, shipmentId: string): Promise<ShipmentPlan | null> {
  const [row] = await db
    .select()
    .from(agriShipments)
    .where(and(eq(agriShipments.orgId, ctx.orgId), eq(agriShipments.id, shipmentId)))
    .limit(1)
  return row ? toShipment(row) : null
}

export async function getShipmentMilestones(ctx: AgriReadContext, shipmentId: string): Promise<ShipmentMilestone[]> {
  const rows = await db
    .select()
    .from(agriShipmentMilestones)
    .where(and(eq(agriShipmentMilestones.orgId, ctx.orgId), eq(agriShipmentMilestones.shipmentId, shipmentId)))
  return rows.map(toMilestone)
}

export async function createShipment(ctx: AgriDbContext, values: CreateShipmentInput): Promise<ShipmentPlan> {
  const id = crypto.randomUUID()
  const ref = `SHIP-${id.slice(0, 8).toUpperCase()}`

  const [row] = await db
    .insert(agriShipments)
    .values({
      id,
      orgId: ctx.orgId,
      ref,
      batchId: values.batchId,
      destination: values.destination,
      allocatedWeight: values.allocatedWeight.toString(),
      plannedDeparture: values.plannedDeparture ? new Date(values.plannedDeparture) : null,
      plannedArrival: values.plannedArrival ? new Date(values.plannedArrival) : null,
    })
    .returning()
  return toShipment(row)
}

export async function addMilestone(ctx: AgriDbContext, values: UpdateMilestoneInput): Promise<ShipmentMilestone> {
  const [row] = await db
    .insert(agriShipmentMilestones)
    .values({
      orgId: ctx.orgId,
      shipmentId: values.shipmentId,
      milestone: values.milestone,
      occurredAt: new Date(),
      actorId: ctx.actorId,
      notes: values.notes,
    })
    .returning()
  return toMilestone(row)
}

export async function updateShipmentStatus(ctx: AgriDbContext, shipmentId: string, status: string): Promise<void> {
  await db
    .update(agriShipments)
    .set({ status: status as typeof agriShipments.$inferSelect.status, updatedAt: new Date() })
    .where(and(eq(agriShipments.orgId, ctx.orgId), eq(agriShipments.id, shipmentId)))
}
