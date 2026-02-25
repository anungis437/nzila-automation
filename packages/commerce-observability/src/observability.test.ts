/**
 * @nzila/commerce-observability — Tests
 *
 * Tests for metrics, spans, SLO definitions, structured logging, and health checks.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  COMMERCE_METRIC,
  CommerceMetrics,
  buildTransitionSpanAttrs,
  buildSagaSpanAttrs,
  buildGateSpanAttrs,
  buildEvidenceSpanAttrs,
  COMMERCE_SPAN,
  COMMERCE_SPAN_ATTR,
  COMMERCE_SLOS,
  COMMERCE_ALERT_RULES,
  logTransition,
  logSagaExecution,
  logGovernanceGate,
  logOrgMismatch,
  logEvidencePack,
  logAuditTrail,
  buildHealthResult,
  aggregateHealth,
  COMMERCE_HEALTH_CHECKS,
} from './index'

// ═══════════════════════════════════════════════════════════════════════════
// 1. METRICS
// ═══════════════════════════════════════════════════════════════════════════

describe('CommerceMetrics — RED metrics collection', () => {
  let metrics: CommerceMetrics

  beforeEach(() => {
    metrics = new CommerceMetrics()
  })

  // ── Transition metrics ────────────────────────────────────────────────

  it('records successful transition metric', () => {
    metrics.recordTransition(
      { machine: 'quote', from: 'draft', to: 'pricing', orgId: 'org-1' },
      true, 12,
    )

    const total = metrics.getCounters(COMMERCE_METRIC.TRANSITION_TOTAL)
    expect(total).toHaveLength(1)
    expect(total[0]!.labels.machine).toBe('quote')
    expect(total[0]!.labels.org_id).toBe('org-1')

    const success = metrics.getCounters(COMMERCE_METRIC.TRANSITION_SUCCESS)
    expect(success).toHaveLength(1)

    const failure = metrics.getCounters(COMMERCE_METRIC.TRANSITION_FAILURE)
    expect(failure).toHaveLength(0)

    const duration = metrics.getHistograms(COMMERCE_METRIC.TRANSITION_DURATION_MS)
    expect(duration).toHaveLength(1)
    expect(duration[0]!.value).toBe(12)
  })

  it('records failed transition metric', () => {
    metrics.recordTransition(
      { machine: 'order', from: 'created', to: 'confirmed', orgId: 'org-2' },
      false, 5,
    )

    const success = metrics.getCounters(COMMERCE_METRIC.TRANSITION_SUCCESS)
    expect(success).toHaveLength(0)

    const failure = metrics.getCounters(COMMERCE_METRIC.TRANSITION_FAILURE)
    expect(failure).toHaveLength(1)
    expect(failure[0]!.labels.machine).toBe('order')
  })

  it('records org mismatch as security metric', () => {
    metrics.recordOrgMismatch('quote', 'org-attacker')

    const mismatches = metrics.getCounters(COMMERCE_METRIC.TRANSITION_ORG_MISMATCH)
    expect(mismatches).toHaveLength(1)
    expect(mismatches[0]!.labels.org_id).toBe('org-attacker')
  })

  // ── Saga metrics ──────────────────────────────────────────────────────

  it('records saga execution with completed status', () => {
    metrics.recordSagaExecution(
      { sagaName: 'quote-to-order', orgId: 'org-1', status: 'completed' },
      150,
    )

    const total = metrics.getCounters(COMMERCE_METRIC.SAGA_EXECUTION_TOTAL)
    expect(total).toHaveLength(1)

    const success = metrics.getCounters(COMMERCE_METRIC.SAGA_SUCCESS)
    expect(success).toHaveLength(1)

    const compensation = metrics.getCounters(COMMERCE_METRIC.SAGA_COMPENSATION)
    expect(compensation).toHaveLength(0)
  })

  it('records saga execution with compensated status', () => {
    metrics.recordSagaExecution(
      { sagaName: 'quote-to-order', orgId: 'org-1', status: 'compensated' },
      300,
    )

    const compensation = metrics.getCounters(COMMERCE_METRIC.SAGA_COMPENSATION)
    expect(compensation).toHaveLength(1)
  })

  it('records saga execution with failed status', () => {
    metrics.recordSagaExecution(
      { sagaName: 'order-to-invoice', orgId: 'org-1', status: 'failed' },
      500,
    )

    const failure = metrics.getCounters(COMMERCE_METRIC.SAGA_FAILURE)
    expect(failure).toHaveLength(1)
  })

  it('records individual saga step duration', () => {
    metrics.recordSagaStep('quote-to-order', 'create-order', 45)

    const steps = metrics.getHistograms(COMMERCE_METRIC.SAGA_STEP_DURATION_MS)
    expect(steps).toHaveLength(1)
    expect(steps[0]!.labels.step).toBe('create-order')
  })

  // ── Governance gate metrics ───────────────────────────────────────────

  it('records governance gate pass', () => {
    metrics.recordGateEvaluation(
      { machine: 'quote', gate: 'approval-threshold', orgId: 'org-1' },
      true,
    )

    const pass = metrics.getCounters(COMMERCE_METRIC.GOVERNANCE_GATE_PASS)
    expect(pass).toHaveLength(1)
    expect(pass[0]!.labels.gate).toBe('approval-threshold')
  })

  it('records governance gate fail', () => {
    metrics.recordGateEvaluation(
      { machine: 'invoice', gate: 'evidence-required', orgId: 'org-1' },
      false,
    )

    const fail = metrics.getCounters(COMMERCE_METRIC.GOVERNANCE_GATE_FAIL)
    expect(fail).toHaveLength(1)
  })

  it('records governance override with reason', () => {
    metrics.recordGovernanceOverride('quote', 'org-1', 'emergency-approval')

    const overrides = metrics.getCounters(COMMERCE_METRIC.GOVERNANCE_OVERRIDE)
    expect(overrides).toHaveLength(1)
    expect(overrides[0]!.labels.reason).toBe('emergency-approval')
  })

  // ── Audit metrics ─────────────────────────────────────────────────────

  it('records audit entry creation', () => {
    metrics.recordAuditEntry('quote', 'state_transition')

    const entries = metrics.getCounters(COMMERCE_METRIC.AUDIT_ENTRY_TOTAL)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.labels.entity_type).toBe('quote')
  })

  it('records audit hash with duration', () => {
    metrics.recordAuditHash(3)

    const hashes = metrics.getCounters(COMMERCE_METRIC.AUDIT_HASH_TOTAL)
    expect(hashes).toHaveLength(1)

    const duration = metrics.getHistograms(COMMERCE_METRIC.AUDIT_HASH_DURATION_MS)
    expect(duration).toHaveLength(1)
    expect(duration[0]!.value).toBe(3)
  })

  // ── Evidence metrics ──────────────────────────────────────────────────

  it('records evidence pack generation', () => {
    metrics.recordEvidencePack('SOC2-CC6.1', 3, 200)

    const packs = metrics.getCounters(COMMERCE_METRIC.EVIDENCE_PACK_TOTAL)
    expect(packs).toHaveLength(1)
    expect(packs[0]!.labels.control_family).toBe('SOC2-CC6.1')

    const artifacts = metrics.getCounters(COMMERCE_METRIC.EVIDENCE_ARTIFACT_TOTAL)
    expect(artifacts).toHaveLength(1)
    expect(artifacts[0]!.value).toBe(3)

    const duration = metrics.getHistograms(COMMERCE_METRIC.EVIDENCE_PACK_DURATION_MS)
    expect(duration).toHaveLength(1)
  })

  it('records evidence seal operation', () => {
    metrics.recordEvidenceSeal('SOC2-CC6.1')

    const seals = metrics.getCounters(COMMERCE_METRIC.EVIDENCE_SEAL_TOTAL)
    expect(seals).toHaveLength(1)
  })

  // ── Snapshot / Reset ──────────────────────────────────────────────────

  it('getSnapshot returns all metrics', () => {
    metrics.recordTransition(
      { machine: 'quote', from: 'draft', to: 'pricing', orgId: 'org-1' },
      true, 10,
    )
    metrics.recordSagaExecution(
      { sagaName: 'test', orgId: 'org-1', status: 'completed' },
      50,
    )

    const snapshot = metrics.getSnapshot()
    expect(snapshot.counters.length).toBeGreaterThan(0)
    expect(snapshot.histograms.length).toBeGreaterThan(0)
  })

  it('reset clears all metrics', () => {
    metrics.recordTransition(
      { machine: 'quote', from: 'draft', to: 'pricing', orgId: 'org-1' },
      true, 10,
    )
    metrics.reset()

    const snapshot = metrics.getSnapshot()
    expect(snapshot.counters).toHaveLength(0)
    expect(snapshot.histograms).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 2. SPAN ATTRIBUTE BUILDERS
// ═══════════════════════════════════════════════════════════════════════════

describe('Span Attribute Builders — distributed tracing', () => {
  it('buildTransitionSpanAttrs sets all commerce attributes', () => {
    const attrs = buildTransitionSpanAttrs('quote', 'draft', 'pricing', 'org-1')

    expect(attrs[COMMERCE_SPAN_ATTR.MACHINE]).toBe('quote')
    expect(attrs[COMMERCE_SPAN_ATTR.FROM_STATE]).toBe('draft')
    expect(attrs[COMMERCE_SPAN_ATTR.TO_STATE]).toBe('pricing')
    expect(attrs[COMMERCE_SPAN_ATTR.ENTITY_ID]).toBe('org-1')
  })

  it('buildSagaSpanAttrs sets saga-specific attributes', () => {
    const attrs = buildSagaSpanAttrs('quote-to-order', 'org-1', 'actor-1')

    expect(attrs[COMMERCE_SPAN_ATTR.SAGA_NAME]).toBe('quote-to-order')
    expect(attrs[COMMERCE_SPAN_ATTR.ENTITY_ID]).toBe('org-1')
    expect(attrs[COMMERCE_SPAN_ATTR.ACTOR_ID]).toBe('actor-1')
  })

  it('buildGateSpanAttrs sets gate evaluation attributes', () => {
    const attrs = buildGateSpanAttrs('quote', 'approval-threshold', 'org-1', true)

    expect(attrs[COMMERCE_SPAN_ATTR.MACHINE]).toBe('quote')
    expect(attrs[COMMERCE_SPAN_ATTR.GATE_NAME]).toBe('approval-threshold')
    expect(attrs[COMMERCE_SPAN_ATTR.GATE_PASSED]).toBe(true)
  })

  it('buildEvidenceSpanAttrs sets evidence pack attributes', () => {
    const attrs = buildEvidenceSpanAttrs('pack-001', 'SOC2-CC6.1', 'org-1')

    expect(attrs[COMMERCE_SPAN_ATTR.EVIDENCE_PACK_ID]).toBe('pack-001')
    expect(attrs[COMMERCE_SPAN_ATTR.CONTROL_FAMILY]).toBe('SOC2-CC6.1')
    expect(attrs[COMMERCE_SPAN_ATTR.ENTITY_ID]).toBe('org-1')
  })

  it('span name constants are defined', () => {
    expect(COMMERCE_SPAN.TRANSITION).toBe('commerce.transition')
    expect(COMMERCE_SPAN.SAGA_EXECUTE).toBe('commerce.saga.execute')
    expect(COMMERCE_SPAN.SAGA_STEP).toBe('commerce.saga.step')
    expect(COMMERCE_SPAN.GOVERNANCE_EVALUATE).toBe('commerce.governance.evaluate')
    expect(COMMERCE_SPAN.EVIDENCE_PACK).toBe('commerce.evidence.pack')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 3. SLO DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

describe('Commerce SLO Definitions — codified targets', () => {
  it('defines SLOs for all commerce services', () => {
    const services = new Set(COMMERCE_SLOS.map((s) => s.service))
    expect(services).toContain('commerce-state')
    expect(services).toContain('commerce-sagas')
    expect(services).toContain('commerce-governance')
    expect(services).toContain('commerce-audit')
    expect(services).toContain('commerce-evidence')
  })

  it('all SLOs have valid targets (0-100)', () => {
    for (const slo of COMMERCE_SLOS) {
      expect(slo.target).toBeGreaterThanOrEqual(0)
      expect(slo.target).toBeLessThanOrEqual(100)
    }
  })

  it('all SLOs have runbook links', () => {
    for (const slo of COMMERCE_SLOS) {
      expect(slo.runbook).toMatch(/^ops\/runbooks\/commerce\//)
    }
  })

  it('all SLOs have severity levels', () => {
    for (const slo of COMMERCE_SLOS) {
      expect(['P1', 'P2', 'P3', 'P4']).toContain(slo.severity)
    }
  })

  it('org mismatch SLO is P1 severity', () => {
    const orgMismatch = COMMERCE_SLOS.find((s) => s.name === 'org-mismatch-rate')
    expect(orgMismatch).toBeDefined()
    expect(orgMismatch!.severity).toBe('P1')
  })

  it('audit completeness SLO is P1 with 100% target', () => {
    const audit = COMMERCE_SLOS.find((s) => s.name === 'audit-completeness')
    expect(audit).toBeDefined()
    expect(audit!.target).toBe(100)
    expect(audit!.severity).toBe('P1')
  })

  it('governance override SLO is P1', () => {
    const override = COMMERCE_SLOS.find((s) => s.name === 'override-rate')
    expect(override).toBeDefined()
    expect(override!.severity).toBe('P1')
  })
})

describe('Commerce Alert Rules — derived from SLOs', () => {
  it('each alert rule references a valid SLO', () => {
    const sloNames = new Set(COMMERCE_SLOS.map((s) => s.name))
    for (const rule of COMMERCE_ALERT_RULES) {
      expect(sloNames).toContain(rule.sloName)
    }
  })

  it('all alert rules have KQL queries', () => {
    for (const rule of COMMERCE_ALERT_RULES) {
      expect(rule.kqlQuery).toBeTruthy()
      expect(rule.kqlQuery.length).toBeGreaterThan(10)
    }
  })

  it('all alert rules have runbook links', () => {
    for (const rule of COMMERCE_ALERT_RULES) {
      expect(rule.runbook).toMatch(/^ops\/runbooks\/commerce\//)
    }
  })

  it('P1 alerts evaluate more frequently than P3', () => {
    const p1Rules = COMMERCE_ALERT_RULES.filter((r) => r.severity === 'P1')
    const p3Rules = COMMERCE_ALERT_RULES.filter((r) => r.severity === 'P3')

    expect(p1Rules.length).toBeGreaterThan(0)
    expect(p3Rules.length).toBeGreaterThan(0)

    const maxP1Freq = Math.max(...p1Rules.map((r) => r.evaluationFrequencyMinutes))
    const minP3Freq = Math.min(...p3Rules.map((r) => r.evaluationFrequencyMinutes))

    expect(maxP1Freq).toBeLessThanOrEqual(minP3Freq)
  })

  it('org mismatch alert is P1 with 5-minute evaluation', () => {
    const orgMismatch = COMMERCE_ALERT_RULES.find((r) => r.name === 'commerce-org-mismatch-spike')
    expect(orgMismatch).toBeDefined()
    expect(orgMismatch!.severity).toBe('P1')
    expect(orgMismatch!.evaluationFrequencyMinutes).toBe(5)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 4. STRUCTURED LOGGING
// ═══════════════════════════════════════════════════════════════════════════

describe('Structured Logging — commerce log builders', () => {
  const ctx = { orgId: 'org-1', correlationId: 'corr-1', actorId: 'actor-1' }

  it('logTransition produces info level for success', () => {
    const entry = logTransition(ctx, 'quote', 'draft', 'pricing', true)

    expect(entry.level).toBe('info')
    expect(entry.module).toBe('commerce-state')
    expect(entry.orgId).toBe('org-1')
    expect(entry.message).toContain('draft')
    expect(entry.message).toContain('pricing')
    expect(entry.timestamp).toBeTruthy()
    expect(entry.data?.ok).toBe(true)
  })

  it('logTransition produces warn level for blocked transitions', () => {
    const entry = logTransition(ctx, 'order', 'created', 'confirmed', false, { code: 'GUARD_FAILED' })

    expect(entry.level).toBe('warn')
    expect(entry.message).toContain('BLOCKED')
    expect(entry.data?.code).toBe('GUARD_FAILED')
  })

  it('logSagaExecution uses correct level per status', () => {
    const completed = logSagaExecution(ctx, 'quote-to-order', 'completed', ['s1', 's2'])
    expect(completed.level).toBe('info')

    const compensated = logSagaExecution(ctx, 'quote-to-order', 'compensated', ['s1'], 'step-2 failed')
    expect(compensated.level).toBe('warn')

    const failed = logSagaExecution(ctx, 'quote-to-order', 'failed', [], 'catastrophic')
    expect(failed.level).toBe('error')
  })

  it('logGovernanceGate produces debug for pass, warn for fail', () => {
    const pass = logGovernanceGate(ctx, 'quote', 'approval-threshold', true)
    expect(pass.level).toBe('debug')

    const fail = logGovernanceGate(ctx, 'quote', 'approval-threshold', false, 'amount exceeds threshold')
    expect(fail.level).toBe('warn')
    expect(fail.message).toContain('amount exceeds threshold')
  })

  it('logOrgMismatch is always error level with security flag', () => {
    const entry = logOrgMismatch(ctx, 'quote', 'org-attacker', 'org-victim')

    expect(entry.level).toBe('error')
    expect(entry.message).toContain('ORG MISMATCH')
    expect(entry.data?.securityEvent).toBe(true)
    expect(entry.data?.attemptedOrgId).toBe('org-attacker')
    expect(entry.data?.resourceOrgId).toBe('org-victim')
  })

  it('logEvidencePack handles valid and invalid packs', () => {
    const valid = logEvidencePack(ctx, 'pack-1', 'SOC2-CC6.1', 3, true)
    expect(valid.level).toBe('info')
    expect(valid.message).toContain('pack-1')

    const invalid = logEvidencePack(ctx, 'pack-2', 'SOC2-CC6.1', 0, false)
    expect(invalid.level).toBe('error')
    expect(invalid.message).toContain('VALIDATION FAILED')
  })

  it('logAuditTrail includes entity context', () => {
    const entry = logAuditTrail(ctx, 'quote', 'state_transition', 'entity-1')

    expect(entry.module).toBe('commerce-audit')
    expect(entry.data?.entityType).toBe('quote')
    expect(entry.data?.action).toBe('state_transition')
  })

  it('all log entries include orgId and timestamp', () => {
    const entries = [
      logTransition(ctx, 'quote', 'a', 'b', true),
      logSagaExecution(ctx, 's', 'completed', []),
      logGovernanceGate(ctx, 'q', 'g', true),
      logOrgMismatch(ctx, 'q', 'a', 'b'),
      logEvidencePack(ctx, 'p', 'c', 1, true),
      logAuditTrail(ctx, 'q', 'a', 'e'),
    ]

    for (const entry of entries) {
      expect(entry.orgId).toBe('org-1')
      expect(entry.timestamp).toBeTruthy()
      expect(entry.correlationId).toBe('corr-1')
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 5. HEALTH CHECKS
// ═══════════════════════════════════════════════════════════════════════════

describe('Health Check Definitions', () => {
  it('defines health checks for all commerce subsystems', () => {
    expect(COMMERCE_HEALTH_CHECKS.STATE_MACHINE.module).toBe('commerce-state')
    expect(COMMERCE_HEALTH_CHECKS.GOVERNANCE.module).toBe('commerce-governance')
    expect(COMMERCE_HEALTH_CHECKS.EVENT_BUS.module).toBe('commerce-events')
    expect(COMMERCE_HEALTH_CHECKS.AUDIT_TRAIL.module).toBe('commerce-audit')
    expect(COMMERCE_HEALTH_CHECKS.EVIDENCE_PACKS.module).toBe('commerce-evidence')
  })

  it('buildHealthResult creates properly formatted result', () => {
    const result = buildHealthResult('healthy', 'All systems operational', { latencyMs: 5 })

    expect(result.status).toBe('healthy')
    expect(result.message).toBe('All systems operational')
    expect(result.timestamp).toBeTruthy()
    expect(result.details?.latencyMs).toBe(5)
  })

  it('aggregateHealth returns healthy when all checks pass', () => {
    const results = [
      buildHealthResult('healthy', 'ok'),
      buildHealthResult('healthy', 'ok'),
      buildHealthResult('healthy', 'ok'),
    ]

    const summary = aggregateHealth(results)
    expect(summary.overall).toBe('healthy')
    expect(summary.checks).toHaveLength(3)
  })

  it('aggregateHealth returns degraded when any check is degraded', () => {
    const results = [
      buildHealthResult('healthy', 'ok'),
      buildHealthResult('degraded', 'slow'),
      buildHealthResult('healthy', 'ok'),
    ]

    const summary = aggregateHealth(results)
    expect(summary.overall).toBe('degraded')
  })

  it('aggregateHealth returns unhealthy when any check is unhealthy', () => {
    const results = [
      buildHealthResult('healthy', 'ok'),
      buildHealthResult('degraded', 'slow'),
      buildHealthResult('unhealthy', 'down'),
    ]

    const summary = aggregateHealth(results)
    expect(summary.overall).toBe('unhealthy')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 6. METRIC NAME CONSTANTS — completeness
// ═══════════════════════════════════════════════════════════════════════════

describe('Metric Name Constants — namespace consistency', () => {
  it('all metric names are prefixed with commerce_', () => {
    for (const [, value] of Object.entries(COMMERCE_METRIC)) {
      expect(value).toMatch(/^commerce_/)
    }
  })

  it('covers transition, saga, governance, audit, evidence domains', () => {
    const prefixes = Object.values(COMMERCE_METRIC).map((m) => m.split('_')[1])
    const domains = new Set(prefixes)

    expect(domains).toContain('transition')
    expect(domains).toContain('saga')
    expect(domains).toContain('governance')
    expect(domains).toContain('audit')
    expect(domains).toContain('evidence')
  })
})
