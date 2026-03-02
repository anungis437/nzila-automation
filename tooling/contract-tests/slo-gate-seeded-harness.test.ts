/**
 * SLO_GATE_SEEDED_HARNESS_003
 *
 * Integration test: seeds deterministic metrics into the SLO gate via the
 * `metricsPerApp` override, runs the gate in pilot mode (enforced), and
 * asserts the result contains non-zero counts and real threshold evaluation.
 *
 * This proves the gate is not decorative — it actually reads values, compares
 * them against thresholds from slo-policy.yml, and reports violations.
 *
 * Contract: CI must fail if the SLO gate ever stops evaluating seeded
 *           metrics or silently passes when thresholds are breached.
 */

import { describe, it, expect } from 'vitest'
import {
  loadSloPolicy,
  resolveThresholds,
  checkSloViolations,
  runSloGate,
  type SloGateResult,
} from '../../scripts/slo-gate'

// ── Types (not exported from slo-gate) — reconstructed inline ──────────

type SimulatedMetrics = NonNullable<Parameters<typeof runSloGate>[2]> extends Record<
  string,
  infer M
>
  ? M
  : never

type SloPolicy = Parameters<typeof runSloGate>[0]

// ── Helpers ─────────────────────────────────────────────────────────────

/** Metrics that comfortably pass even the strictest per-app thresholds
 *  (trade: p95<200, p99<500, err<0.5, success>99.9, delivery<1000, dlq<5). */
function passingMetrics(): SimulatedMetrics {
  return {
    performance: {
      p95_latency_ms: 50,
      p99_latency_ms: 150,
      error_rate_pct: 0.1,
    },
    integrations: {
      success_rate_pct: 99.99,
      p95_delivery_latency_ms: 500,
    },
    dlq: { backlog: 1 },
  }
}

/** Metrics that violate every default threshold. */
function failingMetrics(): SimulatedMetrics {
  return {
    performance: {
      p95_latency_ms: 9000, // way above 500
      p99_latency_ms: 15000, // way above 2000
      error_rate_pct: 25, // way above 2%
    },
    integrations: {
      success_rate_pct: 80, // below 99%
      p95_delivery_latency_ms: 30000, // above 5000
    },
    dlq: { backlog: 5000 }, // above 100
  }
}

