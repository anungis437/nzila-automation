/**
 * Nzila OS — Digest Trends: Unit Tests
 *
 * @module @nzila/platform-ops/digest-trends
 */
import { describe, it, expect } from 'vitest'
import {
  fetchAndAnalyseTrends,
  generateTrendEnrichedDigest,
  createStubTrendSeriesPort,
  DEFAULT_DIGEST_TRENDS_CONFIG,
  type _TrendSeriesPort,
  type TrendSeriesDataPoint,
  type DigestTrendsConfig,
} from './digest-trends'
import type { HealthDigestSnapshot } from './health-digest'

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeDigest(overrides?: Partial<HealthDigestSnapshot>): HealthDigestSnapshot {
  return {
    generatedAt: '2026-03-03T00:00:00.000Z',
    coverageDate: '2026-03-02',
    deltas: [],
    anomalies: [],
    summary: { totalMetrics: 0, sloViolations: 0, warnings: 0, criticals: 0 },
    ...overrides,
  }
}

function makeDegradingSeries(days: number): TrendSeriesDataPoint[] {
  const points: TrendSeriesDataPoint[] = []
  const base = new Date('2026-02-24')
  for (let i = 0; i < days; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    // Steep upward slope: 100 → 200+
    points.push({ date: d.toISOString().slice(0, 10), value: 100 + i * 20 })
  }
  return points
}

function _makeImprovingSeries(days: number): TrendSeriesDataPoint[] {
  const points: TrendSeriesDataPoint[] = []
  const base = new Date('2026-02-24')
  for (let i = 0; i < days; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    // Downward slope: 200 → 100
    points.push({ date: d.toISOString().slice(0, 10), value: 200 - i * 15 })
  }
  return points
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('fetchAndAnalyseTrends', () => {
  it('returns stable results for flat series', async () => {
    const port = createStubTrendSeriesPort()
    const { results, warnings } = await fetchAndAnalyseTrends(port)

    expect(results.length).toBe(DEFAULT_DIGEST_TRENDS_CONFIG.trackedMetrics.length)
    expect(warnings).toHaveLength(0)
    for (const r of results) {
      expect(r.direction).toBe('stable')
      expect(r.isDegrading).toBe(false)
    }
  })

  it('detects degradation when slope exceeds threshold', async () => {
    const port = createStubTrendSeriesPort({
      'p95_latency::console': makeDegradingSeries(7),
    })
    const { results, warnings } = await fetchAndAnalyseTrends(port)

    expect(warnings.length).toBeGreaterThanOrEqual(1)
    const degrading = results.find(
      (r) => r.metric === 'p95_latency' && r.scope === 'console',
    )
    expect(degrading).toBeDefined()
    expect(degrading!.isDegrading).toBe(true)
    expect(degrading!.direction).toBe('degrading')
  })

  it('respects custom config metrics', async () => {
    const port = createStubTrendSeriesPort()
    const config: DigestTrendsConfig = {
      lookbackDays: 5,
      trackedMetrics: [{ metric: 'error_rate', scope: 'api' }],
      thresholds: DEFAULT_DIGEST_TRENDS_CONFIG.thresholds,
    }
    const { results } = await fetchAndAnalyseTrends(port, config)
    expect(results).toHaveLength(1)
    expect(results[0].metric).toBe('error_rate')
    expect(results[0].scope).toBe('api')
  })
})

describe('generateTrendEnrichedDigest', () => {
  it('returns enriched digest with no degradation for flat series', async () => {
    const digest = makeDigest()
    const port = createStubTrendSeriesPort()
    const enriched = await generateTrendEnrichedDigest(digest, port)

    expect(enriched.digest).toBe(digest)
    expect(enriched.trendResults.length).toBeGreaterThan(0)
    expect(enriched.trendWarnings).toHaveLength(0)
    expect(enriched.trendWarningEvent).toBeNull()
    expect(enriched.hasDegradation).toBe(false)
  })

  it('emits trendWarningEvent when degradation found', async () => {
    const digest = makeDigest()
    const port = createStubTrendSeriesPort({
      'error_rate::console': makeDegradingSeries(7),
    })
    const enriched = await generateTrendEnrichedDigest(digest, port)

    expect(enriched.hasDegradation).toBe(true)
    expect(enriched.trendWarnings.length).toBeGreaterThanOrEqual(1)
    expect(enriched.trendWarningEvent).not.toBeNull()
    expect(enriched.trendWarningEvent!.action).toBe('platform.ops.trend_warning')
    expect(enriched.trendWarningEvent!.degradingCount).toBeGreaterThanOrEqual(1)
  })

  it('preserves original digest in output', async () => {
    const digest = makeDigest({
      summary: { totalMetrics: 5, sloViolations: 1, warnings: 1, criticals: 0 },
    })
    const port = createStubTrendSeriesPort()
    const enriched = await generateTrendEnrichedDigest(digest, port)

    expect(enriched.digest.summary.sloViolations).toBe(1)
    expect(enriched.digest.summary.totalMetrics).toBe(5)
  })

  it('detects trend warning without SLO breach', async () => {
    // Digest has zero anomalies, but trends show degradation
    const digest = makeDigest({
      anomalies: [],
      summary: { totalMetrics: 3, sloViolations: 0, warnings: 0, criticals: 0 },
    })
    const port = createStubTrendSeriesPort({
      'p95_latency::web': makeDegradingSeries(7),
    })
    const enriched = await generateTrendEnrichedDigest(digest, port)

    // No SLO breach in digest...
    expect(enriched.digest.summary.sloViolations).toBe(0)
    // ...but trend degradation detected
    expect(enriched.hasDegradation).toBe(true)
    expect(enriched.trendWarnings.length).toBeGreaterThanOrEqual(1)
  })
})

describe('createStubTrendSeriesPort', () => {
  it('returns flat series by default', async () => {
    const port = createStubTrendSeriesPort()
    const series = await port.fetchSeries('p95_latency', 'test', 5)
    expect(series).toHaveLength(5)
    expect(series.every((p) => p.value === 50)).toBe(true)
  })

  it('uses overrides when provided', async () => {
    const custom: TrendSeriesDataPoint[] = [
      { date: '2026-03-01', value: 10 },
      { date: '2026-03-02', value: 20 },
    ]
    const port = createStubTrendSeriesPort({ 'error_rate::api': custom })
    const series = await port.fetchSeries('error_rate', 'api', 7)
    expect(series).toEqual(custom)
  })
})
