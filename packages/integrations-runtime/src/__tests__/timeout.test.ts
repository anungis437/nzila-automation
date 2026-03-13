/**
 * Nzila OS — Integration Runtime: Timeout Tests
 */
import { describe, it, expect } from 'vitest'
import { withTimeout, getTimeoutMs, TimeoutError, DEFAULT_TIMEOUT_CONFIG as _DEFAULT_TIMEOUT_CONFIG } from '../timeout'

describe('getTimeoutMs', () => {
  it('returns provider override when defined', () => {
    expect(getTimeoutMs('slack')).toBe(10_000)
    expect(getTimeoutMs('hubspot')).toBe(20_000)
    expect(getTimeoutMs('twilio')).toBe(12_000)
  })

  it('returns default when provider has no override', () => {
    expect(getTimeoutMs('unknown-provider')).toBe(15_000)
  })

  it('uses custom config', () => {
    const config = { defaultMs: 5_000, overrides: { custom: 2_000 } }
    expect(getTimeoutMs('custom', config)).toBe(2_000)
    expect(getTimeoutMs('other', config)).toBe(5_000)
  })
})

describe('withTimeout', () => {
  it('resolves when fn completes within budget', async () => {
    const result = await withTimeout('slack', async () => 'ok')
    expect(result).toBe('ok')
  })

  it('rejects with TimeoutError when fn exceeds budget', async () => {
    const config = { defaultMs: 50, overrides: {} }
    const slowFn = () => new Promise<string>((resolve) => setTimeout(() => resolve('late'), 200))

    await expect(withTimeout('test', slowFn, config)).rejects.toThrow(TimeoutError)

    try {
      await withTimeout('test', slowFn, config)
    } catch (err) {
      expect(err).toBeInstanceOf(TimeoutError)
      const te = err as TimeoutError
      expect(te.provider).toBe('test')
      expect(te.budgetMs).toBe(50)
      expect(te.code).toBe('INTEGRATION_TIMEOUT')
    }
  })

  it('propagates fn errors without wrapping in TimeoutError', async () => {
    const config = { defaultMs: 5_000, overrides: {} }
    const failFn = () => Promise.reject(new Error('adapter crashed'))

    await expect(withTimeout('test', failFn, config)).rejects.toThrow('adapter crashed')
  })
})

describe('TimeoutError', () => {
  it('has correct properties', () => {
    const err = new TimeoutError('hubspot', 20_000)
    expect(err.name).toBe('TimeoutError')
    expect(err.code).toBe('INTEGRATION_TIMEOUT')
    expect(err.provider).toBe('hubspot')
    expect(err.budgetMs).toBe(20_000)
    expect(err.message).toContain('hubspot')
    expect(err.message).toContain('20000')
  })
})
