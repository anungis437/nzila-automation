/**
 * Zonga Server Actions — Social & Engagement.
 *
 * Follow creators, like content, post comments, and tip artists.
 * Reads/writes domain tables (zonga_listener_follows, zonga_listener_favorites,
 * zonga_listener_activity, zonga_revenue_events) + audit_log for traceability.
 */
'use server'

import { resolveOrgContext } from '@/lib/resolve-org'
import { platformDb } from '@nzila/db/platform'
import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import { RevenueType } from '@/lib/zonga-services'

/* ─── Types ─── */

export interface Follow {
  id: string
  listenerId: string
  creatorId: string
  creatorName?: string
  createdAt?: Date
}

export interface Like {
  id: string
  listenerId: string
  entityId: string
  entityType: string
  createdAt?: Date
}

export interface Comment {
  id: string
  userId: string
  userName?: string
  assetId: string
  content: string
  createdAt?: Date
}

export interface SocialStats {
  followers: number
  following: number
  likes: number
  comments: number
}

/* ─── Follow ─── */

export async function followCreator(creatorId: string): Promise<{ success: boolean }> {
  const ctx = await resolveOrgContext()

  try {
    // Check if already following
    const [existing] = (await platformDb.execute(
      sql`SELECT id FROM zonga_listener_follows
      WHERE listener_id = ${ctx.actorId} AND creator_id = ${creatorId} AND org_id = ${ctx.orgId}
      LIMIT 1`,
    )) as unknown as [{ id: string } | undefined]

    if (existing) {
      return { success: true }
    }

    await platformDb.execute(
      sql`INSERT INTO zonga_listener_follows (org_id, listener_id, creator_id)
      VALUES (${ctx.orgId}, ${ctx.actorId}, ${creatorId})`,
    )

    // Activity tracking
    await platformDb.execute(
      sql`INSERT INTO zonga_listener_activity (org_id, listener_id, activity_type, entity_type, entity_id)
      VALUES (${ctx.orgId}, ${ctx.actorId}, 'follow', 'creator', ${creatorId})`,
    )

    logger.info('Creator followed', { listenerId: ctx.actorId, creatorId })
    return { success: true }
  } catch (error) {
    logger.error('followCreator failed', { error })
    return { success: false }
  }
}

/** @deprecated Use followCreator instead */
export const followUser = followCreator

export async function unfollowCreator(creatorId: string): Promise<{ success: boolean }> {
  const ctx = await resolveOrgContext()

  try {
    await platformDb.execute(
      sql`DELETE FROM zonga_listener_follows
      WHERE listener_id = ${ctx.actorId} AND creator_id = ${creatorId} AND org_id = ${ctx.orgId}`,
    )

    logger.info('Creator unfollowed', { listenerId: ctx.actorId, creatorId })
    return { success: true }
  } catch (error) {
    logger.error('unfollowCreator failed', { error })
    return { success: false }
  }
}

/** @deprecated Use unfollowCreator instead */
export const unfollowUser = unfollowCreator

export async function listFollowers(creatorId: string): Promise<Follow[]> {
  const ctx = await resolveOrgContext()

  try {
    const rows = (await platformDb.execute(
      sql`SELECT
        f.id,
        f.listener_id as "listenerId",
        f.creator_id as "creatorId",
        c.display_name as "creatorName",
        f.created_at as "createdAt"
      FROM zonga_listener_follows f
      LEFT JOIN zonga_creators c ON c.id = f.creator_id
      WHERE f.creator_id = ${creatorId} AND f.org_id = ${ctx.orgId}
      ORDER BY f.created_at DESC`,
    )) as unknown as { rows: Follow[] }

    return rows.rows ?? []
  } catch (error) {
    logger.error('listFollowers failed', { error })
    return []
  }
}

export async function listFollowing(userId_?: string): Promise<Follow[]> {
  const ctx = await resolveOrgContext()
  const targetUser = userId_ ?? ctx.actorId

  try {
    const rows = (await platformDb.execute(
      sql`SELECT
        f.id,
        f.listener_id as "listenerId",
        f.creator_id as "creatorId",
        c.display_name as "creatorName",
        f.created_at as "createdAt"
      FROM zonga_listener_follows f
      LEFT JOIN zonga_creators c ON c.id = f.creator_id
      WHERE f.listener_id = ${targetUser} AND f.org_id = ${ctx.orgId}
      ORDER BY f.created_at DESC`,
    )) as unknown as { rows: Follow[] }

    return rows.rows ?? []
  } catch (error) {
    logger.error('listFollowing failed', { error })
    return []
  }
}

/* ─── Favorites (replaces likes) ─── */

export async function favoriteEntity(
  entityType: string,
  entityId: string,
): Promise<{ success: boolean }> {
  const ctx = await resolveOrgContext()

  try {
    // Idempotent: skip if already favorited
    const [existing] = (await platformDb.execute(
      sql`SELECT id FROM zonga_listener_favorites
      WHERE listener_id = ${ctx.actorId} AND entity_id = ${entityId} AND org_id = ${ctx.orgId}
      LIMIT 1`,
    )) as unknown as [{ id: string } | undefined]

    if (existing) return { success: true }

    await platformDb.execute(
      sql`INSERT INTO zonga_listener_favorites (org_id, listener_id, entity_type, entity_id)
      VALUES (${ctx.orgId}, ${ctx.actorId}, ${entityType}, ${entityId})`,
    )

    logger.info('Entity favorited', { listenerId: ctx.actorId, entityType, entityId })
    return { success: true }
  } catch (error) {
    logger.error('favoriteEntity failed', { error })
    return { success: false }
  }
}

/** @deprecated Use favoriteEntity instead */
export async function likeAsset(assetId: string, _assetTitle?: string) {
  return favoriteEntity('asset', assetId)
}

