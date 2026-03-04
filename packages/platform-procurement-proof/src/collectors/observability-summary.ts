/**
 * @nzila/platform-procurement-proof — Observability Summary Collector
 *
 * Queries the observability subsystem for a minimal summary.
 * Never invents numbers — marks "not_available" if data is missing.
 *
 * @module @nzila/platform-procurement-proof/collectors/observability-summary
 */
import { createHash } from 'node:crypto'
import { createLogger } from '@nzila/os-core/telemetry'
import { nowISO } from '@nzila/platform-utils/time'
import type { HealthReport } from '@nzila/platform-observability'
import type {
  CollectorResult,
  ObservabilitySummaryCollectorData,
  HealthCheckSummary,
} from './types'
import { observabilitySummaryCollectorDataSchema } from './types'

const logger = createLogger('collector:observability-summary')

export interface ObservabilityCollectorPorts {
  /** Run health checks and return report */
  readonly runHealthChecks: () => Promise<HealthReport>
  /** Get error count from structured logs/audit for last 24h (optional) */
  readonly getErrorCount24h?: (orgId: string) => Promise<number | null>
  /** Get p95 latency from metrics store (optional) */
  readonly getP95LatencyMs?: (orgId: string) => Promise<number | null>
  /** Get queue depth from job queue (optional) */
  readonly getQueueDepth?: (orgId: string) => Promise<number | null>
}

/**
 * Collect observability summary for an org.
 */
export async function collectObservabilitySummary(
  orgId: string,
  ports: ObservabilityCollectorPorts,
): Promise<CollectorResult<ObservabilitySummaryCollectorData>> {
  const now = nowISO()
  const source = '@nzila/platform-observability'

  try {
    // Run health checks (always available)
    const healthReport = await ports.runHealthChecks()

    // Optional metrics — never invent numbers
    const [errorCount24h, p95LatencyMs, queueDepth] = await Promise.all([
      ports.getErrorCount24h?.(orgId).catch(() => null) ?? Promise.resolve(null),
      ports.getP95LatencyMs?.(orgId).catch(() => null) ?? Promise.resolve(null),
      ports.getQueueDepth?.(orgId).catch(() => null) ?? Promise.resolve(null),
    ])

    const healthChecks: HealthCheckSummary[] = healthReport.checks.map((c) => ({
      name: c.name,
      status: c.status,
      latencyMs: c.latencyMs,
    }))

    const data: ObservabilitySummaryCollectorData = {
      errorCount24h,
      p95LatencyMs,
      queueDepth,
      healthStatus: healthReport.status,
      healthChecks,
    }

    // Validate
    observabilitySummaryCollectorDataSchema.parse(data)

    const integrityHash = createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')

    logger.info('Observability summary collected', {
      orgId,
      healthStatus: data.healthStatus,
      errorCount24h: data.errorCount24h ?? 'not_available',
      p95LatencyMs: data.p95LatencyMs ?? 'not_available',
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
    logger.error('Failed to collect observability summary', { orgId, error: message })

    return {
      status: 'not_available',
      source,
      collectedAt: now,
      data: null,
      reason: `Observability collection failed: ${message}`,
    }
  }
}
