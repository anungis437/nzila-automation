/**
 * @nzila/platform-procurement-proof — Integrations Health Collector
 *
 * Pulls integration health from the control plane registry and DLQ.
 * Reports per-provider status, circuit breaker state, DLQ depth,
 * and 7-day delivery summaries. All outputs are org-scoped.
 *
 * @module @nzila/platform-procurement-proof/collectors/integrations-health
 */
import { createHash } from 'node:crypto'
import { createLogger } from '@nzila/os-core/telemetry'
import type { RegistryPorts } from '@nzila/platform-integrations-control-plane'
import type {
  CollectorResult,
  IntegrationsHealthCollectorData,
  IntegrationProviderSummary,
} from './types'
import { integrationsHealthCollectorDataSchema } from './types'

const logger = createLogger('collector:integrations-health')

export interface IntegrationsHealthPorts {
  /** List all registered provider names */
  readonly listProviders: RegistryPorts['listProviders']
  /** Get circuit breaker state for a provider+org */
  readonly getCircuitState: RegistryPorts['getCircuitState']
  /** Get delivery stats for a provider in a time window */
  readonly getDeliveryStats: RegistryPorts['getDeliveryStats']
  /** Get DLQ depth for an org */
  readonly getDlqDepth: (orgId: string) => Promise<number>
  /** Get DLQ depth per provider */
  readonly getDlqDepthByProvider?: (orgId: string, provider: string) => Promise<number>
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Collect integration health for an org.
 */
export async function collectIntegrationsHealth(
  orgId: string,
  ports: IntegrationsHealthPorts,
): Promise<CollectorResult<IntegrationsHealthCollectorData>> {
  const now = new Date().toISOString()
  const source = '@nzila/platform-integrations-control-plane'

  try {
    const [providers, dlqDepth] = await Promise.all([
      ports.listProviders(),
      ports.getDlqDepth(orgId),
    ])

    if (providers.length === 0) {
      logger.info('No integration providers registered', { orgId })
      return {
        status: 'not_available',
        source,
        collectedAt: now,
        data: null,
        reason: 'No integration providers are registered for this org.',
      }
    }

    const providerSummaries: IntegrationProviderSummary[] = []
    let healthyCount = 0
    let degradedCount = 0
    let downCount = 0

    for (const provider of providers) {
      try {
        const [circuitState, dayStats, weekStats] = await Promise.all([
          ports.getCircuitState(provider, orgId),
          ports.getDeliveryStats(provider, ONE_DAY_MS),
          ports.getDeliveryStats(provider, SEVEN_DAYS_MS),
        ])

        const providerDlq = ports.getDlqDepthByProvider
          ? await ports.getDlqDepthByProvider(orgId, provider)
          : 0

        const successRate =
          dayStats.total > 0 ? (dayStats.succeeded / dayStats.total) * 100 : 100

        let status: string
        if (circuitState === 'open') {
          status = 'down'
          downCount++
        } else if (circuitState === 'half-open' || successRate < 90) {
          status = 'degraded'
          degradedCount++
        } else {
          status = 'healthy'
          healthyCount++
        }

        const lastSuccessAt =
          dayStats.succeeded > 0 ? new Date().toISOString() : null

        providerSummaries.push({
          provider,
          status,
          circuitState,
          lastSuccessAt,
          failureCount: dayStats.failed,
          dlqCount: providerDlq,
          sevenDaySummary: {
            attempts: weekStats.total,
            successes: weekStats.succeeded,
            failures: weekStats.failed,
          },
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        logger.warn('Failed to collect health for provider', { provider, orgId, error: message })

        providerSummaries.push({
          provider,
          status: 'unknown',
          circuitState: 'unknown',
          lastSuccessAt: null,
          failureCount: 0,
          dlqCount: 0,
          sevenDaySummary: { attempts: 0, successes: 0, failures: 0 },
        })
      }
    }

    const data: IntegrationsHealthCollectorData = {
      totalProviders: providers.length,
      healthyProviders: healthyCount,
      degradedProviders: degradedCount,
      downProviders: downCount,
      dlqDepth,
      providers: providerSummaries,
    }

    // Validate
    integrationsHealthCollectorDataSchema.parse(data)

    const integrityHash = createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')

    logger.info('Integrations health collected', {
      orgId,
      totalProviders: data.totalProviders,
      healthy: data.healthyProviders,
      dlqDepth: data.dlqDepth,
    })

    return {
      status: 'ok',
      source,
      collectedAt: now,
      data,
      integrityHash,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('Failed to collect integrations health', { orgId, error: message })

    return {
      status: 'not_available',
      source,
      collectedAt: now,
      data: null,
      reason: `Integrations health collection failed: ${message}`,
    }
  }
}
