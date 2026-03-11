/**
 * Nzila OS — Platform Ops: Trend-Based Degradation Detection
 *
 * Computes linear-regression slopes over rolling windows for key metrics
 * (p95 latency, error rate, integration SLA) and flags degradation trends
 * before hard SLO thresholds are breached.
 *
 * Emits audit event: `platform.ops.trend_warning`
 *
 * @module @nzila/platform-ops/trend-detection
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface TrendDataPoint {
  /** ISO 8601 date (YYYY-MM-DD) */
  date: string
  /** Metric value on that date */
  value: number
}

export interface TrendInput {
  /** Metric name (e.g. 'p95_latency', 'error_rate', 'integration_sla') */
  metric: string
  /** App or provider scope */
  scope: string
  /** Ordered data points (oldest → newest) */
  dataPoints: TrendDataPoint[]
}

export type TrendDirection = 'improving' | 'stable' | 'degrading'

export interface TrendResult {
  /** Metric name */
  metric: string
  /** Scope (app/provider) */
  scope: string
  /** Computed slope per day */
  slopePerDay: number
  /** Normalised slope (slope / mean) — allows cross-metric comparison */
  normalisedSlope: number
  /** R² goodness-of-fit (0–1) — higher means trend is more reliable */
  rSquared: number
  /** Direction classification */
  direction: TrendDirection
  /** Whether the slope exceeds the degradation threshold */
  isDegrading: boolean
  /** Number of data points used */
  dataPointCount: number
  /** Human-readable summary */
  summary: string
}

export interface TrendWarningAuditEvent {
  action: 'platform.ops.trend_warning'
  timestamp: string
  trends: Array<{
    metric: string
    scope: string
    slopePerDay: number
    direction: TrendDirection
  }>
  degradingCount: number
}

export interface TrendThresholds {
  /** Normalised slope above which a metric is considered degrading */
  degradationSlope: number
  /** Minimum R² for the trend to be considered significant */
  minRSquared: number
  /** Minimum data points required for analysis */
  minDataPoints: number
}

// ── Defaults ───────────────────────────────────────────────────────────────

export const DEFAULT_TREND_THRESHOLDS: TrendThresholds = {
  degradationSlope: 0.02, // 2% per day normalised slope
  minRSquared: 0.3,       // trend must explain ≥30% of variance
  minDataPoints: 3,       // need at least 3 days
}

// ── Slope Computation (linear regression) ──────────────────────────────────

/**
 * Compute the slope and R² of a simple linear regression on numeric data.
 * X = day index (0, 1, 2, …), Y = metric value.
 */
export function computeLinearRegression(values: number[]): {
  slope: number
  intercept: number
  rSquared: number
} {
  const n = values.length
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0, rSquared: 0 }

  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0

  for (let i = 0; i < n; i++) {
    const v = values[i]!
    sumX += i
    sumY += v
    sumXY += i * v
    sumX2 += i * i
  }

  const denominator = n * sumX2 - sumX * sumX
  if (denominator === 0) return { slope: 0, intercept: sumY / n, rSquared: 0 }

  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  // R² calculation
  const yMean = sumY / n
  let ssTot = 0
  let ssRes = 0
  for (let i = 0; i < n; i++) {
    const v = values[i]!
    const predicted = intercept + slope * i
    ssTot += (v - yMean) ** 2
    ssRes += (v - predicted) ** 2
  }
  const rSquared = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot)

  return { slope, intercept, rSquared }
}

// ── Trend Analysis ─────────────────────────────────────────────────────────

/**
 * Classify the direction of a metric based on its name and slope.
 *
 * For metrics where higher = worse (latency, error_rate, dlq_backlog),
 * a positive slope is degrading.
 *
 * For metrics where lower = worse (integration_sla),
 * a negative slope is degrading.
 */
function classifyDirection(
  metric: string,
  normalisedSlope: number,
  threshold: number,
): TrendDirection {
  const invertedMetrics = ['integration_sla']
  const isInverted = invertedMetrics.includes(metric)

  const effectiveSlope = isInverted ? -normalisedSlope : normalisedSlope

  if (effectiveSlope > threshold) return 'degrading'
  if (effectiveSlope < -threshold) return 'improving'
  return 'stable'
}

/**
 * Analyse a single metric's trend over its data points.
 */
export function analyseTrend(
  input: TrendInput,
  thresholds: TrendThresholds = DEFAULT_TREND_THRESHOLDS,
): TrendResult {
  const values = input.dataPoints.map((dp) => dp.value)
  const { slope, rSquared } = computeLinearRegression(values)

  const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  const normalisedSlope = mean !== 0 ? slope / Math.abs(mean) : 0

  const isSignificant =
    rSquared >= thresholds.minRSquared && values.length >= thresholds.minDataPoints

  const direction = isSignificant
    ? classifyDirection(input.metric, normalisedSlope, thresholds.degradationSlope)
    : 'stable'

  const isDegrading = direction === 'degrading'

  const directionEmoji =
    direction === 'degrading' ? '📈🔴' : direction === 'improving' ? '📉🟢' : '➡️⚪'

  const summary = [
    `${input.scope}/${input.metric}: ${directionEmoji} ${direction}`,
    `slope=${slope.toFixed(4)}/day`,
    `R²=${rSquared.toFixed(3)}`,
    `(${values.length} points)`,
  ].join(' · ')

  return {
    metric: input.metric,
    scope: input.scope,
    slopePerDay: Math.round(slope * 10000) / 10000,
    normalisedSlope: Math.round(normalisedSlope * 10000) / 10000,
    rSquared: Math.round(rSquared * 1000) / 1000,
    direction,
    isDegrading,
    dataPointCount: values.length,
    summary,
  }
}

/**
 * Analyse trends for multiple metrics at once.
 */
export function analyseTrends(
  inputs: TrendInput[],
  thresholds: TrendThresholds = DEFAULT_TREND_THRESHOLDS,
): TrendResult[] {
  return inputs.map((input) => analyseTrend(input, thresholds))
}

/**
 * Build the audit event for trend warnings.
 * Only includes degrading trends.
 */
export function buildTrendWarningEvent(
  results: TrendResult[],
): TrendWarningAuditEvent {
  const degrading = results.filter((r) => r.isDegrading)

  return {
    action: 'platform.ops.trend_warning',
    timestamp: new Date().toISOString(),
    trends: degrading.map((r) => ({
      metric: r.metric,
      scope: r.scope,
      slopePerDay: r.slopePerDay,
      direction: r.direction,
    })),
    degradingCount: degrading.length,
  }
}
