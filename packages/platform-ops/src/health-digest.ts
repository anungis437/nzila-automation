/**
 * Nzila OS — Platform Ops: Health Digest
 *
 * Computes daily health snapshots with deltas for key operational metrics:
 *   - p95 latency (per app)
 *   - Error rate (per app)
 *   - Integration SLA (per provider)
 *   - DLQ / outbox backlog
 *
 * Detects anomalies against SLO thresholds and emits audit events.
 *
 * @module @nzila/platform-ops/health-digest
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface MetricDelta {
  /** Metric name (e.g. 'p95_latency', 'error_rate') */
  metric: string
  /** App or provider this metric belongs to */
  scope: string
  /** Previous value (yesterday or last snapshot) */
  previousValue: number
  /** Current value */
  currentValue: number
  /** Absolute change */
  delta: number
  /** Percentage change (+/-) */
  deltaPct: number
  /** SLO threshold (if applicable) */
  sloThreshold: number | null
  /** Whether current value violates the SLO */
  sloViolation: boolean
}

export type AnomalySeverity = 'warning' | 'critical'

export interface Anomaly {
  /** Metric that triggered the anomaly */
  metric: string
  /** Scope (app name, provider, or 'global') */
  scope: string
  /** Current value */
  currentValue: number
  /** SLO threshold that was breached */
  threshold: number
  /** Severity based on how far past threshold */
  severity: AnomalySeverity
  /** Human-readable description */
  description: string
}

export interface HealthDigestSnapshot {
  /** ISO 8601 generation timestamp */
  generatedAt: string
  /** Date this digest covers (YYYY-MM-DD) */
  coverageDate: string
  /** Per-metric deltas */
  deltas: MetricDelta[]
  /** Detected anomalies */
  anomalies: Anomaly[]
  /** Summary counts */
  summary: {
    totalMetrics: number
    sloViolations: number
    warnings: number
    criticals: number
  }
}

export interface HealthDigestAuditEvent {
  action: 'platform.ops.health_digest.generated'
  timestamp: string
  coverageDate: string
  summary: HealthDigestSnapshot['summary']
  anomalyCount: number
}

// ── SLO Config Loader ──────────────────────────────────────────────────────

interface SloThresholds {
  performance?: {
    p95_latency_ms: number
    p99_latency_ms: number
    error_rate_max_pct: number
  }
  integrations?: {
    success_rate_min_pct: number
    p95_delivery_latency_ms: number
  }
  dlq?: {
    backlog_max: number
  }
}

interface SloPolicy {
  defaults: SloThresholds
  apps: Record<string, SloThresholds>
}

/**
 * Load SLO thresholds from parsed policy. In production this reads
 * from `ops/slo-policy.yml`; here we accept the parsed object.
 */
function getThresholds(policy: SloPolicy, app: string): SloThresholds {
  const appOverrides = policy.apps[app]
  return {
    performance: {
      ...policy.defaults.performance!,
      ...appOverrides?.performance,
    },
    integrations: {
      ...policy.defaults.integrations!,
      ...appOverrides?.integrations,
    },
    dlq: {
      ...policy.defaults.dlq!,
      ...appOverrides?.dlq,
    },
  }
}

// ── Delta Computation ──────────────────────────────────────────────────────

export interface MetricInput {
  metric: string
  scope: string
  currentValue: number
  previousValue: number
}

/**
 * Compute deltas and check SLO violations for a set of metric inputs.
 */
