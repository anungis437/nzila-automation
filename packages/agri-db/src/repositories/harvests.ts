import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { HarvestRecord, RecordHarvestInput } from '@nzila/agri-core'
import { db } from '@nzila/db'
import { agriHarvests } from '@nzila/db/schema'
import { eq, and, count, inArray, type SQL } from 'drizzle-orm'

function toHarvest(row: typeof agriHarvests.$inferSelect): HarvestRecord {
  return {
    id: row.id,
    orgId: row.orgId,
    producerId: row.producerId,
    cropId: row.cropId,
    season: row.season,
    harvestDate: row.harvestDate,
    quantity: Number(row.quantity),
    geoPoint: row.geoPoint as HarvestRecord['geoPoint'],
    notes: row.notes ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listHarvests(
  ctx: AgriReadContext,
  opts: PaginationOpts & { producerId?: string; cropId?: string; season?: string } = {},
): Promise<PaginatedResult<HarvestRecord>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  const conditions: SQL[] = [eq(agriHarvests.orgId, ctx.orgId)]
  if (opts.producerId) conditions.push(eq(agriHarvests.producerId, opts.producerId))
  if (opts.cropId) conditions.push(eq(agriHarvests.cropId, opts.cropId))
  if (opts.season) conditions.push(eq(agriHarvests.season, opts.season))
  const where = and(...conditions)!

  const [rows, [{ value: total } = { value: 0 }]] = await Promise.all([
    db.select().from(agriHarvests).where(where).limit(limit).offset(offset),
    db.select({ value: count() }).from(agriHarvests).where(where),
  ])

  return { rows: rows.map(toHarvest), total, limit, offset }
}

export async function getHarvestById(ctx: AgriReadContext, harvestId: string): Promise<HarvestRecord | null> {
  const [row] = await db
    .select()
    .from(agriHarvests)
    .where(and(eq(agriHarvests.orgId, ctx.orgId), eq(agriHarvests.id, harvestId)))
    .limit(1)
  return row ? toHarvest(row) : null
}

export async function getHarvestsByIds(ctx: AgriReadContext, harvestIds: string[]): Promise<HarvestRecord[]> {
  if (harvestIds.length === 0) return []
  const rows = await db
    .select()
    .from(agriHarvests)
    .where(and(eq(agriHarvests.orgId, ctx.orgId), inArray(agriHarvests.id, harvestIds)))
  return rows.map(toHarvest)
}

export async function recordHarvest(ctx: AgriDbContext, values: RecordHarvestInput): Promise<HarvestRecord> {
  const [row] = await db
    .insert(agriHarvests)
    .values({
      orgId: ctx.orgId,
      producerId: values.producerId,
      cropId: values.cropId,
      season: values.season,
      harvestDate: values.harvestDate,
      quantity: values.quantity.toString(),
      geoPoint: values.geoPoint,
      notes: values.notes,
    })
    .returning()
  return toHarvest(row!)
}
