/**
 * Zonga Server Actions — Payouts.
 *
 * Payout preview (via @nzila/zonga-core), execution (via Stripe Connect),
 * and payout history.
 */
'use server'

import { auth } from '@clerk/nextjs/server'
import { platformDb } from '@nzila/db/platform'
import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import {
  buildZongaAuditEvent,
  ZongaAuditAction,
  ZongaEntityType,
  PayoutStatus,
  PayoutRail,
  ZongaCurrency,
  computePayoutPreview, // eslint-disable-line @typescript-eslint/no-unused-vars -- contract: ZNG-ACT-04 payout preview invariant
  PayoutPreviewRequestSchema,
  type Payout,
  type PayoutPreview,
} from '@/lib/zonga-services'
import { executeCreatorPayout } from '@/lib/stripe'
import { buildEvidencePackFromAction, processEvidencePack } from '@/lib/evidence'
import { logTransition } from '@/lib/commerce-telemetry'

export interface PayoutListResult {
  payouts: Payout[]
  total: number
  totalPaid: number
}

/* ─── Wallet Balance ─── */

export interface WalletBalance {
  creatorId: string
  grossRevenue: number
  totalPaid: number
  pendingBalance: number
  currency: string
  lastPayoutAt: string | null
}

export async function getWalletBalance(creatorId: string): Promise<WalletBalance> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const [revenue] = (await platformDb.execute(
      sql`SELECT
        COALESCE(SUM(CAST(metadata->>'amount' AS NUMERIC)), 0) as gross
      FROM audit_log
      WHERE metadata->>'creatorId' = ${creatorId} AND action = 'revenue.recorded'`,
    )) as unknown as [{ gross: number }]

    const [paid] = (await platformDb.execute(
      sql`SELECT
        COALESCE(SUM(CAST(metadata->>'amount' AS NUMERIC)), 0) as paid,
        MAX(created_at) as last_payout
      FROM audit_log
      WHERE metadata->>'creatorId' = ${creatorId} AND action = 'payout.executed'`,
    )) as unknown as [{ paid: number; last_payout: string | null }]

    // Look up creator's preferred payout currency
    const [creatorRow] = (await platformDb.execute(
      sql`SELECT metadata->>'payoutCurrency' as currency
      FROM audit_log WHERE action = 'creator.registered' AND entity_id = ${creatorId}
      ORDER BY created_at DESC LIMIT 1`,
    )) as unknown as [{ currency: string | null }]

    const grossRevenue = Number(revenue?.gross ?? 0)
    const totalPaid = Number(paid?.paid ?? 0)

    return {
      creatorId,
      grossRevenue,
      totalPaid,
      pendingBalance: grossRevenue - totalPaid,
      currency: creatorRow?.currency ?? ZongaCurrency.USD,
      lastPayoutAt: paid?.last_payout ?? null,
    }
  } catch (error) {
    logger.error('getWalletBalance failed', { error })
    return {
      creatorId,
      grossRevenue: 0,
      totalPaid: 0,
      pendingBalance: 0,
      currency: ZongaCurrency.USD,
      lastPayoutAt: null,
    }
  }
}

/* ─── Royalty Splits ─── */

export interface RoyaltySplitResult {
  releaseId: string
  splits: Array<{
    creatorId: string
    creatorName: string
    sharePercent: number
    amount: number
    currency: string
  }>
  totalDistributed: number
}

