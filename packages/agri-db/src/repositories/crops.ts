import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { Crop, CreateCropInput } from '@nzila/agri-core'
import { db } from '@nzila/db'
import { agriCrops } from '@nzila/db/schema'
import { eq, and, count } from 'drizzle-orm'

function toCrop(row: typeof agriCrops.$inferSelect): Crop {
  return {
    id: row.id,
    orgId: row.orgId,
    name: row.name,
    cropType: row.cropType,
    unitOfMeasure: row.unitOfMeasure,
    baselineYieldPerHectare: row.baselineYieldPerHectare ? Number(row.baselineYieldPerHectare) : null,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listCrops(
  ctx: AgriReadContext,
  opts: PaginationOpts = {},
): Promise<PaginatedResult<Crop>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  const where = eq(agriCrops.orgId, ctx.orgId)

  const [rows, [{ value: total } = { value: 0 }]] = await Promise.all([
    db.select().from(agriCrops).where(where).limit(limit).offset(offset),
    db.select({ value: count() }).from(agriCrops).where(where),
  ])

  return { rows: rows.map(toCrop), total, limit, offset }
}

export async function getCropById(ctx: AgriReadContext, cropId: string): Promise<Crop | null> {
  const [row] = await db
    .select()
    .from(agriCrops)
    .where(and(eq(agriCrops.orgId, ctx.orgId), eq(agriCrops.id, cropId)))
    .limit(1)
  return row ? toCrop(row) : null
}

export async function createCrop(ctx: AgriDbContext, values: CreateCropInput): Promise<Crop> {
  const [row] = await db
    .insert(agriCrops)
    .values({
      orgId: ctx.orgId,
      name: values.name,
      cropType: values.cropType,
      unitOfMeasure: values.unitOfMeasure,
      baselineYieldPerHectare: values.baselineYieldPerHectare?.toString() ?? null,
      metadata: values.metadata ?? {},
    })
    .returning()
  return toCrop(row!)
}
