import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  buildAuthorizationUrl,
  isAccessTokenExpired,
  isRefreshTokenExpired,
  QBO_SCOPES,
} from './oauth'
import {
  createSyncState,
  updateSyncState,
  isSyncOverdue,
  detectFieldConflicts,
  resolveConflict,
  autoResolveConflicts,
  generateSyncHealthReport,
  DEFAULT_SYNC_SCHEDULES,
} from './sync'
import type { QboTokenSet } from './types'
import type { SyncResult, SyncState, SyncSchedule, SyncConflict } from './sync'

/* ── OAuth helpers ────────────────────────────────────────── */

vi.mock('./env', () => ({
  getQboEnv: () => ({
    INTUIT_CLIENT_ID: 'test-client-id',
    INTUIT_CLIENT_SECRET: 'test-secret',
    INTUIT_REDIRECT_URI: 'https://app.nzila.io/qbo/callback',
    QBO_BASE_URL: 'https://sandbox-quickbooks.api.intuit.com',
  }),
}))

describe('buildAuthorizationUrl', () => {
  it('returns a URL with client_id and redirect_uri', () => {
    const url = buildAuthorizationUrl('csrf-token-123')
    expect(url).toContain('client_id=test-client-id')
    expect(url).toContain('redirect_uri=')
    expect(url).toContain('state=csrf-token-123')
    expect(url).toContain('response_type=code')
  })

  it('includes QBO accounting scope by default', () => {
    const url = buildAuthorizationUrl('s')
    expect(url).toContain('com.intuit.quickbooks.accounting')
  })

  it('accepts custom scopes', () => {
    const url = buildAuthorizationUrl('s', ['openid', 'profile'])
    expect(url).toContain('scope=openid+profile')
  })
})

/* ── Token expiry checks ──────────────────────────────────── */

describe('isAccessTokenExpired', () => {
  it('returns false for a fresh token', () => {
    const tokenSet: QboTokenSet = {
      access_token: 'at',
      refresh_token: 'rt',
      token_type: 'bearer',
      expires_in: 3600,
      x_refresh_token_expires_in: 8726400,
      realmId: '12345',
      obtainedAt: Date.now(),
    }
    expect(isAccessTokenExpired(tokenSet)).toBe(false)
  })

  it('returns true for an old token', () => {
    const tokenSet: QboTokenSet = {
      access_token: 'at',
      refresh_token: 'rt',
      token_type: 'bearer',
      expires_in: 3600,
      x_refresh_token_expires_in: 8726400,
      realmId: '12345',
      obtainedAt: Date.now() - 4000 * 1000, // 4000s ago, well past 3600s expiry
    }
    expect(isAccessTokenExpired(tokenSet)).toBe(true)
  })
})

describe('isRefreshTokenExpired', () => {
  it('returns false for a fresh refresh token', () => {
    const tokenSet: QboTokenSet = {
      access_token: 'at',
      refresh_token: 'rt',
      token_type: 'bearer',
      expires_in: 3600,
      x_refresh_token_expires_in: 8726400,
      realmId: '12345',
      obtainedAt: Date.now(),
    }
    expect(isRefreshTokenExpired(tokenSet)).toBe(false)
  })
})

/* ── Sync state management ────────────────────────────────── */

describe('createSyncState', () => {
  it('builds initial state with "never" status', () => {
    const state = createSyncState('account', 'qbo-to-nzila')
    expect(state.entityType).toBe('account')
    expect(state.lastSyncStatus).toBe('never')
    expect(state.lastSyncAt).toBeNull()
    expect(state.itemsSynced).toBe(0)
  })
})

describe('updateSyncState', () => {
  it('updates state after successful sync', () => {
    const state = createSyncState('account', 'qbo-to-nzila')
    const result: SyncResult = {
      entityType: 'account',
      direction: 'qbo-to-nzila',
      started: '2025-01-01T00:00:00Z',
      completed: '2025-01-01T00:01:00Z',
      created: 5,
      updated: 3,
      skipped: 0,
      failed: 0,
      conflicts: [],
    }
    const updated = updateSyncState(state, result, 1440)
    expect(updated.lastSyncStatus).toBe('success')
    expect(updated.itemsSynced).toBe(8)
    expect(updated.nextSyncDue).toBeTruthy()
  })

  it('marks partial when some items fail', () => {
    const state = createSyncState('journal-entry', 'nzila-to-qbo')
    const result: SyncResult = {
      entityType: 'journal-entry',
      direction: 'nzila-to-qbo',
      started: '2025-01-01T00:00:00Z',
      completed: '2025-01-01T00:01:00Z',
      created: 3,
      updated: 0,
      skipped: 0,
      failed: 2,
      conflicts: [],
    }
    const updated = updateSyncState(state, result, 60)
    expect(updated.lastSyncStatus).toBe('partial')
  })
})