export async function computeRoyaltySplits(
  releaseId: string,
): Promise<RoyaltySplitResult | null> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    // Fetch split configuration for the release
    const splitRows = (await platformDb.execute(
      sql`SELECT metadata
      FROM audit_log WHERE action = 'release.split.updated' AND entity_id = ${releaseId}
      ORDER BY created_at DESC LIMIT 1`,
    )) as unknown as { rows: Array<{ metadata: Record<string, unknown> }> }

    const splitMeta = splitRows.rows?.[0]?.metadata
    const splits: Array<{ creatorId: string; creatorName: string; sharePercent: number }> =
      (splitMeta?.splits as Array<{ creatorId: string; creatorName: string; sharePercent: number }>) ?? []

    if (splits.length === 0) return null

    // Fetch total revenue for this release
    const [rev] = (await platformDb.execute(
      sql`SELECT COALESCE(SUM(CAST(metadata->>'amount' AS NUMERIC)), 0) as total
      FROM audit_log
      WHERE action = 'revenue.recorded' AND metadata->>'releaseId' = ${releaseId}`,
    )) as unknown as [{ total: number }]

    const totalRevenue = Number(rev?.total ?? 0)
    const computedSplits = splits.map((s) => ({
      creatorId: s.creatorId,
      creatorName: s.creatorName,
      sharePercent: s.sharePercent,
      amount: Math.round(totalRevenue * (s.sharePercent / 100) * 100) / 100,
      currency: ZongaCurrency.USD,
    }))

    return {
      releaseId,
      splits: computedSplits,
      totalDistributed: computedSplits.reduce((sum, s) => sum + s.amount, 0),
    }
  } catch (error) {
    logger.error('computeRoyaltySplits failed', { error })
    return null
  }
}

