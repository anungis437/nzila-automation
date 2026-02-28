import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { Warehouse, CreateWarehouseInput } from '@nzila/agri-core'

export async function listWarehouses(
  ctx: AgriReadContext,
  opts: PaginationOpts = {},
): Promise<PaginatedResult<Warehouse>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  void ctx
  return { rows: [], total: 0, limit, offset }
}

export async function getWarehouseById(ctx: AgriReadContext, warehouseId: string): Promise<Warehouse | null> {
  void ctx; void warehouseId
  return null
}

export async function createWarehouse(ctx: AgriDbContext, values: CreateWarehouseInput): Promise<Warehouse> {
  const id = crypto.randomUUID()
  return {
    id,
    orgId: ctx.orgId,
    name: values.name,
    location: values.location,
    capacity: values.capacity,
    status: 'active',
    createdAt: new Date().toISOString(),
  }
}
