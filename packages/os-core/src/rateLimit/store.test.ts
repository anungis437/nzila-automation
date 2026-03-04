/**
 * @nzila/os-core — Distributed Rate Limit Store Contract Tests
 *
 * Tests the store interface with the InMemoryRateLimitStore.
 * Redis store can be tested with a mock or integration test.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  InMemoryRateLimitStore,
  type RateLimitStore,
  getRateLimitStore,
  resetGlobalStore,
} from './store'

describe('RateLimitStore — InMemory', () => {
  let store: RateLimitStore

  beforeEach(() => {
    store = new InMemoryRateLimitStore()
    resetGlobalStore()
  })

  it('allows requests under the limit', async () => {
    const result = await store.hit('key1', 60_000, 10)
    expect(result.allowed).toBe(true)
    expect(result.count).toBe(1)
    expect(result.remaining).toBe(9)
  })

  it('blocks requests at the limit', async () => {
    for (let i = 0; i < 5; i++) {
      await store.hit('key2', 60_000, 5)
    }
    const result = await store.hit('key2', 60_000, 5)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('isolates different keys', async () => {
    for (let i = 0; i < 5; i++) {
      await store.hit('keyA', 60_000, 5)
    }
    const resultA = await store.hit('keyA', 60_000, 5)
    const resultB = await store.hit('keyB', 60_000, 5)
    expect(resultA.allowed).toBe(false)
    expect(resultB.allowed).toBe(true)
  })

  it('resets a key', async () => {
    for (let i = 0; i < 5; i++) {
      await store.hit('key3', 60_000, 5)
    }
    await store.reset('key3')
    const result = await store.hit('key3', 60_000, 5)
    expect(result.allowed).toBe(true)
    expect(result.count).toBe(1)
  })

  it('peek returns count without recording', async () => {
    await store.hit('key4', 60_000, 10)
    await store.hit('key4', 60_000, 10)
    const count = await store.peek('key4', 60_000)
    expect(count).toBe(2)
    // Peek should not increment
    const count2 = await store.peek('key4', 60_000)
    expect(count2).toBe(2)
  })

  it('in-memory store is always healthy', async () => {
    expect(await store.healthy()).toBe(true)
  })

  it('provides correct resetAt timestamp', async () => {
    const before = Date.now()
    const result = await store.hit('key5', 60_000, 10)
    const after = Date.now()
    expect(result.resetAt).toBeGreaterThanOrEqual(before + 60_000)
    expect(result.resetAt).toBeLessThanOrEqual(after + 60_000)
  })

  it('window expiry allows new requests after window passes', async () => {
    // Use a tiny window
    for (let i = 0; i < 3; i++) {
      await store.hit('key6', 50, 3)
    }
    const blocked = await store.hit('key6', 50, 3)
    expect(blocked.allowed).toBe(false)

    // Wait for window to expire
    await new Promise((r) => setTimeout(r, 60))
    const allowed = await store.hit('key6', 50, 3)
    expect(allowed.allowed).toBe(true)
  })
})

describe('getRateLimitStore factory', () => {
  beforeEach(() => {
    resetGlobalStore()
  })

  it('returns InMemoryRateLimitStore by default', async () => {
    const store = await getRateLimitStore()
    expect(store).toBeInstanceOf(InMemoryRateLimitStore)
  })

  it('returns same singleton on repeated calls', async () => {
    const a = await getRateLimitStore()
    const b = await getRateLimitStore()
    expect(a).toBe(b)
  })
})
