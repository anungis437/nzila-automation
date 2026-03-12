import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { Warehouse, CreateWarehouseInput } from '@nzila/agri-core'
import { db } from '@nzila/db'
import { agriWarehouses } from '@nzila/db/schema'
import { eq, and, count } from 'drizzle-orm'

function toWarehouse(row: typeof agriWarehouses.$inferSelect): Warehouse {
  return {
    id: row.id,
    orgId: row.orgId,
    name: row.name,
    location: row.location as Warehouse['location'],
    capacity: row.capacity ? Number(row.capacity) : null,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listWarehouses(
  ctx: AgriReadContext,
  opts: PaginationOpts = {},
): Promise<PaginatedResult<Warehouse>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  const where = eq(agriWarehouses.orgId, ctx.orgId)

  const [rows, [{ value: total }]] = await Promise.all([
    db.select().from(agriWarehouses).where(where).limit(limit).offset(offset),
    db.select({ value: count() }).from(agriWarehouses).where(where),
  ])

  return { rows: rows.map(toWarehouse), total, limit, offset }
}

export async function getWarehouseById(ctx: AgriReadContext, warehouseId: string): Promise<Warehouse | null> {
  const [row] = await db
    .select()
    .from(agriWarehouses)
    .where(and(eq(agriWarehouses.orgId, ctx.orgId), eq(agriWarehouses.id, warehouseId)))
    .limit(1)
  return row ? toWarehouse(row) : null
}

export async function createWarehouse(ctx: AgriDbContext, values: CreateWarehouseInput): Promise<Warehouse> {
  const [row] = await db
    .insert(agriWarehouses)
    .values({
      orgId: ctx.orgId,
      name: values.name,
      location: values.location,
      capacity: values.capacity?.toString() ?? null,
    })
    .returning()
  return toWarehouse(row)
}
