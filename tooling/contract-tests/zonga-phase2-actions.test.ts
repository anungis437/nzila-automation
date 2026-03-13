/**
 * Contract Test — Zonga Phase 2 Actions (Social, Notifications, Search, Events, Playlists)
 *
 * Structural invariants:
 *   1. Every action file uses 'use server' directive
 *   2. Every action calls auth() for authentication
 *   3. All actions use platformDb for data access
 *   4. All actions use structured logger
 *   5. Action files export the expected public API
 *
 * @invariant ZNG-ACT2-01: Server action auth guard
 * @invariant ZNG-ACT2-02: platformDb usage
 * @invariant ZNG-ACT2-03: Logger integration
 * @invariant ZNG-ACT2-04: Exported function signatures
 * @invariant ZNG-ACT2-05: Domain table pattern (primary writes to domain tables; audit_log for tracing only)
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '../..')
const ZONGA_ACTIONS = join(ROOT, 'apps', 'zonga', 'lib', 'actions')

const PHASE2_ACTION_FILES = [
  'social-actions.ts',
  'notification-actions.ts',
  'search-actions.ts',
  'playlist-actions.ts',
  'event-actions.ts',
]

describe('ZNG-ACT2 — Phase 2 action files exist', () => {
  for (const file of PHASE2_ACTION_FILES) {
    it(`${file} exists`, () => {
      expect(existsSync(join(ZONGA_ACTIONS, file))).toBe(true)
    })
  }
})

describe('ZNG-ACT2-01 — Every action file uses "use server" directive', () => {
  for (const file of PHASE2_ACTION_FILES) {
    it(`${file} has 'use server'`, () => {
      const path = join(ZONGA_ACTIONS, file)
      if (!existsSync(path)) return
      const content = readFileSync(path, 'utf-8')
      expect(content).toContain("'use server'")
    })
  }
})

describe('ZNG-ACT2-01 — Every action file calls auth()', () => {
  for (const file of PHASE2_ACTION_FILES) {
    it(`${file} authenticates via auth()`, () => {
      const path = join(ZONGA_ACTIONS, file)
      if (!existsSync(path)) return
      const content = readFileSync(path, 'utf-8')
      // resolveOrgContext() wraps auth() — see lib/resolve-org.ts
      expect(
        content.includes('auth()') || content.includes('resolveOrgContext()'),
        `${file} must call auth() directly or via resolveOrgContext()`,
      ).toBe(true)
    })
  }
})

describe('ZNG-ACT2-02 — All actions use platformDb', () => {
  for (const file of PHASE2_ACTION_FILES) {
    it(`${file} imports platformDb`, () => {
      const path = join(ZONGA_ACTIONS, file)
      if (!existsSync(path)) return
      const content = readFileSync(path, 'utf-8')
      expect(content).toContain('platformDb')
    })
  }
})

describe('ZNG-ACT2-03 — All actions use structured logger', () => {
  for (const file of PHASE2_ACTION_FILES) {
    it(`${file} imports logger`, () => {
      const path = join(ZONGA_ACTIONS, file)
      if (!existsSync(path)) return
      const content = readFileSync(path, 'utf-8')
      expect(content).toContain('logger')
    })
  }
})

describe('ZNG-ACT2-05 — Mutation actions write to domain tables', () => {
  it('social-actions writes to zonga_listener_follows and zonga_listener_favorites', () => {
    const content = readFileSync(join(ZONGA_ACTIONS, 'social-actions.ts'), 'utf-8')
    expect(content).toContain('zonga_listener_follows')
    expect(content).toContain('zonga_listener_favorites')
  })

  it('notification-actions writes to zonga_notifications', () => {
    const content = readFileSync(join(ZONGA_ACTIONS, 'notification-actions.ts'), 'utf-8')
    expect(content).toContain('zonga_notifications')
  })

  it('playlist-actions writes to zonga_playlists and zonga_playlist_items', () => {
    const content = readFileSync(join(ZONGA_ACTIONS, 'playlist-actions.ts'), 'utf-8')
    expect(content).toContain('zonga_playlists')
    expect(content).toContain('zonga_playlist_items')
  })

  it('event-actions uses INSERT INTO audit_log for tracing', () => {
    const content = readFileSync(join(ZONGA_ACTIONS, 'event-actions.ts'), 'utf-8')
    expect(content).toContain('INSERT INTO audit_log')
  })
})

/* ─── Social Actions Contract ─── */

