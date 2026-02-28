import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { AggregationLot, LotContribution, CreateLotInput } from '@nzila/agri-core'

export async function listLots(
  ctx: AgriReadContext,
  opts: PaginationOpts & { status?: string; season?: string; cropId?: string } = {},
): Promise<PaginatedResult<AggregationLot>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  void ctx
  return { rows: [], total: 0, limit, offset }
}

export async function getLotById(ctx: AgriReadContext, lotId: string): Promise<AggregationLot | null> {
  void ctx; void lotId
  return null
}

export async function getLotContributions(ctx: AgriReadContext, lotId: string): Promise<LotContribution[]> {
  void ctx; void lotId
  return []
}

export async function createLot(
  ctx: AgriDbContext,
  values: CreateLotInput,
  contributions: { harvestId: string; weight: number }[],
): Promise<AggregationLot> {
  const id = crypto.randomUUID()
  const totalWeight = contributions.reduce((sum, c) => sum + c.weight, 0)
  const now = new Date().toISOString()
  return {
    id,
    orgId: ctx.orgId,
    ref: `LOT-${id.slice(0, 8).toUpperCase()}`,
    cropId: values.cropId,
    season: values.season,
    totalWeight,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }
}

export async function updateLotStatus(
  ctx: AgriDbContext,
  lotId: string,
  status: string,
): Promise<void> {
  void ctx; void lotId; void status
  // TODO: wire to Drizzle scoped update
}
