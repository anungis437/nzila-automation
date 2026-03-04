/**
 * @nzila/platform-integrations-control-plane — Provider Registry
 *
 * Central registry for integration providers with health tracking.
 * Aggregates state from the integrations-runtime layer.
 *
 * @module @nzila/platform-integrations-control-plane/registry
 */
import { createLogger } from '@nzila/os-core/telemetry'
import type { ProviderHealth, ProviderStatus } from './types'

const logger = createLogger('integrations-control-plane-registry')

// ── Ports ───────────────────────────────────────────────────────────────────

export interface RegistryPorts {
  /** List all registered provider names */
  listProviders(): Promise<string[]>
  /** Get circuit breaker state for a provider+org */
  getCircuitState(provider: string, orgId: string): Promise<'closed' | 'open' | 'half-open'>
  /** Get delivery stats for a provider in a time window */
  getDeliveryStats(
    provider: string,
    sinceMs: number,
  ): Promise<{
    total: number
    succeeded: number
    failed: number
    avgLatencyMs: number
  }>
}

// ── Provider Registry ───────────────────────────────────────────────────────

export class ProviderRegistry {
  private readonly ports: RegistryPorts

  constructor(ports: RegistryPorts) {
    this.ports = ports
  }

  /**
   * Get health summary for all providers in an org.
   */
  async getProviderHealth(orgId: string): Promise<ProviderHealth[]> {
    const providers = await this.ports.listProviders()
    const results: ProviderHealth[] = []

    for (const provider of providers) {
      try {
        const [circuitState, stats] = await Promise.all([
          this.ports.getCircuitState(provider, orgId),
          this.ports.getDeliveryStats(provider, 24 * 60 * 60 * 1000),
        ])

        const successRate =
          stats.total > 0 ? (stats.succeeded / stats.total) * 100 : 100

        const status = deriveProviderStatus(circuitState, successRate)

        results.push({
          provider,
          status,
          circuitState,
          successRate: Math.round(successRate * 100) / 100,
          avgLatencyMs: Math.round(stats.avgLatencyMs),
          lastCheckedAt: new Date().toISOString(),
          consecutiveFailures: 0,
          totalDeliveries: stats.total,
          totalFailures: stats.failed,
        })
      } catch (err: unknown) {
        logger.error('Failed to get provider health', {
          provider,
          orgId,
          error: err instanceof Error ? err.message : String(err),
        })

        results.push({
          provider,
          status: 'unknown',
          circuitState: 'closed',
          successRate: 0,
          avgLatencyMs: 0,
          lastCheckedAt: new Date().toISOString(),
          consecutiveFailures: 0,
          totalDeliveries: 0,
          totalFailures: 0,
        })
      }
    }

    return results
  }

  /**
   * Get health for a single provider.
   */
  async getProviderHealthSingle(
    orgId: string,
    provider: string,
  ): Promise<ProviderHealth> {
    const allHealth = await this.getProviderHealth(orgId)
    const found = allHealth.find((h) => h.provider === provider)
    if (!found) {
      return {
        provider,
        status: 'unknown',
        circuitState: 'closed',
        successRate: 0,
        avgLatencyMs: 0,
        lastCheckedAt: new Date().toISOString(),
        consecutiveFailures: 0,
        totalDeliveries: 0,
        totalFailures: 0,
      }
    }
    return found
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function deriveProviderStatus(
  circuitState: 'closed' | 'open' | 'half-open',
  successRate: number,
): ProviderStatus {
  if (circuitState === 'open') return 'down'
  if (circuitState === 'half-open') return 'degraded'
  if (successRate < 90) return 'degraded'
  return 'healthy'
}
