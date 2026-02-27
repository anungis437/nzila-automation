/**
 * Zonga Server Actions — Creators.
 *
 * Manage creator profiles, onboarding, and payee information.
 */
'use server'

import { resolveOrgContext } from '@/lib/resolve-org'
import { platformDb } from '@nzila/db/platform'
import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import {
  CreateCreatorSchema,
  buildZongaAuditEvent,
  ZongaAuditAction,
  ZongaEntityType,
  CreatorStatus,
  type Creator,
} from '@/lib/zonga-services'
import { buildEvidencePackFromAction, processEvidencePack } from '@/lib/evidence'

export interface CreatorListResult {
  creators: Creator[]
  total: number
}

export async function listCreators(opts?: {
  page?: number
  pageSize?: number
  status?: string
  search?: string
}): Promise<CreatorListResult> {
  const ctx = await resolveOrgContext()

  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 25
  const offset = (page - 1) * pageSize

  try {
    const rows = (await platformDb.execute(
      sql`SELECT
        entity_id as id, metadata->>'name' as name,
        metadata->>'email' as email,
        metadata->>'status' as status,
        metadata->>'genre' as genre,
        metadata->>'country' as country,
        metadata->>'assetCount' as "assetCount",
        metadata->>'totalRevenue' as "totalRevenue",
        created_at as "createdAt"
      FROM audit_log
      WHERE action = 'creator.registered'
      AND org_id = ${ctx.entityId}
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}`,
    )) as unknown as { rows: Creator[] }

    const [cnt] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM audit_log WHERE action = 'creator.registered' AND org_id = ${ctx.entityId}`,
    )) as unknown as [{ total: number }]

    return {
      creators: rows.rows ?? [],
      total: Number(cnt?.total ?? 0),
    }
  } catch (error) {
    logger.error('listCreators failed', { error })
    return { creators: [], total: 0 }
  }
}

export async function registerCreator(data: {
  name: string
  email: string
  genre?: string
  country?: string
}): Promise<{ success: boolean; creatorId?: string; error?: unknown }> {
  const ctx = await resolveOrgContext()

  const parsed = CreateCreatorSchema.safeParse(data)
  if (!parsed.success) {
    logger.warn('registerCreator validation failed', { errors: parsed.error.flatten().fieldErrors })
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  try {
    const creatorId = crypto.randomUUID()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, metadata, org_id)
      VALUES ('creator.registered', ${ctx.actorId}, 'creator', ${creatorId},
        ${JSON.stringify({ ...data, status: CreatorStatus.ACTIVE, id: creatorId })}::jsonb, ${ctx.entityId})`,
    )

    const auditEvent = buildZongaAuditEvent({
      action: ZongaAuditAction.CREATOR_ACTIVATE,
      entityType: ZongaEntityType.CREATOR,
      entityId: creatorId,
      actorId: ctx.actorId,
      targetId: creatorId,
      metadata: { name: data.name },
    })
    logger.info('Creator registered', { ...auditEvent })

    const pack = buildEvidencePackFromAction({
      actionType: 'CREATOR_REGISTERED',
      entityId: creatorId,
      executedBy: ctx.actorId,
      actionId: crypto.randomUUID(),
    })
    await processEvidencePack(pack)

    revalidatePath('/dashboard/creators')
    return { success: true, creatorId }
  } catch (error) {
    logger.error('registerCreator failed', { error })
    return { success: false }
  }
}

export async function getCreatorDetail(creatorId: string): Promise<{
  creator: Creator | null
  assets: number
  revenue: number
  payouts: number
}> {
  const ctx = await resolveOrgContext()

  try {
    const [creator] = (await platformDb.execute(
      sql`SELECT
        entity_id as id, metadata->>'name' as name,
        metadata->>'email' as email,
        metadata->>'status' as status,
        metadata->>'genre' as genre,
        metadata->>'country' as country,
        created_at as "createdAt"
      FROM audit_log
      WHERE entity_id = ${creatorId} AND entity_type = 'creator'
      AND org_id = ${ctx.entityId}
      ORDER BY created_at DESC LIMIT 1`,
    )) as unknown as [Creator | undefined]

    const [assetCount] = (await platformDb.execute(
      sql`SELECT COUNT(*) as count FROM audit_log
      WHERE metadata->>'creatorId' = ${creatorId} AND action = 'asset.created'
      AND org_id = ${ctx.entityId}`,
    )) as unknown as [{ count: number }]

    const [revenueSum] = (await platformDb.execute(
      sql`SELECT COALESCE(SUM(CAST(metadata->>'amount' AS NUMERIC)), 0) as total
      FROM audit_log
      WHERE metadata->>'creatorId' = ${creatorId} AND action = 'revenue.recorded'
      AND org_id = ${ctx.entityId}`,
    )) as unknown as [{ total: number }]

    const [payoutCount] = (await platformDb.execute(
      sql`SELECT COUNT(*) as count FROM audit_log
      WHERE metadata->>'creatorId' = ${creatorId} AND action = 'payout.executed'
      AND org_id = ${ctx.entityId}`,
    )) as unknown as [{ count: number }]

    return {
      creator: creator ?? null,
      assets: Number(assetCount?.count ?? 0),
      revenue: Number(revenueSum?.total ?? 0),
      payouts: Number(payoutCount?.count ?? 0),
    }
  } catch (error) {
    logger.error('getCreatorDetail failed', { error })
    return { creator: null, assets: 0, revenue: 0, payouts: 0 }
  }
}
