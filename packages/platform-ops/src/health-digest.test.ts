/**
 * Nzila OS — Health Digest Unit Tests
 *
 * Tests for delta computation, anomaly detection, and snapshot generation.
 * No DB dependency — pure logic tests.
 */
import { describe, it, expect } from 'vitest'
import {
  computeDeltas,
  detectAnomalies,
  generateDigestSnapshot,
  buildDigestAuditEvent,
  type MetricInput,
} from '../src/health-digest'

const testPolicy = {
  defaults: {
    performance: { p95_latency_ms: 500, p99_latency_ms: 2000, error_rate_max_pct: 2.0 },
    integrations: { success_rate_min_pct: 99.0, p95_delivery_latency_ms: 5000 },
    dlq: { backlog_max: 100 },
  },
  apps: {
    abr: {
      performance: { p95_latency_ms: 400, p99_latency_ms: 1500, error_rate_max_pct: 1.5 },
    },
  },
}

describe('computeDeltas', () => {
  it('computes basic delta and percentage', () => {
    const inputs: MetricInput[] = [
      { metric: 'p95_latency', scope: 'web', currentValue: 450, previousValue: 400 },
    ]
    const deltas = computeDeltas(inputs, testPolicy)
    expect(deltas).toHaveLength(1)
    expect(deltas[0].delta).toBe(50)
    expect(deltas[0].deltaPct).toBe(12.5)
    expect(deltas[0].sloViolation).toBe(false) // 450 < 500
  })

  it('flags SLO violation when above threshold', () => {
    const inputs: MetricInput[] = [
      { metric: 'p95_latency', scope: 'web', currentValue: 600, previousValue: 400 },
    ]
    const deltas = computeDeltas(inputs, testPolicy)
    expect(deltas[0].sloViolation).toBe(true) // 600 > 500
    expect(deltas[0].sloThreshold).toBe(500)
  })

  it('uses app-specific thresholds when available', () => {
    const inputs: MetricInput[] = [
      { metric: 'p95_latency', scope: 'abr', currentValue: 450, previousValue: 300 },
    ]
    const deltas = computeDeltas(inputs, testPolicy)
    expect(deltas[0].sloThreshold).toBe(400) // abr override
    expect(deltas[0].sloViolation).toBe(true) // 450 > 400
  })

  it('handles integration SLA (below minimum = violation)', () => {
    const inputs: MetricInput[] = [
      { metric: 'integration_sla', scope: 'web', currentValue: 98.5, previousValue: 99.5 },
    ]
    const deltas = computeDeltas(inputs, testPolicy)
    expect(deltas[0].sloViolation).toBe(true) // 98.5 < 99.0
  })

  it('handles DLQ backlog', () => {
    const inputs: MetricInput[] = [
      { metric: 'dlq_backlog', scope: 'web', currentValue: 150, previousValue: 50 },
    ]
    const deltas = computeDeltas(inputs, testPolicy)
    expect(deltas[0].sloViolation).toBe(true) // 150 > 100
  })

  it('handles zero previous value without NaN', () => {
    const inputs: MetricInput[] = [
      { metric: 'error_rate', scope: 'web', currentValue: 3, previousValue: 0 },
    ]
    const deltas = computeDeltas(inputs, testPolicy)
    expect(deltas[0].deltaPct).toBe(0) // no division by zero
    expect(deltas[0].sloViolation).toBe(true) // 3 > 2.0
  })
})

describe('detectAnomalies', () => {
  it('returns empty for no violations', () => {
    const inputs: MetricInput[] = [
      { metric: 'p95_latency', scope: 'web', currentValue: 200, previousValue: 180 },
    ]
    const deltas = computeDeltas(inputs, testPolicy)
    const anomalies = detectAnomalies(deltas)
    expect(anomalies).toHaveLength(0)
  })

  it('detects warning anomaly', () => {
    const inputs: MetricInput[] = [
      { metric: 'p95_latency', scope: 'web', currentValue: 600, previousValue: 400 },
    ]
    const deltas = computeDeltas(inputs, testPolicy)
    const anomalies = detectAnomalies(deltas)
    expect(anomalies).toHaveLength(1)
    expect(anomalies[0].severity).toBe('warning')
  })

  it('detects critical anomaly when far above threshold', () => {
    const inputs: MetricInput[] = [
      { metric: 'p95_latency', scope: 'web', currentValue: 800, previousValue: 400 },
    ]
    const deltas = computeDeltas(inputs, testPolicy)
    const anomalies = detectAnomalies(deltas)
    expect(anomalies).toHaveLength(1)
    expect(anomalies[0].severity).toBe('critical') // 800 > 500 × 1.5 = 750
  })

  it('detects critical error rate spike', () => {
    const inputs: MetricInput[] = [
      { metric: 'error_rate', scope: 'web', currentValue: 5.0, previousValue: 1.0 },
    ]
    const deltas = computeDeltas(inputs, testPolicy)
    const anomalies = detectAnomalies(deltas)
    expect(anomalies).toHaveLength(1)
    expect(anomalies[0].severity).toBe('critical') // 5.0 > 2.0 × 2 = 4.0
  })
})

describe('generateDigestSnapshot', () => {
  it('generates complete snapshot with summary', () => {
    const inputs: MetricInput[] = [
      { metric: 'p95_latency', scope: 'web', currentValue: 200, previousValue: 180 },
      { metric: 'error_rate', scope: 'web', currentValue: 5.0, previousValue: 1.0 },
      { metric: 'dlq_backlog', scope: 'global', currentValue: 50, previousValue: 30 },
    ]
    const snapshot = generateDigestSnapshot(inputs, testPolicy, '2026-03-03')
    expect(snapshot.coverageDate).toBe('2026-03-03')
    expect(snapshot.deltas).toHaveLength(3)
    expect(snapshot.summary.totalMetrics).toBe(3)
    expect(snapshot.summary.sloViolations).toBe(1) // error_rate
    expect(snapshot.summary.criticals).toBe(1) // error_rate > 4.0
  })
})

describe('buildDigestAuditEvent', () => {
  it('produces correct audit event shape', () => {
    const inputs: MetricInput[] = [
      { metric: 'p95_latency', scope: 'web', currentValue: 200, previousValue: 180 },
    ]
    const snapshot = generateDigestSnapshot(inputs, testPolicy, '2026-03-03')
    const event = buildDigestAuditEvent(snapshot)
    expect(event.action).toBe('platform.ops.health_digest.generated')
    expect(event.coverageDate).toBe('2026-03-03')
    expect(event.summary.totalMetrics).toBe(1)
  })
})
