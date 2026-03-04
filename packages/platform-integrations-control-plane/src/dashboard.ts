/**
 * @nzila/platform-integrations-control-plane — Dashboard
 *
 * Aggregated integration health dashboard for the console.
 * Combines provider health, DLQ depth, and delivery stats.
 *
 * @module @nzila/platform-integrations-control-plane/dashboard
 */
import { createLogger } from '@nzila/os-core/telemetry'
import type { ProviderRegistry } from './registry'
import type { DlqManager } from './dlq'
import type { IntegrationDashboardSummary } from './types'

const logger = createLogger('integrations-dashboard')

// ── Dashboard Builder ───────────────────────────────────────────────────────

export interface DashboardPorts {
  readonly registry: ProviderRegistry
  readonly dlq: DlqManager
}

/**
 * Build an integration dashboard summary for an org.
 * Aggregates all integration subsystem metrics into a single view.
 */
export async function buildDashboardSummary(
  ports: DashboardPorts,
  orgId: string,
): Promise<IntegrationDashboardSummary> {
  const [providers, dlqDepth] = await Promise.all([
    ports.registry.getProviderHealth(orgId),
    ports.dlq.depth(orgId),
  ])

  const healthyProviders = providers.filter((p) => p.status === 'healthy').length
  const degradedProviders = providers.filter((p) => p.status === 'degraded').length
  const downProviders = providers.filter((p) => p.status === 'down').length

  const totalDeliveries24h = providers.reduce(
    (acc, p) => acc + p.totalDeliveries,
    0,
  )
  const totalFailures24h = providers.reduce(
    (acc, p) => acc + p.totalFailures,
    0,
  )
  const successRate24h =
    totalDeliveries24h > 0
      ? ((totalDeliveries24h - totalFailures24h) / totalDeliveries24h) * 100
      : 100

  const avgLatencyMs24h =
    providers.length > 0
      ? providers.reduce((acc, p) => acc + p.avgLatencyMs, 0) / providers.length
      : 0

  const summary: IntegrationDashboardSummary = {
    totalProviders: providers.length,
    healthyProviders,
    degradedProviders,
    downProviders,
    dlqDepth,
    totalDeliveries24h,
    successRate24h: Math.round(successRate24h * 100) / 100,
    avgLatencyMs24h: Math.round(avgLatencyMs24h),
    providers,
  }

  logger.info('Dashboard summary built', {
    orgId,
    totalProviders: summary.totalProviders,
    healthy: healthyProviders,
    dlqDepth,
  })

  return summary
}