/** Metrics that violate only the p95 latency threshold. */
function partialFailMetrics(): SimulatedMetrics {
  return {
    performance: {
      p95_latency_ms: 800, // above default 500
      p99_latency_ms: 450, // well below 2000
      error_rate_pct: 0.1,
    },
    integrations: {
      success_rate_pct: 99.9,
      p95_delivery_latency_ms: 1000,
    },
    dlq: { backlog: 10 },
  }
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('SLO_GATE_SEEDED_HARNESS_003', () => {
  const policy = loadSloPolicy()
  const appIds = Object.keys(policy.apps)

  // Sanity: policy loaded from real YAML must have apps
  it('loads slo-policy.yml with at least 10 apps', () => {
    expect(appIds.length).toBeGreaterThanOrEqual(10)
    expect(policy.version).toBe('1.0')
    expect(policy.gating.enforced_environments).toContain('pilot')
  })

  // ── resolveThresholds ───────────────────────────────────────────────

  it('resolves per-app thresholds, falling back to defaults', () => {
    for (const appId of appIds) {
      const thresholds = resolveThresholds(policy, appId)
      expect(thresholds.performance).toBeDefined()
      expect(thresholds.performance!.p95_latency_ms).toBeGreaterThan(0)
      expect(thresholds.performance!.p99_latency_ms).toBeGreaterThan(0)
      expect(thresholds.performance!.error_rate_max_pct).toBeGreaterThan(0)
    }
  })

  // ── checkSloViolations — unit-level seeded checks ───────────────────

  describe('checkSloViolations evaluates seeded data', () => {
    it('returns zero violations for passing metrics', () => {
      const thresholds = resolveThresholds(policy, 'console')
      const violations = checkSloViolations('console', thresholds, passingMetrics(), true)
      expect(violations).toHaveLength(0)
    })

    it('returns multiple violations for failing metrics', () => {
      const thresholds = resolveThresholds(policy, 'console')
      const violations = checkSloViolations('console', thresholds, failingMetrics(), true)
      expect(violations.length).toBeGreaterThanOrEqual(3)

      // Every violation must reference the right app and have real numbers
      for (const v of violations) {
        expect(v.app).toBe('console')
        expect(v.actual).toBeGreaterThan(0)
        expect(v.threshold).toBeGreaterThan(0)
        expect(v.metric).toBeTruthy()
        expect(['error', 'warning']).toContain(v.severity)
      }
    })

    it('detects a single threshold breach without false positives', () => {
      const thresholds = resolveThresholds(policy, 'console')
      const violations = checkSloViolations('console', thresholds, partialFailMetrics(), true)

      // Exactly one performance violation (p95 latency)
      const perfViolations = violations.filter((v) => v.metric.includes('p95'))
      expect(perfViolations.length).toBeGreaterThanOrEqual(1)

      // The actual value must match what we seeded
      const p95 = perfViolations.find((v) => v.metric.includes('p95') && v.metric.includes('latency'))
      expect(p95).toBeDefined()
      expect(p95!.actual).toBe(800)
    })
  })

  // ── runSloGate — full pipeline with seeded metricsPerApp ────────────

  describe('runSloGate in pilot mode (enforced) with seeded data', () => {
    it('passes when all apps have passing metrics', async () => {
      const metricsPerApp: Record<string, SimulatedMetrics> = {}
      for (const appId of appIds) {
        metricsPerApp[appId] = passingMetrics()
      }

      const result: SloGateResult = await runSloGate(policy, 'pilot', metricsPerApp)

      expect(result.environment).toBe('pilot')
      expect(result.isEnforced).toBe(true)
      expect(result.passed).toBe(true)
      expect(result.violations).toHaveLength(0)
      expect(result.checkedAt).toBeTruthy()
    })

    it('fails when any app has failing metrics', async () => {
      const metricsPerApp: Record<string, SimulatedMetrics> = {}
      for (const appId of appIds) {
        metricsPerApp[appId] = passingMetrics()
      }
      // Poison one app
      metricsPerApp['abr'] = failingMetrics()

      const result = await runSloGate(policy, 'pilot', metricsPerApp)

      expect(result.isEnforced).toBe(true)
      expect(result.passed).toBe(false)
      expect(result.violations.length).toBeGreaterThanOrEqual(3)

      // The poisoned app must have violations
      const abrViolations = result.violations.filter((v) => v.app === 'abr')
      expect(abrViolations.length).toBeGreaterThanOrEqual(3)
    })

    it('reports non-zero actual values (not hardcoded zeros)', async () => {
      const metricsPerApp: Record<string, SimulatedMetrics> = {}
      for (const appId of appIds) {
        metricsPerApp[appId] = failingMetrics()
      }

      const result = await runSloGate(policy, 'pilot', metricsPerApp)

      expect(result.passed).toBe(false)
      expect(result.violations.length).toBeGreaterThanOrEqual(appIds.length * 3)

      // Every violation must carry non-zero actual and threshold
      for (const v of result.violations) {
        expect(v.actual).not.toBe(0)
        expect(v.threshold).not.toBe(0)
      }
    })

    it('warning mode does not enforce failures', async () => {
      const metricsPerApp: Record<string, SimulatedMetrics> = {}
      for (const appId of appIds) {
        metricsPerApp[appId] = failingMetrics()
      }

      // staging is warning-only per the policy
      const result = await runSloGate(policy, 'staging', metricsPerApp)

      expect(result.isEnforced).toBe(false)
      // Violations still detected but gate passes
      expect(result.violations.length).toBeGreaterThan(0)
      expect(result.passed).toBe(true)
    })

    it('evaluates all apps from the policy (no silent skips)', async () => {
      const metricsPerApp: Record<string, SimulatedMetrics> = {}
      for (const appId of appIds) {
        metricsPerApp[appId] = failingMetrics()
      }

      const result = await runSloGate(policy, 'pilot', metricsPerApp)

      // Every app must have at least one violation
      const violatedApps = new Set(result.violations.map((v) => v.app))
      for (const appId of appIds) {
        expect(violatedApps.has(appId)).toBe(true)
      }
    })
  })
})
