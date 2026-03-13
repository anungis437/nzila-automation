/**
 * Zonga Server Actions — Releases + Analytics + Integrity.
 *
 * Release bundling, analytics queries, and content integrity checks.
 * Reads/writes domain tables (zonga_releases, zonga_content_assets,
 * zonga_revenue_events) + audit_log for traceability.
 */
'use server'

import { resolveOrgContext } from '@/lib/resolve-org'
import { platformDb } from '@nzila/db/platform'
import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import {
  buildZongaAuditEvent,
  ZongaAuditAction,
  ZongaEntityType,
  ReleaseStatus,
  CreateReleaseSchema,
  type Release,
} from '@/lib/zonga-services'
import { transitionRelease } from '@/lib/workflows/release-state-machine'
import { runPrediction } from '@/lib/ml-client'
import { buildEvidencePackFromAction, processEvidencePack } from '@/lib/evidence'
import { logTransition } from '@/lib/commerce-telemetry'

/* ─── Releases ─── */

export interface ReleaseListResult {
  releases: Release[]
  total: number
}

export async function listReleases(opts?: {
  page?: number
  status?: string
}): Promise<ReleaseListResult> {
  const ctx = await resolveOrgContext()

  const page = opts?.page ?? 1
  const offset = (page - 1) * 25

  try {
    const rows = (await platformDb.execute(
      sql`SELECT
        r.id,
        r.title,
        r.status,
        r.release_type as type,
        r.release_date as "releaseDate",
        r.published_at as "publishedAt",
        c.display_name as "creatorName",
        (SELECT COUNT(*) FROM zonga_release_tracks rt WHERE rt.release_id = r.id) as "trackCount",
        r.metadata->>'upc' as upc,
        r.created_at as "createdAt"
      FROM zonga_releases r
      JOIN zonga_creators c ON c.id = r.creator_id
      WHERE r.org_id = ${ctx.orgId}
      ORDER BY r.created_at DESC
      LIMIT 25 OFFSET ${offset}`,
    )) as unknown as { rows: Release[] }

    const [cnt] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM zonga_releases WHERE org_id = ${ctx.orgId}`,
    )) as unknown as [{ total: number }]

    return {
      releases: rows.rows ?? [],
      total: Number(cnt?.total ?? 0),
    }
  } catch (error) {
    logger.error('listReleases failed', { error })
    return { releases: [], total: 0 }
  }
}

export async function createRelease(data: {
  title: string
  type: 'single' | 'ep' | 'album' | 'compilation'
  creatorId: string
  creatorName?: string
  trackCount?: number
  releaseDate?: string
}): Promise<{ success: boolean; releaseId?: string; error?: unknown }> {
  const ctx = await resolveOrgContext()

  const parsed = CreateReleaseSchema.safeParse(data)
  if (!parsed.success) {
    logger.warn('createRelease validation failed', { errors: parsed.error.flatten().fieldErrors })
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  try {
    const releaseId = crypto.randomUUID()

    // Write to domain table
    await platformDb.execute(
      sql`INSERT INTO zonga_releases (id, org_id, creator_id, title, status, release_type, release_date)
      VALUES (${releaseId}, ${ctx.orgId}, ${data.creatorId}, ${data.title},
        ${ReleaseStatus.DRAFT}, ${data.type}, ${data.releaseDate ? new Date(data.releaseDate) : null})`,
    )

    // Supplementary audit trail
    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, org_id, metadata)
      VALUES ('release.created', ${ctx.actorId}, 'release', ${releaseId}, ${ctx.orgId},
        ${JSON.stringify({ title: data.title, type: data.type })}::jsonb)`,
    )

    const auditEvent = buildZongaAuditEvent({
      action: ZongaAuditAction.RELEASE_PUBLISH,
      entityType: ZongaEntityType.RELEASE,
      orgId: releaseId,
      actorId: ctx.actorId,
      targetId: releaseId,
      metadata: { title: data.title, type: data.type },
    })
    logger.info('Release created', { ...auditEvent })

    revalidatePath('/dashboard/releases')
    return { success: true, releaseId }
  } catch (error) {
    logger.error('createRelease failed', { error })
    return { success: false }
  }
}

