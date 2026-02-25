/**
 * @nzila/commerce-observability — Metrics
 *
 * Commerce-specific RED metrics (Rate, Errors, Duration) for:
 *   - State machine transitions (quote / order / invoice)
 *   - Saga executions & compensations
 *   - Governance gate evaluations
 *   - Audit trail operations
 *   - Evidence pack generation
 *
 * Integrates with the os-core MetricsRegistry singleton.
 * All metric names are prefixed with `commerce_` for namespace isolation.
 *
 * @module @nzila/commerce-observability/metrics
 */

// ── Metric Name Constants ─────────────────────────────────────────────────

export const COMMERCE_METRIC = {
  // Transition metrics
  TRANSITION_TOTAL: 'commerce_transition_total',
  TRANSITION_SUCCESS: 'commerce_transition_success_total',
  TRANSITION_FAILURE: 'commerce_transition_failure_total',
  TRANSITION_DURATION_MS: 'commerce_transition_duration_ms',
  TRANSITION_ORG_MISMATCH: 'commerce_transition_org_mismatch_total',

  // Saga metrics
  SAGA_EXECUTION_TOTAL: 'commerce_saga_execution_total',
  SAGA_SUCCESS: 'commerce_saga_success_total',
  SAGA_COMPENSATION: 'commerce_saga_compensation_total',
  SAGA_FAILURE: 'commerce_saga_failure_total',
  SAGA_DURATION_MS: 'commerce_saga_duration_ms',
  SAGA_STEP_DURATION_MS: 'commerce_saga_step_duration_ms',

  // Governance metrics
  GOVERNANCE_GATE_EVALUATION_TOTAL: 'commerce_governance_gate_evaluation_total',
  GOVERNANCE_GATE_PASS: 'commerce_governance_gate_pass_total',
  GOVERNANCE_GATE_FAIL: 'commerce_governance_gate_fail_total',
  GOVERNANCE_OVERRIDE: 'commerce_governance_override_total',

  // Audit metrics
  AUDIT_ENTRY_TOTAL: 'commerce_audit_entry_total',
  AUDIT_HASH_TOTAL: 'commerce_audit_hash_total',
  AUDIT_HASH_DURATION_MS: 'commerce_audit_hash_duration_ms',

  // Evidence metrics
  EVIDENCE_PACK_TOTAL: 'commerce_evidence_pack_total',
  EVIDENCE_PACK_DURATION_MS: 'commerce_evidence_pack_duration_ms',
  EVIDENCE_ARTIFACT_TOTAL: 'commerce_evidence_artifact_total',
  EVIDENCE_SEAL_TOTAL: 'commerce_evidence_seal_total',
} as const

export type CommerceMetricName = typeof COMMERCE_METRIC[keyof typeof COMMERCE_METRIC]

// ── Label Types ───────────────────────────────────────────────────────────

export interface TransitionMetricLabels {
  readonly machine: string   // 'quote' | 'order' | 'invoice' | 'fulfillment'
  readonly from: string      // source state
  readonly to: string        // target state
  readonly orgId: string     // org context
}

export interface SagaMetricLabels {
  readonly sagaName: string
  readonly orgId: string
  readonly status: string    // SagaStatus
}

export interface GovernanceMetricLabels {
  readonly machine: string
  readonly gate: string
  readonly orgId: string
}

// ── Metrics Collector ─────────────────────────────────────────────────────

export interface MetricEntry {
  readonly name: CommerceMetricName
  readonly labels: Record<string, string>
  readonly value: number
  readonly timestamp: number
}

export interface HistogramEntry {
  readonly name: CommerceMetricName
  readonly labels: Record<string, string>
  readonly value: number
  readonly timestamp: number
}

/**
 * Commerce-specific metrics collector.
 *
 * In production this feeds into the os-core MetricsRegistry.
 * In tests it collects metrics in-memory for assertions.
 *
 * DESIGN:
 *   - Pure functions — no OTel dependency at this layer
 *   - All labels include orgId for org-scoped dashboarding
 *   - All metric names follow RED pattern
 */
export class CommerceMetrics {
  private counters: MetricEntry[] = []
  private histograms: HistogramEntry[] = []

  // ── Transition Metrics ──────────────────────────────────────────────

  /** Record a state machine transition attempt */
  recordTransition(labels: TransitionMetricLabels, success: boolean, durationMs: number): void {
    const baseLabels = { machine: labels.machine, from: labels.from, to: labels.to, org_id: labels.orgId }
    const ts = Date.now()

    this.counters.push({ name: COMMERCE_METRIC.TRANSITION_TOTAL, labels: baseLabels, value: 1, timestamp: ts })

    if (success) {
      this.counters.push({ name: COMMERCE_METRIC.TRANSITION_SUCCESS, labels: baseLabels, value: 1, timestamp: ts })
    } else {
      this.counters.push({ name: COMMERCE_METRIC.TRANSITION_FAILURE, labels: baseLabels, value: 1, timestamp: ts })
    }

    this.histograms.push({ name: COMMERCE_METRIC.TRANSITION_DURATION_MS, labels: baseLabels, value: durationMs, timestamp: ts })
  }

  /** Record an org mismatch rejection (security metric) */
  recordOrgMismatch(machine: string, orgId: string): void {
    this.counters.push({
      name: COMMERCE_METRIC.TRANSITION_ORG_MISMATCH,
      labels: { machine, org_id: orgId },
      value: 1,
      timestamp: Date.now(),
    })
  }

  // ── Saga Metrics ────────────────────────────────────────────────────