/* ── isSyncOverdue ────────────────────────────────────────── */

describe('isSyncOverdue', () => {
  it('returns true when never synced', () => {
    const state = createSyncState('account', 'qbo-to-nzila')
    const schedule: SyncSchedule = {
      entityType: 'account',
      direction: 'qbo-to-nzila',
      intervalMinutes: 1440,
      enabled: true,
      lastRunAt: null,
      nextRunAt: null,
    }
    expect(isSyncOverdue(state, schedule)).toBe(true)
  })

  it('returns false when schedule is disabled', () => {
    const state = createSyncState('customer', 'bidirectional')
    const schedule: SyncSchedule = {
      entityType: 'customer',
      direction: 'bidirectional',
      intervalMinutes: 720,
      enabled: false,
      lastRunAt: null,
      nextRunAt: null,
    }
    expect(isSyncOverdue(state, schedule)).toBe(false)
  })
})

/* ── Conflict detection ───────────────────────────────────── */

describe('detectFieldConflicts', () => {
  it('detects differing field values', () => {
    const conflicts = detectFieldConflicts(
      'account',
      'nz-1',
      { name: 'Revenue', type: 'Income' },
      'qbo-1',
      { name: 'Sales Revenue', type: 'Income' },
    )
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].field).toBe('name')
    expect(conflicts[0].nzilaValue).toBe('Revenue')
    expect(conflicts[0].qboValue).toBe('Sales Revenue')
  })

  it('returns empty array when no conflicts', () => {
    const conflicts = detectFieldConflicts(
      'account',
      'nz-1',
      { name: 'Revenue' },
      'qbo-1',
      { name: 'Revenue' },
    )
    expect(conflicts).toHaveLength(0)
  })
})

/* ── Conflict resolution ──────────────────────────────────── */

describe('autoResolveConflicts', () => {
  const conflict: SyncConflict = {
    id: 'test-1',
    entityType: 'account',
    nzilaId: 'nz-1',
    qboId: 'qbo-1',
    field: 'name',
    nzilaValue: 'Revenue',
    qboValue: 'Sales Revenue',
    detectedAt: '2025-01-01T00:00:00Z',
    resolvedAt: null,
    resolution: null,
  }

  it('resolves nzila-to-qbo as keep-nzila', () => {
    const resolved = autoResolveConflicts([conflict], 'nzila-to-qbo')
    expect(resolved[0].resolution).toBe('keep-nzila')
    expect(resolved[0].resolvedAt).toBeTruthy()
  })

  it('resolves qbo-to-nzila as keep-qbo', () => {
    const resolved = autoResolveConflicts([conflict], 'qbo-to-nzila')
    expect(resolved[0].resolution).toBe('keep-qbo')
  })

  it('resolves bidirectional as keep-qbo', () => {
    const resolved = autoResolveConflicts([conflict], 'bidirectional')
    expect(resolved[0].resolution).toBe('keep-qbo')
  })
})

/* ── Sync health report ───────────────────────────────────── */

describe('generateSyncHealthReport', () => {
  it('reports healthy when all syncs are successful', () => {
    const states: SyncState[] = [
      { ...createSyncState('account', 'qbo-to-nzila'), lastSyncAt: new Date().toISOString(), lastSyncStatus: 'success' },
    ]
    const schedules = DEFAULT_SYNC_SCHEDULES
    const report = generateSyncHealthReport(states, schedules, [])
    expect(report.overallStatus).toBe('healthy')
    expect(report.syncedEntities).toBe(1)
  })

  it('reports critical when sync has failed', () => {
    const states: SyncState[] = [
      { ...createSyncState('account', 'qbo-to-nzila'), lastSyncAt: new Date().toISOString(), lastSyncStatus: 'failed' },
    ]
    const report = generateSyncHealthReport(states, DEFAULT_SYNC_SCHEDULES, [])
    expect(report.overallStatus).toBe('critical')
  })
})
