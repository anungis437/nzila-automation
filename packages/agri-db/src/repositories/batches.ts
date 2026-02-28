import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { InventoryBatch, BatchAllocation, CreateBatchInput, AllocateBatchInput } from '@nzila/agri-core'

export async function listBatches(
  ctx: AgriReadContext,
  opts: PaginationOpts & { warehouseId?: string; status?: string } = {},
): Promise<PaginatedResult<InventoryBatch>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  void ctx
  return { rows: [], total: 0, limit, offset }
}

export async function getBatchById(ctx: AgriReadContext, batchId: string): Promise<InventoryBatch | null> {
  void ctx; void batchId
  return null
}

export async function getBatchAllocations(ctx: AgriReadContext, batchId: string): Promise<BatchAllocation[]> {
  void ctx; void batchId
  return []
}

export async function createBatch(
  ctx: AgriDbContext,
  values: CreateBatchInput,
  lotWeights: { lotId: string; weight: number }[],
): Promise<InventoryBatch> {
  const id = crypto.randomUUID()
  const totalWeight = lotWeights.reduce((sum, l) => sum + l.weight, 0)
  const now = new Date().toISOString()
  return {
    id,
    orgId: ctx.orgId,
    ref: `BATCH-${id.slice(0, 8).toUpperCase()}`,
    warehouseId: values.warehouseId,
    cropId: values.cropId,
    totalWeight,
    availableWeight: totalWeight,
    status: 'available',
    createdAt: now,
    updatedAt: now,
  }
}

export async function allocateBatchToShipment(
  ctx: AgriDbContext,
  batchId: string,
  weight: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // No negative stock validation
  void ctx
  if (weight <= 0) return { ok: false, error: 'Allocation weight must be positive' }
  // In real impl: check batch.availableWeight >= weight
  // Then: batch.availableWeight -= weight
  void batchId
  return { ok: true }
}