  /** Record a saga execution */
  recordSagaExecution(labels: SagaMetricLabels, durationMs: number): void {
    const baseLabels = { saga_name: labels.sagaName, org_id: labels.orgId, status: labels.status }
    const ts = Date.now()

    this.counters.push({ name: COMMERCE_METRIC.SAGA_EXECUTION_TOTAL, labels: baseLabels, value: 1, timestamp: ts })

    if (labels.status === 'completed') {
      this.counters.push({ name: COMMERCE_METRIC.SAGA_SUCCESS, labels: baseLabels, value: 1, timestamp: ts })
    } else if (labels.status === 'compensated') {
      this.counters.push({ name: COMMERCE_METRIC.SAGA_COMPENSATION, labels: baseLabels, value: 1, timestamp: ts })
    } else if (labels.status === 'failed') {
      this.counters.push({ name: COMMERCE_METRIC.SAGA_FAILURE, labels: baseLabels, value: 1, timestamp: ts })
    }

    this.histograms.push({ name: COMMERCE_METRIC.SAGA_DURATION_MS, labels: baseLabels, value: durationMs, timestamp: ts })
  }

  /** Record a single saga step duration */
  recordSagaStep(sagaName: string, stepName: string, durationMs: number): void {
    this.histograms.push({
      name: COMMERCE_METRIC.SAGA_STEP_DURATION_MS,
      labels: { saga_name: sagaName, step: stepName },
      value: durationMs,
      timestamp: Date.now(),
    })
  }

  // ── Governance Gate Metrics ─────────────────────────────────────────

  /** Record a governance gate evaluation */
  recordGateEvaluation(labels: GovernanceMetricLabels, passed: boolean): void {
    const baseLabels = { machine: labels.machine, gate: labels.gate, org_id: labels.orgId }
    const ts = Date.now()

    this.counters.push({ name: COMMERCE_METRIC.GOVERNANCE_GATE_EVALUATION_TOTAL, labels: baseLabels, value: 1, timestamp: ts })

    if (passed) {
      this.counters.push({ name: COMMERCE_METRIC.GOVERNANCE_GATE_PASS, labels: baseLabels, value: 1, timestamp: ts })
    } else {
      this.counters.push({ name: COMMERCE_METRIC.GOVERNANCE_GATE_FAIL, labels: baseLabels, value: 1, timestamp: ts })
    }
  }

  /** Record a governance override (emergency bypass) */
  recordGovernanceOverride(machine: string, orgId: string, reason: string): void {
    this.counters.push({
      name: COMMERCE_METRIC.GOVERNANCE_OVERRIDE,
      labels: { machine, org_id: orgId, reason },
      value: 1,
      timestamp: Date.now(),
    })
  }

  // ── Audit Metrics ───────────────────────────────────────────────────

  /** Record an audit entry creation */
  recordAuditEntry(entityType: string, action: string): void {
    this.counters.push({
      name: COMMERCE_METRIC.AUDIT_ENTRY_TOTAL,
      labels: { entity_type: entityType, action },
      value: 1,
      timestamp: Date.now(),
    })
  }

  /** Record an audit hash operation */
  recordAuditHash(durationMs: number): void {
    const ts = Date.now()
    this.counters.push({ name: COMMERCE_METRIC.AUDIT_HASH_TOTAL, labels: {}, value: 1, timestamp: ts })
    this.histograms.push({ name: COMMERCE_METRIC.AUDIT_HASH_DURATION_MS, labels: {}, value: durationMs, timestamp: ts })
  }

  // ── Evidence Metrics ────────────────────────────────────────────────

  /** Record an evidence pack generation */
  recordEvidencePack(controlFamily: string, artifactCount: number, durationMs: number): void {
    const ts = Date.now()
    this.counters.push({
      name: COMMERCE_METRIC.EVIDENCE_PACK_TOTAL,
      labels: { control_family: controlFamily },
      value: 1,
      timestamp: ts,
    })
    this.counters.push({
      name: COMMERCE_METRIC.EVIDENCE_ARTIFACT_TOTAL,
      labels: { control_family: controlFamily },
      value: artifactCount,
      timestamp: ts,
    })
    this.histograms.push({
      name: COMMERCE_METRIC.EVIDENCE_PACK_DURATION_MS,
      labels: { control_family: controlFamily },
      value: durationMs,
      timestamp: ts,
    })
  }

  /** Record an evidence seal operation */
  recordEvidenceSeal(controlFamily: string): void {
    this.counters.push({
      name: COMMERCE_METRIC.EVIDENCE_SEAL_TOTAL,
      labels: { control_family: controlFamily },
      value: 1,
      timestamp: Date.now(),
    })
  }

  // ── Snapshot / Reset ────────────────────────────────────────────────

  /** Get all collected metrics (for testing or scraping) */
  getSnapshot(): { counters: readonly MetricEntry[]; histograms: readonly HistogramEntry[] } {
    return {
      counters: [...this.counters],
      histograms: [...this.histograms],
    }
  }

  /** Get counters matching a metric name */
  getCounters(name: CommerceMetricName): readonly MetricEntry[] {
    return this.counters.filter((c) => c.name === name)
  }

  /** Get histograms matching a metric name */
  getHistograms(name: CommerceMetricName): readonly HistogramEntry[] {
    return this.histograms.filter((h) => h.name === name)
  }

  /** Reset all metrics (for testing) */
  reset(): void {
    this.counters = []
    this.histograms = []
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────

export const commerceMetrics = new CommerceMetrics()
