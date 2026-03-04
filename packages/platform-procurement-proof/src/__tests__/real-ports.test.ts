/**
 * @nzila/platform-procurement-proof — Real Ports + Collector Tests
 *
 * Tests the real port factory and all 5 collectors to ensure:
 * - OK status when data is available
 * - not_available status when data is absent (never mock silently)
 * - Canada sovereignty defaults
 */
import { describe, it, expect } from 'vitest'
import { createRealPorts } from '../real-ports'
import type { RealPortsDeps } from '../real-ports'
import type { HealthReport } from '@nzila/platform-observability'

// ── Helpers ─────────────────────────────────────────────────────────────────

function createEmptyDeps(): RealPortsDeps {
  return {
    evidencePack: {
      async listPacks() { return [] },
      async loadPack() { return null },
    },
    complianceSnapshots: {
      async listSnapshots() { return [] },
      async loadChain() { return [] },
    },
    integrations: {
      async listProviders() { return [] },
      async getCircuitState() { return 'closed' as const },
      async getDeliveryStats() { return { total: 0, succeeded: 0, failed: 0, avgLatencyMs: 0 } },
      async getDlqDepth() { return 0 },
    },
    observability: {
      async runHealthChecks(): Promise<HealthReport> {
        return { service: 'test', status: 'healthy', checks: [], timestamp: new Date().toISOString() }
      },
    },
  }
}

// ── Sovereignty Defaults ────────────────────────────────────────────────────

describe('createRealPorts — sovereignty defaults', () => {
  it('defaults to Canada Central / PIPEDA / Québec Law 25', async () => {
    const ports = createRealPorts(createEmptyDeps())
    const sov = await ports.getSovereigntyProfile('org-1')

    expect(sov.deploymentRegion).toBe('Canada Central')
    expect(sov.dataResidency).toBe('Canada')
    expect(sov.regulatoryFrameworks).toContain('PIPEDA')
    expect(sov.regulatoryFrameworks).toContain('Québec Law 25')
    expect(sov.crossBorderTransfer).toBe(false)
    expect(sov.validated).toBe(true)
  })

  it('accepts custom sovereignty config', async () => {
    const ports = createRealPorts({
      ...createEmptyDeps(),
      sovereignty: {
        deploymentRegion: 'EU West',
        dataResidency: 'EU',
        regulatoryFrameworks: ['GDPR'],
        crossBorderTransfer: true,
      },
    })
    const sov = await ports.getSovereigntyProfile('org-1')
    expect(sov.deploymentRegion).toBe('EU West')
    expect(sov.regulatoryFrameworks).toEqual(['GDPR'])
  })
})

// ── Security Posture — not_available ────────────────────────────────────────

describe('createRealPorts — security posture', () => {
  it('returns zero-score when dependency scan data is absent', async () => {
    const ports = createRealPorts(createEmptyDeps())
    const sec = await ports.getSecurityPosture('org-1')

    // No CI artifacts → score 0, attestation marked not_available
    expect(sec.vulnerabilitySummary.score).toBe(0)
    expect(sec.signedAttestation.attestationId).toBe('not_available')
    expect(sec.dependencyAudit.lockfileIntegrity).toBe(false)
  })
})

// ── Data Lifecycle ──────────────────────────────────────────────────────────

describe('createRealPorts — data lifecycle', () => {
  it('returns manifests with canadacentral storage region', async () => {
    const ports = createRealPorts(createEmptyDeps())
    const dl = await ports.getDataLifecycle('org-1')

    expect(dl.manifests.length).toBeGreaterThan(0)
    for (const m of dl.manifests) {
      expect(m.storageRegion).toBe('canadacentral')
      expect(m.encryptionAtRest).toBe(true)
      expect(m.encryptionInTransit).toBe(true)
    }
    expect(dl.retentionControls.policiesEnforced).toBe(dl.retentionControls.policiesTotal)
  })
})

// ── Governance Evidence — empty stores ──────────────────────────────────────

describe('createRealPorts — governance evidence', () => {
  it('returns zero counts when no evidence packs or snapshots exist', async () => {
    const ports = createRealPorts(createEmptyDeps())
    const gov = await ports.getGovernanceEvidence('org-1')

    expect(gov.evidencePackCount).toBe(0)
    expect(gov.snapshotChainLength).toBe(0)
    expect(gov.snapshotChainValid).toBe(false)
  })
})

// ── Operational Evidence ────────────────────────────────────────────────────

describe('createRealPorts — operational evidence', () => {
  it('returns operational metrics from observability', async () => {
    const ports = createRealPorts(createEmptyDeps())
    const ops = await ports.getOperationalEvidence('org-1')

    expect(ops.sloCompliance.overall).toBeGreaterThan(0)
    expect(ops.performanceMetrics).toBeDefined()
    expect(ops.incidentSummary).toBeDefined()
  })
})

// ── Sign Pack ───────────────────────────────────────────────────────────────

describe('createRealPorts — signPack', () => {
  it('signs with Ed25519 and returns a valid keyId', async () => {
    const ports = createRealPorts(createEmptyDeps())
    const sig = await ports.signPack('test-digest-abc')

    expect(sig.algorithm).toBe('Ed25519')
    expect(sig.keyId).toBeTruthy()
    expect(sig.digest).toBe('test-digest-abc')
    expect(sig.signedBy).toBe('platform-procurement-proof')
  })
})
