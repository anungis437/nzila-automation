/**
 * @nzila/platform-decision-engine — Decision rules
 *
 * Rule patterns that transform platform signals into DecisionRecord candidates.
 * Each rule examines anomalies, insights, and signals to generate decisions.
 *
 * @module @nzila/platform-decision-engine/rules
 */
import type { Anomaly } from '@nzila/platform-anomaly-engine/types'
import type { CrossAppInsight, OperationalSignal } from '@nzila/platform-intelligence/types'
import type { ChangeRecord } from '@nzila/platform-change-management/types'
import type {
  DecisionCategory,
  DecisionSeverity,
  DecisionType,
  DecisionRecord,
  DecisionEngineInput,
  EvidenceRef,
} from './types'
import { generateDecisionId, nowISO } from './utils'
import { ENGINE_VERSION } from './types'

// ── Severity mapping ────────────────────────────────────────────────────────

function mapAnomalySeverity(s: string): DecisionSeverity {
  const map: Record<string, DecisionSeverity> = {
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',
    critical: 'CRITICAL',
  }
  return map[s] ?? 'LOW'
}

function mapInsightSeverity(s: string): DecisionSeverity {
  const map: Record<string, DecisionSeverity> = {
    info: 'LOW',
    warning: 'MEDIUM',
    critical: 'CRITICAL',
  }
  return map[s] ?? 'LOW'
}

// ── Decision builder helper ─────────────────────────────────────────────────

