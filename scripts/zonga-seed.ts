/**
 * Zonga Seed Data — SQL generator for E2E testing and demos
 *
 * Generates deterministic seed data for all Zonga domain tables.
 * Output: SQL file at scripts/zonga-seed-output.sql
 *
 * Usage: npx tsx scripts/zonga-seed.ts
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ── Config ──────────────────────────────────────────────────────────────

const ORG_ID = 'org_zonga_demo'
const SEED_DATE = '2026-01-15T00:00:00Z'

function uuid(prefix: string, i: number): string {
  const hex = i.toString(16).padStart(8, '0')
  return `${prefix}0000-0000-0000-0000${hex}`
}

// ── Creators ────────────────────────────────────────────────────────────

const creators = [
  { id: uuid('c1', 1), name: 'Amara Diallo', genre: 'Afrobeats', country: 'Senegal', bio: 'Pioneering Afrobeats from Dakar' },
  { id: uuid('c1', 2), name: 'Kwame Asante', genre: 'Highlife', country: 'Ghana', bio: 'Modern highlife with traditional roots' },
  { id: uuid('c1', 3), name: 'Zara Okafor', genre: 'Afropop', country: 'Nigeria', bio: 'Chart-topping Afropop artist' },
  { id: uuid('c1', 4), name: 'Tendai Moyo', genre: 'Amapiano', country: 'South Africa', bio: 'Amapiano producer and DJ' },
  { id: uuid('c1', 5), name: 'Fatou Cissé', genre: 'Mbalax', country: 'Senegal', bio: 'Contemporary Mbalax vocalist' },
  { id: uuid('c1', 6), name: 'Kofi Mensah', genre: 'Hiplife', country: 'Ghana', bio: 'Hiplife pioneer blending hip-hop with highlife' },
  { id: uuid('c1', 7), name: 'Nia Kamara', genre: 'R&B', country: 'Kenya', bio: 'Soulful R&B from Nairobi' },
  { id: uuid('c1', 8), name: 'Jabari Nkomo', genre: 'Gqom', country: 'South Africa', bio: 'Underground Gqom producer' },
]

// ── Content Assets ──────────────────────────────────────────────────────

const assets = [
  { id: uuid('a1', 1), creatorIdx: 0, title: 'Sunrise in Dakar', type: 'single', duration: 234 },
  { id: uuid('a1', 2), creatorIdx: 0, title: 'Ocean Waves', type: 'single', duration: 198 },
  { id: uuid('a1', 3), creatorIdx: 1, title: 'Accra Nights', type: 'single', duration: 267 },
  { id: uuid('a1', 4), creatorIdx: 1, title: 'Golden Coast', type: 'single', duration: 312 },
  { id: uuid('a1', 5), creatorIdx: 2, title: 'Lagos Love', type: 'single', duration: 245 },
  { id: uuid('a1', 6), creatorIdx: 2, title: 'Victoria Island', type: 'single', duration: 189 },
  { id: uuid('a1', 7), creatorIdx: 3, title: 'Joburg Groove', type: 'single', duration: 278 },
  { id: uuid('a1', 8), creatorIdx: 3, title: 'Township Beats', type: 'single', duration: 356 },
  { id: uuid('a1', 9), creatorIdx: 4, title: 'Dakar Dawn', type: 'single', duration: 223 },
  { id: uuid('a1', 10), creatorIdx: 5, title: 'Kumasi Flow', type: 'single', duration: 201 },
  { id: uuid('a1', 11), creatorIdx: 6, title: 'Nairobi Nights', type: 'single', duration: 289 },
  { id: uuid('a1', 12), creatorIdx: 7, title: 'Durban Bass', type: 'single', duration: 334 },
]

// ── Releases ────────────────────────────────────────────────────────────

const releases = [
  { id: uuid('r1', 1), creatorIdx: 0, title: 'Sahel Sounds', type: 'album', trackCount: 2, status: 'published' },
  { id: uuid('r1', 2), creatorIdx: 1, title: 'Gold Coast Chronicles', type: 'ep', trackCount: 2, status: 'published' },
  { id: uuid('r1', 3), creatorIdx: 2, title: 'Lagos Diaries', type: 'album', trackCount: 2, status: 'published' },
  { id: uuid('r1', 4), creatorIdx: 3, title: 'Piano Stories', type: 'ep', trackCount: 2, status: 'published' },
  { id: uuid('r1', 5), creatorIdx: 4, title: 'Mbalax Rising', type: 'single', trackCount: 1, status: 'draft' },
  { id: uuid('r1', 6), creatorIdx: 5, title: 'Hiplife Heritage', type: 'album', trackCount: 1, status: 'published' },
]

// ── Events ──────────────────────────────────────────────────────────────

const events = [
  { id: uuid('e1', 1), creatorIdx: 0, title: 'Dakar Music Festival 2026', venue: 'Place du Souvenir', city: 'Dakar', country: 'Senegal', daysFromNow: 30 },
  { id: uuid('e1', 2), creatorIdx: 2, title: 'Lagos Live Sessions', venue: 'Eko Hotel', city: 'Lagos', country: 'Nigeria', daysFromNow: 45 },
  { id: uuid('e1', 3), creatorIdx: 3, title: 'Amapiano Nights Jozi', venue: 'Constitution Hill', city: 'Johannesburg', country: 'South Africa', daysFromNow: 60 },
]

// ── Listeners ───────────────────────────────────────────────────────────

const listeners = [
  { id: uuid('l1', 1), displayName: 'DJ Selector', email: 'selector@example.com' },
  { id: uuid('l1', 2), displayName: 'MusicLover99', email: 'musiclover@example.com' },
  { id: uuid('l1', 3), displayName: 'AfroHead', email: 'afrohead@example.com' },
  { id: uuid('l1', 4), displayName: 'VibeChecker', email: 'vibechecker@example.com' },
]

// ── SQL Generation ──────────────────────────────────────────────────────

function esc(val: string | null | undefined): string {
  if (val == null) return 'NULL'
  return `'${val.replace(/'/g, "''")}'`
}

function generateSQL(): string {
  const lines: string[] = [
    '-- Zonga E2E Seed Data',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Org: ${ORG_ID}`,
    '',
    '-- Clean existing seed data',
    `DELETE FROM zonga_listener_activity WHERE org_id = ${esc(ORG_ID)};`,
    `DELETE FROM zonga_listener_favorites WHERE org_id = ${esc(ORG_ID)};`,
    `DELETE FROM zonga_listener_follows WHERE org_id = ${esc(ORG_ID)};`,
    `DELETE FROM zonga_listener_playlist_saves WHERE org_id = ${esc(ORG_ID)};`,
    `DELETE FROM zonga_notifications WHERE org_id = ${esc(ORG_ID)};`,
    `DELETE FROM zonga_integrity_signals WHERE org_id = ${esc(ORG_ID)};`,
    `DELETE FROM zonga_moderation_cases WHERE org_id = ${esc(ORG_ID)};`,
    `DELETE FROM zonga_playlist_items WHERE playlist_id IN (SELECT id FROM zonga_playlists WHERE org_id = ${esc(ORG_ID)});`,
    `DELETE FROM zonga_playlists WHERE org_id = ${esc(ORG_ID)};`,
    `DELETE FROM zonga_ticket_types WHERE event_id IN (SELECT id FROM zonga_events WHERE org_id = ${esc(ORG_ID)});`,
    `DELETE FROM zonga_tickets WHERE org_id = ${esc(ORG_ID)};`,
    `DELETE FROM zonga_events WHERE org_id = ${esc(ORG_ID)};`,
    `DELETE FROM zonga_release_tracks WHERE release_id IN (SELECT id FROM zonga_releases WHERE org_id = ${esc(ORG_ID)});`,
    `DELETE FROM zonga_releases WHERE org_id = ${esc(ORG_ID)};`,
    `DELETE FROM zonga_revenue_events WHERE org_id = ${esc(ORG_ID)};`,
    `DELETE FROM zonga_payouts WHERE org_id = ${esc(ORG_ID)};`,
    `DELETE FROM zonga_content_assets WHERE org_id = ${esc(ORG_ID)};`,
    `DELETE FROM zonga_creator_accounts WHERE creator_id IN (SELECT id FROM zonga_creators WHERE org_id = ${esc(ORG_ID)});`,
    `DELETE FROM zonga_listeners WHERE org_id = ${esc(ORG_ID)};`,
    `DELETE FROM zonga_creators WHERE org_id = ${esc(ORG_ID)};`,
    '',
    '-- ── Creators ──',
  ]

  for (const c of creators) {
    lines.push(
      `INSERT INTO zonga_creators (id, org_id, display_name, genre, country, bio, status, created_at)`,
      `VALUES (${esc(c.id)}, ${esc(ORG_ID)}, ${esc(c.name)}, ${esc(c.genre)}, ${esc(c.country)}, ${esc(c.bio)}, 'active', ${esc(SEED_DATE)});`,
    )
  }

  lines.push('', '-- ── Creator Accounts ──')
  for (let i = 0; i < creators.length; i++) {
    lines.push(
      `INSERT INTO zonga_creator_accounts (id, creator_id, email, created_at)`,
      `VALUES (${esc(uuid('ca', i + 1))}, ${esc(creators[i].id)}, ${esc(`${creators[i].name.toLowerCase().replace(/\s+/g, '.')}@zonga.example.com`)}, ${esc(SEED_DATE)});`,
    )
  }

  lines.push('', '-- ── Content Assets ──')
  for (const a of assets) {
    lines.push(
      `INSERT INTO zonga_content_assets (id, org_id, creator_id, title, asset_type, status, duration_seconds, created_at)`,
      `VALUES (${esc(a.id)}, ${esc(ORG_ID)}, ${esc(creators[a.creatorIdx].id)}, ${esc(a.title)}, ${esc(a.type)}, 'published', ${a.duration}, ${esc(SEED_DATE)});`,
    )
  }

  lines.push('', '-- ── Releases ──')
  for (const r of releases) {
    const releaseDate = r.status === 'published' ? esc('2026-02-01') : 'NULL'
    lines.push(
      `INSERT INTO zonga_releases (id, org_id, creator_id, title, release_type, status, release_date, created_at)`,
      `VALUES (${esc(r.id)}, ${esc(ORG_ID)}, ${esc(creators[r.creatorIdx].id)}, ${esc(r.title)}, ${esc(r.type)}, ${esc(r.status)}, ${releaseDate}, ${esc(SEED_DATE)});`,
    )
  }

  lines.push('', '-- ── Release Tracks ──')
  let trackIdx = 0
  // Pair assets to releases (first 2 assets → release 1, next 2 → release 2, etc.)
  const assetPairs = [
    [0, 1], // release 0
    [2, 3], // release 1
    [4, 5], // release 2
    [6, 7], // release 3
    [8],    // release 4
    [9],    // release 5
  ]
  for (let ri = 0; ri < releases.length; ri++) {
    for (let ti = 0; ti < (assetPairs[ri]?.length ?? 0); ti++) {
      const assetIdx = assetPairs[ri][ti]
      trackIdx++
      lines.push(
        `INSERT INTO zonga_release_tracks (id, release_id, asset_id, track_number, created_at)`,
        `VALUES (${esc(uuid('rt', trackIdx))}, ${esc(releases[ri].id)}, ${esc(assets[assetIdx].id)}, ${ti + 1}, ${esc(SEED_DATE)});`,
      )
    }
  }

  lines.push('', '-- ── Events ──')
  for (const ev of events) {
    const start = new Date()
    start.setDate(start.getDate() + ev.daysFromNow)
    const end = new Date(start)
    end.setHours(end.getHours() + 4)
    lines.push(
      `INSERT INTO zonga_events (id, org_id, creator_id, title, description, venue, city, country, start_date, end_date, status, created_at)`,
      `VALUES (${esc(ev.id)}, ${esc(ORG_ID)}, ${esc(creators[ev.creatorIdx].id)}, ${esc(ev.title)}, 'A spectacular live music event', ${esc(ev.venue)}, ${esc(ev.city)}, ${esc(ev.country)}, ${esc(start.toISOString())}, ${esc(end.toISOString())}, 'published', ${esc(SEED_DATE)});`,
    )
  }

  lines.push('', '-- ── Ticket Types ──')
  for (let i = 0; i < events.length; i++) {
    lines.push(
      `INSERT INTO zonga_ticket_types (id, event_id, name, price, currency, capacity, created_at)`,
      `VALUES (${esc(uuid('tt', i * 2 + 1))}, ${esc(events[i].id)}, 'General Admission', 2500, 'USD', 500, ${esc(SEED_DATE)});`,
      `INSERT INTO zonga_ticket_types (id, event_id, name, price, currency, capacity, created_at)`,
      `VALUES (${esc(uuid('tt', i * 2 + 2))}, ${esc(events[i].id)}, 'VIP', 7500, 'USD', 50, ${esc(SEED_DATE)});`,
    )
  }

  lines.push('', '-- ── Listeners ──')
  for (const l of listeners) {
    lines.push(
      `INSERT INTO zonga_listeners (id, org_id, display_name, email, created_at)`,
      `VALUES (${esc(l.id)}, ${esc(ORG_ID)}, ${esc(l.displayName)}, ${esc(l.email)}, ${esc(SEED_DATE)});`,
    )
  }

  lines.push('', '-- ── Follows ──')
  // Each listener follows 2-3 creators
  const followPairs = [
    [0, 0], [0, 2], [0, 3],
    [1, 1], [1, 4],
    [2, 0], [2, 1], [2, 5],
    [3, 2], [3, 3], [3, 6], [3, 7],
  ]
  for (let i = 0; i < followPairs.length; i++) {
    const [li, ci] = followPairs[i]
    lines.push(
      `INSERT INTO zonga_listener_follows (id, org_id, listener_id, creator_id, created_at)`,
      `VALUES (${esc(uuid('fl', i + 1))}, ${esc(ORG_ID)}, ${esc(listeners[li].id)}, ${esc(creators[ci].id)}, ${esc(SEED_DATE)});`,
    )
  }

  lines.push('', '-- ── Favorites ──')
  const favPairs = [
    [0, 0], [0, 4], [0, 7],
    [1, 2], [1, 5],
    [2, 1], [2, 6], [2, 10],
    [3, 3], [3, 8], [3, 11],
  ]
  for (let i = 0; i < favPairs.length; i++) {
    const [li, ai] = favPairs[i]
    lines.push(
      `INSERT INTO zonga_listener_favorites (id, org_id, listener_id, entity_type, entity_id, created_at)`,
      `VALUES (${esc(uuid('fv', i + 1))}, ${esc(ORG_ID)}, ${esc(listeners[li].id)}, 'asset', ${esc(assets[ai].id)}, ${esc(SEED_DATE)});`,
    )
  }

  lines.push('', '-- ── Playlists ──')
  const playlists = [
    { id: uuid('pl', 1), listenerIdx: 0, name: 'Afrobeats Essentials', visibility: 'public' },
    { id: uuid('pl', 2), listenerIdx: 1, name: 'Chill Highlife', visibility: 'public' },
    { id: uuid('pl', 3), listenerIdx: 2, name: 'My Private Mix', visibility: 'private' },
  ]
  for (const pl of playlists) {
    lines.push(
      `INSERT INTO zonga_playlists (id, org_id, owner_type, owner_id, name, visibility, created_at)`,
      `VALUES (${esc(pl.id)}, ${esc(ORG_ID)}, 'listener', ${esc(listeners[pl.listenerIdx].id)}, ${esc(pl.name)}, ${esc(pl.visibility)}, ${esc(SEED_DATE)});`,
    )
  }

  lines.push('', '-- ── Playlist Items ──')
  const playlistItems = [
    [0, 0, 1], [0, 4, 2], [0, 7, 3], // Afrobeats Essentials: 3 tracks
    [1, 2, 1], [1, 3, 2],             // Chill Highlife: 2 tracks
    [2, 10, 1], [2, 11, 2],           // Private Mix: 2 tracks
  ]
  for (let i = 0; i < playlistItems.length; i++) {
    const [pli, ai, pos] = playlistItems[i]
    lines.push(
      `INSERT INTO zonga_playlist_items (id, playlist_id, asset_id, position, created_at)`,
      `VALUES (${esc(uuid('pi', i + 1))}, ${esc(playlists[pli].id)}, ${esc(assets[ai].id)}, ${pos}, ${esc(SEED_DATE)});`,
    )
  }

  lines.push('', '-- ── Revenue Events (streams) ──')
  for (let i = 0; i < 20; i++) {
    const assetIdx = i % assets.length
    const creatorIdx = assets[assetIdx].creatorIdx
    lines.push(
      `INSERT INTO zonga_revenue_events (id, org_id, creator_id, asset_id, type, amount, currency, occurred_at)`,
      `VALUES (${esc(uuid('rv', i + 1))}, ${esc(ORG_ID)}, ${esc(creators[creatorIdx].id)}, ${esc(assets[assetIdx].id)}, 'stream', ${(Math.random() * 0.5 + 0.1).toFixed(4)}, 'USD', ${esc(SEED_DATE)});`,
    )
  }

  lines.push('', '-- ── Notifications ──')
  for (let i = 0; i < 5; i++) {
    const creatorIdx = i % creators.length
    lines.push(
      `INSERT INTO zonga_notifications (id, org_id, user_id, type, title, message, read, created_at)`,
      `VALUES (${esc(uuid('nt', i + 1))}, ${esc(ORG_ID)}, ${esc(creators[creatorIdx].id)}, 'system', 'Welcome to Zonga', 'Your creator profile is now active.', ${i < 3 ? 'true' : 'false'}, ${esc(SEED_DATE)});`,
    )
  }

  lines.push('', '-- Seed complete')
  return lines.join('\n')
}

// ── Main ────────────────────────────────────────────────────────────────

const output = generateSQL()
const outputPath = path.join(__dirname, 'zonga-seed-output.sql')
fs.writeFileSync(outputPath, output, 'utf-8')
console.log(`✓ Zonga seed SQL written to ${outputPath}`)
console.log(`  Creators: ${creators.length}`)
console.log(`  Assets: ${assets.length}`)
console.log(`  Releases: ${releases.length}`)
console.log(`  Events: ${events.length}`)
console.log(`  Listeners: ${listeners.length}`)
console.log(`  Playlists: 3`)
console.log(`  Revenue events: 20`)
