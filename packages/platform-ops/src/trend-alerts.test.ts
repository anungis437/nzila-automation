/**
 * Nzila OS — Trend Alerts: Unit Tests
 *
 * @module @nzila/platform-ops/trend-alerts
 */
import { describe, it, expect, vi } from 'vitest'
import {
  formatTrendWarningAlert,
  formatTrendWarningSummary,
  dispatchTrendAlerts,
  DEFAULT_TREND_ALERT_CONFIG,
  type TrendAlertConfig,
} from './trend-alerts'
import type { TrendResult, TrendWarningAuditEvent } from './trend-detection'
import type { AlertTarget, ChatOpsAdapter } from './health-alerts'

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeWarning(overrides?: Partial<TrendResult>): TrendResult {
  return {
    metric: 'p95_latency',
    scope: 'console',
    slopePerDay: 5.0,
    normalisedSlope: 0.04,
    rSquared: 0.85,
    direction: 'degrading',
    isDegrading: true,
    dataPointCount: 7,
    summary: 'console/p95_latency: 📈🔴 degrading · slope=5.0000/day · R²=0.850 · (7 points)',
    ...overrides,
  }
}

function makeEvent(count: number): TrendWarningAuditEvent {
  return {
    action: 'platform.ops.trend_warning',
    timestamp: '2026-03-03T00:00:00.000Z',
    trends: [],
    degradingCount: count,
  }
}

function makeMockAdapter(): ChatOpsAdapter {
  return {
    send: vi.fn().mockResolvedValue({ ok: true }),
  }
}

const TARGETS: AlertTarget[] = [
  { provider: 'slack', credentials: { webhookUrl: 'https://slack.test' } },
]

// ── Tests ──────────────────────────────────────────────────────────────────

describe('formatTrendWarningAlert', () => {
  it('formats a single trend warning alert', () => {
    const alert = formatTrendWarningAlert(makeWarning())

    expect(alert.subject).toContain('Trend Warning')
    expect(alert.subject).toContain('console/p95_latency')
    expect(alert.body).toContain('Trend Degradation Detected')
    expect(alert.body).toContain('p95_latency')
    expect(alert.body).toContain('before')
    expect(alert.consoleUrl).toContain('/trend-detection')
    expect(alert.severity).toBe('warning')
  })

  it('uses critical severity when configured', () => {
    const config: TrendAlertConfig = {
      ...DEFAULT_TREND_ALERT_CONFIG,
      severity: 'critical',
    }
    const alert = formatTrendWarningAlert(makeWarning(), config)

    expect(alert.subject).toContain('CRITICAL')
    expect(alert.severity).toBe('critical')
  })
})

describe('formatTrendWarningSummary', () => {
  it('formats summary for multiple warnings', () => {
    const warnings = [makeWarning(), makeWarning({ metric: 'error_rate', scope: 'web' })]
    const event = makeEvent(2)

    const alert = formatTrendWarningSummary(warnings, event)

    expect(alert.subject).toContain('2 Trend Warning')
    expect(alert.body).toContain('console/p95_latency')
    expect(alert.body).toContain('web/error_rate')
    expect(alert.consoleUrl).toContain('/ops')
  })

  it('escalates to critical when 3+ warnings', () => {
    const warnings = [
      makeWarning(),
      makeWarning({ metric: 'error_rate' }),
      makeWarning({ metric: 'integration_sla' }),
    ]
    const event = makeEvent(3)

    const alert = formatTrendWarningSummary(warnings, event)

    expect(alert.subject).toContain('CRITICAL')
    expect(alert.severity).toBe('critical')
  })
})

describe('dispatchTrendAlerts', () => {
  it('does not dispatch when below minimum threshold', async () => {
    const adapter = makeMockAdapter()
    const results = await dispatchTrendAlerts(
      [], // no warnings
      makeEvent(0),
      TARGETS,
      { slack: adapter },
    )

    expect(results).toHaveLength(0)
    expect(adapter.send).not.toHaveBeenCalled()
  })

  it('dispatches summary alert when threshold met', async () => {
    const adapter = makeMockAdapter()
    const warnings = [makeWarning()]

    const results = await dispatchTrendAlerts(
      warnings,
      makeEvent(1),
      TARGETS,
      { slack: adapter },
    )

    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(adapter.send).toHaveBeenCalled()
    const summaryResult = results.find((r) => r.target.includes('trend_summary'))
    expect(summaryResult).toBeDefined()
    expect(summaryResult!.sent).toBe(true)
  })

  it('dispatches individual alert for high-slope degradation', async () => {
    const adapter = makeMockAdapter()
    const warnings = [makeWarning({ normalisedSlope: 0.08 })] // > 0.05

    const results = await dispatchTrendAlerts(
      warnings,
      makeEvent(1),
      TARGETS,
      { slack: adapter },
    )

    const individualResult = results.find((r) => r.target.includes('trend:console'))
    expect(individualResult).toBeDefined()
    expect(individualResult!.sent).toBe(true)
  })

  it('handles adapter errors gracefully', async () => {
    const adapter: ChatOpsAdapter = {
      send: vi.fn().mockRejectedValue(new Error('network error')),
    }

    const results = await dispatchTrendAlerts(
      [makeWarning()],
      makeEvent(1),
      TARGETS,
      { slack: adapter },
    )

    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results[0].sent).toBe(false)
    expect(results[0].error).toBe('network error')
  })

  it('reports missing adapter', async () => {
    const results = await dispatchTrendAlerts(
      [makeWarning()],
      makeEvent(1),
      [{ provider: 'teams', credentials: {} }],
      {}, // no adapters
    )

    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results[0].sent).toBe(false)
    expect(results[0].error).toContain('No adapter')
  })
})
