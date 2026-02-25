/**
 * @nzila/commerce-observability — SLO Definitions
 *
 * Service Level Objectives for the commerce module.
 * These codify the expected availability, latency, and error budgets
 * for all commerce operations.
 *
 * Definitions here serve as the single source of truth — alert rules
 * in Azure Monitor / Prometheus derive from these values.
 *
 * @module @nzila/commerce-observability/slo
 */

// ── SLO Definitions ──────────────────────────────────────────────────────

export interface CommerceSloDefinition {
  /** Service/domain identifier */
  readonly service: string
  /** SLO name */
  readonly name: string
  /** Target percentage (e.g. 99.9 = 99.9%) */
  readonly target: number
  /** Metric that measures this SLO */
  readonly metric: string
  /** Rolling window in hours */
  readonly windowHours: number
  /** Human-readable description */
  readonly description: string
  /** Percentage below target that triggers alert */
  readonly alertThreshold: number
  /** Severity when breached */
  readonly severity: 'P1' | 'P2' | 'P3' | 'P4'
  /** Runbook link for when alert fires */
  readonly runbook: string
}

/**
 * Canonical SLO definitions for commerce operations.
 *
 * Follow RED pattern:
 *   Rate     — request/operation throughput
 *   Errors   — failure percentages
 *   Duration — latency distributions
 */
export const COMMERCE_SLOS: readonly CommerceSloDefinition[] = [
  // ── State Machine Transitions ────────────────────────────────────────
  {
    service: 'commerce-state',
    name: 'transition-success-rate',
    target: 99.5,
    metric: 'commerce_transition_success_rate',
    windowHours: 168, // 7 days
    description: 'State machine transitions succeed 99.5% of the time (excluding governance blocks)',
    alertThreshold: 1.0,
    severity: 'P2',
    runbook: 'ops/runbooks/commerce/stuck-state-resolution.md',
  },
  {
    service: 'commerce-state',
    name: 'transition-latency-p99',
    target: 95,
    metric: 'commerce_transition_duration_p99_under_100ms',
    windowHours: 168,
    description: '95% of transitions complete under 100ms at p99',
    alertThreshold: 2.0,
    severity: 'P3',
    runbook: 'ops/runbooks/commerce/stuck-state-resolution.md',
  },
  {
    service: 'commerce-state',
    name: 'org-mismatch-rate',
    target: 99.99,
    metric: 'commerce_transition_org_mismatch_rate_below_0_01pct',
    windowHours: 720, // 30 days
    description: 'Cross-org transition attempts remain below 0.01% (security indicator)',
    alertThreshold: 0.01,
    severity: 'P1',
    runbook: 'ops/runbooks/commerce/org-isolation-breach.md',
  },

  // ── Saga Orchestration ───────────────────────────────────────────────
  {
    service: 'commerce-sagas',
    name: 'saga-success-rate',
    target: 99.0,
    metric: 'commerce_saga_success_rate',
    windowHours: 168,
    description: 'Saga orchestrations complete successfully 99% of the time',
    alertThreshold: 2.0,
    severity: 'P2',
    runbook: 'ops/runbooks/commerce/saga-compensation-failure.md',
  },
  {
    service: 'commerce-sagas',
    name: 'saga-compensation-rate',
    target: 100, // any compensation is worth investigating
    metric: 'commerce_saga_compensation_total_below_threshold',
    windowHours: 24,
    description: 'Saga compensations should be rare — alert when > 5 in 24h',
    alertThreshold: 5,
    severity: 'P3',
    runbook: 'ops/runbooks/commerce/saga-compensation-failure.md',
  },
  {
    service: 'commerce-sagas',
    name: 'saga-duration-p99',
    target: 95,
    metric: 'commerce_saga_duration_p99_under_5s',
    windowHours: 168,
    description: '95% of saga executions complete under 5s at p99',
    alertThreshold: 2.0,
    severity: 'P3',
    runbook: 'ops/runbooks/commerce/saga-compensation-failure.md',
  },

  // ── Governance Gates ─────────────────────────────────────────────────
  {
    service: 'commerce-governance',
    name: 'gate-evaluation-success',
    target: 99.9,
    metric: 'commerce_governance_gate_evaluation_success_rate',
    windowHours: 720,
    description: 'Governance gate evaluations complete without internal errors 99.9%',
    alertThreshold: 0.5,
    severity: 'P2',
    runbook: 'ops/runbooks/commerce/governance-override.md',
  },
  {
    service: 'commerce-governance',
    name: 'override-rate',
    target: 100, // any override is an audit event
    metric: 'commerce_governance_override_below_threshold',
    windowHours: 720,
    description: 'Governance overrides should be extremely rare — alert on any occurrence',
    alertThreshold: 1,
    severity: 'P1',
    runbook: 'ops/runbooks/commerce/governance-override.md',
  },

  // ── Audit Trail ──────────────────────────────────────────────────────
  {
    service: 'commerce-audit',
    name: 'audit-completeness',
    target: 100,
    metric: 'commerce_audit_entry_total_matches_transition_total',
    windowHours: 24,
    description: 'Every transition produces an audit entry — 100% completeness required',
    alertThreshold: 0,
    severity: 'P1',
    runbook: 'ops/runbooks/commerce/audit-gap-investigation.md',
  },
  {
    service: 'commerce-audit',
    name: 'audit-hash-latency',
    target: 99,
    metric: 'commerce_audit_hash_duration_p99_under_50ms',
    windowHours: 168,
    description: 'Audit hash computation completes under 50ms 99% of the time',
    alertThreshold: 2.0,
    severity: 'P4',
    runbook: 'ops/runbooks/commerce/stuck-state-resolution.md',
  },

  // ── Evidence Packs ───────────────────────────────────────────────────
  {
    service: 'commerce-evidence',
    name: 'evidence-pack-success',
    target: 99.9,
    metric: 'commerce_evidence_pack_success_rate',
    windowHours: 720,
    description: 'Evidence pack generation succeeds 99.9% of the time',
    alertThreshold: 0.5,
    severity: 'P2',
    runbook: 'ops/runbooks/commerce/evidence-pack-failure.md',
  },
] as const

