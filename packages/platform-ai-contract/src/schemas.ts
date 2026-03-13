/**
 * Runtime validation schemas for canonical AI outputs.
 *
 * Lightweight runtime checks — no external schema library dependency.
 */
import type { AIOutputBase, AIOutput } from './types.js'

const AI_OUTPUT_TYPES = ['insight', 'anomaly', 'decision', 'recommendation'] as const

export function isValidConfidenceScore(score: unknown): score is number {
  return typeof score === 'number' && score >= 0 && score <= 1
}

export function hasRequiredBaseFields(output: Record<string, unknown>): output is AIOutputBase {
  return (
    isValidConfidenceScore(output.confidence_score) &&
    Array.isArray(output.evidence_refs) &&
    typeof output.engine_version === 'string' &&
    typeof output.review_required === 'boolean' &&
    typeof output.org_id === 'string' &&
    typeof output.generated_at === 'string'
  )
}

export function isValidAIOutput(output: unknown): output is AIOutput {
  if (!output || typeof output !== 'object') return false
  const obj = output as Record<string, unknown>

  if (!hasRequiredBaseFields(obj)) return false
  if (!AI_OUTPUT_TYPES.includes(obj.type as (typeof AI_OUTPUT_TYPES)[number])) return false

  return true
}

/** Create a safe fallback output for when the AI engine is unavailable */
export function createFallbackOutput(
  type: AIOutput['type'],
  org_id: string,
  engine_version: string,
): AIOutput {
  const base: AIOutputBase = {
    confidence_score: 0,
    evidence_refs: [],
    engine_version,
    review_required: true,
    org_id,
    generated_at: new Date().toISOString(),
  }

  switch (type) {
    case 'insight':
      return { ...base, type: 'insight', category: 'operational', title: 'AI engine unavailable', description: 'The AI engine could not produce an output. Manual review required.', affected_entities: [] }
    case 'anomaly':
      return { ...base, type: 'anomaly', severity: 'low', anomaly_type: 'unavailable', metric_name: 'unknown', expected_value: 0, actual_value: 0, deviation_pct: 0 }
    case 'decision':
      return { ...base, type: 'decision', decision: 'defer', rationale: 'AI engine unavailable. Deferring to human review.', policy_refs: [], risk_level: 'medium' }
    case 'recommendation':
      return { ...base, type: 'recommendation', action: 'manual_review', priority: 'medium', expected_impact: 'Unknown — AI engine unavailable', prerequisites: [], auto_executable: false }
  }
}
