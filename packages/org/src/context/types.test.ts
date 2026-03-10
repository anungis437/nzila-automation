import { describe, it, expect } from 'vitest'
import {
  isOrgContext,
  isDbContext,
  toDbContext,
} from './types'

describe('isOrgContext', () => {
  it('returns true for a valid OrgContext', () => {
    const ctx = {
      orgId: 'org-1',
      actorId: 'user-1',
      appId: 'web',
      role: 'admin',
      permissions: ['read', 'write'],
      requestId: 'req-1',
    }
    expect(isOrgContext(ctx)).toBe(true)
  })

  it('returns false for null', () => {
    expect(isOrgContext(null)).toBe(false)
  })

  it('returns false for object missing required fields', () => {
    expect(isOrgContext({ orgId: 'org-1' })).toBe(false)
  })

  it('returns false for non-object', () => {
    expect(isOrgContext('not-an-object')).toBe(false)
  })
})

describe('isDbContext', () => {
  it('returns true for a valid DbContext', () => {
    const ctx = {
      orgId: 'org-1',
      actorId: 'user-1',
    }
    expect(isDbContext(ctx)).toBe(true)
  })

  it('returns false for null', () => {
    expect(isDbContext(null)).toBe(false)
  })

  it('returns false for missing actorId', () => {
    expect(isDbContext({ orgId: 'org-1' })).toBe(false)
  })
})

describe('toDbContext', () => {
  it('extracts DbContext from OrgContext', () => {
    const ctx = {
      orgId: 'org-1',
      actorId: 'user-1',
      appId: 'web',
      role: 'admin',
      permissions: ['read'],
      requestId: 'req-1',
      correlationId: 'corr-1',
    }

    const db = toDbContext(ctx)

    expect(db.orgId).toBe('org-1')
    expect(db.actorId).toBe('user-1')
    expect(db.correlationId).toBe('corr-1')
    expect((db as Record<string, unknown>).appId).toBeUndefined()
    expect((db as Record<string, unknown>).permissions).toBeUndefined()
  })
})
