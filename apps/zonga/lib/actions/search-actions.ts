/**
 * Zonga Server Actions — Search & Discovery.
 *
 * Global search across assets, creators, events, and playlists.
 * All searches query the audit_log JSONB metadata.
 */
'use server'

import { resolveOrgContext } from '@/lib/resolve-org'
import { platformDb } from '@nzila/db/platform'
import { sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'

/* ─── Types ─── */

export interface SearchResult {
  id: string
  type: 'asset' | 'creator' | 'event' | 'playlist'
  title: string
  subtitle?: string
  status?: string
  genre?: string
  createdAt?: Date
}

export interface SearchResults {
  assets: SearchResult[]
  creators: SearchResult[]
  events: SearchResult[]
  playlists: SearchResult[]
  total: number
}

/* ─── Global Search ─── */

export async function globalSearch(query: string): Promise<SearchResults> {
  const ctx = await resolveOrgContext()

  if (!query || query.trim().length < 2) {
    return { assets: [], creators: [], events: [], playlists: [], total: 0 }
  }

  const pattern = `%${query.trim().toLowerCase()}%`

  try {
    // Search assets
    const assetRows = (await platformDb.execute(
      sql`SELECT
        entity_id as id,
        metadata->>'title' as title,
        metadata->>'creatorName' as subtitle,
        metadata->>'status' as status,
        metadata->>'genre' as genre,
        created_at as "createdAt"
      FROM audit_log
      WHERE action = 'asset.created'
        AND org_id = ${ctx.entityId}
        AND (
          LOWER(metadata->>'title') LIKE ${pattern}
          OR LOWER(metadata->>'creatorName') LIKE ${pattern}
          OR LOWER(metadata->>'genre') LIKE ${pattern}
        )
      ORDER BY created_at DESC
      LIMIT 20`,
    )) as unknown as { rows: Omit<SearchResult, 'type'>[] }

    // Search creators
    const creatorRows = (await platformDb.execute(
      sql`SELECT
        entity_id as id,
        metadata->>'name' as title,
        metadata->>'email' as subtitle,
        metadata->>'status' as status,
        metadata->>'primaryGenre' as genre,
        created_at as "createdAt"
      FROM audit_log
      WHERE action = 'creator.registered'
        AND org_id = ${ctx.entityId}
        AND (
          LOWER(metadata->>'name') LIKE ${pattern}
          OR LOWER(metadata->>'email') LIKE ${pattern}
          OR LOWER(metadata->>'country') LIKE ${pattern}
        )
      ORDER BY created_at DESC
      LIMIT 20`,
    )) as unknown as { rows: Omit<SearchResult, 'type'>[] }

    // Search events
    const eventRows = (await platformDb.execute(
      sql`SELECT
        entity_id as id,
        metadata->>'title' as title,
        metadata->>'venue' as subtitle,
        metadata->>'status' as status,
        metadata->>'genre' as genre,
        created_at as "createdAt"
      FROM audit_log
      WHERE action = 'event.created'
        AND org_id = ${ctx.entityId}
        AND (
          LOWER(metadata->>'title') LIKE ${pattern}
          OR LOWER(metadata->>'venue') LIKE ${pattern}
          OR LOWER(metadata->>'city') LIKE ${pattern}
        )
      ORDER BY created_at DESC
      LIMIT 20`,
    )) as unknown as { rows: Omit<SearchResult, 'type'>[] }

    // Search playlists
    const playlistRows = (await platformDb.execute(
      sql`SELECT
        entity_id as id,
        metadata->>'title' as title,
        metadata->>'description' as subtitle,
        metadata->>'visibility' as status,
        metadata->>'genre' as genre,
        created_at as "createdAt"
      FROM audit_log
      WHERE action = 'playlist.created'
        AND org_id = ${ctx.entityId}
        AND (
          LOWER(metadata->>'title') LIKE ${pattern}
          OR LOWER(metadata->>'description') LIKE ${pattern}
        )
      ORDER BY created_at DESC
      LIMIT 20`,
    )) as unknown as { rows: Omit<SearchResult, 'type'>[] }

    const assets = (assetRows.rows ?? []).map((r) => ({ ...r, type: 'asset' as const }))
    const creators = (creatorRows.rows ?? []).map((r) => ({ ...r, type: 'creator' as const }))
    const events = (eventRows.rows ?? []).map((r) => ({ ...r, type: 'event' as const }))
    const playlists = (playlistRows.rows ?? []).map((r) => ({ ...r, type: 'playlist' as const }))

    return {
      assets,
      creators,
      events,
      playlists,
      total: assets.length + creators.length + events.length + playlists.length,
    }
  } catch (error) {
    logger.error('globalSearch failed', { error })
    return { assets: [], creators: [], events: [], playlists: [], total: 0 }
  }
}

/* ─── Trending / Featured ─── */

export async function getTrending(): Promise<SearchResult[]> {
  const ctx = await resolveOrgContext()

  try {
    // Assets with most likes in the last 30 days
    const rows = (await platformDb.execute(
      sql`SELECT
        a.metadata->>'assetId' as id,
        b.metadata->>'title' as title,
        b.metadata->>'creatorName' as subtitle,
        b.metadata->>'genre' as genre,
        COUNT(*) as like_count
      FROM audit_log a
      LEFT JOIN audit_log b ON b.entity_id = a.metadata->>'assetId' AND b.action = 'asset.created'
      WHERE a.action = 'social.liked'
        AND a.org_id = ${ctx.entityId}
        AND a.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY a.metadata->>'assetId', b.metadata->>'title', b.metadata->>'creatorName', b.metadata->>'genre'
      ORDER BY like_count DESC
      LIMIT 10`,
    )) as unknown as { rows: Array<{ id: string; title: string; subtitle: string; genre: string }> }

    return (rows.rows ?? []).map((r) => ({
      ...r,
      type: 'asset' as const,
    }))
  } catch (error) {
    logger.error('getTrending failed', { error })
    return []
  }
}

/* ─── Recently Played ─── */

export async function getRecentlyPlayed(): Promise<SearchResult[]> {
  const ctx = await resolveOrgContext()

  try {
    const rows = (await platformDb.execute(
      sql`SELECT
        a.metadata->>'assetId' as id,
        b.metadata->>'title' as title,
        b.metadata->>'creatorName' as subtitle,
        b.metadata->>'genre' as genre,
        a.created_at as "createdAt"
      FROM audit_log a
      LEFT JOIN audit_log b ON b.entity_id = a.metadata->>'assetId' AND b.action = 'asset.created'
      WHERE a.action = 'stream.played' AND a.actor_id = ${ctx.actorId}
        AND a.org_id = ${ctx.entityId}
      ORDER BY a.created_at DESC
      LIMIT 20`,
    )) as unknown as { rows: Omit<SearchResult, 'type'>[] }

    return (rows.rows ?? []).map((r) => ({ ...r, type: 'asset' as const }))
  } catch (error) {
    logger.error('getRecentlyPlayed failed', { error })
    return []
  }
}
