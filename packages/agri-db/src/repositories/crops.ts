import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { Crop, CreateCropInput } from '@nzila/agri-core'

export async function listCrops(
  ctx: AgriReadContext,
  opts: PaginationOpts = {},
): Promise<PaginatedResult<Crop>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  void ctx
  return { rows: [], total: 0, limit, offset }
}

export async function getCropById(ctx: AgriReadContext, cropId: string): Promise<Crop | null> {
  void ctx; void cropId
  return null
}

export async function createCrop(ctx: AgriDbContext, values: CreateCropInput): Promise<Crop> {
  const id = crypto.randomUUID()
  return {
    id,
    orgId: ctx.orgId,
    name: values.name,
    cropType: values.cropType,
    unitOfMeasure: values.unitOfMeasure,
    baselineYieldPerHectare: values.baselineYieldPerHectare,
    metadata: values.metadata ?? {},
    createdAt: new Date().toISOString(),
  }
}
