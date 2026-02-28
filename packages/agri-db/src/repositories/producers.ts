import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { ProducerProfile, CreateProducerInput, UpdateProducerInput } from '@nzila/agri-core'

export async function listProducers(
  ctx: AgriReadContext,
  opts: PaginationOpts = {},
): Promise<PaginatedResult<ProducerProfile>> {
  const _orgId = ctx.orgId
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  // TODO: wire to Drizzle scoped query — WHERE org_id = ctx.orgId
  return { rows: [], total: 0, limit, offset }
}

export async function getProducerById(
  ctx: AgriReadContext,
  producerId: string,
): Promise<ProducerProfile | null> {
  const _orgId = ctx.orgId
  void producerId
  // TODO: wire to Drizzle scoped query
  return null
}

export async function createProducer(
  ctx: AgriDbContext,
  values: CreateProducerInput,
): Promise<ProducerProfile> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  return {
    id,
    orgId: ctx.orgId,
    name: values.name,
    contactPhone: values.contactPhone,
    contactEmail: values.contactEmail,
    location: values.location,
    cooperativeId: values.cooperativeId,
    status: 'active',
    metadata: values.metadata ?? {},
    createdAt: now,
    updatedAt: now,
  }
}

export async function updateProducer(
  ctx: AgriDbContext,
  producerId: string,
  values: UpdateProducerInput,
): Promise<ProducerProfile | null> {
  void ctx
  void producerId
  void values
  // TODO: wire to Drizzle scoped update
  return null
}