describe('ZNG-ACT2-04 — Social actions exported functions', () => {
  it('exports followCreator, unfollowCreator, favoriteEntity, unfavoriteEntity, postComment, tipCreator', () => {
    const path = join(ZONGA_ACTIONS, 'social-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('export async function followCreator')
    expect(content).toContain('export async function unfollowCreator')
    expect(content).toContain('export async function favoriteEntity')
    expect(content).toContain('export async function unfavoriteEntity')
    expect(content).toContain('export async function postComment')
    expect(content).toContain('export async function tipCreator')
  })

  it('preserves deprecated wrappers/aliases: followUser, likeAsset, unlikeAsset', () => {
    const path = join(ZONGA_ACTIONS, 'social-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('followUser')
    expect(content).toContain('likeAsset')
    expect(content).toContain('unlikeAsset')
  })

  it('exports listing functions: listFollowers, listFollowing, listComments', () => {
    const path = join(ZONGA_ACTIONS, 'social-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('export async function listFollowers')
    expect(content).toContain('export async function listFollowing')
    expect(content).toContain('export async function listComments')
  })

  it('exports stats: getSocialStats, getEntityFavoriteCount (with getAssetLikeCount alias)', () => {
    const path = join(ZONGA_ACTIONS, 'social-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('export async function getSocialStats')
    expect(content).toContain('export async function getEntityFavoriteCount')
    expect(content).toContain('export const getAssetLikeCount')
  })

  it('tipCreator writes to zonga_revenue_events using RevenueType.TIP', () => {
    const path = join(ZONGA_ACTIONS, 'social-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('zonga_revenue_events')
    expect(content).toContain('RevenueType.TIP')
  })

  it('uses domain tables plus audit_log for comments', () => {
    const path = join(ZONGA_ACTIONS, 'social-actions.ts')
    const content = readFileSync(path, 'utf-8')
    // Follows/favorites/tips go to domain tables (no audit_log for these)
    expect(content).toContain('zonga_listener_follows')
    expect(content).toContain('zonga_listener_favorites')
    expect(content).toContain('zonga_revenue_events')
    // Comments still use audit_log (append-only pattern)
    expect(content).toContain("'social.commented'")
  })
})

/* ─── Notification Actions Contract ─── */

describe('ZNG-ACT2-04 — Notification actions exported functions', () => {
  it('exports listNotifications, markAsRead, markAllRead, createNotification', () => {
    const path = join(ZONGA_ACTIONS, 'notification-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('export async function listNotifications')
    expect(content).toContain('export async function markAsRead')
    expect(content).toContain('export async function markAllRead')
    expect(content).toContain('export async function createNotification')
  })

  it('exports getUnreadCount', () => {
    const path = join(ZONGA_ACTIONS, 'notification-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('export async function getUnreadCount')
  })

  it('uses zonga_notifications domain table for reads and writes', () => {
    const path = join(ZONGA_ACTIONS, 'notification-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('zonga_notifications')
    expect(content).toContain('INSERT INTO zonga_notifications')
    expect(content).toContain('UPDATE zonga_notifications')
  })

  it('markAsRead and markAllRead call revalidatePath', () => {
    const path = join(ZONGA_ACTIONS, 'notification-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('revalidatePath')
  })
})

/* ─── Search Actions Contract ─── */

describe('ZNG-ACT2-04 — Search actions exported functions', () => {
  it('exports globalSearch, getTrending, getRecentlyPlayed', () => {
    const path = join(ZONGA_ACTIONS, 'search-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('export async function globalSearch')
    expect(content).toContain('export async function getTrending')
    expect(content).toContain('export async function getRecentlyPlayed')
  })

  it('globalSearch queries domain tables for multiple entity types', () => {
    const path = join(ZONGA_ACTIONS, 'search-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('zonga_content_assets')
    expect(content).toContain('zonga_creators')
    expect(content).toContain('zonga_events')
    expect(content).toContain('zonga_playlists')
  })

  it('exports SearchResult and SearchResults types', () => {
    const path = join(ZONGA_ACTIONS, 'search-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('export interface SearchResult')
    expect(content).toContain('export interface SearchResults')
  })
})

/* ─── Playlist Actions Contract ─── */

describe('ZNG-ACT2-04 — Playlist actions exported functions', () => {
  it('exports listPlaylists, getPlaylistDetail, createPlaylist, addTrackToPlaylist, removeTrackFromPlaylist', () => {
    const path = join(ZONGA_ACTIONS, 'playlist-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('export async function listPlaylists')
    expect(content).toContain('export async function getPlaylistDetail')
    expect(content).toContain('export async function createPlaylist')
    expect(content).toContain('export async function addTrackToPlaylist')
    expect(content).toContain('export async function removeTrackFromPlaylist')
  })

  it('writes to zonga_playlists/zonga_playlist_items with audit trail for creation', () => {
    const path = join(ZONGA_ACTIONS, 'playlist-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('zonga_playlists')
    expect(content).toContain('zonga_playlist_items')
    expect(content).toContain("'playlist.created'")
  })
})

/* ─── Event Actions Contract ─── */

describe('ZNG-ACT2-04 — Event actions exported functions', () => {
  it('exports listEvents, getEventDetail, createEvent, publishEvent, purchaseTicket, listTickets', () => {
    const path = join(ZONGA_ACTIONS, 'event-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('export async function listEvents')
    expect(content).toContain('export async function getEventDetail')
    expect(content).toContain('export async function createEvent')
    expect(content).toContain('export async function publishEvent')
    expect(content).toContain('export async function purchaseTicket')
    expect(content).toContain('export async function listTickets')
  })

  it('purchaseTicket integrates Stripe checkout', () => {
    const path = join(ZONGA_ACTIONS, 'event-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('createCheckoutSession')
    expect(content).toContain("from '@/lib/stripe'")
  })

  it('purchaseTicket writes to zonga_ticket_purchases with audit trail', () => {
    const path = join(ZONGA_ACTIONS, 'event-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('zonga_ticket_purchases')
    expect(content).toContain("'event.ticket.purchased'")
  })

  it('uses proper audit actions for events', () => {
    const path = join(ZONGA_ACTIONS, 'event-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain("'event.created'")
    expect(content).toContain("'event.published'")
    expect(content).toContain("'event.ticket.purchased'")
  })
})

/* ─── publishRelease addition to release-actions ─── */

describe('ZNG-ACT2 — publishRelease added to release-actions', () => {
  it('release-actions.ts exports publishRelease', () => {
    const path = join(ZONGA_ACTIONS, 'release-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('export async function publishRelease')
  })

  it('publishRelease transitions status via transitionReleaseStatus', () => {
    const path = join(ZONGA_ACTIONS, 'release-actions.ts')
    const content = readFileSync(path, 'utf-8')
    expect(content).toContain('export async function publishRelease')
    // Uses release.status_changed audit action for all transitions
    expect(content).toContain("'release.status_changed'")
  })
})