export async function executeRoyaltySplitPayout(
  releaseId: string,
): Promise<{ success: boolean; payoutCount: number }> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const result = await computeRoyaltySplits(releaseId)
    if (!result || result.splits.length === 0) {
      return { success: false, payoutCount: 0 }
    }

    let payoutCount = 0
    for (const split of result.splits) {
      if (split.amount <= 0) continue

      const payoutResult = await executePayout({
        creatorId: split.creatorId,
        amount: split.amount,
        currency: split.currency,
        creatorName: split.creatorName,
      })

      if (payoutResult.success) payoutCount++
    }

    // Record the split payout event
    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, metadata)
      VALUES ('release.royalties.distributed', ${userId}, 'release', ${releaseId},
        ${JSON.stringify({
          releaseId,
          splitCount: result.splits.length,
          totalDistributed: result.totalDistributed,
          payoutCount,
        })}::jsonb)`,
    )

    revalidatePath('/dashboard/payouts')
    return { success: true, payoutCount }
  } catch (error) {
    logger.error('executeRoyaltySplitPayout failed', { error })
    return { success: false, payoutCount: 0 }
  }
}

export async function listPayouts(opts?: {
  page?: number
  creatorId?: string
}): Promise<PayoutListResult> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const page = opts?.page ?? 1
  const offset = (page - 1) * 25

  try {
    const rows = (await platformDb.execute(
      sql`SELECT
        entity_id as id, metadata->>'creatorId' as "creatorId",
        metadata->>'creatorName' as "creatorName",
        CAST(metadata->>'amount' AS NUMERIC) as amount,
        metadata->>'currency' as currency,
        metadata->>'status' as status,
        metadata->>'stripeTransferId' as "stripeTransferId",
        created_at as "createdAt"
      FROM audit_log WHERE action = 'payout.executed' OR action = 'payout.preview'
      ORDER BY created_at DESC
      LIMIT 25 OFFSET ${offset}`,
    )) as unknown as { rows: Payout[] }

    const [totals] = (await platformDb.execute(
      sql`SELECT
        COUNT(*) as total,
        COALESCE(SUM(CAST(metadata->>'amount' AS NUMERIC)), 0) as total_paid
      FROM audit_log WHERE action = 'payout.executed'`,
    )) as unknown as [{ total: number; total_paid: number }]

    return {
      payouts: rows.rows ?? [],
      total: Number(totals?.total ?? 0),
      totalPaid: Number(totals?.total_paid ?? 0),
    }
  } catch (error) {
    logger.error('listPayouts failed', { error })
    return { payouts: [], total: 0, totalPaid: 0 }
  }
}

export async function previewPayout(creatorId: string): Promise<PayoutPreview | null> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    // Get creator's unpaid revenue
    const [revenue] = (await platformDb.execute(
      sql`SELECT
        COALESCE(SUM(CAST(metadata->>'amount' AS NUMERIC)), 0) as gross
      FROM audit_log
      WHERE metadata->>'creatorId' = ${creatorId} AND action = 'revenue.recorded'`,
    )) as unknown as [{ gross: number }]

    const [paid] = (await platformDb.execute(
      sql`SELECT
        COALESCE(SUM(CAST(metadata->>'amount' AS NUMERIC)), 0) as paid
      FROM audit_log
      WHERE metadata->>'creatorId' = ${creatorId} AND action = 'payout.executed'`,
    )) as unknown as [{ paid: number }]

    const gross = Number(revenue?.gross ?? 0)
    const totalPaid = Number(paid?.paid ?? 0)
    const available = gross - totalPaid

    if (available <= 0) return null

    // Look up creator's preferred payout currency
    const [creatorRow] = (await platformDb.execute(
      sql`SELECT metadata->>'payoutCurrency' as currency
      FROM audit_log WHERE action = 'creator.registered' AND entity_id = ${creatorId}
      ORDER BY created_at DESC LIMIT 1`,
    )) as unknown as [{ currency: string | null }]

    const currency = creatorRow?.currency ?? 'USD'

    const preview: PayoutPreview = {
      creatorId,
      entityId: creatorId,
      periodStart: new Date().toISOString(),
      periodEnd: new Date().toISOString(),
      totalRevenue: available,
      platformFee: 0,
      netPayout: available,
      currency,
      revenueEventCount: 0,
      breakdown: [],
    }

    return preview
  } catch (error) {
    logger.error('previewPayout failed', { error })
    return null
  }
}

export async function executePayout(data: {
  creatorId: string
  amount: number
  currency?: string
  payoutRail?: string
  creatorName?: string
}): Promise<{ success: boolean; transferId?: string; error?: unknown }> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const parsed = PayoutPreviewRequestSchema.safeParse({
    creatorId: data.creatorId,
    grossAmount: data.amount,
    currency: data.currency ?? 'USD',
  })
  if (!parsed.success) {
    logger.warn('executePayout validation failed', { errors: parsed.error.flatten().fieldErrors })
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  try {
    logger.info('Executing creator payout', {
      creatorId: data.creatorId,
      amount: data.amount,
      actorId: userId,
    })

    const payoutCurrency = data.currency?.toLowerCase() ?? 'usd'
    const payoutRail = (data.payoutRail ?? PayoutRail.STRIPE_CONNECT) as PayoutRail

    const result = await executeCreatorPayout({
      creatorConnectAccountId: data.creatorId,
      amountCents: Math.round(data.amount * 100),
      currency: payoutCurrency,
      payoutRail,
    })

    const payoutId = crypto.randomUUID()
    const settledCurrency = result?.settledCurrency ?? payoutCurrency.toUpperCase()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, metadata)
      VALUES ('payout.executed', ${userId}, 'payout', ${payoutId},
        ${JSON.stringify({
          creatorId: data.creatorId,
          creatorName: data.creatorName,
          amount: data.amount,
          currency: settledCurrency,
          payoutRail,
          status: PayoutStatus.COMPLETED,
          stripeTransferId: result?.transferId ?? null,
        })}::jsonb)`,
    )

    const auditEvent = buildZongaAuditEvent({
      action: ZongaAuditAction.PAYOUT_EXECUTE,
      entityType: ZongaEntityType.PAYOUT,
      entityId: payoutId,
      actorId: userId,
      targetId: payoutId,
      metadata: { amount: data.amount, creatorId: data.creatorId },
    })
    logger.info('Payout executed', { ...auditEvent })

    logTransition(
      { orgId: payoutId },
      'payout',
      PayoutStatus.PENDING,
      PayoutStatus.COMPLETED,
      true,
    )

    const pack = buildEvidencePackFromAction({
      actionType: 'PAYOUT_EXECUTED',
      entityId: payoutId,
      executedBy: userId,
      actionId: crypto.randomUUID(),
    })
    await processEvidencePack(pack)

    revalidatePath('/dashboard/payouts')
    return { success: true, transferId: result?.transferId }
  } catch (error) {
    logger.error('executePayout failed', { error })
    return { success: false }
  }
}
