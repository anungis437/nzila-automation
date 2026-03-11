/**
 * Nzila OS — Integration Runtime: Reliability Contract Tests
 *
 * These tests verify the reliability invariants that ALL integration
 * adapters must satisfy. They exercise the full reliability stack:
 *   - Schema validation at boundaries
 *   - Timeout enforcement
 *   - Classified retry with backoff
 *   - Failure classification accuracy
 *   - Mock adapter honoring the contract
 *   - Telemetry emission on all paths
 *
 * @invariant INTEGRATION_RELIABILITY_CONTRACT_001
 */
import { describe, it, expect } from 'vitest'
import { createValidatedAdapter, validateSendRequest } from '../adapter-validator'
import { withTimeout, TimeoutError } from '../timeout'
import { executeWithClassifiedRetry, type ClassifiedRetryConfig } from '../classified-retry'
import { MockAdapter } from '../mock-adapter'
import { recordIntegrationTelemetry, recordSendTelemetry } from '../telemetry-bridge'
import type { SendRequest, SendResult } from '@nzila/integrations-core'

// ── Shared fixtures ─────────────────────────────────────────────────────────

function validRequest(): SendRequest {
  return {
    orgId: '11111111-1111-1111-1111-111111111111',
    channel: 'email',
    to: 'user@example.com',
    correlationId: '22222222-2222-2222-2222-222222222222',
    body: 'Hello from reliability contract test',
  }
}

const fastRetryConfig: ClassifiedRetryConfig = {
  retry: { maxAttempts: 3, initialDelayMs: 1, maxDelayMs: 5, backoffMultiplier: 1 },
  timeout: { defaultMs: 5_000, overrides: {} },
}

// ── CONTRACT: Schema validation prevents invalid requests ────────────────

describe('Contract: Schema validation', () => {
  it('C1: valid requests pass validation', () => {
    const result = validateSendRequest(validRequest())
    expect(result.valid).toBe(true)
  })

  it('C2: invalid channel is rejected before adapter call', async () => {
    const mock = new MockAdapter()
    const validated = createValidatedAdapter(mock)
    const result = await validated.send(
      { ...validRequest(), channel: 'fax' as never } as unknown as SendRequest,
      {},
    )
    expect(result.ok).toBe(false)
    expect(result.error).toContain('Validation failed')
    expect(mock.callCount).toBe(0)
  })

  it('C3: missing required fields are rejected', async () => {
    const mock = new MockAdapter()
    const validated = createValidatedAdapter(mock)
    const result = await validated.send(
      { orgId: '', channel: 'email', to: '', correlationId: '' } as unknown as SendRequest,
      {},
    )
    expect(result.ok).toBe(false)
    expect(mock.callCount).toBe(0)
  })
})

// ── CONTRACT: Timeout enforcement ────────────────────────────────────────

describe('Contract: Timeout enforcement', () => {
  it('C4: operations within budget complete normally', async () => {
    const result = await withTimeout('resend', async () => 42, { defaultMs: 1_000, overrides: {} })
    expect(result).toBe(42)
  })

  it('C5: operations exceeding budget throw TimeoutError', async () => {
    const config = { defaultMs: 10, overrides: {} }
    await expect(
      withTimeout('slow-provider', () => new Promise((r) => setTimeout(r, 500)), config),
    ).rejects.toThrow(TimeoutError)
  })

  it('C6: TimeoutError carries provider context', async () => {
    try {
      await withTimeout(
        'hubspot',
        () => new Promise((r) => setTimeout(r, 500)),
        { defaultMs: 10, overrides: {} },
      )
    } catch (err) {
      expect(err).toBeInstanceOf(TimeoutError)
      expect((err as TimeoutError).provider).toBe('hubspot')
    }
  })
})

// ── CONTRACT: Classified retry ──────────────────────────────────────────

describe('Contract: Classified retry', () => {
  it('C7: transient errors are retried up to maxAttempts', async () => {
    let calls = 0
    const result = await executeWithClassifiedRetry(
      'resend',
      async () => {
        calls++
        return { ok: false, error: 'connection timeout' } as SendResult
      },
      fastRetryConfig,
    )
    expect(calls).toBe(3) // maxAttempts
    expect(result.classification!.retryable).toBe(true)
  })

  it('C8: permanent errors are NOT retried', async () => {
    let calls = 0
    const result = await executeWithClassifiedRetry(
      'resend',
      async () => {
        calls++
        return { ok: false, error: 'validation error: bad input' } as SendResult
      },
      fastRetryConfig,
    )
    expect(calls).toBe(1)
    expect(result.classification!.retryable).toBe(false)
    expect(result.classification!.failureClass).toBe('permanent')
  })

  it('C9: classification provides actionable suggestedAction', async () => {
    const result = await executeWithClassifiedRetry(
      'resend',
      async () => ({ ok: false, error: 'rate limit exceeded' } as SendResult),
      { ...fastRetryConfig, retry: { ...fastRetryConfig.retry, maxAttempts: 1 } },
    )
    expect(result.classification!.suggestedAction).toBeTruthy()
    expect(typeof result.classification!.suggestedAction).toBe('string')
  })

  it('C10: success after retries records correct attempt count', async () => {
    let call = 0
    const result = await executeWithClassifiedRetry(
      'resend',
      async () => {
        call++
        if (call < 2) return { ok: false, error: 'timeout occurred' } as SendResult
        return { ok: true, providerMessageId: 'msg-ok' } as SendResult
      },
      fastRetryConfig,
    )
    expect(result.result.ok).toBe(true)
    expect(result.attempts).toBe(2)
  })
})

