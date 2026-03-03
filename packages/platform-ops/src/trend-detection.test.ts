/**
 * Nzila OS — Trend Detection Unit Tests
 *
 * Tests for slope computation, direction classification, and audit event building.
 * No DB dependency — pure logic tests.
 */
import { describe, it, expect } from 'vitest'
import {
  computeLinearRegression,
  analyseTrend,
  analyseTrends,
  buildTrendWarningEvent,
  DEFAULT_TREND_THRESHOLDS,
  type TrendInput,
} from '../src/trend-detection'

describe('computeLinearRegression', () => {
  it('returns zero slope for constant values', () => {
    const result = computeLinearRegression([10, 10, 10, 10])
    expect(result.slope).toBe(0)
    expect(result.rSquared).toBe(0)
  })

  it('returns positive slope for increasing values', () => {
    const result = computeLinearRegression([100, 200, 300, 400])
    expect(result.slope).toBe(100)
    expect(result.rSquared).toBeCloseTo(1.0, 3)
  })

  it('returns negative slope for decreasing values', () => {
    const result = computeLinearRegression([400, 300, 200, 100])
    expect(result.slope).toBe(-100)
    expect(result.rSquared).toBeCloseTo(1.0, 3)
  })

  it('handles single value gracefully', () => {
    const result = computeLinearRegression([42])
    expect(result.slope).toBe(0)
    expect(result.intercept).toBe(42)
  })

  it('handles empty array', () => {
    const result = computeLinearRegression([])
    expect(result.slope).toBe(0)
    expect(result.intercept).toBe(0)
  })

  it('computes correct R² for noisy data', () => {
    // Slight upward trend with noise
    const result = computeLinearRegression([100, 115, 105, 120, 130])
    expect(result.slope).toBeGreaterThan(0)
    expect(result.rSquared).toBeGreaterThan(0.5)
    expect(result.rSquared).toBeLessThanOrEqual(1.0)
  })
})

describe('analyseTrend', () => {
  it('detects degrading p95_latency (increasing)', () => {
    const input: TrendInput = {
      metric: 'p95_latency',
      scope: 'web',
      dataPoints: [
        { date: '2026-02-25', value: 200 },
        { date: '2026-02-26', value: 250 },
        { date: '2026-02-27', value: 310 },
        { date: '2026-02-28', value: 380 },
        { date: '2026-03-01', value: 460 },
      ],
    }
    const result = analyseTrend(input)
    expect(result.direction).toBe('degrading')
    expect(result.isDegrading).toBe(true)
    expect(result.slopePerDay).toBeGreaterThan(0)
  })

  it('detects stable metric with flat values', () => {
    const input: TrendInput = {
      metric: 'p95_latency',
      scope: 'web',
      dataPoints: [
        { date: '2026-02-25', value: 200 },
        { date: '2026-02-26', value: 202 },
        { date: '2026-02-27', value: 199 },
        { date: '2026-02-28', value: 201 },
        { date: '2026-03-01', value: 200 },
      ],
    }
    const result = analyseTrend(input)
    expect(result.direction).toBe('stable')
    expect(result.isDegrading).toBe(false)
  })

  it('detects degrading integration_sla (decreasing)', () => {
    const input: TrendInput = {
      metric: 'integration_sla',
      scope: 'stripe',
      dataPoints: [
        { date: '2026-02-25', value: 99.8 },
        { date: '2026-02-26', value: 97.0 },
        { date: '2026-02-27', value: 94.0 },
        { date: '2026-02-28', value: 91.0 },
        { date: '2026-03-01', value: 88.0 },
      ],
    }
    const result = analyseTrend(input)
    expect(result.direction).toBe('degrading')
    expect(result.isDegrading).toBe(true)
    // integration_sla slope is negative but that means degrading
    expect(result.slopePerDay).toBeLessThan(0)
  })

  it('detects improving error_rate (decreasing)', () => {
    const input: TrendInput = {
      metric: 'error_rate',
      scope: 'abr',
      dataPoints: [
        { date: '2026-02-25', value: 5.0 },
        { date: '2026-02-26', value: 4.0 },
        { date: '2026-02-27', value: 3.0 },
        { date: '2026-02-28', value: 2.0 },
        { date: '2026-03-01', value: 1.0 },
      ],
    }
    const result = analyseTrend(input)
    expect(result.direction).toBe('improving')
    expect(result.isDegrading).toBe(false)
  })

  it('marks as stable when insufficient data points', () => {
    const input: TrendInput = {
      metric: 'p95_latency',
      scope: 'web',
      dataPoints: [
        { date: '2026-02-28', value: 200 },
        { date: '2026-03-01', value: 600 },
      ],
    }
    const result = analyseTrend(input, { ...DEFAULT_TREND_THRESHOLDS, minDataPoints: 3 })
    expect(result.direction).toBe('stable')
    expect(result.isDegrading).toBe(false)
  })

  it('marks as stable when R² is too low', () => {
    const input: TrendInput = {
      metric: 'p95_latency',
      scope: 'web',
      dataPoints: [
        { date: '2026-02-25', value: 100 },
        { date: '2026-02-26', value: 500 },
        { date: '2026-02-27', value: 50 },
        { date: '2026-02-28', value: 400 },
        { date: '2026-03-01', value: 150 },
      ],
    }
    const result = analyseTrend(input, { ...DEFAULT_TREND_THRESHOLDS, minRSquared: 0.9 })
    expect(result.direction).toBe('stable')
  })

  it('includes summary string', () => {
    const input: TrendInput = {
      metric: 'error_rate',
      scope: 'web',
      dataPoints: [
        { date: '2026-02-25', value: 1.0 },
        { date: '2026-02-26', value: 2.0 },
        { date: '2026-02-27', value: 3.0 },
      ],
    }
    const result = analyseTrend(input)
    expect(result.summary).toContain('web/error_rate')
    expect(result.dataPointCount).toBe(3)
  })
})

