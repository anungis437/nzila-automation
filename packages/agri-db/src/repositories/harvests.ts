import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { HarvestRecord, RecordHarvestInput } from '@nzila/agri-core'

export async function listHarvests(
  ctx: AgriReadContext,
  opts: PaginationOpts & { producerId?: string; cropId?: string; season?: string } = {},
): Promise<PaginatedResult<HarvestRecord>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  void ctx
  return { rows: [], total: 0, limit, offset }
}

export async function getHarvestById(ctx: AgriReadContext, harvestId: string): Promise<HarvestRecord | null> {
  void ctx; void harvestId
  return null
}

export async function getHarvestsByIds(ctx: AgriReadContext, harvestIds: string[]): Promise<HarvestRecord[]> {
  void ctx; void harvestIds
  return []
}

export async function recordHarvest(ctx: AgriDbContext, values: RecordHarvestInput): Promise<HarvestRecord> {
  const id = crypto.randomUUID()
  return {
    id,
    orgId: ctx.orgId,
    producerId: values.producerId,
    cropId: values.cropId,
    season: values.season,
    harvestDate: values.harvestDate,
    quantity: values.quantity,
    geoPoint: values.geoPoint,
    notes: values.notes,
    createdAt: new Date().toISOString(),
  }
}
