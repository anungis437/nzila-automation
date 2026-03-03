/**
 * @nzila/os-core — Idempotency enforcement unit tests
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  checkIdempotency,
  InMemoryIdempotencyCache,
  hashPayload,
  buildCacheKey,
  isStrictEnvironment,
  type IdempotencyCache,
  type CachedIdempotencyEntry,
} from '../idempotency'

describe('Idempotency enforcement', () => {
  let cache: InMemoryIdempotencyCache

  beforeEach(() => {
    cache = new InMemoryIdempotencyCache()
  })

  // ── Strict mode (pilot/prod) — missing key rejected ─────────────────

  it('rejects POST /api/* without Idempotency-Key in strict mode', async () => {
    const result = await checkIdempotency({
      method: 'POST',
      pathname: '/api/orgs/abc/invoices',
      idempotencyKey: undefined,
      orgId: 'org-1',
      body: '{}',
      cache,
      strict: true,
    })

    expect(result.proceed).toBe(false)
    expect(result.error?.status).toBe(400)
    expect(result.error?.body).toMatchObject({ code: 'IDEMPOTENCY_KEY_REQUIRED' })
  })

  it('rejects PUT /api/* without Idempotency-Key in strict mode', async () => {
    const result = await checkIdempotency({
      method: 'PUT',
      pathname: '/api/quotes/q1',
      idempotencyKey: null,
      orgId: 'org-1',
      body: '{}',
      cache,
      strict: true,
    })

    expect(result.proceed).toBe(false)
    expect(result.error?.status).toBe(400)
  })

  it('rejects PATCH /api/* without Idempotency-Key in strict mode', async () => {
    const result = await checkIdempotency({
      method: 'PATCH',
      pathname: '/api/orgs/abc/settings',
      idempotencyKey: undefined,
      orgId: 'org-1',
      body: '{}',
      cache,
      strict: true,
    })

    expect(result.proceed).toBe(false)
    expect(result.error?.status).toBe(400)
  })

  it('rejects DELETE /api/* without Idempotency-Key in strict mode', async () => {
    const result = await checkIdempotency({
      method: 'DELETE',
      pathname: '/api/orgs/abc/members/m1',
      idempotencyKey: undefined,
      orgId: 'org-1',
      body: '{}',
      cache,
      strict: true,
    })

    expect(result.proceed).toBe(false)
    expect(result.error?.status).toBe(400)
  })

  // ── Dev/staging — missing key is allowed ────────────────────────────

  it('allows POST /api/* without Idempotency-Key in non-strict mode', async () => {
    const result = await checkIdempotency({
      method: 'POST',
      pathname: '/api/orgs/abc/invoices',
      idempotencyKey: undefined,
      orgId: 'org-1',
      body: '{}',
      cache,
      strict: false,
    })

    expect(result.proceed).toBe(true)
    expect(result.error).toBeUndefined()
  })

  // ── GET requests are never enforced ─────────────────────────────────

  it('allows GET requests without Idempotency-Key even in strict mode', async () => {
    const result = await checkIdempotency({
      method: 'GET',
      pathname: '/api/orgs/abc/invoices',
      idempotencyKey: undefined,
      orgId: 'org-1',
      body: '',
      cache,
      strict: true,
    })

    expect(result.proceed).toBe(true)
  })

  // ── Non-API routes are not enforced ─────────────────────────────────

  it('allows POST to non-api paths without Idempotency-Key', async () => {
    const result = await checkIdempotency({
      method: 'POST',
      pathname: '/webhooks/stripe',
      idempotencyKey: undefined,
      orgId: 'org-1',
      body: '{}',
      cache,
      strict: true,
    })

    expect(result.proceed).toBe(true)
  })

  // ── Replay with same payload returns cached response ────────────────

  it('returns cached response on replay with identical payload', async () => {
    const body = JSON.stringify({ amount: 100 })
    const key = 'idem-key-1'
    const orgId = 'org-1'
    const pathname = '/api/orgs/org-1/invoices'

    // First request — proceeds
    const first = await checkIdempotency({
      method: 'POST',
      pathname,
      idempotencyKey: key,
      orgId,
      body,
      cache,
      strict: true,
    })
    expect(first.proceed).toBe(true)
    expect(first.cacheKey).toBeDefined()
    expect(first.payloadHash).toBeDefined()

    // Simulate handler execution — store the result
    await cache.set(first.cacheKey!, {
      payloadHash: first.payloadHash!,
      status: 201,
      body: JSON.stringify({ id: 'inv-1' }),
      headers: { 'content-type': 'application/json' },
      createdAt: Date.now(),
    })

    // Replay — same payload
    const replay = await checkIdempotency({
      method: 'POST',
      pathname,
      idempotencyKey: key,
      orgId,
      body,
      cache,
      strict: true,
    })

    expect(replay.proceed).toBe(false)
    expect(replay.cachedResponse?.status).toBe(201)
    expect(replay.cachedResponse?.body).toBe(JSON.stringify({ id: 'inv-1' }))
    expect(replay.cachedResponse?.headers['x-idempotency-replayed']).toBe('true')
  })

  // ── Replay with different payload fails ─────────────────────────────

  it('rejects replay with different payload (409 Conflict)', async () => {
    const key = 'idem-key-2'
    const orgId = 'org-2'
    const pathname = '/api/orgs/org-2/quotes'
    const body1 = JSON.stringify({ amount: 100 })
    const body2 = JSON.stringify({ amount: 200 })

    // First request
    const first = await checkIdempotency({
      method: 'POST',
      pathname,
      idempotencyKey: key,
      orgId,
      body: body1,
      cache,
      strict: true,
    })
    expect(first.proceed).toBe(true)

    // Store result
    await cache.set(first.cacheKey!, {
      payloadHash: first.payloadHash!,
      status: 201,
      body: '{}',
      headers: {},
      createdAt: Date.now(),
    })

    // Replay with different payload
    const replay = await checkIdempotency({
      method: 'POST',
      pathname,
      idempotencyKey: key,
      orgId,
      body: body2,
      cache,
      strict: true,
    })

    expect(replay.proceed).toBe(false)
    expect(replay.error?.status).toBe(409)
    expect(replay.error?.body).toMatchObject({ code: 'IDEMPOTENCY_PAYLOAD_MISMATCH' })
  })

  // ── Org isolation — same key, different org ─────────────────────────

  it('treats same idempotency key from different orgs as independent', async () => {
    const key = 'shared-key'
    const pathname = '/api/invoices'
    const body = JSON.stringify({ amount: 500 })

    // Org A — proceeds
    const orgA = await checkIdempotency({
      method: 'POST',
      pathname,
      idempotencyKey: key,
      orgId: 'org-A',
      body,
      cache,
      strict: true,
    })
    expect(orgA.proceed).toBe(true)

    // Store for org A
    await cache.set(orgA.cacheKey!, {
      payloadHash: orgA.payloadHash!,
      status: 201,
      body: '{ "org": "A" }',
      headers: {},
      createdAt: Date.now(),
    })

    // Org B with same key — must also proceed (different org scope)
    const orgB = await checkIdempotency({
      method: 'POST',
      pathname,
      idempotencyKey: key,
      orgId: 'org-B',
      body,
      cache,
      strict: true,
    })
    expect(orgB.proceed).toBe(true)
  })

  // ── hashPayload ─────────────────────────────────────────────────────

  it('produces deterministic hashes', () => {
    const body = '{"a":1,"b":2}'
    expect(hashPayload(body)).toBe(hashPayload(body))
    expect(hashPayload(body)).not.toBe(hashPayload('{"a":1,"b":3}'))
  })

  // ── buildCacheKey ───────────────────────────────────────────────────

  it('includes orgId, route, and key in cache key', () => {
    const key = buildCacheKey('org-1', '/api/invoices', 'k1')
    expect(key).toBe('idempotency:org-1:/api/invoices:k1')
  })

  // ── InMemoryIdempotencyCache ────────────────────────────────────────

  it('evicts oldest entries when at capacity', async () => {
    const small = new InMemoryIdempotencyCache(2)
    const entry = (hash: string): CachedIdempotencyEntry => ({
      payloadHash: hash,
      status: 200,
      body: '{}',
      headers: {},
      createdAt: Date.now(),
    })

    await small.set('k1', entry('h1'))
    await small.set('k2', entry('h2'))
    expect(small.size).toBe(2)

    await small.set('k3', entry('h3'))
    expect(small.size).toBe(2) // k1 evicted
    expect(await small.get('k1')).toBeNull()
    expect(await small.get('k3')).not.toBeNull()
  })

  // ── TTL enforcement (48h default) ───────────────────────────────────

  it('returns null for entries older than 48h (TTL expired)', async () => {
    const expired: CachedIdempotencyEntry = {
      payloadHash: 'h-expired',
      status: 200,
      body: '{}',
      headers: {},
      createdAt: Date.now() - 49 * 60 * 60 * 1_000, // 49h ago
    }

    await cache.set('expired-key', expired)
    const result = await cache.get('expired-key')
    expect(result).toBeNull()
  })

  it('returns entry that is within the 48h TTL window', async () => {
    const fresh: CachedIdempotencyEntry = {
      payloadHash: 'h-fresh',
      status: 200,
      body: '{}',
      headers: {},
      createdAt: Date.now() - 47 * 60 * 60 * 1_000, // 47h ago
    }

    await cache.set('fresh-key', fresh)
    const result = await cache.get('fresh-key')
    expect(result).not.toBeNull()
    expect(result?.payloadHash).toBe('h-fresh')
  })
})
