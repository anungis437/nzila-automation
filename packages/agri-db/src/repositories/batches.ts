import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { InventoryBatch, BatchAllocation, CreateBatchInput, AllocateBatchInput as _AllocateBatchInput } from '@nzila/agri-core'
import { db } from '@nzila/db'
import { agriBatches, agriBatchAllocations } from '@nzila/db/schema'
import { eq, and, count, type SQL } from 'drizzle-orm'

function toBatch(row: typeof agriBatches.$inferSelect): InventoryBatch {
  return {
    id: row.id,
    orgId: row.orgId,
    ref: row.ref,
    warehouseId: row.warehouseId,
    cropId: row.cropId,
    totalWeight: Number(row.totalWeight),
    availableWeight: Number(row.availableWeight),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toAllocation(row: typeof agriBatchAllocations.$inferSelect): BatchAllocation {
  return {
    id: row.id,
    orgId: row.orgId,
    batchId: row.batchId,
    lotId: row.lotId,
    weight: Number(row.weight),
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listBatches(
  ctx: AgriReadContext,
  opts: PaginationOpts & { warehouseId?: string; status?: string } = {},
): Promise<PaginatedResult<InventoryBatch>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  const conditions: SQL[] = [eq(agriBatches.orgId, ctx.orgId)]
  if (opts.warehouseId) conditions.push(eq(agriBatches.warehouseId, opts.warehouseId))
  if (opts.status) conditions.push(eq(agriBatches.status, opts.status as typeof agriBatches.$inferSelect.status))
  const where = and(...conditions)!

  const [rows, [{ value: total } = { value: 0 }]] = await Promise.all([
    db.select().from(agriBatches).where(where).limit(limit).offset(offset),
    db.select({ value: count() }).from(agriBatches).where(where),
  ])

  return { rows: rows.map(toBatch), total, limit, offset }
}

export async function getBatchById(ctx: AgriReadContext, batchId: string): Promise<InventoryBatch | null> {
  const [row] = await db
    .select()
    .from(agriBatches)
    .where(and(eq(agriBatches.orgId, ctx.orgId), eq(agriBatches.id, batchId)))
    .limit(1)
  return row ? toBatch(row) : null
}

export async function getBatchAllocations(ctx: AgriReadContext, batchId: string): Promise<BatchAllocation[]> {
  const rows = await db
    .select()
    .from(agriBatchAllocations)
    .where(and(eq(agriBatchAllocations.orgId, ctx.orgId), eq(agriBatchAllocations.batchId, batchId)))
  return rows.map(toAllocation)
}

export async function createBatch(
  ctx: AgriDbContext,
  values: CreateBatchInput,
  lotWeights: { lotId: string; weight: number }[],
): Promise<InventoryBatch> {
  const totalWeight = lotWeights.reduce((sum, l) => sum + l.weight, 0)
  const id = crypto.randomUUID()
  const ref = `BATCH-${id.slice(0, 8).toUpperCase()}`

  const [row] = await db
    .insert(agriBatches)
    .values({
      id,
      orgId: ctx.orgId,
      ref,
      warehouseId: values.warehouseId,
      cropId: values.cropId,
      totalWeight: totalWeight.toString(),
      availableWeight: totalWeight.toString(),
    })
    .returning()

  if (lotWeights.length > 0) {
    await db.insert(agriBatchAllocations).values(
      lotWeights.map((l) => ({
        orgId: ctx.orgId,
        batchId: row!.id,
        lotId: l.lotId,
        weight: l.weight.toString(),
      })),
    )
  }

  return toBatch(row!)
}

export async function allocateBatchToShipment(
  ctx: AgriDbContext,
  batchId: string,
  weight: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (weight <= 0) return { ok: false, error: 'Allocation weight must be positive' }

  const batch = await getBatchById({ orgId: ctx.orgId }, batchId)
  if (!batch) return { ok: false, error: 'Batch not found' }
  if (batch.availableWeight < weight) return { ok: false, error: 'Insufficient available weight' }

  const newAvailable = batch.availableWeight - weight
  await db
    .update(agriBatches)
    .set({
      availableWeight: newAvailable.toString(),
      status: newAvailable === 0 ? 'depleted' : 'allocated',
      updatedAt: new Date(),
    })
    .where(and(eq(agriBatches.orgId, ctx.orgId), eq(agriBatches.id, batchId)))

  return { ok: true }
}