export function computeDeltas(
  inputs: MetricInput[],
  policy: SloPolicy,
): MetricDelta[] {
  return inputs.map((input) => {
    const delta = input.currentValue - input.previousValue
    const deltaPct =
      input.previousValue !== 0
        ? Math.round(((input.currentValue - input.previousValue) / input.previousValue) * 10000) / 100
        : 0

    const thresholds = getThresholds(policy, input.scope)
    let sloThreshold: number | null = null
    let sloViolation = false

    // Map metric names to SLO thresholds
    if (input.metric === 'p95_latency' && thresholds.performance) {
      sloThreshold = thresholds.performance.p95_latency_ms
      sloViolation = input.currentValue > sloThreshold
    } else if (input.metric === 'p99_latency' && thresholds.performance) {
      sloThreshold = thresholds.performance.p99_latency_ms
      sloViolation = input.currentValue > sloThreshold
    } else if (input.metric === 'error_rate' && thresholds.performance) {
      sloThreshold = thresholds.performance.error_rate_max_pct
      sloViolation = input.currentValue > sloThreshold
    } else if (input.metric === 'integration_sla' && thresholds.integrations) {
      sloThreshold = thresholds.integrations.success_rate_min_pct
      sloViolation = input.currentValue < sloThreshold // below minimum
    } else if (input.metric === 'dlq_backlog' && thresholds.dlq) {
      sloThreshold = thresholds.dlq.backlog_max
      sloViolation = input.currentValue > sloThreshold
    }

    return {
      metric: input.metric,
      scope: input.scope,
      previousValue: input.previousValue,
      currentValue: input.currentValue,
      delta,
      deltaPct,
      sloThreshold,
      sloViolation,
    }
  })
}

// ── Anomaly Detection ──────────────────────────────────────────────────────

/**
 * Detect anomalies from computed deltas.
 * - warning: value exceeds SLO threshold
 * - critical: value exceeds 1.5× SLO threshold (or special rules)
 */
export function detectAnomalies(deltas: MetricDelta[]): Anomaly[] {
  const anomalies: Anomaly[] = []

  for (const d of deltas) {
    if (!d.sloViolation || d.sloThreshold === null) continue

    // Determine severity
    let severity: AnomalySeverity = 'warning'

    if (d.metric === 'p95_latency' || d.metric === 'p99_latency') {
      if (d.currentValue > d.sloThreshold * 1.5) severity = 'critical'
    } else if (d.metric === 'error_rate') {
      if (d.currentValue > d.sloThreshold * 2) severity = 'critical'
    } else if (d.metric === 'integration_sla') {
      // Below minimum — critical if more than 2% below threshold
      if (d.currentValue < d.sloThreshold - 2) severity = 'critical'
    } else if (d.metric === 'dlq_backlog') {
      if (d.currentValue > d.sloThreshold * 2) severity = 'critical'
    }

    const direction = d.metric === 'integration_sla' ? 'below' : 'above'
    anomalies.push({
      metric: d.metric,
      scope: d.scope,
      currentValue: d.currentValue,
      threshold: d.sloThreshold,
      severity,
      description: `${d.scope}/${d.metric} is ${direction} SLO: ${d.currentValue} (threshold: ${d.sloThreshold})`,
    })
  }

  return anomalies
}

// ── Snapshot Assembly ──────────────────────────────────────────────────────

/**
 * Generate a complete health digest snapshot.
 */
export function generateDigestSnapshot(
  inputs: MetricInput[],
  policy: SloPolicy,
  coverageDate?: string,
): HealthDigestSnapshot {
  const deltas = computeDeltas(inputs, policy)
  const anomalies = detectAnomalies(deltas)

  const sloViolations = deltas.filter((d) => d.sloViolation).length
  const warnings = anomalies.filter((a) => a.severity === 'warning').length
  const criticals = anomalies.filter((a) => a.severity === 'critical').length

  return {
    generatedAt: new Date().toISOString(),
    coverageDate: coverageDate ?? new Date().toISOString().slice(0, 10),
    deltas,
    anomalies,
    summary: {
      totalMetrics: deltas.length,
      sloViolations,
      warnings,
      criticals,
    },
  }
}

/**
 * Build the audit event payload for a health digest.
 */
export function buildDigestAuditEvent(
  snapshot: HealthDigestSnapshot,
): HealthDigestAuditEvent {
  return {
    action: 'platform.ops.health_digest.generated',
    timestamp: snapshot.generatedAt,
    coverageDate: snapshot.coverageDate,
    summary: snapshot.summary,
    anomalyCount: snapshot.anomalies.length,
  }
}
