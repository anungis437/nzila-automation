/**
 * Canonical AI output types for Nzila OS.
 *
 * All platform-ai-* packages must use these types for their outputs.
 * See docs/AI_PLATFORM_CONTRACT.md.
 */

/** Base fields required on every AI output */
export interface AIOutputBase {
  /** 0.0 – 1.0 confidence in the output */
  confidence_score: number

  /** References to evidence / source data that informed the output */
  evidence_refs: string[]

  /** Versioned identifier for the model or engine that produced the output */
  engine_version: string

  /** Whether human review is required before the output can be acted upon */
  review_required: boolean

  /** Org scope for multi-tenant isolation */
  org_id: string

  /** ISO 8601 timestamp of output generation */
  generated_at: string

  /** Allow additional fields */
  [key: string]: unknown
}

/** Cross-app intelligence, trend detection, and operational signals */
export interface InsightOutput extends AIOutputBase {
  type: 'insight'
  category: 'trend' | 'correlation' | 'anomaly_summary' | 'operational'
  title: string
  description: string
  affected_entities: string[]
  recommended_action?: string
}

/** Anomaly detection in grievances, financials, pricing, and patterns */
export interface AnomalyOutput extends AIOutputBase {
  type: 'anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  anomaly_type: string
  metric_name: string
  expected_value: number
  actual_value: number
  deviation_pct: number
}

/** Policy-engine decisions, approval recommendations, and risk assessments */
export interface DecisionOutput extends AIOutputBase {
  type: 'decision'
  decision: 'approve' | 'reject' | 'escalate' | 'defer'
  rationale: string
  policy_refs: string[]
  risk_level: 'low' | 'medium' | 'high'
  alternatives?: string[]
}

/** Agent-driven recommendations and next-best-action suggestions */
export interface RecommendationOutput extends AIOutputBase {
  type: 'recommendation'
  action: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  expected_impact: string
  prerequisites: string[]
  auto_executable: boolean
}

/** Union of all canonical AI output types */
export type AIOutput = InsightOutput | AnomalyOutput | DecisionOutput | RecommendationOutput
