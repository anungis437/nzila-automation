/**
 * Nzila OS — Health Alerts Unit Tests
 *
 * Tests for alert formatting and dispatch logic.
 * Uses mock adapters — no real Slack/Teams calls.
 */
import { describe, it, expect, vi } from 'vitest'
import {
  formatAnomalyAlert,
  formatDigestSummary,
  dispatchAlerts,
  type ChatOpsAdapter,
} from '../src/health-alerts'
import type { Anomaly, HealthDigestSnapshot } from '../src/health-digest'

const mockAnomaly: Anomaly = {
  metric: 'p95_latency',
  scope: 'web',
  currentValue: 800,
  threshold: 500,
  severity: 'critical',
  description: 'web/p95_latency is above SLO: 800 (threshold: 500)',
}

const mockSnapshot: HealthDigestSnapshot = {
  generatedAt: '2026-03-03T08:00:00.000Z',
  coverageDate: '2026-03-03',
  deltas: [],
  anomalies: [mockAnomaly],
  summary: {
    totalMetrics: 5,
    sloViolations: 1,
    warnings: 0,
    criticals: 1,
  },
}

describe('formatAnomalyAlert', () => {
  it('formats a critical anomaly alert', () => {
    const alert = formatAnomalyAlert(mockAnomaly)
    expect(alert.subject).toContain('CRITICAL')
    expect(alert.subject).toContain('web/p95_latency')
    expect(alert.body).toContain('800')
    expect(alert.body).toContain('500')
    expect(alert.severity).toBe('critical')
    expect(alert.consoleUrl).toContain('/performance/regressions')
  })

  it('formats a warning anomaly alert', () => {
    const warning: Anomaly = { ...mockAnomaly, severity: 'warning' }
    const alert = formatAnomalyAlert(warning)
    expect(alert.subject).toContain('WARNING')
  })
})

describe('formatDigestSummary', () => {
  it('formats digest with anomalies', () => {
    const alert = formatDigestSummary(mockSnapshot)
    expect(alert.subject).toContain('Daily Health Digest')
    expect(alert.subject).toContain('CRITICAL')
    expect(alert.body).toContain('SLO Violations')
    expect(alert.body).toContain('web/p95_latency')
    expect(alert.consoleUrl).toContain('/system-health')
  })

  it('formats healthy digest without anomalies', () => {
    const healthy: HealthDigestSnapshot = {
      ...mockSnapshot,
      anomalies: [],
      summary: { totalMetrics: 5, sloViolations: 0, warnings: 0, criticals: 0 },
    }
    const alert = formatDigestSummary(healthy)
    expect(alert.subject).toContain('HEALTHY')
  })
})

describe('dispatchAlerts', () => {
  it('sends digest to all targets', async () => {
    const sendFn = vi.fn().mockResolvedValue({ ok: true })
    const mockAdapter: ChatOpsAdapter = { send: sendFn }

    const results = await dispatchAlerts(
      { ...mockSnapshot, anomalies: [] },
      [{ provider: 'slack', credentials: { webhookUrl: 'https://test' } }],
      { slack: mockAdapter },
    )

    expect(results).toHaveLength(1) // digest summary only
    expect(results[0].sent).toBe(true)
    expect(sendFn).toHaveBeenCalledTimes(1)
  })

  it('sends immediate alert for critical anomalies', async () => {
    const sendFn = vi.fn().mockResolvedValue({ ok: true })
    const mockAdapter: ChatOpsAdapter = { send: sendFn }

    const results = await dispatchAlerts(
      mockSnapshot,
      [{ provider: 'slack', credentials: { webhookUrl: 'https://test' } }],
      { slack: mockAdapter },
    )

    // 1 digest + 1 critical anomaly alert
    expect(results).toHaveLength(2)
    expect(results.every((r) => r.sent)).toBe(true)
  })

  it('handles adapter errors gracefully', async () => {
    const sendFn = vi.fn().mockRejectedValue(new Error('Network error'))
    const mockAdapter: ChatOpsAdapter = { send: sendFn }

    const results = await dispatchAlerts(
      mockSnapshot,
      [{ provider: 'slack', credentials: { webhookUrl: 'https://test' } }],
      { slack: mockAdapter },
    )

    expect(results).toHaveLength(2)
    expect(results.every((r) => !r.sent)).toBe(true)
    expect(results[0].error).toBe('Network error')
  })

  it('handles missing adapter gracefully', async () => {
    const results = await dispatchAlerts(
      mockSnapshot,
      [{ provider: 'slack', credentials: { webhookUrl: 'https://test' } }],
      {}, // no adapters
    )

    expect(results[0].sent).toBe(false)
    expect(results[0].error).toBe('No adapter available')
  })
})
