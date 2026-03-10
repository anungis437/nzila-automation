import { describe, it, expect, vi } from 'vitest'
import { ResilientDispatcher } from '../resilientAdapter'
import type { ResilientDispatcherPorts } from '../resilientAdapter'
import type { IntegrationProvider } from '@nzila/integrations-core'

function makePorts(overrides: Partial<ResilientDispatcherPorts> = {}): ResilientDispatcherPorts {
  const adapter = { send: vi.fn().mockResolvedValue({ ok: true, providerMessageId: 'msg-1' }) }
  return {
    getAdapter: vi.fn().mockReturnValue(adapter),
    getCredentials: vi.fn().mockResolvedValue({ apiKey: 'test' }),
    resolveConfig: vi.fn().mockResolvedValue({ id: 'cfg-1', provider: 'hubspot' as IntegrationProvider }),
    recordDelivery: vi.fn().mockResolvedValue({ id: 'del-1' }),
    updateDeliveryStatus: vi.fn().mockResolvedValue(undefined),
    enqueueDlq: vi.fn().mockResolvedValue(undefined),
    emitAudit: vi.fn(),
    circuitBreaker: {
      healthRepo: {
        findByOrgAndProvider: vi.fn().mockResolvedValue(null),
        updateCircuitState: vi.fn().mockResolvedValue(undefined),
        upsert: vi.fn().mockResolvedValue(undefined),
      },
      emitAudit: vi.fn(),
    },
    ...overrides,
  }
}

function makeRequest() {
  return {
    orgId: 'org-1',
    channel: 'email' as const,
    to: 'recipient@example.com',
    correlationId: 'corr-1',
  }
}

describe('ResilientDispatcher', () => {
  it('dispatches successfully when circuit is closed', async () => {
    const ports = makePorts()
    const dispatcher = new ResilientDispatcher(ports)

    const result = await dispatcher.dispatch(makeRequest())

    expect(result.ok).toBe(true)
    expect(ports.circuitBreaker.healthRepo.upsert).toHaveBeenCalled()
  })

  it('rejects dispatch when circuit is open', async () => {
    const ports = makePorts({
      circuitBreaker: {
        healthRepo: {
          findByOrgAndProvider: vi.fn().mockResolvedValue({
            circuitState: 'open',
            circuitNextRetryAt: new Date(Date.now() + 60_000).toISOString(),
            consecutiveFailures: 5,
          }),
          updateCircuitState: vi.fn().mockResolvedValue(undefined),
          upsert: vi.fn().mockResolvedValue(undefined),
        },
        emitAudit: vi.fn(),
      },
    })
    const dispatcher = new ResilientDispatcher(ports)

    const result = await dispatcher.dispatch(makeRequest())

    expect(result.ok).toBe(false)
    expect(result.error).toContain('Circuit breaker')
    // Inner dispatcher should NOT have been called
    expect(ports.recordDelivery).not.toHaveBeenCalled()
  })

  it('records failure to circuit breaker on dispatch error', async () => {
    const adapter = { send: vi.fn().mockResolvedValue({ ok: false, error: 'network error' }) }
    const ports = makePorts({
      getAdapter: vi.fn().mockReturnValue(adapter),
    })
    const dispatcher = new ResilientDispatcher(ports, { retry: { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0, jitter: false } })

    const result = await dispatcher.dispatch(makeRequest())

    expect(result.ok).toBe(false)
    // Circuit breaker should have recorded the failure
    expect(ports.circuitBreaker.healthRepo.upsert).toHaveBeenCalled()
  })

  it('forceOpen delegates to circuit breaker', async () => {
    const ports = makePorts()
    const dispatcher = new ResilientDispatcher(ports)

    await dispatcher.forceOpen('org-1', 'hubspot' as IntegrationProvider)

    expect(ports.circuitBreaker.healthRepo.updateCircuitState).toHaveBeenCalledWith(
      'org-1', 'hubspot', 'open', expect.any(String),
    )
  })

  it('forceReset delegates to circuit breaker', async () => {
    const ports = makePorts()
    const dispatcher = new ResilientDispatcher(ports)

    await dispatcher.forceReset('org-1', 'hubspot' as IntegrationProvider)

    expect(ports.circuitBreaker.healthRepo.upsert).toHaveBeenCalledWith(
      'org-1', 'hubspot',
      expect.objectContaining({ circuitState: 'closed', consecutiveFailures: 0 }),
    )
  })
})
