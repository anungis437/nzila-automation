/**
 * Trade Server Actions — Financing.
 *
 * Attach financing terms to a deal.
 * Every action calls `resolveOrgContext()` first and emits audit.
 */
'use server'

import { resolveOrgContext } from '@/lib/resolve-org'
import { revalidatePath } from 'next/cache'
import {
  createFinancingSchema,
  buildActionAuditEntry,
  type TradeServiceResult,
  type TradeFinancingTerms,
} from '@nzila/trade-core'
import { createTradeFinancingRepository } from '@nzila/trade-db'

const repo = createTradeFinancingRepository()

export async function attachFinancing(
  data: unknown,
): Promise<TradeServiceResult<{ financingId: string }>> {
  const ctx = await resolveOrgContext()
  const parsed = createFinancingSchema.safeParse(data)

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
    entityType: 'trade_financing',
    targetEntityId: row.id,
    action: 'financing.attached',
    label: `Attached financing to deal ${parsed.data.dealId}`,
    metadata: {
      dealId: parsed.data.dealId,
      provider: parsed.data.provider,
    },
  })

  revalidatePath('/trade/deals')

  return { ok: true, data: { financingId: row.id }, error: null, auditEntries: [entry] }
}

export async function getFinancingForDeal(
  dealId: string,
): Promise<TradeServiceResult<{ financing: TradeFinancingTerms | null }>> {
  const ctx = await resolveOrgContext()

  const rows = await repo.listByDeal({ orgId: ctx.orgId }, dealId)
  const first = rows[0] ?? null

  return {
    ok: true,
    data: { financing: first as unknown as TradeFinancingTerms | null },
    error: null,
    auditEntries: [],
  }
}
