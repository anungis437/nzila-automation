/**
 * Nzila OS — Synthetic Scale Envelope Harness
 *
 * Generates synthetic load profiles against the platform-performance
 * metrics engine and measures p95 degradation under sustained load.
 *
 * No real HTTP traffic — this is an in-process harness that exercises
 * the metrics pipeline with configurable concurrency and duration.
 *
 * @module @nzila/platform-performance/scale-harness
 */

import { computeEnvelope, type PerformanceEnvelope } from './metrics'

// ── Types ───────────────────────────────────────────────────────────────────

export interface ScaleProfile {
  /** Human-readable profile name */
  name: string
  /** Concurrent virtual users */
  concurrency: number
  /** Duration of the load phase in seconds */
  durationSec: number
  /** Requests per second target */
  rps: number
  /** Simulated routes to exercise */
  routes: string[]
  /** Simulated org IDs */
  orgIds: string[]
  /** Error injection rate (0–1) */
  errorRate?: number
  /** Latency jitter range [min, max] in ms */
  latencyRange?: [number, number]
}

export interface ScalePhaseResult {
  /** Profile that was executed */
  profile: ScaleProfile
  /** Total synthetic requests generated */
  totalRequests: number
  /** Performance envelope computed from synthetic data */
  envelope: PerformanceEnvelope
  /** Wall-clock duration of the phase in ms */
  elapsedMs: number
  /** Requests that exceeded the p95 budget */
  budgetViolations: number
  /** Whether the phase passed the degradation threshold */
  passed: boolean
}

export interface ScaleEnvelopeResult {
  /** All phase results in order */
  phases: ScalePhaseResult[]
  /** Overall pass/fail */
  passed: boolean
  /** Peak p95 observed across all phases */
  peakP95: number
  /** Peak throughput observed */
  peakThroughput: number
  /** Degradation ratio: (peak p95 / baseline p95) */
  degradationRatio: number
  /** ISO timestamp */
  completedAt: string
}

export interface ScaleHarnessConfig {
  /** Profiles to execute in sequence (ramp-up) */
  profiles: ScaleProfile[]
  /** p95 budget in ms — if any phase exceeds this, it fails */
  p95BudgetMs: number
  /** Maximum allowed degradation ratio vs first phase */
  maxDegradationRatio: number
}

// ── Default Profiles ────────────────────────────────────────────────────────

const DEFAULT_ROUTES = [
  '/api/claims',
  '/api/revenue',
  '/api/policies',
  '/api/payments',
  '/api/integrations',
  '/api/audit',
]

const DEFAULT_ORG_IDS = [
  'org_scale_001',
  'org_scale_002',
  'org_scale_003',
  'org_scale_004',
  'org_scale_005',
]

export const DEFAULT_SCALE_PROFILES: ScaleProfile[] = [
  {
    name: 'baseline',
    concurrency: 10,
    durationSec: 30,
    rps: 50,
    routes: DEFAULT_ROUTES,
    orgIds: DEFAULT_ORG_IDS,
    errorRate: 0.01,
    latencyRange: [5, 100],
  },
  {
    name: 'moderate',
    concurrency: 50,
    durationSec: 60,
    rps: 200,
    routes: DEFAULT_ROUTES,
    orgIds: DEFAULT_ORG_IDS,
    errorRate: 0.02,
    latencyRange: [10, 250],
  },
  {
    name: 'heavy',
    concurrency: 200,
    durationSec: 120,
    rps: 500,
    routes: DEFAULT_ROUTES,
    orgIds: DEFAULT_ORG_IDS,
    errorRate: 0.03,
    latencyRange: [20, 500],
  },
  {
    name: 'spike',
    concurrency: 500,
    durationSec: 30,
    rps: 1000,
    routes: DEFAULT_ROUTES,
    orgIds: DEFAULT_ORG_IDS,
    errorRate: 0.05,
    latencyRange: [30, 800],
  },
]

export const DEFAULT_HARNESS_CONFIG: ScaleHarnessConfig = {
  profiles: DEFAULT_SCALE_PROFILES,
  p95BudgetMs: 500,
  maxDegradationRatio: 3.0,
}

