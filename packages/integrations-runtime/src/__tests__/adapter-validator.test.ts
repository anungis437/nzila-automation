/**
 * Nzila OS — Integration Runtime: Adapter Validator Tests
 */
import { describe, it, expect } from 'vitest'
import { validateSendRequest, createValidatedAdapter } from '../adapter-validator'
import type { IntegrationAdapter, SendRequest, SendResult, HealthCheckResult } from '@nzila/integrations-core'

// ── Fixtures ────────────────────────────────────────────────────────────────

function validRequest(): SendRequest {
  return {
    orgId: '11111111-1111-1111-1111-111111111111',
    channel: 'email',
    to: 'user@example.com',
    correlationId: '22222222-2222-2222-2222-222222222222',
    body: 'Hello',
  }
}

function stubAdapter(): IntegrationAdapter {
  return {
    provider: 'resend',
    channel: 'email',
    async send(): Promise<SendResult> {
      return { ok: true, providerMessageId: 'msg-123' }
    },
    async healthCheck(): Promise<HealthCheckResult> {
      return { provider: 'resend', status: 'ok', latencyMs: 10, details: null, checkedAt: new Date().toISOString() }
    },
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('validateSendRequest', () => {
  it('accepts valid requests', () => {
    const result = validateSendRequest(validRequest())
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects missing orgId', () => {
    const result = validateSendRequest({ ...validRequest(), orgId: '' } as unknown as SendRequest)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rejects invalid channel', () => {
    const result = validateSendRequest({ ...validRequest(), channel: 'invalid' } as unknown as SendRequest)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.field === 'channel')).toBe(true)
  })

  it('rejects empty to field', () => {
    const result = validateSendRequest({ ...validRequest(), to: '' })
    expect(result.valid).toBe(false)
  })

  it('rejects invalid correlationId (non-uuid)', () => {
    const result = validateSendRequest({ ...validRequest(), correlationId: 'not-a-uuid' })
    expect(result.valid).toBe(false)
  })
})

describe('createValidatedAdapter', () => {
  it('passes valid requests to inner adapter', async () => {
    const adapter = createValidatedAdapter(stubAdapter())
    const result = await adapter.send(validRequest(), {})
    expect(result.ok).toBe(true)
    expect(result.providerMessageId).toBe('msg-123')
  })

  it('rejects invalid requests without calling inner adapter', async () => {
    let innerCalled = false
    const inner: IntegrationAdapter = {
      provider: 'resend',
      channel: 'email',
      async send(): Promise<SendResult> {
        innerCalled = true
        return { ok: true }
      },
      async healthCheck(): Promise<HealthCheckResult> {
        return { provider: 'resend', status: 'ok', latencyMs: 1, details: null, checkedAt: '' }
      },
    }

    const adapter = createValidatedAdapter(inner)
    const result = await adapter.send(
      { ...validRequest(), channel: 'invalid' as never } as unknown as SendRequest,
      {},
    )
    expect(result.ok).toBe(false)
    expect(result.error).toContain('Validation failed')
    expect(innerCalled).toBe(false)
  })

  it('delegates healthCheck to inner adapter', async () => {
    const adapter = createValidatedAdapter(stubAdapter())
    const health = await adapter.healthCheck({})
    expect(health.status).toBe('ok')
  })

  it('preserves provider and channel from inner adapter', () => {
    const adapter = createValidatedAdapter(stubAdapter())
    expect(adapter.provider).toBe('resend')
    expect(adapter.channel).toBe('email')
  })
})
