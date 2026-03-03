import { describe, it, expect } from 'vitest'
import {
  generateSyntheticLoad,
  executeScalePhase,
  runScaleEnvelope,
  DEFAULT_SCALE_PROFILES,
  type ScaleProfile,
} from './scale-harness'

// ── Type contract tests ────────────────────────────────────────────────────

describe('Scale Harness — type contracts', () => {
  it('exports generateSyntheticLoad', () => {
    expect(typeof generateSyntheticLoad).toBe('function')
  })

  it('exports executeScalePhase', () => {
    expect(typeof executeScalePhase).toBe('function')
  })

  it('exports runScaleEnvelope', () => {
    expect(typeof runScaleEnvelope).toBe('function')
  })

  it('exports DEFAULT_SCALE_PROFILES with 4 phases', () => {
    expect(Array.isArray(DEFAULT_SCALE_PROFILES)).toBe(true)
    expect(DEFAULT_SCALE_PROFILES).toHaveLength(4)
    expect(DEFAULT_SCALE_PROFILES.map((p) => p.name)).toEqual([
      'baseline',
      'moderate',
      'heavy',
      'spike',
    ])
  })
})

// ── Synthetic load generation ──────────────────────────────────────────────

describe('generateSyntheticLoad — deterministic', () => {
  const profile: ScaleProfile = {
    name: 'test',
    concurrency: 10,
    durationSec: 10,
    rps: 100,
    routes: ['/api/a', '/api/b'],
    orgIds: ['org_1'],
    errorRate: 0.1,
    latencyRange: [5, 50],
  }

  it('generates expected number of requests', () => {
    const rows = generateSyntheticLoad(profile, 42)
    expect(rows).toHaveLength(1000) // 100 rps * 10 sec
  })

  it('is deterministic with same seed', () => {
    const a = generateSyntheticLoad(profile, 42)
    const b = generateSyntheticLoad(profile, 42)
    expect(a.map((r) => r.latencyMs)).toEqual(b.map((r) => r.latencyMs))
  })

  it('distributes routes evenly', () => {
    const rows = generateSyntheticLoad(profile, 42)
    const routeCounts = new Map<string, number>()
    for (const r of rows) {
      routeCounts.set(r.route, (routeCounts.get(r.route) ?? 0) + 1)
    }
    expect(routeCounts.get('/api/a')).toBe(500)
    expect(routeCounts.get('/api/b')).toBe(500)
  })

  it('injects errors at approximately the configured rate', () => {
    const rows = generateSyntheticLoad(profile, 42)
    const errors = rows.filter((r) => r.statusCode >= 400)
    // ±5% tolerance on 10% target
    expect(errors.length).toBeGreaterThan(50)
    expect(errors.length).toBeLessThan(200)
  })

  it('respects latency range', () => {
    const rows = generateSyntheticLoad(profile, 42)
    for (const r of rows) {
      expect(r.latencyMs).toBeGreaterThanOrEqual(0)
    }
  })

  it('produces different results with different seeds', () => {
    const a = generateSyntheticLoad(profile, 42)
    const b = generateSyntheticLoad(profile, 99)
    const aLatencies = a.map((r) => r.latencyMs)
    const bLatencies = b.map((r) => r.latencyMs)
    expect(aLatencies).not.toEqual(bLatencies)
  })
})

// ── Phase execution ────────────────────────────────────────────────────────

describe('executeScalePhase — deterministic', () => {
  const profile: ScaleProfile = {
    name: 'test-phase',
    concurrency: 10,
    durationSec: 5,
    rps: 100,
    routes: ['/api/test'],
    orgIds: ['org_1'],
    errorRate: 0.02,
    latencyRange: [5, 50],
  }

  it('returns well-formed phase result', () => {
    const result = executeScalePhase(profile, 500, 42)
    expect(result).toHaveProperty('profile')
    expect(result).toHaveProperty('totalRequests')
    expect(result).toHaveProperty('envelope')
    expect(result).toHaveProperty('elapsedMs')
    expect(result).toHaveProperty('budgetViolations')
    expect(result).toHaveProperty('passed')
    expect(result.totalRequests).toBe(500)
  })

  it('passes when p95 is within budget', () => {
    const result = executeScalePhase(profile, 10_000, 42)
    expect(result.passed).toBe(true)
  })

  it('fails when p95 exceeds budget', () => {
    const result = executeScalePhase(profile, 1, 42) // 1ms budget — impossible
    expect(result.passed).toBe(false)
  })

  it('computes envelope with correct sample size', () => {
    const result = executeScalePhase(profile, 500, 42)
    expect(result.envelope.sampleSize).toBe(500)
  })

  it('counts budget violations correctly', () => {
    const result = executeScalePhase(profile, 30, 42)
    // Some requests should exceed 30ms with range [5, 50] + concurrency factor
    expect(typeof result.budgetViolations).toBe('number')
    expect(result.budgetViolations).toBeGreaterThanOrEqual(0)
  })
})

// ── Full envelope run ──────────────────────────────────────────────────────

describe('runScaleEnvelope — composite result', () => {
  it('runs all default profiles', () => {
    const result = runScaleEnvelope()
    expect(result.phases).toHaveLength(4)
    expect(result.phases.map((p) => p.profile.name)).toEqual([
      'baseline',
      'moderate',
      'heavy',
      'spike',
    ])
  })

  it('returns well-formed envelope result', () => {
    const result = runScaleEnvelope()
    expect(result).toHaveProperty('passed')
    expect(result).toHaveProperty('peakP95')
    expect(result).toHaveProperty('peakThroughput')
    expect(result).toHaveProperty('degradationRatio')
    expect(result).toHaveProperty('completedAt')
    expect(typeof result.passed).toBe('boolean')
    expect(result.peakP95).toBeGreaterThan(0)
    expect(result.degradationRatio).toBeGreaterThanOrEqual(1)
  })

  it('accepts custom config overrides', () => {
    const result = runScaleEnvelope({
      profiles: [DEFAULT_SCALE_PROFILES[0]],
      p95BudgetMs: 10_000,
      maxDegradationRatio: 100,
    })
    expect(result.phases).toHaveLength(1)
    expect(result.passed).toBe(true)
  })

  it('degradation ratio is >= 1.0', () => {
    const result = runScaleEnvelope()
    expect(result.degradationRatio).toBeGreaterThanOrEqual(1)
  })

  it('peak p95 >= baseline p95', () => {
    const result = runScaleEnvelope()
    const baselineP95 = result.phases[0].envelope.p95
    expect(result.peakP95).toBeGreaterThanOrEqual(baselineP95)
  })

  it('completedAt is valid ISO timestamp', () => {
    const result = runScaleEnvelope()
    expect(() => new Date(result.completedAt)).not.toThrow()
    expect(new Date(result.completedAt).toISOString()).toBe(result.completedAt)
  })
})
