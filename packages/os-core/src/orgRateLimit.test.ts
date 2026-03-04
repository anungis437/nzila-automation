import { describe, it, expect, beforeEach } from 'vitest'
import {
  checkOrgRateLimit,
  classifyRoute,
  getThrottleLog,
  clearThrottleLog,
  getThrottleStats,
  DEFAULT_ORG_RATE_LIMITS,
  type OrgRateLimitConfig,
} from './orgRateLimit'

const ORG_A = 'org-aaa'
const ORG_B = 'org-bbb'
const ORG_STATS = 'org-stats-test'
const ORG_THROTTLE = 'org-throttle-test'

beforeEach(() => {
  clearThrottleLog()
})

describe('classifyRoute', () => {
  it('auth routes', () => {
    expect(classifyRoute('/api/auth/callback', 'POST')).toBe('auth')
  })
  it('export routes', () => {
    expect(classifyRoute('/api/export/pack', 'GET')).toBe('exports')
  })
  it('proof routes', () => {
    expect(classifyRoute('/api/proof/latest', 'GET')).toBe('exports')
  })
  it('integration routes', () => {
    expect(classifyRoute('/api/integrations/slack', 'POST')).toBe('integrations')
  })
  it('mutations (POST)', () => {
    expect(classifyRoute('/api/orgs/123/documents', 'POST')).toBe('mutations')
  })
  it('general (GET)', () => {
    expect(classifyRoute('/api/orgs/123/documents', 'GET')).toBe('general')
  })
})

describe('checkOrgRateLimit', () => {
  it('allows requests within limits', () => {
    const result = checkOrgRateLimit(ORG_A, '/api/orgs/1/data', 'GET')
    expect(result.allowed).toBe(true)
    expect(result.orgId).toBe(ORG_A)
    expect(result.routeGroup).toBe('general')
  })

  it('isolates rate limits between orgs', () => {
    // Exhaust Org A's auth limit
    const tightConfig: OrgRateLimitConfig = {
      groups: {
        auth: { max: 2, windowMs: 60_000 },
        mutations: { max: 60, windowMs: 60_000 },
        exports: { max: 10, windowMs: 60_000 },
        integrations: { max: 100, windowMs: 60_000 },
        general: { max: 200, windowMs: 60_000 },
      },
    }

    checkOrgRateLimit(ORG_A, '/api/auth/login', 'POST', tightConfig)
    checkOrgRateLimit(ORG_A, '/api/auth/login', 'POST', tightConfig)
    const blocked = checkOrgRateLimit(ORG_A, '/api/auth/login', 'POST', tightConfig)
    expect(blocked.allowed).toBe(false)

    // Org B should still be allowed
    const orgB = checkOrgRateLimit(ORG_B, '/api/auth/login', 'POST', tightConfig)
    expect(orgB.allowed).toBe(true)
  })

  it('records throttle events', () => {
    const tightConfig: OrgRateLimitConfig = {
      groups: {
        auth: { max: 1, windowMs: 60_000 },
        mutations: { max: 60, windowMs: 60_000 },
        exports: { max: 10, windowMs: 60_000 },
        integrations: { max: 100, windowMs: 60_000 },
        general: { max: 200, windowMs: 60_000 },
      },
    }

    checkOrgRateLimit(ORG_THROTTLE, '/api/auth/login', 'POST', tightConfig)
    checkOrgRateLimit(ORG_THROTTLE, '/api/auth/login', 'POST', tightConfig)

    const log = getThrottleLog(ORG_THROTTLE)
    expect(log.length).toBe(1)
    expect(log[0].routeGroup).toBe('auth')
  })
})

describe('getThrottleStats', () => {
  it('returns summary with grouped counts', () => {
    const tightConfig: OrgRateLimitConfig = {
      groups: {
        auth: { max: 1, windowMs: 60_000 },
        mutations: { max: 1, windowMs: 60_000 },
        exports: { max: 10, windowMs: 60_000 },
        integrations: { max: 100, windowMs: 60_000 },
        general: { max: 200, windowMs: 60_000 },
      },
    }

    // Trigger throttles
    checkOrgRateLimit(ORG_STATS, '/api/auth/login', 'POST', tightConfig)
    checkOrgRateLimit(ORG_STATS, '/api/auth/login', 'POST', tightConfig) // throttled
    checkOrgRateLimit(ORG_STATS, '/api/orgs/1/doc', 'POST', tightConfig)
    checkOrgRateLimit(ORG_STATS, '/api/orgs/1/doc', 'POST', tightConfig) // throttled

    const stats = getThrottleStats(ORG_STATS)
    expect(stats.totalThrottles).toBe(2)
    expect(stats.byGroup.auth).toBe(1)
    expect(stats.byGroup.mutations).toBe(1)
  })
})
