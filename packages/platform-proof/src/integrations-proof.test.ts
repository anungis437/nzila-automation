import { describe, it, expect, vi } from 'vitest'
import { generateIntegrationsProofSection, type IntegrationProviderSnapshot, type IntegrationsProofPorts } from './integrations-proof'

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeSnapshot(overrides?: Partial<IntegrationProviderSnapshot>): IntegrationProviderSnapshot {
  return {
    provider: 'resend',
    status: 'ok',
    successRate24h: 0.99,
    sentCount24h: 1000,
    failureCount24h: 10,
    circuitState: 'closed',
    circuitOpenCount: 0,
    dlqBacklogCount: 2,
    lastBreachAt: null,
    p95LatencyMs: 150,
    ...overrides,
  }
}

function makePorts(snapshots: IntegrationProviderSnapshot[]): IntegrationsProofPorts {
  return {
    fetchProviderSnapshots: vi.fn().mockResolvedValue(snapshots),
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('generateIntegrationsProofSection', () => {
  it('returns a well-formed section', async () => {
    const section = await generateIntegrationsProofSection('org-1', makePorts([makeSnapshot()]))

    expect(section.sectionType).toBe('integrations_health')
    expect(section.sectionId).toContain('int-proof-org-1')
    expect(section.providers).toHaveLength(1)
    expect(section.overallAvailability).toBeCloseTo(0.99)
    expect(section.totalDlqBacklog).toBe(2)
    expect(section.totalCircuitOpenCount).toBe(0)
    expect(section.activeSlaBreaches).toBe(0)
    expect(section.signatureHash).toMatch(/^[0-9a-f]{64}$/)
    expect(section.generatedAt).toBeTruthy()
  })

  it('aggregates across multiple providers', async () => {
    const snapshots = [
      makeSnapshot({ provider: 'resend', sentCount24h: 500, successRate24h: 0.98, dlqBacklogCount: 3, circuitOpenCount: 1 }),
      makeSnapshot({ provider: 'sendgrid', sentCount24h: 500, successRate24h: 1.0, dlqBacklogCount: 0, circuitOpenCount: 0 }),
    ]
    const section = await generateIntegrationsProofSection('org-1', makePorts(snapshots))

    expect(section.providers).toHaveLength(2)
    expect(section.totalDlqBacklog).toBe(3)
    expect(section.totalCircuitOpenCount).toBe(1)
    // (500*0.98 + 500*1.0) / 1000 = 0.99
    expect(section.overallAvailability).toBeCloseTo(0.99)
  })

  it('counts active SLA breaches', async () => {
    const snapshots = [
      makeSnapshot({ provider: 'resend', lastBreachAt: '2026-02-27T00:00:00Z' }),
      makeSnapshot({ provider: 'sendgrid', lastBreachAt: null }),
      makeSnapshot({ provider: 'slack', lastBreachAt: '2026-02-26T12:00:00Z' }),
    ]
    const section = await generateIntegrationsProofSection('org-1', makePorts(snapshots))

    expect(section.activeSlaBreaches).toBe(2)
  })

  it('handles empty providers', async () => {
    const section = await generateIntegrationsProofSection('org-1', makePorts([]))

    expect(section.providers).toHaveLength(0)
    expect(section.overallAvailability).toBe(1) // no data = assume compliant
    expect(section.totalDlqBacklog).toBe(0)
    expect(section.signatureHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('does not leak secrets in the section', async () => {
    const section = await generateIntegrationsProofSection('org-1', makePorts([makeSnapshot()]))

    const serialized = JSON.stringify(section)
    expect(serialized).not.toContain('PROOF_SIGNING_SECRET')
    expect(serialized).not.toContain('api_key')
    expect(serialized).not.toContain('password')
  })

  it('produces different signatures for different orgs', async () => {
    const ports = makePorts([makeSnapshot()])
    const section1 = await generateIntegrationsProofSection('org-1', ports)
    const section2 = await generateIntegrationsProofSection('org-2', ports)

    expect(section1.signatureHash).not.toBe(section2.signatureHash)
  })
})
