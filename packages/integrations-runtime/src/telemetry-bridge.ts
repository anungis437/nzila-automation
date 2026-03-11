/**
 * Nzila OS — Integration Runtime: Telemetry Bridge
 *
 * Bridges integration-runtime events to @nzila/platform-observability
 * structured telemetry. Provides a unified hook that records integration
 * metrics, emits structured logs, and links to correlation contexts.
 *
 * @invariant INTEGRATION_TELEMETRY_001
 */
import { integrationTelemetry } from '@nzila/platform-observability'
import type { IntegrationProvider, IntegrationType, SendResult } from '@nzila/integrations-core'

// ── Types ───────────────────────────────────────────────────────────────────

export interface IntegrationTelemetryEvent {
  readonly provider: IntegrationProvider
  readonly channel: IntegrationType
  readonly orgId: string
  readonly correlationId: string
  readonly action: 'send' | 'health_check' | 'retry' | 'dlq' | 'circuit_trip' | 'timeout'
  readonly success: boolean
  readonly latencyMs: number
  readonly error?: string
  readonly attempt?: number
  readonly maxAttempts?: number
  readonly metadata?: Record<string, unknown>
}

export interface TelemetryBridgePorts {
  /** Optional custom telemetry factory (for testing) */
  readonly createTelemetry?: (provider: string, channel: string) => ReturnType<typeof integrationTelemetry>
}

// ── Bridge ──────────────────────────────────────────────────────────────────

/**
 * Record an integration event through the platform observability layer.
 * Uses `integrationTelemetry()` from platform-observability to emit
 * structured metrics and log entries.
 */
export function recordIntegrationTelemetry(
  event: IntegrationTelemetryEvent,
  ports?: TelemetryBridgePorts,
): void {
  const factory = ports?.createTelemetry ?? integrationTelemetry
  const tel = factory(event.provider, event.channel)

  switch (event.action) {
    case 'send':
      tel.providerRequest()
      tel.providerResponse(event.success ? 200 : 500, event.latencyMs)
      tel.syncCompleted(event.success)
      break
    case 'retry':
      tel.retryInvoked(event.attempt ?? 1, event.error ?? 'unknown')
      break
    case 'timeout':
      tel.providerResponse(504, event.latencyMs)
      break
    case 'health_check':
      tel.providerResponse(event.success ? 200 : 503, event.latencyMs)
      break
    case 'dlq':
      tel.auditEmitted('delivery.dlq')
      break
    case 'circuit_trip':
      tel.auditEmitted('circuit.tripped')
      break
  }
}

/**
 * Record a send result as telemetry, classifying success/failure.
 */
export function recordSendTelemetry(
  provider: IntegrationProvider,
  channel: IntegrationType,
  orgId: string,
  correlationId: string,
  result: SendResult,
  latencyMs: number,
  attempt?: number,
): void {
  recordIntegrationTelemetry({
    provider,
    channel,
    orgId,
    correlationId,
    action: 'send',
    success: result.ok,
    latencyMs,
    error: result.error,
    attempt,
    metadata: result.rateLimitInfo ? { rateLimitInfo: result.rateLimitInfo } : undefined,
  })
}