// ── CONTRACT: MockAdapter honours IntegrationAdapter interface ──────────

describe('Contract: MockAdapter', () => {
  it('C11: mock adapter implements send/healthCheck interface', async () => {
    const mock = new MockAdapter()
    const sendResult = await mock.send(validRequest(), { key: 'value' })
    expect(typeof sendResult.ok).toBe('boolean')

    const healthResult = await mock.healthCheck({})
    expect(['ok', 'degraded', 'down']).toContain(healthResult.status)
    expect(typeof healthResult.latencyMs).toBe('number')
  })

  it('C12: mock adapter is usable with validated adapter wrapper', async () => {
    const mock = new MockAdapter()
    const validated = createValidatedAdapter(mock)
    const result = await validated.send(validRequest(), {})
    expect(result.ok).toBe(true)
    expect(mock.callCount).toBe(1)
  })

  it('C13: mock adapter is usable with classified retry', async () => {
    const mock = new MockAdapter()
    mock.enqueueResults(
      { ok: false, error: 'rate limit exceeded' },
      { ok: true, providerMessageId: 'msg-retry-ok' },
    )

    const result = await executeWithClassifiedRetry(
      'resend',
      () => mock.send(validRequest(), {}),
      fastRetryConfig,
    )
    expect(result.result.ok).toBe(true)
    expect(mock.callCount).toBe(2)
  })
})

// ── CONTRACT: Telemetry bridge does not throw ───────────────────────────

describe('Contract: Telemetry bridge', () => {
  it('C14: recordIntegrationTelemetry does not throw on success events', () => {
    expect(() =>
      recordIntegrationTelemetry({
        provider: 'resend',
        channel: 'email',
        orgId: '11111111-1111-1111-1111-111111111111',
        correlationId: '22222222-2222-2222-2222-222222222222',
        action: 'send',
        success: true,
        latencyMs: 42,
      }),
    ).not.toThrow()
  })

  it('C15: recordIntegrationTelemetry does not throw on failure events', () => {
    expect(() =>
      recordIntegrationTelemetry({
        provider: 'slack',
        channel: 'chatops',
        orgId: '11111111-1111-1111-1111-111111111111',
        correlationId: '22222222-2222-2222-2222-222222222222',
        action: 'timeout',
        success: false,
        latencyMs: 15_001,
        error: 'timeout exceeded',
      }),
    ).not.toThrow()
  })

  it('C16: recordSendTelemetry does not throw', () => {
    expect(() =>
      recordSendTelemetry(
        'resend',
        'email',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        { ok: true, providerMessageId: 'msg-1' },
        50,
        1,
      ),
    ).not.toThrow()
  })
})

// ── CONTRACT: Full stack integration ────────────────────────────────────

describe('Contract: Full reliability stack', () => {
  it('C17: validated → timeout → classified retry → telemetry chain works end-to-end', async () => {
    const mock = new MockAdapter()
    mock.enqueueResults(
      { ok: false, error: 'rate limit exceeded' },
      { ok: true, providerMessageId: 'msg-e2e' },
    )
    const validated = createValidatedAdapter(mock)

    const result = await executeWithClassifiedRetry(
      'resend',
      () => validated.send(validRequest(), {}),
      fastRetryConfig,
    )

    expect(result.result.ok).toBe(true)
    expect(result.attempts).toBe(2)
    expect(mock.callCount).toBe(2) // validation passed both times

    // Telemetry does not throw
    expect(() =>
      recordSendTelemetry('resend', 'email', validRequest().orgId, validRequest().correlationId, result.result, 50, result.attempts),
    ).not.toThrow()
  })

  it('C18: full stack rejects invalid input before any retry/timeout', async () => {
    const mock = new MockAdapter()
    const validated = createValidatedAdapter(mock)

    const badRequest = { ...validRequest(), channel: 'fax' as never } as unknown as SendRequest

    const result = await executeWithClassifiedRetry(
      'resend',
      () => validated.send(badRequest, {}),
      fastRetryConfig,
    )

    // Should fail on validation (permanent), not retried
    expect(result.result.ok).toBe(false)
    expect(result.result.error).toContain('Validation failed')
    expect(result.classification!.retryable).toBe(false)
    expect(mock.callCount).toBe(0) // Inner adapter never called
  })
})
