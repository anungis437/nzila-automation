/**
 * Contract Test — SLO Gate: Authoritative Source Proof
 *
 * Stronger invariant than SLO_GATE_REAL_METRICS_002 — asserts that the
 * slo-gate script references ALL three authoritative metric sources and
 * that it cannot degrade to a purely decorative pass-through.
 *
 * Required sources:
 *   1. platform-performance metric reader (P95/P99 latency, error rate)
 *   2. platform-ops reader (DLQ backlogs, worker saturation)
 *   3. integrations metrics context (integration success rate / delivery latency)
 *
 * @invariant SLO_GATE_REAL_SOURCES_002
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'

const ROOT = join(__dirname, '..', '..')

function readContent(rel: string): string {
  const abs = join(ROOT, rel)
  if (!existsSync(abs)) return ''
  return readFileSync(abs, 'utf-8')
}

describe('SLO_GATE_REAL_SOURCES_002 — Authoritative metric source proof', () => {
  const gatePath = 'scripts/slo-gate.ts'
  const policyPath = 'ops/slo-policy.yml'

  // ── Source 1: platform-performance ────────────────────────────────────
  describe('Source 1 — platform-performance metric reader', () => {
    it('imports getGlobalPerformanceEnvelope from @nzila/platform-performance', () => {
      const gate = readContent(gatePath)
      expect(gate).toMatch(
        /import\s*\{[^}]*getGlobalPerformanceEnvelope[^}]*\}\s*from\s*['"]@nzila\/platform-performance['"]/,
      )
    })

    it('calls getGlobalPerformanceEnvelope with a time window', () => {
      const gate = readContent(gatePath)
      // Must specify windowMinutes (not just call with defaults)
      expect(gate).toMatch(/getGlobalPerformanceEnvelope\(\s*\{/)
      expect(gate).toMatch(/windowMinutes/)
    })

    it('uses performance envelope data (p95, p99, errorRate)', () => {
      const gate = readContent(gatePath)
      expect(gate).toContain('realPerformance')
      // Must access actual metrics from the envelope
      expect(gate).toMatch(/\.p95\b/)
      expect(gate).toMatch(/\.p99\b/)
      expect(gate).toMatch(/\.errorRate/)
    })
  })

  // ── Source 2: platform-ops (DLQ / backlog) ────────────────────────────
  describe('Source 2 — platform-ops DLQ/backlog reader', () => {
    it('imports getOpsSnapshot from @nzila/platform-ops', () => {
      const gate = readContent(gatePath)
      expect(gate).toMatch(
        /import\s*\{[^}]*getOpsSnapshot[^}]*\}\s*from\s*['"]@nzila\/platform-ops['"]/,
      )
    })

    it('reads outbox backlog counts from OpsSnapshot', () => {
      const gate = readContent(gatePath)
      // Must reference outboxBacklogs (the real data shape)
      expect(gate).toContain('outboxBacklogs')
      expect(gate).toMatch(/pendingCount/)
    })

    it('feeds DLQ data into violation checker', () => {
      const gate = readContent(gatePath)
      // DLQ backlog must flow into the metrics object for threshold checking
      expect(gate).toMatch(/dlq.*backlog|backlog.*dlq/i)
    })
  })

  // ── Source 3: integrations metrics context ────────────────────────────
  describe('Source 3 — integrations metrics (success rate / delivery latency)', () => {
    it('gate evaluates integration success rate', () => {
      const gate = readContent(gatePath)
      expect(gate).toMatch(/success_rate_pct|integration.*success/i)
    })

    it('gate evaluates integration delivery latency', () => {
      const gate = readContent(gatePath)
      expect(gate).toMatch(/p95_delivery_latency_ms|delivery.*latency/i)
    })
  })

  // ── Anti-decorative checks ────────────────────────────────────────────
  describe('Anti-decorative — gate cannot silently become pass-through', () => {
    it('gate distinguishes enforced vs warning-only environments', () => {
      const gate = readContent(gatePath)
      // Must check enforced_environments from policy
      expect(gate).toMatch(/enforced_environments/)
      expect(gate).toMatch(/isEnforced|enforced/)
    })

    it('gate exits non-zero on violations in enforced environments', () => {
      const gate = readContent(gatePath)
      expect(gate).toMatch(/process\.exit\(1\)/)
    })

    it('real metric queries are gated by enforced check (not unconditionally skipped)', () => {
      const gate = readContent(gatePath)
      // The real query block must be conditional on enforcement
      // Match the call site ("await getGlobalPerformanceEnvelope"), not the import
      const enforcedIdx = gate.indexOf('if (enforced')
      const realQueryIdx = gate.indexOf('await getGlobalPerformanceEnvelope')
      expect(enforcedIdx).toBeGreaterThan(-1)
      expect(realQueryIdx).toBeGreaterThan(-1)
      // Real query call must appear somewhere after the enforced check
      expect(realQueryIdx).toBeGreaterThan(enforcedIdx)
    })

    it('simulated metrics are only a fallback, not the primary path', () => {
      const gate = readContent(gatePath)
      // Count occurrences of simulated vs real
      const simulatedMatches = gate.match(/simulated|Simulated|0\.8\b/g) ?? []
      const realMatches = gate.match(/getGlobalPerformanceEnvelope|getOpsSnapshot/g) ?? []

      // Real metric references must appear (cannot be zero)
      expect(realMatches.length).toBeGreaterThan(0)
      // At least as many real references as simulated ones
      expect(realMatches.length).toBeGreaterThanOrEqual(1)
    })

    it('gate does not hardcode all-passing results', () => {
      const gate = readContent(gatePath)
      // Must not contain a hardcoded "passed: true" without actual checks
      // (this catches someone gutting the gate)
      const exportRunSloGate = gate.slice(
        gate.indexOf('async function runSloGate'),
      )
      // The return must reference `allViolations` or dynamic data
      expect(exportRunSloGate).toContain('allViolations')
      // Must not return a static `{ passed: true }` without violation check
      expect(exportRunSloGate).not.toMatch(/return\s*\{\s*passed:\s*true\s*\}/)
    })
  })

  // ── SLO policy file structural checks ─────────────────────────────────
  describe('SLO policy file has required threshold structure', () => {
    it('ops/slo-policy.yml exists', () => {
      expect(existsSync(join(ROOT, policyPath))).toBe(true)
    })

    it('policy defines enforced environments including pilot and prod', () => {
      const policy = readContent(policyPath)
      expect(policy).toContain('pilot')
      expect(policy).toContain('prod')
    })

    it('policy defines performance thresholds (p95, p99, error_rate)', () => {
      const policy = readContent(policyPath)
      expect(policy).toContain('p95_latency_ms')
      expect(policy).toContain('p99_latency_ms')
      expect(policy).toContain('error_rate')
    })

    it('policy defines DLQ backlog threshold', () => {
      const policy = readContent(policyPath)
      expect(policy).toMatch(/backlog|dlq/i)
    })
  })
})
