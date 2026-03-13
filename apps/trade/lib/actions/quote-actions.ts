/**
 * Trade Server Actions — Quotes.
 *
 * Quote generation, acceptance, and lifecycle management.
 * Every action calls `resolveOrgContext()` first and emits audit.
 */
'use server'

import { resolveOrgContext } from '@/lib/resolve-org'
import { revalidatePath } from 'next/cache'
import {
  createQuoteSchema,
  transitionQuoteSchema,
  buildActionAuditEntry,
  type TradeServiceResult,
  type TradeQuote,
} from '@nzila/trade-core'
import { createTradeQuoteRepository } from '@nzila/trade-db'

const repo = createTradeQuoteRepository()

export async function createQuote(
  data: unknown,
): Promise<TradeServiceResult<{ quoteId: string }>> {
  const ctx = await resolveOrgContext()
  const parsed = createQuoteSchema.safeParse(data)

  if (!parsed.success) {
    return { ok: false, data: null, error: parsed.error.message, auditEntries: [] }
  }

  const dbCtx = { orgId: ctx.orgId, actorId: ctx.actorId }
  const row = await repo.create(dbCtx, {
    ...parsed.data,
    validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
  })

  const entry = buildActionAuditEntry({
    id: crypto.randomUUID(),
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    role: ctx.role,
    entityType: 'trade_quote',
    targetEntityId: row.id,
    action: 'quote.created',
    label: `Created quote for deal ${parsed.data.dealId}`,
    metadata: {
      dealId: parsed.data.dealId,
      unitPrice: parsed.data.unitPrice,
      quantity: parsed.data.quantity,
      total: row.total,
      currency: parsed.data.currency,
    },
  })

  revalidatePath('/trade/deals')

  return { ok: true, data: { quoteId: row.id }, error: null, auditEntries: [entry] }
}

export async function transitionQuote(
  data: unknown,
): Promise<TradeServiceResult<{ quoteId: string; newStatus: string }>> {
  const ctx = await resolveOrgContext()
  const parsed = transitionQuoteSchema.safeParse(data)

  if (!parsed.success) {
    return { ok: false, data: null, error: parsed.error.message, auditEntries: [] }
  }

  const dbCtx = { orgId: ctx.orgId, actorId: ctx.actorId }
  const updates: { status?: string; acceptedAt?: Date | null } = { status: parsed.data.toStatus }
  if (parsed.data.toStatus === 'accepted') updates.acceptedAt = new Date()
  await repo.update(dbCtx, { id: parsed.data.quoteId, ...updates })

  const entry = buildActionAuditEntry({
    id: crypto.randomUUID(),
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    role: ctx.role,
    entityType: 'trade_quote',
    targetEntityId: parsed.data.quoteId,
    action: `quote.${parsed.data.toStatus}`,
    label: `Quote ${parsed.data.quoteId} → ${parsed.data.toStatus}`,
    metadata: parsed.data.metadata ?? {},
  })

  revalidatePath('/trade/deals')

  return {
    ok: true,
    data: { quoteId: parsed.data.quoteId, newStatus: parsed.data.toStatus },
    error: null,
    auditEntries: [entry],
  }
}

export async function listQuotesForDeal(
  dealId: string,
): Promise<TradeServiceResult<{ quotes: TradeQuote[] }>> {
  const ctx = await resolveOrgContext()

  const rows = await repo.listByDeal({ orgId: ctx.orgId }, dealId)

  return {
    ok: true,
    data: { quotes: rows as unknown as TradeQuote[] },
    error: null,
    auditEntries: [],
  }
}
