/**
 * Nzila OS — Platform Ops: Ops Confidence Score
 *
 * Weighted composite score (0–100) giving a single-glance operational
 * confidence indicator. Components:
 *   - SLO compliance (weight: 30%)
 *   - Error delta (weight: 20%)
 *   - Integration SLA (weight: 20%)
 *   - DLQ / backlog health (weight: 15%)
 *   - Regression severity (weight: 15%)
 *
 * @module @nzila/platform-ops/ops-score
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface OpsScoreInput {
  /** Percentage of metrics currently meeting SLO (0–100) */
  sloCompliancePct: number
  /** Error rate delta vs previous period (positive = worse) */
  errorDeltaPct: number
  /** Current integration SLA percentage (0–100) */
  integrationSlaPct: number
  /** DLQ / outbox backlog ratio: pending / max_threshold (0 = clean, 1+ = over) */
  dlqBacklogRatio: number
  /** Regression severity: 0 = none, 1 = minor, 2 = moderate, 3 = critical */
  regressionSeverity: number
}

export interface OpsScoreComponent {
  /** Component name */
  name: string
  /** Raw input value */
  rawValue: number
  /** Normalised score (0–100) */
  normalisedScore: number
  /** Weight applied */
  weight: number
  /** Weighted contribution to final score */
  contribution: number
}

export interface OpsScoreResult {
  /** Composite score (0–100), higher = more confident */
  score: number
  /** Letter grade for quick triage */
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  /** Per-component breakdown */
  components: OpsScoreComponent[]
  /** Human-readable status */
  status: string
  /** ISO 8601 timestamp of computation */
  computedAt: string
}

export interface OpsScoreHistoryEntry {
  date: string
  score: number
  grade: string
}

export interface OpsScoreDelta {
  /** Current score */
  current: number
  /** Score 7 days ago (or earliest available) */
  previous: number
  /** Absolute change */
  delta: number
  /** Direction indicator */
  direction: 'up' | 'down' | 'flat'
}

// ── Weights ────────────────────────────────────────────────────────────────

const WEIGHTS = {
  sloCompliance: 0.30,
  errorDelta: 0.20,
  integrationSla: 0.20,
  dlqBacklog: 0.15,
  regressionSeverity: 0.15,
} as const

// ── Normalisation Helpers ──────────────────────────────────────────────────

/** Clamp a value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Normalise SLO compliance: 0–100% → 0–100 score (direct mapping)
 */
function normaliseSloCompliance(pct: number): number {
  return clamp(pct, 0, 100)
}

/**
 * Normalise error delta: 0% change = 100 score, ≥10% increase = 0 score.
 * Improvements (negative delta) cap at 100.
 */
function normaliseErrorDelta(deltaPct: number): number {
  if (deltaPct <= 0) return 100 // improved or unchanged
  return clamp(100 - deltaPct * 10, 0, 100)
}

/**
 * Normalise integration SLA: 100% = 100 score, ≤90% = 0 score.
 */
function normaliseIntegrationSla(pct: number): number {
  if (pct >= 100) return 100
  if (pct <= 90) return 0
  return clamp((pct - 90) * 10, 0, 100)
}

/**
 * Normalise DLQ backlog: 0 ratio = 100 score, ≥2 ratio = 0 score.
 */
function normaliseDlqBacklog(ratio: number): number {
  if (ratio <= 0) return 100
  if (ratio >= 2) return 0
  return clamp(100 - ratio * 50, 0, 100)
}

/**
 * Normalise regression severity: 0 = 100, 1 = 75, 2 = 40, 3 = 0
 */
function normaliseRegressionSeverity(severity: number): number {
  const map: Record<number, number> = { 0: 100, 1: 75, 2: 40, 3: 0 }
  return map[clamp(Math.round(severity), 0, 3)] ?? 0
}

// ── Grade Mapping ──────────────────────────────────────────────────────────

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

function gradeToStatus(grade: string): string {
  const statusMap: Record<string, string> = {
    A: 'Excellent — all systems nominal',
    B: 'Good — minor attention areas',
    C: 'Fair — review recommended',
    D: 'Poor — action required',
    F: 'Critical — immediate attention needed',
  }
  return statusMap[grade] ?? 'Unknown'
}

// ── Core Computation ───────────────────────────────────────────────────────

/**
 * Compute the Ops Confidence Score from raw inputs.
 */
export function computeOpsScore(input: OpsScoreInput): OpsScoreResult {
  const components: OpsScoreComponent[] = [
    {
      name: 'SLO Compliance',
      rawValue: input.sloCompliancePct,
      normalisedScore: normaliseSloCompliance(input.sloCompliancePct),
      weight: WEIGHTS.sloCompliance,
      contribution: 0,
    },
    {
      name: 'Error Delta',
      rawValue: input.errorDeltaPct,
      normalisedScore: normaliseErrorDelta(input.errorDeltaPct),
      weight: WEIGHTS.errorDelta,
      contribution: 0,
    },
    {
      name: 'Integration SLA',
      rawValue: input.integrationSlaPct,
      normalisedScore: normaliseIntegrationSla(input.integrationSlaPct),
      weight: WEIGHTS.integrationSla,
      contribution: 0,
    },
    {
      name: 'DLQ / Backlog',
      rawValue: input.dlqBacklogRatio,
      normalisedScore: normaliseDlqBacklog(input.dlqBacklogRatio),
      weight: WEIGHTS.dlqBacklog,
      contribution: 0,
    },
    {
      name: 'Regression Severity',
      rawValue: input.regressionSeverity,
      normalisedScore: normaliseRegressionSeverity(input.regressionSeverity),
      weight: WEIGHTS.regressionSeverity,
      contribution: 0,
    },
  ]

  // Compute weighted contributions
  for (const c of components) {
    c.contribution = Math.round(c.normalisedScore * c.weight * 100) / 100
  }

  const rawScore = components.reduce((sum, c) => sum + c.contribution, 0)
  const score = Math.round(clamp(rawScore, 0, 100))
  const grade = scoreToGrade(score)

  return {
    score,
    grade,
    components,
    status: gradeToStatus(grade),
    computedAt: new Date().toISOString(),
  }
}

/**
 * Compute 7-day delta between current and previous score snapshots.
 */
export function computeOpsScoreDelta(
  current: number,
  history: OpsScoreHistoryEntry[],
): OpsScoreDelta {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
  const previous = sorted.length > 0 ? sorted[0]!.score : current

  const delta = current - previous
  const direction: OpsScoreDelta['direction'] =
    delta > 1 ? 'up' : delta < -1 ? 'down' : 'flat'

  return { current, previous, delta, direction }
}