// ── Derived Alert Rules ───────────────────────────────────────────────────

export interface AlertRule {
  readonly name: string
  readonly sloName: string
  readonly severity: 'P1' | 'P2' | 'P3' | 'P4'
  /** KQL query template for Azure Monitor */
  readonly kqlQuery: string
  /** Evaluation frequency in minutes */
  readonly evaluationFrequencyMinutes: number
  /** Runbook link */
  readonly runbook: string
}

/**
 * Derived alert rules from SLO definitions.
 * These map directly to Azure Monitor alert rules or Prometheus recording rules.
 */
export const COMMERCE_ALERT_RULES: readonly AlertRule[] = [
  {
    name: 'commerce-org-mismatch-spike',
    sloName: 'org-mismatch-rate',
    severity: 'P1',
    kqlQuery: `customMetrics
| where name == "commerce_transition_org_mismatch_total"
| summarize total = sum(valueSum) by bin(timestamp, 5m)
| where total > 0`,
    evaluationFrequencyMinutes: 5,
    runbook: 'ops/runbooks/commerce/org-isolation-breach.md',
  },
  {
    name: 'commerce-saga-compensation-spike',
    sloName: 'saga-compensation-rate',
    severity: 'P3',
    kqlQuery: `customMetrics
| where name == "commerce_saga_compensation_total"
| summarize total = sum(valueSum) by bin(timestamp, 1h)
| where total > 5`,
    evaluationFrequencyMinutes: 15,
    runbook: 'ops/runbooks/commerce/saga-compensation-failure.md',
  },
  {
    name: 'commerce-governance-override-alert',
    sloName: 'override-rate',
    severity: 'P1',
    kqlQuery: `customMetrics
| where name == "commerce_governance_override_total"
| summarize total = sum(valueSum) by bin(timestamp, 1h)
| where total > 0`,
    evaluationFrequencyMinutes: 5,
    runbook: 'ops/runbooks/commerce/governance-override.md',
  },
  {
    name: 'commerce-audit-gap-alert',
    sloName: 'audit-completeness',
    severity: 'P1',
    kqlQuery: `customMetrics
| where name in ("commerce_transition_total", "commerce_audit_entry_total")
| summarize transitions = sumif(valueSum, name == "commerce_transition_total"),
            audits = sumif(valueSum, name == "commerce_audit_entry_total")
  by bin(timestamp, 5m)
| where transitions > audits`,
    evaluationFrequencyMinutes: 5,
    runbook: 'ops/runbooks/commerce/audit-gap-investigation.md',
  },
  {
    name: 'commerce-saga-failure-rate',
    sloName: 'saga-success-rate',
    severity: 'P2',
    kqlQuery: `customMetrics
| where name == "commerce_saga_failure_total"
| summarize total = sum(valueSum) by bin(timestamp, 1h)
| where total > 3`,
    evaluationFrequencyMinutes: 15,
    runbook: 'ops/runbooks/commerce/saga-compensation-failure.md',
  },
  {
    name: 'commerce-evidence-pack-failure',
    sloName: 'evidence-pack-success',
    severity: 'P2',
    kqlQuery: `customMetrics
| where name == "commerce_evidence_pack_total"
| summarize total = sum(valueSum) by bin(timestamp, 24h)
| where total == 0`,
    evaluationFrequencyMinutes: 60,
    runbook: 'ops/runbooks/commerce/evidence-pack-failure.md',
  },
] as const
