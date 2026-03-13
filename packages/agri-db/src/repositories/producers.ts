import type { AgriReadContext, AgriDbContext, PaginationOpts, PaginatedResult } from '../types'
import type { ProducerProfile, CreateProducerInput, UpdateProducerInput } from '@nzila/agri-core'
import { db } from '@nzila/db'
import { agriProducers } from '@nzila/db/schema'
import { eq, and, count } from 'drizzle-orm'

function toProfile(row: typeof agriProducers.$inferSelect): ProducerProfile {
  return {
    id: row.id,
    orgId: row.orgId,
    name: row.name,
    contactPhone: row.contactPhone ?? null,
    contactEmail: row.contactEmail ?? null,
    location: row.location as ProducerProfile['location'],
    cooperativeId: row.cooperativeId ?? null,
    status: row.status,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listProducers(
  ctx: AgriReadContext,
  opts: PaginationOpts = {},
): Promise<PaginatedResult<ProducerProfile>> {
  const limit = Math.min(opts.limit ?? 50, 200)
  const offset = opts.offset ?? 0
  const where = eq(agriProducers.orgId, ctx.orgId)

  const [rows, [{ value: total } = { value: 0 }]] = await Promise.all([
    db.select().from(agriProducers).where(where).limit(limit).offset(offset),
    db.select({ value: count() }).from(agriProducers).where(where),
  ])

  return { rows: rows.map(toProfile), total, limit, offset }
}

export async function getProducerById(
  ctx: AgriReadContext,
  producerId: string,
): Promise<ProducerProfile | null> {
  const [row] = await db
    .select()
    .from(agriProducers)
    .where(and(eq(agriProducers.orgId, ctx.orgId), eq(agriProducers.id, producerId)))
    .limit(1)
  return row ? toProfile(row) : null
}

export async function createProducer(
  ctx: AgriDbContext,
  values: CreateProducerInput,
): Promise<ProducerProfile> {
  const [row] = await db
    .insert(agriProducers)
    .values({
      orgId: ctx.orgId,
      name: values.name,
      contactPhone: values.contactPhone,
      contactEmail: values.contactEmail,
      location: values.location,
      cooperativeId: values.cooperativeId,
      metadata: values.metadata ?? {},
    })
    .returning()
  return toProfile(row!)
}

export async function updateProducer(
  ctx: AgriDbContext,
  producerId: string,
  values: UpdateProducerInput,
): Promise<ProducerProfile | null> {
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (values.name !== undefined) updates.name = values.name
  if (values.contactPhone !== undefined) updates.contactPhone = values.contactPhone
  if (values.contactEmail !== undefined) updates.contactEmail = values.contactEmail
  if (values.location !== undefined) updates.location = values.location
  if (values.cooperativeId !== undefined) updates.cooperativeId = values.cooperativeId
  if (values.status !== undefined) updates.status = values.status
  if (values.metadata !== undefined) updates.metadata = values.metadata

  const [row] = await db
    .update(agriProducers)
    .set(updates)
    .where(and(eq(agriProducers.orgId, ctx.orgId), eq(agriProducers.id, producerId)))
    .returning()
  return row ? toProfile(row) : null
}