export async function unfavoriteEntity(entityId: string): Promise<{ success: boolean }> {
  const ctx = await resolveOrgContext()

  try {
    await platformDb.execute(
      sql`DELETE FROM zonga_listener_favorites
      WHERE listener_id = ${ctx.actorId} AND entity_id = ${entityId} AND org_id = ${ctx.orgId}`,
    )

    return { success: true }
  } catch (error) {
    logger.error('unfavoriteEntity failed', { error })
    return { success: false }
  }
}

/** @deprecated Use unfavoriteEntity instead */
export async function unlikeAsset(assetId: string) {
  return unfavoriteEntity(assetId)
}

export async function getEntityFavoriteCount(entityId: string): Promise<number> {
  const ctx = await resolveOrgContext()

  try {
    const [result] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM zonga_listener_favorites
      WHERE entity_id = ${entityId} AND org_id = ${ctx.orgId}`,
    )) as unknown as [{ total: number }]

    return Number(result?.total ?? 0)
  } catch (error) {
    logger.error('getEntityFavoriteCount failed', { error })
    return 0
  }
}

/** @deprecated Use getEntityFavoriteCount instead */
export const getAssetLikeCount = getEntityFavoriteCount

/* ─── Comments (kept in audit_log for now — low-volume append-only) ─── */

export async function postComment(data: {
  assetId: string
  content: string
  userName?: string
}): Promise<{ success: boolean; commentId?: string }> {
  const ctx = await resolveOrgContext()

  try {
    const commentId = crypto.randomUUID()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, org_id, metadata)
      VALUES ('social.commented', ${ctx.actorId}, 'comment', ${commentId}, ${ctx.orgId},
        ${JSON.stringify({
          userId: ctx.actorId,
          userName: data.userName,
          assetId: data.assetId,
          content: data.content,
        })}::jsonb)`,
    )

    // Activity tracking
    await platformDb.execute(
      sql`INSERT INTO zonga_listener_activity (org_id, listener_id, activity_type, entity_type, entity_id, metadata_json)
      VALUES (${ctx.orgId}, ${ctx.actorId}, 'comment', 'asset', ${data.assetId},
        ${JSON.stringify({ commentId })}::jsonb)`,
    )

    logger.info('Comment posted', { userId: ctx.actorId, assetId: data.assetId })
    revalidatePath('/dashboard/catalog')
    return { success: true, commentId }
  } catch (error) {
    logger.error('postComment failed', { error })
    return { success: false }
  }
}

export async function listComments(assetId: string): Promise<Comment[]> {
  const ctx = await resolveOrgContext()

  try {
    const rows = (await platformDb.execute(
      sql`SELECT
        entity_id as id,
        metadata->>'userId' as "userId",
        metadata->>'userName' as "userName",
        metadata->>'assetId' as "assetId",
        metadata->>'content' as content,
        created_at as "createdAt"
      FROM audit_log
      WHERE action = 'social.commented' AND metadata->>'assetId' = ${assetId}
        AND org_id = ${ctx.orgId}
      ORDER BY created_at DESC`,
    )) as unknown as { rows: Comment[] }

    return rows.rows ?? []
  } catch (error) {
    logger.error('listComments failed', { error })
    return []
  }
}

/* ─── Tip (send creator a tip) ─── */

export async function tipCreator(data: {
  creatorId: string
  creatorName?: string
  amount: number
  currency: string
  message?: string
}): Promise<{ success: boolean }> {
  const ctx = await resolveOrgContext()

  try {
    // Record revenue in domain table
    await platformDb.execute(
      sql`INSERT INTO zonga_revenue_events (org_id, creator_id, type, amount, currency, source, description)
      VALUES (${ctx.orgId}, ${data.creatorId}, ${RevenueType.TIP}, ${data.amount},
        ${data.currency}, 'tip', ${data.message ?? null})`,
    )

    // Activity tracking
    await platformDb.execute(
      sql`INSERT INTO zonga_listener_activity (org_id, listener_id, activity_type, entity_type, entity_id, metadata_json)
      VALUES (${ctx.orgId}, ${ctx.actorId}, 'tip', 'creator', ${data.creatorId},
        ${JSON.stringify({ amount: data.amount, currency: data.currency })}::jsonb)`,
    )

    logger.info('Tip sent', { senderId: ctx.actorId, creatorId: data.creatorId, amount: data.amount })
    return { success: true }
  } catch (error) {
    logger.error('tipCreator failed', { error })
    return { success: false }
  }
}

/* ─── Social Stats ─── */

export async function getSocialStats(entityId: string): Promise<SocialStats> {
  const ctx = await resolveOrgContext()

  try {
    const [followers] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM zonga_listener_follows
      WHERE creator_id = ${entityId} AND org_id = ${ctx.orgId}`,
    )) as unknown as [{ total: number }]

    const [following] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM zonga_listener_follows
      WHERE listener_id = ${entityId} AND org_id = ${ctx.orgId}`,
    )) as unknown as [{ total: number }]

    const [likes] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM zonga_listener_favorites
      WHERE listener_id = ${entityId} AND org_id = ${ctx.orgId}`,
    )) as unknown as [{ total: number }]

    const [comments] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM zonga_listener_activity
      WHERE listener_id = ${entityId} AND activity_type = 'comment' AND org_id = ${ctx.orgId}`,
    )) as unknown as [{ total: number }]

    return {
      followers: Number(followers?.total ?? 0),
      following: Number(following?.total ?? 0),
      likes: Number(likes?.total ?? 0),
      comments: Number(comments?.total ?? 0),
    }
  } catch (error) {
    logger.error('getSocialStats failed', { error })
    return { followers: 0, following: 0, likes: 0, comments: 0 }
  }
}