describe('analyseTrends', () => {
  it('analyses multiple inputs at once', () => {
    const inputs: TrendInput[] = [
      {
        metric: 'p95_latency',
        scope: 'web',
        dataPoints: [
          { date: '2026-02-25', value: 200 },
          { date: '2026-02-26', value: 250 },
          { date: '2026-02-27', value: 300 },
        ],
      },
      {
        metric: 'error_rate',
        scope: 'web',
        dataPoints: [
          { date: '2026-02-25', value: 1.0 },
          { date: '2026-02-26', value: 1.0 },
          { date: '2026-02-27', value: 1.0 },
        ],
      },
    ]
    const results = analyseTrends(inputs)
    expect(results).toHaveLength(2)
  })
})

describe('buildTrendWarningEvent', () => {
  it('produces audit event with degrading trends only', () => {
    const inputs: TrendInput[] = [
      {
        metric: 'p95_latency',
        scope: 'web',
        dataPoints: [
          { date: '2026-02-25', value: 200 },
          { date: '2026-02-26', value: 300 },
          { date: '2026-02-27', value: 400 },
          { date: '2026-02-28', value: 500 },
        ],
      },
      {
        metric: 'error_rate',
        scope: 'web',
        dataPoints: [
          { date: '2026-02-25', value: 1.0 },
          { date: '2026-02-26', value: 1.0 },
          { date: '2026-02-27', value: 1.0 },
          { date: '2026-02-28', value: 1.0 },
        ],
      },
    ]
    const results = analyseTrends(inputs)
    const event = buildTrendWarningEvent(results)

    expect(event.action).toBe('platform.ops.trend_warning')
    expect(event.degradingCount).toBeGreaterThanOrEqual(1)
    expect(event.trends.every((t) => t.direction === 'degrading')).toBe(true)
  })

  it('returns zero degrading count when all stable', () => {
    const inputs: TrendInput[] = [
      {
        metric: 'p95_latency',
        scope: 'web',
        dataPoints: [
          { date: '2026-02-25', value: 200 },
          { date: '2026-02-26', value: 200 },
          { date: '2026-02-27', value: 200 },
        ],
      },
    ]
    const results = analyseTrends(inputs)
    const event = buildTrendWarningEvent(results)
    expect(event.degradingCount).toBe(0)
    expect(event.trends).toHaveLength(0)
  })
})
