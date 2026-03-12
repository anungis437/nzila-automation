/**
 * Trade Server Actions — Commissions.
 *
 * Commission preview and finalization on deals.
 * Every action calls `resolveOrgContext()` first and emits audit.
 */
'use server'

import { resolveOrgContext } from '@/lib/resolve-org'
import { revalidatePath } from 'next/cache'
import {
  createCommissionSchema,
  finalizeCommissionSchema,
  buildActionAuditEntry,
  type TradeServiceResult,
  type TradeCommission,
} from '@nzila/trade-core'
import { createTradeCommissionRepository } from '@nzila/trade-db'

const repo = createTradeCommissionRepository()

export async function createCommission(
  data: unknown,
): Promise<TradeServiceResult<{ commissionId: string }>> {
  const ctx = await resolveOrgContext()
  const parsed = createCommissionSchema.safeParse(data)

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
    entityType: 'trade_commission',
    targetEntityId: row.id,
    action: 'commission.created',
    label: `Created commission for deal ${parsed.data.dealId} / party ${parsed.data.partyId}`,
    metadata: {
      dealId: parsed.data.dealId,
      partyId: parsed.data.partyId,
      currency: parsed.data.currency,
    },
  })

  revalidatePath('/trade/commissions')

  return { ok: true, data: { commissionId: row.id }, error: null, auditEntries: [entry] }
}

export async function finalizeCommission(
  data: unknown,
): Promise<TradeServiceResult<{ commissionId: string; finalizedAmount: string }>> {
  const ctx = await resolveOrgContext()
  const parsed = finalizeCommissionSchema.safeParse(data)

  if (!parsed.success) {
    return { ok: false, data: null, error: parsed.error.message, auditEntries: [] }
  }

  const dbCtx = { orgId: ctx.orgId, actorId: ctx.actorId }
  await repo.finalize(dbCtx, {
    id: parsed.data.commissionId,
    calculatedAmount: parsed.data.calculatedAmount,
  })

  const entry = buildActionAuditEntry({
    id: crypto.randomUUID(),
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    role: ctx.role,
    entityType: 'trade_commission',
    targetEntityId: parsed.data.commissionId,
    action: 'commission.finalized',
    label: `Finalized commission ${parsed.data.commissionId} at ${parsed.data.calculatedAmount}`,
    metadata: {
      calculatedAmount: parsed.data.calculatedAmount,
    },
  })

  revalidatePath('/trade/commissions')

  return {
    ok: true,
    data: {
      commissionId: parsed.data.commissionId,
      finalizedAmount: parsed.data.calculatedAmount,
    },
    error: null,
    auditEntries: [entry],
  }
}

export async function listCommissions(opts?: {
  page?: number
  pageSize?: number
  status?: string
  dealId?: string
}): Promise<TradeServiceResult<{ commissions: TradeCommission[]; total: number }>> {
  const ctx = await resolveOrgContext()

  if (!opts?.dealId) {
    return { ok: true, data: { commissions: [], total: 0 }, error: null, auditEntries: [] }
  }

  const rows = await repo.listByDeal({ orgId: ctx.orgId }, opts.dealId)

  return {
    ok: true,
    data: { commissions: rows as unknown as TradeCommission[], total: rows.length },
    error: null,
    auditEntries: [],
  }
}
