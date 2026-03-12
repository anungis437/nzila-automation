/**
 * Trade Server Actions — Deals.
 *
 * Deal creation and FSM-based stage transitions.
 * Transitions MUST go through `attemptDealTransition()` — no direct stage mutation.
 * Every action calls `resolveOrgContext()` first and emits audit.
 */
'use server'

import { resolveOrgContext } from '@/lib/resolve-org'
import { revalidatePath } from 'next/cache'
import {
  createDealSchema,
  transitionDealSchema,
  buildActionAuditEntry,
  buildTransitionAuditEntry,
  type TradeServiceResult,
  type TradeDeal,
  TradeDealStage,
} from '@nzila/trade-core'
import {
  attemptDealTransition,
  getAvailableDealTransitions,
  type TradeTransitionContext,
} from '@nzila/trade-core/machines'
import { tradeDealMachine } from '@nzila/trade-core/machines'
import { createTradeDealRepository } from '@nzila/trade-db'

const repo = createTradeDealRepository()

export async function createDeal(
  data: unknown,
): Promise<TradeServiceResult<{ dealId: string; refNumber: string }>> {
  const ctx = await resolveOrgContext()
  const parsed = createDealSchema.safeParse(data)

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
    entityType: 'trade_deal',
    targetEntityId: row.id,
    action: 'deal.created',
    label: `Created deal ${row.refNumber}`,
    metadata: {
      sellerPartyId: parsed.data.sellerPartyId,
      buyerPartyId: parsed.data.buyerPartyId,
      totalValue: parsed.data.totalValue,
      currency: parsed.data.currency,
    },
  })

  revalidatePath('/trade/deals')

  return {
    ok: true,
    data: { dealId: row.id, refNumber: row.refNumber },
    error: null,
    auditEntries: [entry],
  }
}

export async function transitionDeal(
  data: unknown,
): Promise<TradeServiceResult<{ dealId: string; newStage: string }>> {
  const ctx = await resolveOrgContext()
  const parsed = transitionDealSchema.safeParse(data)

  if (!parsed.success) {
    return { ok: false, data: null, error: parsed.error.message, auditEntries: [] }
  }

  const dbCtx = { orgId: ctx.orgId, actorId: ctx.actorId }
  const deal = await repo.getById({ orgId: ctx.orgId }, parsed.data.dealId)
  if (!deal) {
    return { ok: false, data: null, error: 'Deal not found', auditEntries: [] }
  }

  const currentStage = deal.stage as TradeDealStage

  const transitionCtx: TradeTransitionContext = {
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    role: ctx.role,
    meta: parsed.data.metadata ?? {},
  }

  const result = attemptDealTransition(
    tradeDealMachine,
    transitionCtx,
    { orgId: ctx.orgId, stage: currentStage },
    parsed.data.toStage,
  )

  if (!result.ok) {
    return {
      ok: false,
      data: null,
      error: `Transition blocked: ${result.reason}`,
      auditEntries: [],
    }
  }

  await repo.updateStage(dbCtx, parsed.data.dealId, parsed.data.toStage)

  const auditEntry = buildTransitionAuditEntry(result, {
    id: crypto.randomUUID(),
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    role: ctx.role,
    entityType: 'trade_deal',
    targetEntityId: parsed.data.dealId,
  })

  revalidatePath('/trade/deals')
  revalidatePath(`/trade/deals/${parsed.data.dealId}`)

  return {
    ok: true,
    data: { dealId: parsed.data.dealId, newStage: parsed.data.toStage },
    error: null,
    auditEntries: [auditEntry],
  }
}

export async function getDealTransitions(
  dealId: string,
): Promise<TradeServiceResult<{ transitions: string[] }>> {
  const ctx = await resolveOrgContext()

  const deal = await repo.getById({ orgId: ctx.orgId }, dealId)
  const currentStage = deal ? (deal.stage as TradeDealStage) : TradeDealStage.LEAD

  const available = getAvailableDealTransitions(tradeDealMachine, {
    orgId: ctx.orgId,
    actorId: ctx.actorId,
    role: ctx.role,
    meta: {},
  }, { orgId: ctx.orgId, stage: currentStage })

  return {
    ok: true,
    data: { transitions: available.map((t) => t.label) },
    error: null,
    auditEntries: [],
  }
}

export async function listDeals(_opts?: {
  page?: number
  pageSize?: number
  stage?: string
}): Promise<TradeServiceResult<{ deals: TradeDeal[]; total: number }>> {
  const ctx = await resolveOrgContext()

  const rows = await repo.list({ orgId: ctx.orgId })

  return {
    ok: true,
    data: { deals: rows as unknown as TradeDeal[], total: rows.length },
    error: null,
    auditEntries: [],
  }
}

export async function getDeal(
  dealId: string,
): Promise<TradeServiceResult<TradeDeal | null>> {
  const ctx = await resolveOrgContext()

  const row = await repo.getById({ orgId: ctx.orgId }, dealId)

  return {
    ok: true,
    data: row as unknown as TradeDeal | null,
    error: null,
    auditEntries: [],
  }
}
