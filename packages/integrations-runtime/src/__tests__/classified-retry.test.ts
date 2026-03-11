/**
 * Nzila OS — Integration Runtime: Classified Retry Tests
 */
import { describe, it, expect } from 'vitest'
import { executeWithClassifiedRetry, type ClassifiedRetryConfig } from '../classified-retry'
import type { SendResult } from '@nzila/integrations-core'

// ── Helpers ─────────────────────────────────────────────────────────────────

function fastConfig(maxAttempts = 3): ClassifiedRetryConfig {
  return {
    retry: {
      maxAttempts,
      initialDelayMs: 1,    // 1ms to keep tests fast
      maxDelayMs: 5,
      backoffMultiplier: 1,
    },
    timeout: {
      defaultMs: 5_000,
      overrides: {},
    },
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('executeWithClassifiedRetry', () => {
  it('returns success on first attempt when fn succeeds', async () => {
    const result = await executeWithClassifiedRetry(
      'resend',
      async () => ({ ok: true, providerMessageId: 'msg-1' } as SendResult),
      fastConfig(),
    )
    expect(result.result.ok).toBe(true)
    expect(result.attempts).toBe(1)
    expect(result.classification).toBeUndefined()
  })

  it('retries transient failures and succeeds', async () => {
    let attempt = 0
    const result = await executeWithClassifiedRetry(
      'resend',
      async () => {
        attempt++
        if (attempt < 3) return { ok: false, error: 'rate limit exceeded' } as SendResult
        return { ok: true, providerMessageId: 'msg-2' } as SendResult
      },
      fastConfig(3),
    )
    expect(result.result.ok).toBe(true)
    expect(result.attempts).toBe(3)
  })

  it('does not retry permanent failures', async () => {
    let callCount = 0
    const result = await executeWithClassifiedRetry(
      'resend',
      async () => {
        callCount++
        return { ok: false, error: 'validation error: invalid email format' } as SendResult
      },
      fastConfig(3),
    )
    expect(result.result.ok).toBe(false)
    expect(callCount).toBe(1)
    expect(result.classification).toBeDefined()
    expect(result.classification!.retryable).toBe(false)
    expect(result.classification!.failureClass).toBe('permanent')
  })

  it('classifies timeout errors as transient', async () => {
    const config: ClassifiedRetryConfig = {
      retry: {
        maxAttempts: 2,
        initialDelayMs: 1,
        maxDelayMs: 5,
        backoffMultiplier: 1,
      },
      timeout: { defaultMs: 10, overrides: {} },
    }

    const result = await executeWithClassifiedRetry(
      'resend',
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return { ok: true } as SendResult
      },
      config,
    )

    expect(result.result.ok).toBe(false)
    expect(result.result.error).toContain('timeout')
    expect(result.classification).toBeDefined()
    expect(result.classification!.category).toBe('timeout')
    expect(result.classification!.retryable).toBe(true)
  })

  it('gives up after max attempts on transient failures', async () => {
    const result = await executeWithClassifiedRetry(
      'resend',
      async () => ({ ok: false, error: 'connection timeout' } as SendResult),
      fastConfig(2),
    )
    expect(result.result.ok).toBe(false)
    expect(result.attempts).toBe(2)
    expect(result.classification!.retryable).toBe(true)
  })

  it('handles thrown exceptions', async () => {
    let callCount = 0
    const result = await executeWithClassifiedRetry(
      'resend',
      async () => {
        callCount++
        throw new Error('ECONNREFUSED: network unreachable')
      },
      fastConfig(2),
    )
    expect(result.result.ok).toBe(false)
    expect(result.result.error).toContain('ECONNREFUSED')
    expect(callCount).toBe(2)
    expect(result.classification!.category).toBe('network')
    expect(result.classification!.retryable).toBe(true)
  })
})
