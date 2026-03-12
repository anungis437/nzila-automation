/**
 * @nzila/platform-decision-engine — Type definitions
 *
 * Canonical types for the Decision Layer.
 * Every decision is evidence-backed, policy-aware, and auditable.
 *
 * @module @nzila/platform-decision-engine/types
 */

// ── Enums ───────────────────────────────────────────────────────────────────

export type DecisionCategory =
  | 'STAFFING'
  | 'RISK'
  | 'FINANCIAL'
  | 'GOVERNANCE'
  | 'COMPLIANCE'
  | 'OPERATIONS'
  | 'PARTNER'
  | 'CUSTOMER'
  | 'DEPLOYMENT'
  | 'OTHER'

export type DecisionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type DecisionStatus =
  | 'GENERATED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'DEFERRED'
  | 'EXECUTED'
  | 'EXPIRED'
  | 'CLOSED'

export type DecisionType =
  | 'RECOMMENDATION'
  | 'ESCALATION'
  | 'REVIEW_REQUEST'
  | 'PRIORITIZATION'

export type DecisionSource =
  | 'rules'
  | 'anomaly_engine'
  | 'intelligence_engine'
  | 'agent_workflow'
  | 'hybrid'

export type EvidenceRefType =
  | 'event'
  | 'insight'
  | 'anomaly'
  | 'metric'
  | 'policy'
  | 'snapshot'
  | 'change'
  | 'artifact'

export type FeedbackAction =
  | 'APPROVE'
  | 'REJECT'
  | 'DEFER'
  | 'EXECUTE'
  | 'COMMENT'

export type AuditEventType =
  | 'decision_generated'
  | 'decision_viewed'
  | 'decision_approved'
  | 'decision_rejected'
  | 'decision_deferred'
  | 'decision_executed'
  | 'decision_expired'
  | 'decision_feedback_recorded'

// ── Composite Types ─────────────────────────────────────────────────────────

export interface EvidenceRef {
  readonly type: EvidenceRefType
  readonly ref_id: string
  readonly summary?: string
}

export interface DecisionGeneratedBy {
  readonly source: DecisionSource
  readonly engine_version: string
  readonly model_version?: string
}

export interface PolicyContext {
  readonly execution_allowed: boolean
  readonly reasons: readonly string[]
}

export interface EnvironmentContext {
  readonly environment: 'LOCAL' | 'PREVIEW' | 'STAGING' | 'PRODUCTION'
  readonly protected_environment: boolean
}

export interface DecisionOutcome {
  readonly accepted: boolean
  readonly rejected: boolean
  readonly deferred: boolean
  readonly executed: boolean
  readonly execution_notes?: string
}

// ── Decision Record ─────────────────────────────────────────────────────────

export interface DecisionRecord {
  readonly decision_id: string
  readonly org_id: string
  readonly category: DecisionCategory
  readonly type: DecisionType
  readonly severity: DecisionSeverity
  readonly title: string
  readonly summary: string
  readonly explanation: string
  readonly confidence_score: number
  readonly generated_by: DecisionGeneratedBy
  readonly evidence_refs: readonly EvidenceRef[]
  readonly recommended_actions: readonly string[]
  readonly required_approvals: readonly string[]
  readonly review_required: boolean
  readonly policy_context: PolicyContext
  readonly environment_context: EnvironmentContext
  readonly status: DecisionStatus
  readonly generated_at: string
  readonly expires_at?: string
  readonly reviewed_by?: readonly string[]
  readonly review_notes?: readonly string[]
  readonly outcome?: DecisionOutcome
}

// ── Feedback ────────────────────────────────────────────────────────────────

export interface DecisionFeedback {
  readonly decision_id: string
  readonly actor: string
  readonly action: FeedbackAction
  readonly notes?: string
  readonly created_at: string
}

// ── Audit Entry ─────────────────────────────────────────────────────────────

export interface DecisionAuditEntry {
  readonly decision_id: string
  readonly event_type: AuditEventType
  readonly actor: string
  readonly timestamp: string
  readonly detail?: string
}

// ── Engine Input ────────────────────────────────────────────────────────────

export interface DecisionEngineInput {
  readonly org_id: string
  readonly anomalies: readonly import('@nzila/platform-anomaly-engine/types').Anomaly[]
  readonly insights: readonly import('@nzila/platform-intelligence/types').CrossAppInsight[]
  readonly signals: readonly import('@nzila/platform-intelligence/types').OperationalSignal[]
  readonly governance_status?: import('@nzila/platform-governance/types').GovernanceStatus
  readonly change_records?: readonly import('@nzila/platform-change-management/types').ChangeRecord[]
  readonly environment: 'LOCAL' | 'PREVIEW' | 'STAGING' | 'PRODUCTION'
}

// ── Decision Export Pack ────────────────────────────────────────────────────

export interface DecisionExportPack {
  readonly decision_record: DecisionRecord
  readonly evidence_refs: readonly EvidenceRef[]
  readonly policy_context: PolicyContext
  readonly governance_status_snapshot?: Record<string, unknown>
  readonly change_status_snapshot?: Record<string, unknown>
  readonly output_hash: string
  readonly exported_at: string
}

// ── Decision Summary ────────────────────────────────────────────────────────

export interface DecisionSummary {
  readonly total: number
  readonly by_severity: Record<DecisionSeverity, number>
  readonly by_category: Record<DecisionCategory, number>
  readonly by_status: Record<DecisionStatus, number>
  readonly pending_review: number
  readonly critical_open: number
}

// ── Constants ───────────────────────────────────────────────────────────────

export const ALL_CATEGORIES: readonly DecisionCategory[] = [
  'STAFFING', 'RISK', 'FINANCIAL', 'GOVERNANCE', 'COMPLIANCE',
  'OPERATIONS', 'PARTNER', 'CUSTOMER', 'DEPLOYMENT', 'OTHER',
] as const

export const ALL_SEVERITIES: readonly DecisionSeverity[] = [
  'LOW', 'MEDIUM', 'HIGH', 'CRITICAL',
] as const

export const ALL_STATUSES: readonly DecisionStatus[] = [
  'GENERATED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED',
  'DEFERRED', 'EXECUTED', 'EXPIRED', 'CLOSED',
] as const

export const ENGINE_VERSION = '1.0.0'
