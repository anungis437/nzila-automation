/**
 * Zonga Server Actions — Social & Engagement.
 *
 * Follow creators, like content, post comments, and tip artists.
 * All interactions are stored via audit_log for event-sourced state.
 */
'use server'

import { auth } from '@clerk/nextjs/server'
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
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const followId = crypto.randomUUID()

    // Check if already following
    const [existing] = (await platformDb.execute(
      sql`SELECT entity_id FROM audit_log
      WHERE action = 'social.followed'
        AND metadata->>'followerId' = ${userId}
        AND metadata->>'followingId' = ${followingId}
      LIMIT 1`,
    )) as unknown as [{ entity_id: string } | undefined]

    if (existing) {
      return { success: true } // Already following
    }

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, metadata)
      VALUES ('social.followed', ${userId}, 'follow', ${followId},
        ${JSON.stringify({
          followerId: userId,
          followingId,
          followingName,
        })}::jsonb)`,
    )

    logger.info('User followed', { followerId: userId, followingId })
    return { success: true }
  } catch (error) {
    logger.error('followUser failed', { error })
    return { success: false }
  }
}

export async function unfollowUser(followingId: string): Promise<{ success: boolean }> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const unfollowId = crypto.randomUUID()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, metadata)
      VALUES ('social.unfollowed', ${userId}, 'follow', ${unfollowId},
        ${JSON.stringify({
          followerId: userId,
          followingId,
        })}::jsonb)`,
    )

    logger.info('User unfollowed', { followerId: userId, followingId })
    return { success: true }
  } catch (error) {
    logger.error('unfollowUser failed', { error })
    return { success: false }
  }
}

export async function listFollowers(creatorId: string): Promise<Follow[]> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

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
        AND entity_id NOT IN (
          SELECT metadata->>'originalFollowId' FROM audit_log
          WHERE action = 'social.unfollowed' AND metadata->>'followingId' = ${creatorId}
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
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  const targetUser = userId_ ?? userId

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
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const likeId = crypto.randomUUID()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, metadata)
      VALUES ('social.liked', ${userId}, 'like', ${likeId},
        ${JSON.stringify({
          userId,
          assetId,
          assetTitle,
        })}::jsonb)`,
    )

    logger.info('Asset liked', { userId, assetId })
    return { success: true }
  } catch (error) {
    logger.error('likeAsset failed', { error })
    return { success: false }
  }
}

export async function unlikeAsset(assetId: string): Promise<{ success: boolean }> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const unlikeId = crypto.randomUUID()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, metadata)
      VALUES ('social.unliked', ${userId}, 'like', ${unlikeId},
        ${JSON.stringify({
          userId,
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
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const [likes] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM audit_log
      WHERE action = 'social.liked' AND metadata->>'assetId' = ${assetId}`,
    )) as unknown as [{ total: number }]

    const [unlikes] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM audit_log
      WHERE action = 'social.unliked' AND metadata->>'assetId' = ${assetId}`,
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
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const commentId = crypto.randomUUID()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, metadata)
      VALUES ('social.commented', ${userId}, 'comment', ${commentId},
        ${JSON.stringify({
          userId,
          userName: data.userName,
          assetId: data.assetId,
          content: data.content,
        })}::jsonb)`,
    )

    logger.info('Comment posted', { userId, assetId: data.assetId })
    revalidatePath('/dashboard/catalog')
    return { success: true, commentId }
  } catch (error) {
    logger.error('postComment failed', { error })
    return { success: false }
  }
}

export async function listComments(assetId: string): Promise<Comment[]> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

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
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const tipId = crypto.randomUUID()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, metadata)
      VALUES ('social.tipped', ${userId}, 'tip', ${tipId},
        ${JSON.stringify({
          senderId: userId,
          creatorId: data.creatorId,
          creatorName: data.creatorName,
          amount: data.amount,
          currency: data.currency,
          message: data.message,
        })}::jsonb)`,
    )

    // Also record it as revenue for the creator
    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, metadata)
      VALUES ('revenue.recorded', ${userId}, 'revenue', ${crypto.randomUUID()},
        ${JSON.stringify({
          type: RevenueType.TIP,
          creatorId: data.creatorId,
          amount: data.amount,
          currency: data.currency,
        })}::jsonb)`,
    )

    logger.info('Tip sent', { senderId: userId, creatorId: data.creatorId, amount: data.amount })
    return { success: true }
  } catch (error) {
    logger.error('tipCreator failed', { error })
    return { success: false }
  }
}

/* ─── Social Stats ─── */

export async function getSocialStats(entityId: string): Promise<SocialStats> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const [followers] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM audit_log
      WHERE action = 'social.followed' AND metadata->>'followingId' = ${entityId}`,
    )) as unknown as [{ total: number }]

    const [following] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM audit_log
      WHERE action = 'social.followed' AND metadata->>'followerId' = ${entityId}`,
    )) as unknown as [{ total: number }]

    const [likes] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM audit_log
      WHERE action = 'social.liked' AND metadata->>'userId' = ${entityId}`,
    )) as unknown as [{ total: number }]

    const [comments] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM audit_log
      WHERE action = 'social.commented' AND metadata->>'userId' = ${entityId}`,
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
