/**
 * @nzila/platform-decision-engine — Ranking & prioritization
 *
 * Ranks decisions by severity, confidence, recency, evidence density, and policy urgency.
 *
 * @module @nzila/platform-decision-engine/ranking
 */
import type { DecisionRecord, DecisionSeverity } from './types'

const SEVERITY_WEIGHT: Record<DecisionSeverity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

/**
 * Compute a priority score for a decision.
 * Higher is more urgent.
 */
export function computePriorityScore(decision: DecisionRecord): number {
  const severity = SEVERITY_WEIGHT[decision.severity]
  const confidence = decision.confidence_score
  const evidenceDensity = Math.min(decision.evidence_refs.length / 5, 1)
  const policyUrgency = decision.policy_context.execution_allowed ? 0 : 0.5
  const actionDensity = Math.min(decision.recommended_actions.length / 5, 1)

  // Recency: decisions generated within last 24h get a boost
  const ageHours = (Date.now() - new Date(decision.generated_at).getTime()) / (1000 * 60 * 60)
  const recency = ageHours < 24 ? 1 : ageHours < 72 ? 0.5 : 0.2

  return (
    severity * 2 +
    confidence * 1.5 +
    evidenceDensity * 1 +
    policyUrgency * 1 +
    actionDensity * 0.5 +
    recency * 1
  )
}

/**
 * Rank decisions by priority score, highest first.
 */
export function rankDecisions(decisions: readonly DecisionRecord[]): DecisionRecord[] {
  return [...decisions].sort((a, b) => computePriorityScore(b) - computePriorityScore(a))
}

/**
 * Get the top N highest-priority decisions.
 */
export function topDecisions(decisions: readonly DecisionRecord[], n: number): DecisionRecord[] {
  return rankDecisions(decisions).slice(0, n)
}
