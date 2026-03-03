/**
 * Nzila OS — Pilot Summary Export Unit Tests
 *
 * Tests for bundle generation, hash computation, and port injection.
 * No DB dependency — pure logic tests.
 */
import { describe, it, expect } from 'vitest'
import {
  generatePilotSummary,
  computeBundleHash,
  createDefaultPilotPorts,
  type PilotExportPorts,
} from '../src/pilot-export'

function createTestPorts(): PilotExportPorts {
  return {
    getRelease: async () => ({
      version: '1.2.3',
      commitSha: 'abc123',
      buildTimestamp: '2026-03-03T00:00:00.000Z',
      contractTestHash: 'sha256:deadbeef',
      ciPipelineStatus: 'pass',
    }),
    getSloSummary: async () => ({
      totalMetrics: 10,
      compliantCount: 9,
      violationCount: 1,
      compliancePct: 90,
      highlights: ['p95 latency slightly elevated on ABR'],
    }),
    getLifecycle: async () => ({
      retentionPolicyActive: true,
      gdprCompliant: true,
      dataClassification: 'internal',
      lastPurgeDate: '2026-02-28',
    }),
    getIntegrity: async () => ({
      auditIntegrityHash: 'sha256:integrity123',
      secretScanStatus: 'pass',
      redTeamSummary: 'No findings',
      tamperProofStatus: 'verified' as const,
    }),
    getOpsDigest: async () => ({
      generatedAt: '2026-03-03T00:00:00.000Z',
      sloViolations: 1,
      warnings: 1,
      criticals: 0,
      opsConfidenceScore: 85,
      opsConfidenceGrade: 'B',
    }),
    getIsolation: async () => ({
      isolationVerified: true,
      tenantsChecked: 5,
      crossTenantLeaks: 0,
    }),
  }
}

describe('generatePilotSummary', () => {
  it('generates a complete bundle with all sections', async () => {
    const ports = createTestPorts()
    const bundle = await generatePilotSummary(ports)

    expect(bundle.platformName).toBe('Nzila OS')
    expect(bundle.exportVersion).toBe('1.0.0')
    expect(bundle.exportedAt).toBeTruthy()

    // Release
    expect(bundle.release.version).toBe('1.2.3')
    expect(bundle.release.commitSha).toBe('abc123')
    expect(bundle.release.ciPipelineStatus).toBe('pass')

    // SLO
    expect(bundle.slo.totalMetrics).toBe(10)
    expect(bundle.slo.compliancePct).toBe(90)

    // Lifecycle
    expect(bundle.lifecycle.retentionPolicyActive).toBe(true)
    expect(bundle.lifecycle.gdprCompliant).toBe(true)

    // Integrity
    expect(bundle.integrity.tamperProofStatus).toBe('verified')

    // Ops digest
    expect(bundle.opsDigest.opsConfidenceScore).toBe(85)
    expect(bundle.opsDigest.opsConfidenceGrade).toBe('B')

    // Isolation
    expect(bundle.isolation.isolationVerified).toBe(true)
    expect(bundle.isolation.crossTenantLeaks).toBe(0)

    // Signature
    expect(bundle.signatureHash).toMatch(/^sha256:/)
  })

  it('produces a deterministic hash for the same content', async () => {
    const content = {
      exportedAt: '2026-03-03T00:00:00.000Z',
      exportVersion: '1.0.0',
      platformName: 'Nzila OS',
      release: { version: '1.0.0', commitSha: 'aaa', buildTimestamp: '', contractTestHash: '', ciPipelineStatus: 'pass' },
      slo: { totalMetrics: 0, compliantCount: 0, violationCount: 0, compliancePct: 100, highlights: [] },
      lifecycle: { retentionPolicyActive: true, gdprCompliant: true, dataClassification: 'internal', lastPurgeDate: null },
      integrity: { auditIntegrityHash: '', secretScanStatus: 'pass', redTeamSummary: '', tamperProofStatus: 'verified' as const },
      opsDigest: { generatedAt: '', sloViolations: 0, warnings: 0, criticals: 0, opsConfidenceScore: null, opsConfidenceGrade: null },
      isolation: { isolationVerified: true, tenantsChecked: 0, crossTenantLeaks: 0 },
    }
    const hash1 = await computeBundleHash(content)
    const hash2 = await computeBundleHash(content)
    expect(hash1).toBe(hash2)
  })
})

describe('createDefaultPilotPorts', () => {
  it('returns valid ports that produce a bundle', async () => {
    const ports = createDefaultPilotPorts()
    const bundle = await generatePilotSummary(ports)
    expect(bundle.platformName).toBe('Nzila OS')
    expect(bundle.signatureHash).toMatch(/^sha256:/)
  })
})
