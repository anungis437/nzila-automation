/**
 * Nzila OS — Integration Runtime: Mock Adapter Tests
 */
import { describe, it, expect } from 'vitest'
import { MockAdapter as _MockAdapter, createMockAdapter } from '../mock-adapter'
import type { SendRequest, SendResult as _SendResult } from '@nzila/integrations-core'

function sampleRequest(): SendRequest {
  return {
    orgId: '11111111-1111-1111-1111-111111111111',
    channel: 'email',
    to: 'user@example.com',
    correlationId: '22222222-2222-2222-2222-222222222222',
    body: 'Hi',
  }
}

describe('MockAdapter', () => {
  it('returns default success result', async () => {
    const adapter = createMockAdapter()
    const result = await adapter.send(sampleRequest(), {})
    expect(result.ok).toBe(true)
    expect(result.providerMessageId).toContain('mock-')
  })

  it('records calls for assertions', async () => {
    const adapter = createMockAdapter()
    expect(adapter.callCount).toBe(0)

    await adapter.send(sampleRequest(), { apiKey: 'test' })
    expect(adapter.callCount).toBe(1)
    expect(adapter.calls[0]!.request.to).toBe('user@example.com')
    expect(adapter.calls[0]!.credentials).toEqual({ apiKey: 'test' })
  })

  it('returns queued results in order', async () => {
    const adapter = createMockAdapter()
    adapter.enqueueResults(
      { ok: false, error: 'rate limited' },
      { ok: true, providerMessageId: 'msg-2' },
    )

    const r1 = await adapter.send(sampleRequest(), {})
    expect(r1.ok).toBe(false)

    const r2 = await adapter.send(sampleRequest(), {})
    expect(r2.ok).toBe(true)
    expect(r2.providerMessageId).toBe('msg-2')

    // Falls back to default after queue exhausted
    const r3 = await adapter.send(sampleRequest(), {})
    expect(r3.ok).toBe(true)
  })

  it('simulates latency', async () => {
    const adapter = createMockAdapter({ latencyMs: 50 })
    const start = Date.now()
    await adapter.send(sampleRequest(), {})
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(40) // Allow small timing variance
  })

  it('resets call history', async () => {
    const adapter = createMockAdapter()
    await adapter.send(sampleRequest(), {})
    expect(adapter.callCount).toBe(1)

    adapter.reset()
    expect(adapter.callCount).toBe(0)
    expect(adapter.calls).toHaveLength(0)
  })

  it('supports health check stubbing', async () => {
    const adapter = createMockAdapter({ healthStatus: 'degraded' })
    const health = await adapter.healthCheck({})
    expect(health.status).toBe('degraded')
    expect(health.provider).toBe('resend')

    adapter.setHealthStatus('down')
    const h2 = await adapter.healthCheck({})
    expect(h2.status).toBe('down')
  })

  it('sets custom default result', async () => {
    const adapter = createMockAdapter()
    adapter.setDefaultResult({ ok: false, error: 'custom fail' })
    const result = await adapter.send(sampleRequest(), {})
    expect(result.ok).toBe(false)
    expect(result.error).toBe('custom fail')
  })

  it('preserves provider/channel', () => {
    const adapter = createMockAdapter({ provider: 'slack', channel: 'chatops' })
    expect(adapter.provider).toBe('slack')
    expect(adapter.channel).toBe('chatops')
  })
})