// ── Synthetic Data Generation ───────────────────────────────────────────────

interface SyntheticRow {
  route: string
  latencyMs: number
  statusCode: number
  recordedAt: Date
}

/**
 * Generate synthetic request metrics for a given profile.
 * Pure function — deterministic with seed.
 */
export function generateSyntheticLoad(
  profile: ScaleProfile,
  seed?: number,
): SyntheticRow[] {
  const rows: SyntheticRow[] = []
  const totalRequests = profile.rps * profile.durationSec
  const [minLatency, maxLatency] = profile.latencyRange ?? [5, 200]
  const errorRate = profile.errorRate ?? 0.02

  // Simple seeded PRNG for reproducibility
  let state = seed ?? 42
  function nextRandom(): number {
    state = (state * 1664525 + 1013904223) & 0x7fffffff
    return state / 0x7fffffff
  }

  const baseTime = Date.now()
  const intervalMs = (profile.durationSec * 1000) / totalRequests

  for (let i = 0; i < totalRequests; i++) {
    const route = profile.routes[i % profile.routes.length]
    const rng = nextRandom()

    // Latency increases with concurrency (simulating contention)
    const concurrencyFactor = 1 + (profile.concurrency / 100) * 0.5
    const baseLatency = minLatency + rng * (maxLatency - minLatency)
    const latencyMs = Math.round(baseLatency * concurrencyFactor)

    const isError = nextRandom() < errorRate
    const statusCode = isError ? (nextRandom() < 0.5 ? 500 : 503) : 200

    rows.push({
      route,
      latencyMs,
      statusCode,
      recordedAt: new Date(baseTime + i * intervalMs),
    })
  }

  return rows
}

// ── Phase Execution ─────────────────────────────────────────────────────────

/**
 * Execute a single scale phase: generate synthetic load, compute envelope.
 * Pure computation — no DB writes, no network calls.
 */
export function executeScalePhase(
  profile: ScaleProfile,
  p95BudgetMs: number,
  seed?: number,
): ScalePhaseResult {
  const startMs = Date.now()
  const rows = generateSyntheticLoad(profile, seed)
  const windowMinutes = Math.max(profile.durationSec / 60, 1)
  const envelope = computeEnvelope(rows, windowMinutes)
  const elapsedMs = Date.now() - startMs

  const budgetViolations = rows.filter((r) => r.latencyMs > p95BudgetMs).length
  const passed = envelope.p95 <= p95BudgetMs

  return {
    profile,
    totalRequests: rows.length,
    envelope,
    elapsedMs,
    budgetViolations,
    passed,
  }
}

// ── Full Harness ────────────────────────────────────────────────────────────

/**
 * Run the complete scale envelope test: execute all profiles sequentially,
 * measure degradation ratio, and produce a composite result.
 */
export function runScaleEnvelope(
  config?: Partial<ScaleHarnessConfig>,
): ScaleEnvelopeResult {
  const resolved: ScaleHarnessConfig = {
    ...DEFAULT_HARNESS_CONFIG,
    ...config,
    profiles: config?.profiles ?? DEFAULT_HARNESS_CONFIG.profiles,
  }

  const phases: ScalePhaseResult[] = []
  let seed = 42

  for (const profile of resolved.profiles) {
    const phase = executeScalePhase(profile, resolved.p95BudgetMs, seed)
    phases.push(phase)
    seed += 1000
  }

  const baselineP95 = phases[0]?.envelope.p95 ?? 1
  const peakP95 = Math.max(...phases.map((p) => p.envelope.p95))
  const peakThroughput = Math.max(...phases.map((p) => p.envelope.throughput))
  const degradationRatio = Math.round((peakP95 / Math.max(baselineP95, 1)) * 100) / 100

  const passed =
    phases.every((p) => p.passed) &&
    degradationRatio <= resolved.maxDegradationRatio

  return {
    phases,
    passed,
    peakP95,
    peakThroughput,
    degradationRatio,
    completedAt: new Date().toISOString(),
  }
}
