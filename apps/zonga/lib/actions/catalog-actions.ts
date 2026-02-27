/**
 * Zonga Server Actions — Catalog (Content Assets).
 *
 * CRUD for tracks, albums, and other content assets.
 * Uses @nzila/zonga-core schemas for validation.
 */
'use server'

import { resolveOrgContext } from '@/lib/resolve-org'
import { platformDb } from '@nzila/db/platform'
import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import {
  CreateContentAssetSchema,
  buildZongaAuditEvent,
  ZongaAuditAction,
  ZongaEntityType,
  AssetStatus,
  type ContentAsset,
} from '@/lib/zonga-services'
import { buildEvidencePackFromAction, processEvidencePack } from '@/lib/evidence'
import { logTransition } from '@/lib/commerce-telemetry'

export interface CatalogListResult {
  assets: ContentAsset[]
  total: number
  hasMore: boolean
}

export async function listCatalogAssets(opts?: {
  page?: number
  pageSize?: number
  search?: string
  type?: string
  status?: string
}): Promise<CatalogListResult> {
  const ctx = await resolveOrgContext()

  const page = opts?.page ?? 1
  const pageSize = opts?.pageSize ?? 25
  const offset = (page - 1) * pageSize

  try {
    const assets = (await platformDb.execute(
      sql`SELECT
        id, metadata->>'title' as title,
        metadata->>'type' as type,
        metadata->>'status' as status,
        metadata->>'creatorId' as "creatorId",
        metadata->>'creatorName' as "creatorName",
        metadata->>'duration' as duration,
        metadata->>'genre' as genre,
        metadata->>'isrc' as isrc,
        created_at as "createdAt"
      FROM audit_log
      WHERE (action = 'asset.created' OR action = 'asset.published')
        AND org_id = ${ctx.entityId}
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}`,
    )) as unknown as { rows: ContentAsset[] }

    const [countResult] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM audit_log
      WHERE (action = 'asset.created' OR action = 'asset.published')
        AND org_id = ${ctx.entityId}`,
    )) as unknown as [{ total: number }]

    const total = Number(countResult?.total ?? 0)
    return {
      assets: assets.rows ?? [],
      total,
      hasMore: page * pageSize < total,
    }
  } catch (error) {
    logger.error('listCatalogAssets failed', { error })
    return { assets: [], total: 0, hasMore: false }
  }
}

export async function createContentAsset(data: {
  title: string
  type: string
  genre?: string
  creatorId?: string
  creatorName?: string
  duration?: number
}): Promise<{ success: boolean; assetId?: string; error?: unknown }> {
  const ctx = await resolveOrgContext()

  const parsed = CreateContentAssetSchema.safeParse(data)
  if (!parsed.success) {
    logger.warn('createContentAsset validation failed', { errors: parsed.error.flatten().fieldErrors })
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  try {
    const assetId = crypto.randomUUID()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, org_id, metadata)
      VALUES ('asset.created', ${ctx.actorId}, 'content_asset', ${assetId}, ${ctx.entityId},
        ${JSON.stringify({ ...data, status: AssetStatus.DRAFT, id: assetId })}::jsonb)`,
    )

    const auditEvent = buildZongaAuditEvent({
      action: ZongaAuditAction.CONTENT_UPLOAD,
      entityType: ZongaEntityType.CONTENT_ASSET,
      entityId: assetId,
      actorId: ctx.actorId,
      targetId: assetId,
      metadata: { title: data.title, type: data.type },
    })
    logger.info('Content asset created', { ...auditEvent })

    const pack = buildEvidencePackFromAction({
      actionType: 'CONTENT_ASSET_CREATED',
      entityId: assetId,
      executedBy: ctx.actorId,
      actionId: crypto.randomUUID(),
    })
    await processEvidencePack(pack)

    revalidatePath('/dashboard/catalog')
    return { success: true, assetId }
  } catch (error) {
    logger.error('createContentAsset failed', { error })
    return { success: false }
  }
}

export async function publishAsset(assetId: string): Promise<{ success: boolean }> {
  const ctx = await resolveOrgContext()

  try {
    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, org_id, metadata)
      VALUES ('asset.published', ${ctx.actorId}, 'content_asset', ${assetId}, ${ctx.entityId},
        ${JSON.stringify({ status: AssetStatus.PUBLISHED, publishedAt: new Date().toISOString() })}::jsonb)`,
    )

    const auditEvent = buildZongaAuditEvent({
      action: ZongaAuditAction.CONTENT_PUBLISH,
      entityType: ZongaEntityType.CONTENT_ASSET,
      entityId: assetId,
      actorId: ctx.actorId,
      targetId: assetId,
    })
    logger.info('Content asset published', { ...auditEvent })

    logTransition(
      { orgId: assetId },
      'content_asset',
      AssetStatus.DRAFT,
      AssetStatus.PUBLISHED,
      true,
    )

    revalidatePath('/dashboard/catalog')
    return { success: true }
  } catch (error) {
    logger.error('publishAsset failed', { error })
    return { success: false }
  }
}

export async function getAssetDetail(assetId: string): Promise<ContentAsset | null> {
  const ctx = await resolveOrgContext()

  try {
    const [row] = (await platformDb.execute(
      sql`SELECT
        entity_id as id, metadata->>'title' as title,
        metadata->>'type' as type,
        metadata->>'status' as status,
        metadata->>'creatorId' as "creatorId",
        metadata->>'creatorName' as "creatorName",
        metadata->>'duration' as duration,
        metadata->>'genre' as genre,
        metadata->>'isrc' as isrc,
        created_at as "createdAt"
      FROM audit_log
      WHERE entity_id = ${assetId} AND entity_type = 'content_asset'
        AND org_id = ${ctx.entityId}
      ORDER BY created_at DESC
      LIMIT 1`,
    )) as unknown as [ContentAsset | undefined]

    return row ?? null
  } catch (error) {
    logger.error('getAssetDetail failed', { error })
    return null
  }
}
