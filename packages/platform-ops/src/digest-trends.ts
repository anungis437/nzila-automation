/**
 * Nzila OS — Platform Ops: Trend-Enriched Health Digest
 *
 * Integrates trend detection into the daily health digest loop.
 * Fetches N-day metric series, runs `analyseTrends()`, emits
 * `platform.ops.trend_warning` audit events on degradation, and
 * includes `trendWarnings` in the digest output.
 *
 * This enables *predictive* ops: degradation is surfaced before
 * hard SLO thresholds are breached.
 *
 * @module @nzila/platform-ops/digest-trends
 */
import {
  analyseTrends,
  buildTrendWarningEvent,
  type TrendInput,
  type TrendResult,
  type TrendThresholds,
  type TrendWarningAuditEvent,
  DEFAULT_TREND_THRESHOLDS,
} from './trend-detection'
import type { HealthDigestSnapshot } from './health-digest'

// ── Types ──────────────────────────────────────────────────────────────────

export interface TrendSeriesDataPoint {
  date: string
  value: number
}

/**
 * Port for fetching N-day metric series from the data layer.
 * Consumers provide their own implementation (DB query, API, mock).
 */
export interface TrendSeriesPort {
  /**
   * Fetch the last `days` data points for a given metric + scope.
   * Returns ordered oldest → newest.
   */
  fetchSeries(
    metric: string,
    scope: string,
    days: number,
  ): Promise<TrendSeriesDataPoint[]>
}

export interface TrendEnrichedDigest {
  /** Original digest snapshot */
  digest: HealthDigestSnapshot
  /** Trend analysis results for all tracked metrics */
  trendResults: TrendResult[]
  /** Only the degrading trends (convenience filter) */
  trendWarnings: TrendResult[]
  /** Audit event for degrading trends (null if none) */
  trendWarningEvent: TrendWarningAuditEvent | null
  /** Whether any degradation was detected */
  hasDegradation: boolean
}

export interface DigestTrendsConfig {
  /** Number of days to look back for trend data (default: 7) */
  lookbackDays: number
  /** Metrics to track, each with metric name + scope */
  trackedMetrics: Array<{ metric: string; scope: string }>
  /** Trend detection thresholds */
  thresholds: TrendThresholds
}

// ── Defaults ───────────────────────────────────────────────────────────────

export const DEFAULT_TRACKED_METRICS: DigestTrendsConfig['trackedMetrics'] = [
  { metric: 'p95_latency', scope: 'console' },
  { metric: 'p95_latency', scope: 'web' },
  { metric: 'error_rate', scope: 'console' },
  { metric: 'error_rate', scope: 'web' },
  { metric: 'integration_sla', scope: 'global' },
]

export const DEFAULT_DIGEST_TRENDS_CONFIG: DigestTrendsConfig = {
  lookbackDays: 7,
  trackedMetrics: DEFAULT_TRACKED_METRICS,
  thresholds: DEFAULT_TREND_THRESHOLDS,
}

// ── Core ───────────────────────────────────────────────────────────────────

/**
 * Fetch series data for all tracked metrics and run trend analysis.
 */
export async function fetchAndAnalyseTrends(
  port: TrendSeriesPort,
  config: DigestTrendsConfig = DEFAULT_DIGEST_TRENDS_CONFIG,
): Promise<{ results: TrendResult[]; warnings: TrendResult[] }> {
  const inputs: TrendInput[] = await Promise.all(
    config.trackedMetrics.map(async ({ metric, scope }) => {
      const dataPoints = await port.fetchSeries(metric, scope, config.lookbackDays)
      return { metric, scope, dataPoints }
    }),
  )

  const results = analyseTrends(inputs, config.thresholds)
  const warnings = results.filter((r) => r.isDegrading)

  return { results, warnings }
}

/**
 * Generate a trend-enriched digest.
 *
 * Takes a pre-computed `HealthDigestSnapshot` and augments it with
 * trend analysis data. Emits audit event when degradation is detected.
 */
export async function generateTrendEnrichedDigest(
  digest: HealthDigestSnapshot,
  port: TrendSeriesPort,
  config: DigestTrendsConfig = DEFAULT_DIGEST_TRENDS_CONFIG,
): Promise<TrendEnrichedDigest> {
  const { results, warnings } = await fetchAndAnalyseTrends(port, config)

  const trendWarningEvent =
    warnings.length > 0 ? buildTrendWarningEvent(results) : null

  return {
    digest,
    trendResults: results,
    trendWarnings: warnings,
    trendWarningEvent,
    hasDegradation: warnings.length > 0,
  }
}

/**
 * Create an in-memory stub port for testing / demo purposes.
 * Returns flat (stable) series by default.
 */
export function createStubTrendSeriesPort(
  overrides?: Record<string, TrendSeriesDataPoint[]>,
): TrendSeriesPort {
  return {
    fetchSeries: async (metric, scope, days) => {
      const key = `${metric}::${scope}`
      if (overrides?.[key]) return overrides[key]

      // Generate flat series (value = 50 for all days)
      const points: TrendSeriesDataPoint[] = []
      const today = new Date()
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        points.push({ date: d.toISOString().slice(0, 10), value: 50 })
      }
      return points
    },
  }
}
