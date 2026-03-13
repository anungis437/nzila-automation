import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { AggregationLot, LotContribution, CreateLotInput } from '@nzila/agri-core'
import { db } from '@nzila/db'
import { agriLots, agriLotContributions, agriHarvests as _agriHarvests } from '@nzila/db/schema'
import { eq, and, count, inArray as _inArray, type SQL } from 'drizzle-orm'

function toLot(row: typeof agriLots.$inferSelect): AggregationLot {
  return {
    id: row.id,
    orgId: row.orgId,
    ref: row.ref,
    cropId: row.cropId,
    season: row.season,
    totalWeight: Number(row.totalWeight),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toContribution(row: typeof agriLotContributions.$inferSelect): LotContribution {
  return {
    id: row.id,
    orgId: row.orgId,
    lotId: row.lotId,
    harvestId: row.harvestId,
    weight: Number(row.weight),
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listLots(
  ctx: AgriReadContext,
  opts: PaginationOpts & { status?: string; season?: string; cropId?: string } = {},
): Promise<PaginatedResult<AggregationLot>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  const conditions: SQL[] = [eq(agriLots.orgId, ctx.orgId)]
  if (opts.status) conditions.push(eq(agriLots.status, opts.status as typeof agriLots.$inferSelect.status))
  if (opts.season) conditions.push(eq(agriLots.season, opts.season))
  if (opts.cropId) conditions.push(eq(agriLots.cropId, opts.cropId))
  const where = and(...conditions)!

  const [rows, [{ value: total } = { value: 0 }]] = await Promise.all([
    db.select().from(agriLots).where(where).limit(limit).offset(offset),
    db.select({ value: count() }).from(agriLots).where(where),
  ])

  return { rows: rows.map(toLot), total, limit, offset }
}

export async function getLotById(ctx: AgriReadContext, lotId: string): Promise<AggregationLot | null> {
  const [row] = await db
    .select()
    .from(agriLots)
    .where(and(eq(agriLots.orgId, ctx.orgId), eq(agriLots.id, lotId)))
    .limit(1)
  return row ? toLot(row) : null
}

export async function getLotContributions(ctx: AgriReadContext, lotId: string): Promise<LotContribution[]> {
  const rows = await db
    .select()
    .from(agriLotContributions)
    .where(and(eq(agriLotContributions.orgId, ctx.orgId), eq(agriLotContributions.lotId, lotId)))
  return rows.map(toContribution)
}

export async function createLot(
  ctx: AgriDbContext,
  values: CreateLotInput,
  contributions: { harvestId: string; weight: number }[],
): Promise<AggregationLot> {
  const totalWeight = contributions.reduce((sum, c) => sum + c.weight, 0)
  const id = crypto.randomUUID()
  const ref = `LOT-${id.slice(0, 8).toUpperCase()}`

  const [row] = await db
    .insert(agriLots)
    .values({
      id,
      orgId: ctx.orgId,
      ref,
      cropId: values.cropId,
      season: values.season,
      totalWeight: totalWeight.toString(),
    })
    .returning()

  if (contributions.length > 0) {
    await db.insert(agriLotContributions).values(
      contributions.map((c) => ({
        orgId: ctx.orgId,
        lotId: row!.id,
        harvestId: c.harvestId,
        weight: c.weight.toString(),
      })),
    )
  }

  return toLot(row!)
}

export async function updateLotStatus(
  ctx: AgriDbContext,
  lotId: string,
  status: string,
): Promise<void> {
  await db
    .update(agriLots)
    .set({ status: status as typeof agriLots.$inferSelect.status, updatedAt: new Date() })
    .where(and(eq(agriLots.orgId, ctx.orgId), eq(agriLots.id, lotId)))
}
