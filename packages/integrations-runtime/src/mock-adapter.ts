/**
 * Nzila OS — Integration Runtime: Mock Adapter
 *
 * Configurable mock adapter for testing integration reliability without
 * calling external providers. Supports:
 *   - Programmatic success/failure responses
 *   - Latency simulation
 *   - Call recording for assertions
 *   - Rate-limit injection
 *   - Health check stubbing
 *
 * @invariant INTEGRATION_MOCK_001
 */
import type {
  IntegrationAdapter,
  IntegrationProvider,
  IntegrationType,
  SendRequest,
  SendResult,
  HealthCheckResult,
  HealthStatus,
} from '@nzila/integrations-core'

// ── Types ───────────────────────────────────────────────────────────────────

export interface MockAdapterConfig {
  /** Provider name (default: 'resend') */
  readonly provider?: IntegrationProvider
  /** Channel type (default: 'email') */
  readonly channel?: IntegrationType
  /** Default send result */
  readonly defaultResult?: SendResult
  /** Simulated latency in ms (default: 0 = instant) */
  readonly latencyMs?: number
  /** Health check status (default: 'ok') */
  readonly healthStatus?: HealthStatus
  /** Queue of results to return in order (pops from front) */
  readonly resultQueue?: SendResult[]
}

export interface RecordedCall {
  readonly request: SendRequest
  readonly credentials: Record<string, unknown>
  readonly timestamp: string
}

// ── Mock adapter ────────────────────────────────────────────────────────────

export class MockAdapter implements IntegrationAdapter {
  readonly provider: IntegrationProvider
  readonly channel: IntegrationType

  private _defaultResult: SendResult
  private _latencyMs: number
  private _healthStatus: HealthStatus
  private readonly _resultQueue: SendResult[]
  private readonly _calls: RecordedCall[] = []
  private readonly _healthCalls: Array<{ credentials: Record<string, unknown>; timestamp: string }> = []

  constructor(config: MockAdapterConfig = {}) {
    this.provider = config.provider ?? 'resend'
    this.channel = config.channel ?? 'email'
    this._defaultResult = config.defaultResult ?? {
      ok: true,
      providerMessageId: `mock-${Date.now().toString(36)}`,
      latencyMs: 1,
    }
    this._latencyMs = config.latencyMs ?? 0
    this._healthStatus = config.healthStatus ?? 'ok'
    this._resultQueue = config.resultQueue ? [...config.resultQueue] : []
  }

  // ── Adapter implementation ──────────────────────────────────────────────

  async send(request: SendRequest, credentials: Record<string, unknown>): Promise<SendResult> {
    this._calls.push({
      request,
      credentials,
      timestamp: new Date().toISOString(),
    })

    if (this._latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this._latencyMs))
    }

    // Return from queue first, then default
    if (this._resultQueue.length > 0) {
      return this._resultQueue.shift()!
    }

    return { ...this._defaultResult }
  }

  async healthCheck(credentials: Record<string, unknown>): Promise<HealthCheckResult> {
    this._healthCalls.push({
      credentials,
      timestamp: new Date().toISOString(),
    })

    return {
      provider: this.provider,
      status: this._healthStatus,
      latencyMs: this._latencyMs,
      details: this._healthStatus === 'ok' ? null : 'Mock degraded/down',
      checkedAt: new Date().toISOString(),
    }
  }

  // ── Test helpers ────────────────────────────────────────────────────────

  /** All recorded send calls */
  get calls(): readonly RecordedCall[] {
    return this._calls
  }

  /** Number of send calls */
  get callCount(): number {
    return this._calls.length
  }

  /** All recorded health check calls */
  get healthCalls(): readonly Array<{ credentials: Record<string, unknown>; timestamp: string }> {
    return this._healthCalls
  }

  /** Reset call history */
  reset(): void {
    this._calls.length = 0
    this._healthCalls.length = 0
    this._resultQueue.length = 0
  }

  /** Override the default result for subsequent calls */
  setDefaultResult(result: SendResult): void {
    this._defaultResult = result
  }

  /** Enqueue results to be returned in order */
  enqueueResults(...results: SendResult[]): void {
    this._resultQueue.push(...results)
  }

  /** Set simulated latency */
  setLatency(ms: number): void {
    this._latencyMs = ms
  }

  /** Set health check status */
  setHealthStatus(status: HealthStatus): void {
    this._healthStatus = status
  }
}

/**
 * Factory for creating a mock adapter with sensible defaults.
 */
export function createMockAdapter(overrides?: MockAdapterConfig): MockAdapter {
  return new MockAdapter(overrides)
}
