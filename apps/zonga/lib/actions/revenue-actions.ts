/**
 * Zonga Server Actions — Revenue.
 *
 * Revenue event tracking, stream analytics, and per-creator breakdowns.
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
  RevenueType,
  RecordRevenueEventSchema,
  type RevenueEvent,
} from '@/lib/zonga-services'
import { buildEvidencePackFromAction, processEvidencePack } from '@/lib/evidence'

export interface RevenueOverview {
  totalRevenue: number
  streamRevenue: number
  downloadRevenue: number
  syncRevenue: number
  eventCount: number
  recentEvents: RevenueEvent[]
}

export async function getRevenueOverview(): Promise<RevenueOverview> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const [totals] = (await platformDb.execute(
      sql`SELECT
        COALESCE(SUM(CAST(metadata->>'amount' AS NUMERIC)), 0) as total,
        COALESCE(SUM(CASE WHEN metadata->>'type' = ${RevenueType.STREAM} THEN CAST(metadata->>'amount' AS NUMERIC) END), 0) as streams,
        COALESCE(SUM(CASE WHEN metadata->>'type' = ${RevenueType.DOWNLOAD} THEN CAST(metadata->>'amount' AS NUMERIC) END), 0) as downloads,
        COALESCE(SUM(CASE WHEN metadata->>'type' = ${RevenueType.SYNC_LICENSE} THEN CAST(metadata->>'amount' AS NUMERIC) END), 0) as sync,
        COUNT(*) as event_count
      FROM audit_log WHERE action = 'revenue.recorded'`,
    )) as unknown as [{ total: number; streams: number; downloads: number; sync: number; event_count: number }]

    const recentEvents = (await platformDb.execute(
      sql`SELECT
        entity_id as id, metadata->>'type' as type,
        CAST(metadata->>'amount' AS NUMERIC) as amount,
        metadata->>'assetId' as "assetId",
        metadata->>'assetTitle' as "assetTitle",
        metadata->>'creatorId' as "creatorId",
        metadata->>'source' as source,
        created_at as "createdAt"
      FROM audit_log WHERE action = 'revenue.recorded'
      ORDER BY created_at DESC LIMIT 25`,
    )) as unknown as { rows: RevenueEvent[] }

    return {
      totalRevenue: Number(totals?.total ?? 0),
      streamRevenue: Number(totals?.streams ?? 0),
      downloadRevenue: Number(totals?.downloads ?? 0),
      syncRevenue: Number(totals?.sync ?? 0),
      eventCount: Number(totals?.event_count ?? 0),
      recentEvents: recentEvents.rows ?? [],
    }
  } catch (error) {
    logger.error('getRevenueOverview failed', { error })
    return {
      totalRevenue: 0,
      streamRevenue: 0,
      downloadRevenue: 0,
      syncRevenue: 0,
      eventCount: 0,
      recentEvents: [],
    }
  }
}

export async function recordRevenueEvent(data: {
  type: string
  amount: number
  assetId: string
  assetTitle?: string
  creatorId: string
  source?: string
}): Promise<{ success: boolean; error?: unknown }> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const parsed = RecordRevenueEventSchema.safeParse(data)
  if (!parsed.success) {
    logger.warn('recordRevenueEvent validation failed', { errors: parsed.error.flatten().fieldErrors })
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  try {
    const eventId = crypto.randomUUID()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, metadata)
      VALUES ('revenue.recorded', ${userId}, 'revenue_event', ${eventId},
        ${JSON.stringify({ ...data, id: eventId })}::jsonb)`,
    )

    const auditEvent = buildZongaAuditEvent({
      action: ZongaAuditAction.REVENUE_RECORD,
      entityType: ZongaEntityType.REVENUE_EVENT,
      entityId: eventId,
      actorId: userId,
      targetId: eventId,
      metadata: { type: data.type, amount: data.amount },
    })
    logger.info('Revenue event recorded', { ...auditEvent })

    const pack = buildEvidencePackFromAction({
      actionType: 'REVENUE_RECORDED',
      entityId: eventId,
      executedBy: userId,
      actionId: crypto.randomUUID(),
    })
    await processEvidencePack(pack)

    revalidatePath('/dashboard/revenue')
    return { success: true }
  } catch (error) {
    logger.error('recordRevenueEvent failed', { error })
    return { success: false }
  }
}

export async function getRevenueByCreator(): Promise<
  Array<{ creatorId: string; creatorName: string; total: number; events: number }>
> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const rows = (await platformDb.execute(
      sql`SELECT
        metadata->>'creatorId' as "creatorId",
        COALESCE(metadata->>'creatorName', metadata->>'creatorId') as "creatorName",
        COALESCE(SUM(CAST(metadata->>'amount' AS NUMERIC)), 0) as total,
        COUNT(*) as events
      FROM audit_log WHERE action = 'revenue.recorded'
      GROUP BY metadata->>'creatorId', COALESCE(metadata->>'creatorName', metadata->>'creatorId')
      ORDER BY total DESC
      LIMIT 50`,
    )) as unknown as { rows: Array<{ creatorId: string; creatorName: string; total: number; events: number }> }

    return rows.rows ?? []
  } catch (error) {
    logger.error('getRevenueByCreator failed', { error })
    return []
  }
}