export async function transitionReleaseStatus(
  releaseId: string,
  targetStatus: ReleaseStatus,
): Promise<{ success: boolean; error?: string }> {
  const ctx = await resolveOrgContext()

  try {
    // Read current status from domain table
    const [release] = (await platformDb.execute(
      sql`SELECT id, status, title FROM zonga_releases
      WHERE id = ${releaseId} AND org_id = ${ctx.orgId}`,
    )) as unknown as [{ id: string; status: ReleaseStatus; title: string } | undefined]

    if (!release) {
      return { success: false, error: 'Release not found' }
    }

    const result = transitionRelease(
      release.status as ReleaseStatus,
      targetStatus,
      { role: 'admin', actorId: ctx.actorId, orgId: ctx.orgId },
      releaseId,
      { id: releaseId, title: release.title },
    )

    if (!result.success) {
      return { success: false, error: `Transition not allowed: ${release.status} → ${targetStatus}` }
    }

    // Update domain table
    const now = new Date()
    await platformDb.execute(
      sql`UPDATE zonga_releases
      SET status = ${targetStatus},
          published_at = ${targetStatus === ReleaseStatus.PUBLISHED ? now : null},
          updated_at = ${now}
      WHERE id = ${releaseId}`,
    )

    // Audit trail
    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, org_id, metadata)
      VALUES (${'release.status_changed'}, ${ctx.actorId}, 'release', ${releaseId}, ${ctx.orgId},
        ${JSON.stringify({ from: release.status, to: targetStatus })}::jsonb)`,
    )

    logTransition({ orgId: ctx.orgId }, 'release', release.status, targetStatus, true)

    if (targetStatus === ReleaseStatus.PUBLISHED) {
      const pack = buildEvidencePackFromAction({
        actionType: 'RELEASE_PUBLISHED',
        orgId: ctx.orgId,
        executedBy: ctx.actorId,
        actionId: crypto.randomUUID(),
      })
      await processEvidencePack(pack)
    }

    logger.info('Release status transitioned', { releaseId, from: release.status, to: targetStatus })
    revalidatePath('/dashboard/releases')
    return { success: true }
  } catch (error) {
    logger.error('transitionReleaseStatus failed', { error })
    return { success: false, error: 'Internal error' }
  }
}

/** @deprecated Use transitionReleaseStatus instead */
export async function publishRelease(
  releaseId: string,
): Promise<{ success: boolean }> {
  return transitionReleaseStatus(releaseId, ReleaseStatus.PUBLISHED)
}

/* ─── Analytics ─── */

export interface AnalyticsOverview {
  totalStreams: number
  totalDownloads: number
  uniqueListeners: number
  topAssets: Array<{ assetId: string; title: string; streams: number }>
  revenueByMonth: Array<{ month: string; amount: number }>
  totalFollowers: number
  totalFavorites: number
  totalCreators: number
  totalReleases: number
  topCreators: Array<{ creatorId: string; name: string; streams: number }>
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const ctx = await resolveOrgContext()

  try {
    const [streams] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM zonga_revenue_events
      WHERE type = 'stream' AND org_id = ${ctx.orgId}`,
    )) as unknown as [{ total: number }]

    const [downloads] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM zonga_revenue_events
      WHERE type = 'download' AND org_id = ${ctx.orgId}`,
    )) as unknown as [{ total: number }]

    const [listeners] = (await platformDb.execute(
      sql`SELECT COUNT(DISTINCT la.listener_id) as total
      FROM zonga_listener_activity la
      WHERE la.org_id = ${ctx.orgId} AND la.activity_type = 'stream'`,
    )) as unknown as [{ total: number }]

    const topAssets = (await platformDb.execute(
      sql`SELECT
        r.asset_id as "assetId",
        COALESCE(a.title, r.asset_id::text) as title,
        COUNT(*) as streams
      FROM zonga_revenue_events r
      LEFT JOIN zonga_content_assets a ON a.id = r.asset_id
      WHERE r.type = 'stream' AND r.org_id = ${ctx.orgId}
      GROUP BY r.asset_id, a.title
      ORDER BY streams DESC LIMIT 10`,
    )) as unknown as { rows: Array<{ assetId: string; title: string; streams: number }> }

    const revenueByMonth = (await platformDb.execute(
      sql`SELECT
        TO_CHAR(occurred_at, 'YYYY-MM') as month,
        COALESCE(SUM(amount::numeric), 0) as amount
      FROM zonga_revenue_events WHERE org_id = ${ctx.orgId}
      GROUP BY TO_CHAR(occurred_at, 'YYYY-MM')
      ORDER BY month DESC LIMIT 12`,
    )) as unknown as { rows: Array<{ month: string; amount: number }> }

    const [followers] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM zonga_listener_follows
      WHERE org_id = ${ctx.orgId}`,
    )) as unknown as [{ total: number }]

    const [favorites] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM zonga_listener_favorites
      WHERE org_id = ${ctx.orgId}`,
    )) as unknown as [{ total: number }]

    const [creators] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM zonga_creators
      WHERE org_id = ${ctx.orgId} AND status = 'active'`,
    )) as unknown as [{ total: number }]

    const [releases] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM zonga_releases
      WHERE org_id = ${ctx.orgId} AND status = 'published'`,
    )) as unknown as [{ total: number }]

    const topCreators = (await platformDb.execute(
      sql`SELECT
        r.creator_id as "creatorId",
        COALESCE(c.display_name, r.creator_id::text) as name,
        COUNT(*) as streams
      FROM zonga_revenue_events r
      LEFT JOIN zonga_creators c ON c.id = r.creator_id
      WHERE r.type = 'stream' AND r.org_id = ${ctx.orgId}
      GROUP BY r.creator_id, c.display_name
      ORDER BY streams DESC LIMIT 10`,
    )) as unknown as { rows: Array<{ creatorId: string; name: string; streams: number }> }

    return {
      totalStreams: Number(streams?.total ?? 0),
      totalDownloads: Number(downloads?.total ?? 0),
      uniqueListeners: Number(listeners?.total ?? 0),
      topAssets: topAssets.rows ?? [],
      revenueByMonth: revenueByMonth.rows ?? [],
      totalFollowers: Number(followers?.total ?? 0),
      totalFavorites: Number(favorites?.total ?? 0),
      totalCreators: Number(creators?.total ?? 0),
      totalReleases: Number(releases?.total ?? 0),
      topCreators: topCreators.rows ?? [],
    }
  } catch (error) {
    logger.error('getAnalyticsOverview failed', { error })
    return {
      totalStreams: 0,
      totalDownloads: 0,
      uniqueListeners: 0,
      topAssets: [],
      revenueByMonth: [],
      totalFollowers: 0,
      totalFavorites: 0,
      totalCreators: 0,
      totalReleases: 0,
      topCreators: [],
    }
  }
}

/* ─── Content Integrity ─── */

export interface IntegrityCheck {
  id: string
  type: 'duplicate' | 'metadata-mismatch' | 'rights-conflict' | 'ai-flagged'
  assetId: string
  assetTitle: string
  severity: 'info' | 'warning' | 'critical' | 'high' | 'medium' | 'low'
  message: string
  checkType: string
  confidence: number | null
  checkedAt: string
  description: string
  createdAt: Date
  resolved: boolean
}

export interface IntegritySummary {
  total: number
  passed: number
  flagged: number
  critical: number
}

export interface IntegrityResult {
  checks: IntegrityCheck[]
  summary: IntegritySummary
}

export async function getIntegrityChecks(): Promise<IntegrityResult> {
  const _ctx = await resolveOrgContext()

  try {
    // Run ML-based content integrity check
    const prediction = await runPrediction({
      model: 'content-integrity-checker',
      features: { scope: 'platform' },
    })

    const checks: IntegrityCheck[] = []

    if (prediction?.issues && Array.isArray(prediction.issues)) {
      for (const issue of prediction.issues) {
        checks.push({
          id: `integrity-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: issue.type ?? 'ai-flagged',
          assetId: issue.assetId ?? '',
          assetTitle: issue.assetTitle ?? 'Unknown Asset',
          severity: issue.severity ?? 'info',
          message: issue.description ?? 'AI-flagged content issue',
          checkType: issue.type ?? 'ai-flagged',
          confidence: issue.confidence ?? null,
          checkedAt: new Date().toISOString(),
          description: issue.description ?? 'AI-flagged content issue',
          createdAt: new Date(),
          resolved: false,
        })
      }
    }

    const critical = checks.filter((c) => c.severity === 'critical' || c.severity === 'high').length
    const flagged = checks.filter((c) => c.severity === 'warning' || c.severity === 'medium').length
    const passed = checks.length - critical - flagged

    return {
      checks,
      summary: {
        total: checks.length,
        passed: Math.max(0, passed),
        flagged,
        critical,
      },
    }
  } catch (error) {
    logger.error('getIntegrityChecks failed', { error })
    return { checks: [], summary: { total: 0, passed: 0, flagged: 0, critical: 0 } }
  }
}
