/**
 * @nzila/platform-observability — Reliability Engineering (SLO / SLI)
 *
 * Defines Service Level Indicators, Service Level Objectives, and error budget tracking.
 * This is the code-first source of truth for all reliability targets.
 *
 * @module @nzila/platform-observability/reliability
 */

// ── SLI Definitions ──────────────────────────────────────────────────────

export type SliMetric =
  | 'availability'
  | 'latency_p95'
  | 'latency_p99'
  | 'error_rate'
  | 'success_rate'
  | 'retry_success_rate'
  | 'job_completion_rate'
  | 'retry_exhaustion_rate'
  | 'sync_success_rate'

export interface SliDefinition {
  readonly name: string
  readonly metric: SliMetric
  readonly description: string
  readonly unit: 'percent' | 'milliseconds' | 'ratio'
}

// ── SLO Definitions ──────────────────────────────────────────────────────

export type SloComparison = 'gte' | 'lte' | 'lt' | 'gt'

export interface SloTarget {
  readonly service: string
  readonly category: 'api' | 'integration' | 'workflow' | 'ai' | 'data-fabric'
  readonly sli: SliMetric
  readonly comparison: SloComparison
  readonly target: number
  readonly windowHours: number
  readonly alertThresholdPct: number
  readonly description: string
}

// ── Canonical SLO Registry ───────────────────────────────────────────────

export const PLATFORM_SLOS: readonly SloTarget[] = [
  // ── API Services ──────────────────────────────────────────────────────
  {
    service: 'api',
    category: 'api',
    sli: 'availability',
    comparison: 'gte',
    target: 99.5,
    windowHours: 720,
    alertThresholdPct: 0.5,
    description: 'API availability >= 99.5% over 30 days',
  },
  {
    service: 'api',
    category: 'api',
    sli: 'latency_p95',
    comparison: 'lte',
    target: 400,
    windowHours: 168,
    alertThresholdPct: 10,
    description: 'p95 API latency < 400ms over 7 days',
  },
  {
    service: 'api',
    category: 'api',
    sli: 'error_rate',
    comparison: 'lt',
    target: 1,
    windowHours: 168,
    alertThresholdPct: 50,
    description: 'API error rate < 1% over 7 days',
  },

  // ── Integration Pipelines ─────────────────────────────────────────────
  {
    service: 'integrations',
    category: 'integration',
    sli: 'sync_success_rate',
    comparison: 'gte',
    target: 98,
    windowHours: 720,
    alertThresholdPct: 1,
    description: 'Integration sync success rate >= 98% over 30 days',
  },
  {
    service: 'integrations',
    category: 'integration',
    sli: 'retry_success_rate',
    comparison: 'gte',
    target: 90,
    windowHours: 168,
    alertThresholdPct: 5,
    description: 'Integration retry success rate >= 90% over 7 days',
  },

  // ── Workflow Engine ────────────────────────────────────────────────────
  {
    service: 'orchestrator',
    category: 'workflow',
    sli: 'job_completion_rate',
    comparison: 'gte',
    target: 99,
    windowHours: 720,
    alertThresholdPct: 0.5,
    description: 'Workflow job completion rate >= 99% over 30 days',
  },
  {
    service: 'orchestrator',
    category: 'workflow',
    sli: 'retry_exhaustion_rate',
    comparison: 'lt',
    target: 0.5,
    windowHours: 168,
    alertThresholdPct: 50,
    description: 'Workflow retry exhaustion rate < 0.5% over 7 days',
  },

  // ── AI Services ────────────────────────────────────────────────────────
  {
    service: 'ai',
    category: 'ai',
    sli: 'availability',
    comparison: 'gte',
    target: 99.0,
    windowHours: 720,
    alertThresholdPct: 0.5,
    description: 'AI service availability >= 99.0% over 30 days',
  },
  {
    service: 'ai',
    category: 'ai',
    sli: 'latency_p95',
    comparison: 'lte',
    target: 5000,
    windowHours: 168,
    alertThresholdPct: 20,
    description: 'AI reasoning p95 latency < 5s over 7 days',
  },

  // ── Data Fabric ────────────────────────────────────────────────────────
  {
    service: 'data-fabric',
    category: 'data-fabric',
    sli: 'sync_success_rate',
    comparison: 'gte',
    target: 99,
    windowHours: 720,
    alertThresholdPct: 0.5,
    description: 'Data fabric sync success rate >= 99% over 30 days',
  },
]

// ── Error Budget ─────────────────────────────────────────────────────────

export interface ErrorBudgetStatus {
  readonly service: string
  readonly sli: SliMetric
  readonly target: number
  readonly current: number
  readonly budgetTotalPct: number
  readonly budgetRemainingPct: number
  readonly budgetConsumedPct: number
  readonly exhausted: boolean
  readonly windowHours: number
}

/**
 * Compute error budget status for a given SLO target and current metric value.
 */
export function computeErrorBudget(slo: SloTarget, currentValue: number): ErrorBudgetStatus {
  const isUpperBound = slo.comparison === 'lte' || slo.comparison === 'lt'
  const budgetTotalPct = isUpperBound ? slo.target : 100 - slo.target

  let budgetConsumedPct: number
  if (isUpperBound) {
    // For upper-bound SLOs (latency, error rate): consumed = (current / target) * 100
    budgetConsumedPct = budgetTotalPct === 0 ? 0 : (currentValue / slo.target) * 100
  } else {
    // For lower-bound SLOs (availability): consumed = ((target - current) / (100 - target)) * 100
    budgetConsumedPct = budgetTotalPct === 0 ? 0 : ((slo.target - currentValue) / budgetTotalPct) * 100
  }

  budgetConsumedPct = Math.max(0, budgetConsumedPct)
  const budgetRemainingPct = Math.max(0, 100 - budgetConsumedPct)

  return {
    service: slo.service,
    sli: slo.sli,
    target: slo.target,
    current: currentValue,
    budgetTotalPct,
    budgetRemainingPct,
    budgetConsumedPct,
    exhausted: budgetRemainingPct <= 0,
    windowHours: slo.windowHours,
  }
}

/**
 * Check if a current metric value meets its SLO target.
 */
export function meetsSlo(slo: SloTarget, currentValue: number): boolean {
  switch (slo.comparison) {
    case 'gte': return currentValue >= slo.target
    case 'lte': return currentValue <= slo.target
    case 'gt': return currentValue > slo.target
    case 'lt': return currentValue < slo.target
  }
}