function buildDecision(
  input: DecisionEngineInput,
  opts: {
    category: DecisionCategory
    type: DecisionType
    severity: DecisionSeverity
    title: string
    summary: string
    explanation: string
    confidence: number
    evidenceRefs: EvidenceRef[]
    actions: string[]
    approvals?: string[]
  },
): DecisionRecord {
  const isProtected = input.environment === 'PRODUCTION' || input.environment === 'STAGING'
  return {
    decision_id: generateDecisionId(),
    org_id: input.org_id,
    category: opts.category,
    type: opts.type,
    severity: opts.severity,
    title: opts.title,
    summary: opts.summary,
    explanation: opts.explanation,
    confidence_score: Math.max(0, Math.min(1, opts.confidence)),
    generated_by: { source: 'rules', engine_version: ENGINE_VERSION },
    evidence_refs: opts.evidenceRefs,
    recommended_actions: opts.actions,
    required_approvals: opts.approvals ?? (opts.severity === 'CRITICAL' ? ['platform-admin'] : []),
    review_required: opts.severity === 'HIGH' || opts.severity === 'CRITICAL' || isProtected,
    policy_context: { execution_allowed: !isProtected, reasons: isProtected ? ['Protected environment'] : [] },
    environment_context: { environment: input.environment, protected_environment: isProtected },
    status: 'GENERATED',
    generated_at: nowISO(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

// ── Rule interface ──────────────────────────────────────────────────────────

export interface DecisionRule {
  readonly name: string
  readonly description: string
  evaluate(input: DecisionEngineInput): DecisionRecord[]
}

// ── Rule 4A: Union — Grievance backlog ──────────────────────────────────────

export const grievanceBacklogRule: DecisionRule = {
  name: 'grievance-backlog',
  description: 'Detect grievance spike anomalies and recommend staffing actions',
  evaluate(input) {
    return input.anomalies
      .filter((a: Anomaly) => a.anomalyType === 'grievance_spike')
      .map((a: Anomaly) => buildDecision(input, {
        category: 'STAFFING',
        type: 'RECOMMENDATION',
        severity: mapAnomalySeverity(a.severity),
        title: `Grievance backlog spike in ${a.app}`,
        summary: `Detected ${a.deviationFactor.toFixed(1)}x above expected for ${a.metric}`,
        explanation: a.description,
        confidence: Math.min(1, a.deviationFactor / 5),
        evidenceRefs: [{ type: 'anomaly', ref_id: a.id, summary: a.description }],
        actions: [a.suggestedAction, 'Review grievance queue', 'Consider temporary staff allocation'],
      }))
  },
}

// ── Rule 4A: Union — Arbitration risk ───────────────────────────────────────

export const arbitrationRiskRule: DecisionRule = {
  name: 'arbitration-risk',
  description: 'Identify compliance deviations that may indicate arbitration risk',
  evaluate(input) {
    return input.anomalies
      .filter((a: Anomaly) => a.anomalyType === 'compliance_deviation' && a.app === 'union-eyes')
      .map((a: Anomaly) => buildDecision(input, {
        category: 'COMPLIANCE',
        type: 'ESCALATION',
        severity: a.severity === 'critical' ? 'CRITICAL' : 'HIGH',
        title: `Compliance deviation risk — ${a.metric}`,
        summary: `Compliance metric deviated ${a.deviationFactor.toFixed(1)}x; arbitration risk detected`,
        explanation: a.description,
        confidence: 0.75,
        evidenceRefs: [{ type: 'anomaly', ref_id: a.id, summary: a.description }],
        actions: ['Review compliance status', 'Escalate to legal', a.suggestedAction],
        approvals: ['legal-compliance', 'platform-admin'],
      }))
  },
}

// ── Rule 4B: CFO — Budget variance ──────────────────────────────────────────

export const budgetVarianceRule: DecisionRule = {
  name: 'budget-variance',
  description: 'Detect financial irregularities and significant budget variances',
  evaluate(input) {
    return input.anomalies
      .filter((a: Anomaly) => a.anomalyType === 'financial_irregularity')
      .map((a: Anomaly) => buildDecision(input, {
        category: 'FINANCIAL',
        type: a.severity === 'critical' ? 'ESCALATION' : 'RECOMMENDATION',
        severity: mapAnomalySeverity(a.severity),
        title: `Financial irregularity in ${a.app}`,
        summary: `Budget metric ${a.metric} deviated ${a.deviationFactor.toFixed(1)}x from expected`,
        explanation: a.description,
        confidence: Math.min(1, a.deviationFactor / 4),
        evidenceRefs: [{ type: 'anomaly', ref_id: a.id, summary: a.description }],
        actions: [a.suggestedAction, 'Review budget allocations', 'Audit recent transactions'],
        approvals: ['finance-admin'],
      }))
  },
}

// ── Rule 4C: ShopQuoter — Pricing anomaly ───────────────────────────────────

export const pricingAnomalyRule: DecisionRule = {
  name: 'pricing-anomaly',
  description: 'Detect pricing outliers that may affect quotation accuracy',
  evaluate(input) {
    return input.anomalies
      .filter((a: Anomaly) => a.anomalyType === 'pricing_outlier')
      .map((a: Anomaly) => buildDecision(input, {
        category: 'FINANCIAL',
        type: 'REVIEW_REQUEST',
        severity: mapAnomalySeverity(a.severity),
        title: `Pricing outlier detected in ${a.app}`,
        summary: `Pricing for ${a.metric} deviated ${a.deviationFactor.toFixed(1)}x from expected range`,
        explanation: a.description,
        confidence: Math.min(1, 0.6 + a.deviationFactor * 0.1),
        evidenceRefs: [{ type: 'anomaly', ref_id: a.id, summary: a.description }],
        actions: [a.suggestedAction, 'Review pricing model', 'Validate supplier rates'],
      }))
  },
}

// ── Rule 4D: Partners — Underperforming ─────────────────────────────────────

export const partnerPerformanceRule: DecisionRule = {
  name: 'partner-performance-drop',
  description: 'Detect underperforming partners and recommend follow-up actions',
  evaluate(input) {
    return input.anomalies
      .filter((a: Anomaly) => a.anomalyType === 'partner_performance_drop')
      .map((a: Anomaly) => buildDecision(input, {
        category: 'PARTNER',
        type: 'RECOMMENDATION',
        severity: mapAnomalySeverity(a.severity),
        title: `Partner performance drop — ${a.metric}`,
        summary: `Partner performance metric dropped ${a.deviationFactor.toFixed(1)}x below baseline`,
        explanation: a.description,
        confidence: Math.min(1, a.deviationFactor / 3),
        evidenceRefs: [{ type: 'anomaly', ref_id: a.id, summary: a.description }],
        actions: [a.suggestedAction, 'Schedule partner review', 'Assess contract SLAs'],
      }))
  },
}

// ── Rule 4E: Platform — Deployment risk ─────────────────────────────────────

export const deploymentRiskRule: DecisionRule = {
  name: 'deployment-risk',
  description: 'Flag risky deployments based on change records and environment',
  evaluate(input) {
    if (!input.change_records) return []
    return input.change_records
      .filter((c: ChangeRecord) =>
        c.risk_level === 'HIGH' &&
        (c.status === 'PROPOSED' || c.status === 'APPROVED') &&
        c.environment === 'PROD',
      )
      .map((c: ChangeRecord) => buildDecision(input, {
        category: 'DEPLOYMENT',
        type: 'REVIEW_REQUEST',
        severity: 'HIGH',
        title: `High-risk deployment: ${c.title}`,
        summary: `Change ${c.change_id} is high-risk targeting production`,
        explanation: `${c.description}. Impact: ${c.impact_summary}`,
        confidence: 0.85,
        evidenceRefs: [{ type: 'change', ref_id: c.change_id, summary: c.title }],
        actions: ['Ensure rollback plan', 'Verify staging validation', 'Schedule maintenance window'],
        approvals: ['platform-admin', 'service-owner'],
      }))
  },
}

// ── Rule 4E: Platform — Cross-app insight escalation ────────────────────────

export const crossAppInsightRule: DecisionRule = {
  name: 'cross-app-insight',
  description: 'Escalate critical cross-application insights',
  evaluate(input) {
    return input.insights
      .filter((i: CrossAppInsight) => i.severity === 'critical' || (i.severity === 'warning' && i.apps.length > 2))
      .map((i: CrossAppInsight) => buildDecision(input, {
        category: i.category === 'compliance' ? 'COMPLIANCE' : 'OPERATIONS',
        type: i.severity === 'critical' ? 'ESCALATION' : 'RECOMMENDATION',
        severity: mapInsightSeverity(i.severity),
        title: i.title,
        summary: `${i.description}. Affects: ${i.apps.join(', ')}`,
        explanation: `Cross-app insight across ${i.apps.length} apps. ${i.recommendations.join('. ')}`,
        confidence: 0.7,
        evidenceRefs: [{ type: 'insight', ref_id: i.id, summary: i.title }],
        actions: i.recommendations,
      }))
  },
}

// ── Rule 4E: Governance — Stale governance state ────────────────────────────

export const governanceStateRule: DecisionRule = {
  name: 'governance-stale-state',
  description: 'Detect operational signals indicating governance or usage anomalies',
  evaluate(input) {
    return input.signals
      .filter((s: OperationalSignal) =>
        (s.signalType === 'threshold_breach' || s.signalType === 'spike') &&
        s.confidence >= 0.6,
      )
      .map((s: OperationalSignal) => buildDecision(input, {
        category: 'GOVERNANCE',
        type: 'REVIEW_REQUEST',
        severity: s.deviationPercent > 50 ? 'HIGH' : 'MEDIUM',
        title: `${s.signalType} on ${s.metric} in ${s.app}`,
        summary: `${s.metric} deviated ${s.deviationPercent.toFixed(0)}% from baseline (confidence: ${(s.confidence * 100).toFixed(0)}%)`,
        explanation: `Signal: ${s.signalType}. Current: ${s.currentValue}, Baseline: ${s.baselineValue}`,
        confidence: s.confidence,
        evidenceRefs: [{ type: 'metric', ref_id: s.id, summary: `${s.metric} ${s.signalType}` }],
        actions: ['Investigate root cause', 'Review governance checkpoints'],
      }))
  },
}

// ── Default rule set ────────────────────────────────────────────────────────

export const DEFAULT_RULES: readonly DecisionRule[] = [
  grievanceBacklogRule,
  arbitrationRiskRule,
  budgetVarianceRule,
  pricingAnomalyRule,
  partnerPerformanceRule,
  deploymentRiskRule,
  crossAppInsightRule,
  governanceStateRule,
] as const
