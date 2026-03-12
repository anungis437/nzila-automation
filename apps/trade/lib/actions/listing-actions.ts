/**
 * Trade Server Actions — Listings.
 *
 * CRUD for trade listings (generic + vehicle).
 * Every action calls `resolveOrgContext()` first and emits audit.
 */
'use server'

import { resolveOrgContext } from '@/lib/resolve-org'
import { revalidatePath } from 'next/cache'
import {
  createListingSchema,
  updateListingSchema,
  addListingMediaSchema,
  buildActionAuditEntry,
  type TradeServiceResult,
  type TradeListing,
} from '@nzila/trade-core'
import { createTradeListingRepository } from '@nzila/trade-db'

const repo = createTradeListingRepository()

export async function createListing(
  data: unknown,
): Promise<TradeServiceResult<{ listingId: string }>> {
  const ctx = await resolveOrgContext()
  const parsed = createListingSchema.safeParse(data)

  if (!parsed.success) {
    return { ok: false, data: null, error: parsed.error.message, auditEntries: [] }
  }

  const dbCtx = { orgId: ctx.orgId, actorId: ctx.actorId }
  const row = await repo.create(dbCtx, parsed.data)

  const entry = buildActionAuditEntry({
    id: crypto.randomUUID(),
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    role: ctx.role,
    entityType: 'trade_listing',
    targetEntityId: row.id,
    action: 'listing.created',
    label: `Created listing "${parsed.data.title}"`,
    metadata: { listingType: parsed.data.listingType, currency: parsed.data.currency },
  })

  revalidatePath('/trade/listings')

  return { ok: true, data: { listingId: row.id }, error: null, auditEntries: [entry] }
}

export async function updateListing(
  data: unknown,
): Promise<TradeServiceResult<{ listingId: string }>> {
  const ctx = await resolveOrgContext()
  const parsed = updateListingSchema.safeParse(data)

  if (!parsed.success) {
    return { ok: false, data: null, error: parsed.error.message, auditEntries: [] }
  }

  const dbCtx = { orgId: ctx.orgId, actorId: ctx.actorId }
  await repo.update(dbCtx, parsed.data)

  const entry = buildActionAuditEntry({
    id: crypto.randomUUID(),
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    role: ctx.role,
    entityType: 'trade_listing',
    targetEntityId: parsed.data.id,
    action: 'listing.updated',
    label: `Updated listing ${parsed.data.id}`,
    metadata: { fields: Object.keys(parsed.data).filter((k) => k !== 'id') },
  })

  revalidatePath('/trade/listings')

  return { ok: true, data: { listingId: parsed.data.id }, error: null, auditEntries: [entry] }
}

export async function addListingMedia(
  data: unknown,
): Promise<TradeServiceResult<{ mediaId: string }>> {
  const ctx = await resolveOrgContext()
  const parsed = addListingMediaSchema.safeParse(data)

  if (!parsed.success) {
    return { ok: false, data: null, error: parsed.error.message, auditEntries: [] }
  }

  const id = crypto.randomUUID()

  const entry = buildActionAuditEntry({
    id: crypto.randomUUID(),
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    role: ctx.role,
    entityType: 'trade_listing_media',
    targetEntityId: id,
    action: 'listing.media_added',
    label: `Added ${parsed.data.mediaType} media to listing ${parsed.data.listingId}`,
  })

  // TODO: persist listing media (tradeListingMedia table — separate from listing repo)

  revalidatePath('/trade/listings')

  return { ok: true, data: { mediaId: id }, error: null, auditEntries: [entry] }
}

export async function listListings(_opts?: {
  page?: number
  pageSize?: number
  status?: string
  listingType?: string
}): Promise<TradeServiceResult<{ listings: TradeListing[]; total: number }>> {
  const ctx = await resolveOrgContext()

  const rows = await repo.list({ orgId: ctx.orgId })

  return {
    ok: true,
    data: { listings: rows as unknown as TradeListing[], total: rows.length },
    error: null,
    auditEntries: [],
  }
}
