/**
 * Zonga Server Actions — Social & Engagement.
 *
 * Follow creators, like content, post comments, and tip artists.
 * All interactions are stored via audit_log for event-sourced state.
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
  followerId: string
  followingId: string
  followingName?: string
  createdAt?: Date
}

export interface Like {
  id: string
  userId: string
  assetId: string
  assetTitle?: string
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

export async function followUser(followingId: string, followingName?: string): Promise<{ success: boolean }> {
  const ctx = await resolveOrgContext()

  try {
    const followId = crypto.randomUUID()

    // Check if already following
    const [existing] = (await platformDb.execute(
      sql`SELECT entity_id FROM audit_log
      WHERE action = 'social.followed'
        AND metadata->>'followerId' = ${ctx.actorId}
        AND metadata->>'followingId' = ${followingId}
        AND org_id = ${ctx.entityId}
      LIMIT 1`,
    )) as unknown as [{ entity_id: string } | undefined]

    if (existing) {
      return { success: true } // Already following
    }

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, org_id, metadata)
      VALUES ('social.followed', ${ctx.actorId}, 'follow', ${followId}, ${ctx.entityId},
        ${JSON.stringify({
          followerId: ctx.actorId,
          followingId,
          followingName,
        })}::jsonb)`,
    )

    logger.info('User followed', { followerId: ctx.actorId, followingId })
    return { success: true }
  } catch (error) {
    logger.error('followUser failed', { error })
    return { success: false }
  }
}

export async function unfollowUser(followingId: string): Promise<{ success: boolean }> {
  const ctx = await resolveOrgContext()

  try {
    const unfollowId = crypto.randomUUID()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, org_id, metadata)
      VALUES ('social.unfollowed', ${ctx.actorId}, 'follow', ${unfollowId}, ${ctx.entityId},
        ${JSON.stringify({
          followerId: ctx.actorId,
          followingId,
        })}::jsonb)`,
    )

    logger.info('User unfollowed', { followerId: ctx.actorId, followingId })
    return { success: true }
  } catch (error) {
    logger.error('unfollowUser failed', { error })
    return { success: false }
  }
}

export async function listFollowers(creatorId: string): Promise<Follow[]> {
  const ctx = await resolveOrgContext()

  try {
    const rows = (await platformDb.execute(
      sql`SELECT
        entity_id as id,
        metadata->>'followerId' as "followerId",
        metadata->>'followingId' as "followingId",
        metadata->>'followingName' as "followingName",
        created_at as "createdAt"
      FROM audit_log
      WHERE action = 'social.followed' AND metadata->>'followingId' = ${creatorId}
        AND org_id = ${ctx.entityId}
        AND entity_id NOT IN (
          SELECT metadata->>'originalFollowId' FROM audit_log
          WHERE action = 'social.unfollowed' AND metadata->>'followingId' = ${creatorId}
            AND org_id = ${ctx.entityId}
        )
      ORDER BY created_at DESC`,
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
        entity_id as id,
        metadata->>'followerId' as "followerId",
        metadata->>'followingId' as "followingId",
        metadata->>'followingName' as "followingName",
        created_at as "createdAt"
      FROM audit_log
      WHERE action = 'social.followed' AND metadata->>'followerId' = ${targetUser}
        AND org_id = ${ctx.entityId}
      ORDER BY created_at DESC`,
    )) as unknown as { rows: Follow[] }

    return rows.rows ?? []
  } catch (error) {
    logger.error('listFollowing failed', { error })
    return []
  }
}

/* ─── Likes ─── */

export async function likeAsset(
  assetId: string,
  assetTitle?: string,
): Promise<{ success: boolean }> {
  const ctx = await resolveOrgContext()

  try {
    const likeId = crypto.randomUUID()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, org_id, metadata)
      VALUES ('social.liked', ${ctx.actorId}, 'like', ${likeId}, ${ctx.entityId},
        ${JSON.stringify({
          userId: ctx.actorId,
          assetId,
          assetTitle,
        })}::jsonb)`,
    )

    logger.info('Asset liked', { userId: ctx.actorId, assetId })
    return { success: true }
  } catch (error) {
    logger.error('likeAsset failed', { error })
    return { success: false }
  }
}

export async function unlikeAsset(assetId: string): Promise<{ success: boolean }> {
  const ctx = await resolveOrgContext()

  try {
    const unlikeId = crypto.randomUUID()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, org_id, metadata)
      VALUES ('social.unliked', ${ctx.actorId}, 'like', ${unlikeId}, ${ctx.entityId},
        ${JSON.stringify({
          userId: ctx.actorId,
          assetId,
        })}::jsonb)`,
    )

    return { success: true }
  } catch (error) {
    logger.error('unlikeAsset failed', { error })
    return { success: false }
  }
}

export async function getAssetLikeCount(assetId: string): Promise<number> {
  const ctx = await resolveOrgContext()

  try {
    const [likes] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM audit_log
      WHERE action = 'social.liked' AND metadata->>'assetId' = ${assetId}
        AND org_id = ${ctx.entityId}`,
    )) as unknown as [{ total: number }]

    const [unlikes] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM audit_log
      WHERE action = 'social.unliked' AND metadata->>'assetId' = ${assetId}
        AND org_id = ${ctx.entityId}`,
    )) as unknown as [{ total: number }]

    return Math.max(0, Number(likes?.total ?? 0) - Number(unlikes?.total ?? 0))
  } catch (error) {
    logger.error('getAssetLikeCount failed', { error })
    return 0
  }
}

/* ─── Comments ─── */

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
      VALUES ('social.commented', ${ctx.actorId}, 'comment', ${commentId}, ${ctx.entityId},
        ${JSON.stringify({
          userId: ctx.actorId,
          userName: data.userName,
          assetId: data.assetId,
          content: data.content,
        })}::jsonb)`,
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
        AND org_id = ${ctx.entityId}
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
    const tipId = crypto.randomUUID()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, org_id, metadata)
      VALUES ('social.tipped', ${ctx.actorId}, 'tip', ${tipId}, ${ctx.entityId},
        ${JSON.stringify({
          senderId: ctx.actorId,
          creatorId: data.creatorId,
          creatorName: data.creatorName,
          amount: data.amount,
          currency: data.currency,
          message: data.message,
        })}::jsonb)`,
    )

    // Also record it as revenue for the creator
    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, org_id, metadata)
      VALUES ('revenue.recorded', ${ctx.actorId}, 'revenue', ${crypto.randomUUID()}, ${ctx.entityId},
        ${JSON.stringify({
          type: RevenueType.TIP,
          creatorId: data.creatorId,
          amount: data.amount,
          currency: data.currency,
        })}::jsonb)`,
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
      sql`SELECT COUNT(*) as total FROM audit_log
      WHERE action = 'social.followed' AND metadata->>'followingId' = ${entityId}
        AND org_id = ${ctx.entityId}`,
    )) as unknown as [{ total: number }]

    const [following] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM audit_log
      WHERE action = 'social.followed' AND metadata->>'followerId' = ${entityId}
        AND org_id = ${ctx.entityId}`,
    )) as unknown as [{ total: number }]

    const [likes] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM audit_log
      WHERE action = 'social.liked' AND metadata->>'userId' = ${entityId}
        AND org_id = ${ctx.entityId}`,
    )) as unknown as [{ total: number }]

    const [comments] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM audit_log
      WHERE action = 'social.commented' AND metadata->>'userId' = ${entityId}
        AND org_id = ${ctx.entityId}`,
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
