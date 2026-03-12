/**
 * Trade Server Actions — Parties.
 *
 * CRUD for trade parties (sellers, buyers, brokers, agents).
 * Every action calls `resolveOrgContext()` first and emits audit.
 */
'use server'

import { resolveOrgContext } from '@/lib/resolve-org'
import { revalidatePath } from 'next/cache'
import {
  createPartySchema,
  updatePartySchema,
  buildActionAuditEntry,
  type TradeServiceResult,
  type TradeParty,
} from '@nzila/trade-core'
import { createTradePartyRepository } from '@nzila/trade-db'

const repo = createTradePartyRepository()

export async function createParty(
  data: unknown,
): Promise<TradeServiceResult<{ partyId: string }>> {
  const ctx = await resolveOrgContext()
  const parsed = createPartySchema.safeParse(data)

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
    entityType: 'trade_party',
    targetEntityId: row.id,
    action: 'party.created',
    label: `Created party ${parsed.data.name}`,
    metadata: { role: parsed.data.role, country: parsed.data.country },
  })

  revalidatePath('/trade/parties')

  return { ok: true, data: { partyId: row.id }, error: null, auditEntries: [entry] }
}

export async function updateParty(
  data: unknown,
): Promise<TradeServiceResult<{ partyId: string }>> {
  const ctx = await resolveOrgContext()
  const parsed = updatePartySchema.safeParse(data)

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
    entityType: 'trade_party',
    targetEntityId: parsed.data.id,
    action: 'party.updated',
    label: `Updated party ${parsed.data.id}`,
    metadata: { fields: Object.keys(parsed.data).filter((k) => k !== 'id') },
  })

  revalidatePath('/trade/parties')

  return { ok: true, data: { partyId: parsed.data.id }, error: null, auditEntries: [entry] }
}

export async function listParties(_opts?: {
  page?: number
  pageSize?: number
  role?: string
}): Promise<TradeServiceResult<{ parties: TradeParty[]; total: number }>> {
  const ctx = await resolveOrgContext()

  const rows = await repo.list({ orgId: ctx.orgId })

  return {
    ok: true,
    data: { parties: rows as unknown as TradeParty[], total: rows.length },
    error: null,
    auditEntries: [],
  }
}
