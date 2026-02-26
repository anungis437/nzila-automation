/**
 * Zonga Server Actions — Playlists.
 *
 * Create, list, update, and manage playlists.
 * Follows the audit_log pattern used across all Zonga actions.
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
} from '@/lib/zonga-services'
import { buildEvidencePackFromAction, processEvidencePack } from '@/lib/evidence'

/* ─── Types ─── */

export interface Playlist {
  id: string
  title: string
  description?: string
  creatorId?: string
  creatorName?: string
  trackCount: number
  coverUrl?: string
  isPublic: boolean
  genre?: string
  createdAt?: Date
}

export interface PlaylistTrack {
  id: string
  assetId: string
  title: string
  creatorName?: string
  genre?: string
  position: number
}

export interface PlaylistListResult {
  playlists: Playlist[]
  total: number
}

/* ─── List ─── */

export async function listPlaylists(opts?: {
  page?: number
  search?: string
  creatorId?: string
}): Promise<PlaylistListResult> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const page = opts?.page ?? 1
  const offset = (page - 1) * 25

  try {
    const rows = (await platformDb.execute(
      sql`SELECT
        entity_id as id,
        metadata->>'title' as title,
        metadata->>'description' as description,
        metadata->>'creatorId' as "creatorId",
        metadata->>'creatorName' as "creatorName",
        COALESCE(CAST(metadata->>'trackCount' AS INTEGER), 0) as "trackCount",
        metadata->>'coverUrl' as "coverUrl",
        COALESCE(CAST(metadata->>'isPublic' AS BOOLEAN), true) as "isPublic",
        metadata->>'genre' as genre,
        created_at as "createdAt"
      FROM audit_log
      WHERE action = 'playlist.created'
      ORDER BY created_at DESC
      LIMIT 25 OFFSET ${offset}`,
    )) as unknown as { rows: Playlist[] }

    const [cnt] = (await platformDb.execute(
      sql`SELECT COUNT(*) as total FROM audit_log WHERE action = 'playlist.created'`,
    )) as unknown as [{ total: number }]

    return {
      playlists: rows.rows ?? [],
      total: Number(cnt?.total ?? 0),
    }
  } catch (error) {
    logger.error('listPlaylists failed', { error })
    return { playlists: [], total: 0 }
  }
}

/* ─── Detail ─── */

export async function getPlaylistDetail(playlistId: string): Promise<{
  playlist: Playlist | null
  tracks: PlaylistTrack[]
}> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const [playlist] = (await platformDb.execute(
      sql`SELECT
        entity_id as id,
        metadata->>'title' as title,
        metadata->>'description' as description,
        metadata->>'creatorId' as "creatorId",
        metadata->>'creatorName' as "creatorName",
        COALESCE(CAST(metadata->>'trackCount' AS INTEGER), 0) as "trackCount",
        metadata->>'coverUrl' as "coverUrl",
        COALESCE(CAST(metadata->>'isPublic' AS BOOLEAN), true) as "isPublic",
        metadata->>'genre' as genre,
        created_at as "createdAt"
      FROM audit_log
      WHERE entity_id = ${playlistId} AND action = 'playlist.created'
      ORDER BY created_at DESC LIMIT 1`,
    )) as unknown as [Playlist | undefined]

    // Fetch tracks added to this playlist
    const trackRows = (await platformDb.execute(
      sql`SELECT
        entity_id as id,
        metadata->>'assetId' as "assetId",
        metadata->>'title' as title,
        metadata->>'creatorName' as "creatorName",
        metadata->>'genre' as genre,
        COALESCE(CAST(metadata->>'position' AS INTEGER), 0) as position
      FROM audit_log
      WHERE action = 'playlist.track.added' AND metadata->>'playlistId' = ${playlistId}
      ORDER BY CAST(metadata->>'position' AS INTEGER) ASC`,
    )) as unknown as { rows: PlaylistTrack[] }

    return {
      playlist: playlist ?? null,
      tracks: trackRows.rows ?? [],
    }
  } catch (error) {
    logger.error('getPlaylistDetail failed', { error })
    return { playlist: null, tracks: [] }
  }
}

/* ─── Create ─── */

export async function createPlaylist(data: {
  title: string
  description?: string
  genre?: string
  isPublic?: boolean
}): Promise<{ success: boolean; playlistId?: string }> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const playlistId = crypto.randomUUID()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, metadata)
      VALUES ('playlist.created', ${userId}, 'playlist', ${playlistId},
        ${JSON.stringify({
          ...data,
          id: playlistId,
          creatorId: userId,
          trackCount: 0,
          isPublic: data.isPublic ?? true,
        })}::jsonb)`,
    )

    const auditEvent = buildZongaAuditEvent({
      action: 'playlist.created' as ZongaAuditAction,
      entityType: 'playlist' as ZongaEntityType,
      entityId: playlistId,
      actorId: userId,
      targetId: playlistId,
      metadata: { title: data.title },
    })
    logger.info('Playlist created', { ...auditEvent })

    const pack = buildEvidencePackFromAction({
      actionType: 'PLAYLIST_CREATED',
      entityId: playlistId,
      executedBy: userId,
      actionId: crypto.randomUUID(),
    })
    await processEvidencePack(pack)

    revalidatePath('/dashboard/playlists')
    return { success: true, playlistId }
  } catch (error) {
    logger.error('createPlaylist failed', { error })
    return { success: false }
  }
}

/* ─── Add Track ─── */

export async function addTrackToPlaylist(data: {
  playlistId: string
  assetId: string
  title: string
  creatorName?: string
  genre?: string
  position?: number
}): Promise<{ success: boolean }> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const entryId = crypto.randomUUID()

    // Determine position (append by default)
    let position = data.position
    if (position === undefined) {
      const [cnt] = (await platformDb.execute(
        sql`SELECT COUNT(*) as count FROM audit_log
        WHERE action = 'playlist.track.added' AND metadata->>'playlistId' = ${data.playlistId}`,
      )) as unknown as [{ count: number }]
      position = Number(cnt?.count ?? 0) + 1
    }

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, metadata)
      VALUES ('playlist.track.added', ${userId}, 'playlist_track', ${entryId},
        ${JSON.stringify({
          ...data,
          position,
          id: entryId,
        })}::jsonb)`,
    )

    logger.info('Track added to playlist', {
      playlistId: data.playlistId,
      assetId: data.assetId,
      position,
    })

    revalidatePath('/dashboard/playlists')
    return { success: true }
  } catch (error) {
    logger.error('addTrackToPlaylist failed', { error })
    return { success: false }
  }
}

/* ─── Remove Track ─── */

export async function removeTrackFromPlaylist(data: {
  playlistId: string
  assetId: string
}): Promise<{ success: boolean }> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const removalId = crypto.randomUUID()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, metadata)
      VALUES ('playlist.track.removed', ${userId}, 'playlist_track', ${removalId},
        ${JSON.stringify({
          playlistId: data.playlistId,
          assetId: data.assetId,
        })}::jsonb)`,
    )

    logger.info('Track removed from playlist', {
      playlistId: data.playlistId,
      assetId: data.assetId,
    })

    revalidatePath('/dashboard/playlists')
    return { success: true }
  } catch (error) {
    logger.error('removeTrackFromPlaylist failed', { error })
    return { success: false }
  }
}
