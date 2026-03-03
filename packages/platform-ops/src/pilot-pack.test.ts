/**
 * Nzila OS — Pilot Summary Pack: Unit Tests
 *
 * @module @nzila/platform-ops/pilot-pack
 */
import { describe, it, expect } from 'vitest'
import {
  generatePilotPack,
  verifyManifest,
  type PilotSummaryPack,
} from './pilot-pack'
import { createDefaultPilotPorts, type PilotExportPorts } from './pilot-export'

// ── Helpers ────────────────────────────────────────────────────────────────

function makePorts(): PilotExportPorts {
  return createDefaultPilotPorts()
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('generatePilotPack', () => {
  it('produces a pack with bundle + manifest', async () => {
    const pack = await generatePilotPack(makePorts())

    expect(pack.bundle).toBeDefined()
    expect(pack.manifest).toBeDefined()
    expect(pack.metadata).toBeDefined()
    expect(pack.metadata.formatVersion).toBe('2.0.0')
    expect(pack.metadata.sectionCount).toBe(6)
  })

  it('manifest contains hashes for all 6 sections', async () => {
    const pack = await generatePilotPack(makePorts())

    const sections = pack.manifest.sections
    expect(sections).toHaveLength(6)

    const names = sections.map((s) => s.section)
    expect(names).toContain('release')
    expect(names).toContain('slo')
    expect(names).toContain('lifecycle')
    expect(names).toContain('integrity')
    expect(names).toContain('opsDigest')
    expect(names).toContain('isolation')

    for (const s of sections) {
      expect(s.hash).toMatch(/^sha256:[a-f0-9]{64}$/)
      expect(s.sizeBytes).toBeGreaterThan(0)
    }
  })

  it('bundleHash matches the bundle signatureHash', async () => {
    const pack = await generatePilotPack(makePorts())

    expect(pack.manifest.bundleHash).toBe(pack.bundle.signatureHash)
    expect(pack.metadata.bundleHash).toBe(pack.bundle.signatureHash)
  })

  it('totalSizeBytes is sum of section sizes', async () => {
    const pack = await generatePilotPack(makePorts())

    const summedSize = pack.manifest.sections.reduce((s, e) => s + e.sizeBytes, 0)
    expect(pack.manifest.totalSizeBytes).toBe(summedSize)
  })
})

describe('verifyManifest', () => {
  it('returns empty array when all sections match', async () => {
    const pack = await generatePilotPack(makePorts())
    const mismatches = await verifyManifest(pack.bundle, pack.manifest)
    expect(mismatches).toEqual([])
  })

  it('detects tampered section hashes', async () => {
    const pack = await generatePilotPack(makePorts())

    // Tamper with the release section hash
    const tamperedManifest = {
      ...pack.manifest,
      sections: pack.manifest.sections.map((s) =>
        s.section === 'release' ? { ...s, hash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000' } : s,
      ),
    }

    const mismatches = await verifyManifest(pack.bundle, tamperedManifest)
    expect(mismatches).toContain('release')
    expect(mismatches).toHaveLength(1)
  })
})

describe('pack determinism', () => {
  it('same ports produce same section hashes', async () => {
    // Use fixed ports that return identical data on every call
    // (createDefaultPilotPorts uses new Date() internally, causing drift)
    const fixedPorts: PilotExportPorts = {
      getRelease: async () => ({
        version: '1.0.0',
        commitSha: 'abc123',
        buildTimestamp: '2026-01-01T00:00:00.000Z',
        contractTestHash: 'test-hash',
        ciPipelineStatus: 'pass',
      }),
      getSloSummary: async () => ({
        totalMetrics: 5,
        compliantCount: 5,
        violationCount: 0,
        compliancePct: 100,
        highlights: ['All clear'],
      }),
      getLifecycle: async () => ({
        retentionPolicyActive: true,
        gdprCompliant: true,
        dataClassification: 'internal',
        lastPurgeDate: null,
      }),
      getIntegrity: async () => ({
        auditIntegrityHash: 'integrity-hash',
        secretScanStatus: 'pass',
        redTeamSummary: 'No findings',
        tamperProofStatus: 'verified' as const,
      }),
      getOpsDigest: async () => ({
        generatedAt: '2026-01-01T00:00:00.000Z',
        sloViolations: 0,
        warnings: 0,
        criticals: 0,
        opsConfidenceScore: 90,
        opsConfidenceGrade: 'A',
      }),
      getIsolation: async () => ({
        isolationVerified: true,
        tenantsChecked: 3,
        crossTenantLeaks: 0,
      }),
    }

    const pack1 = await generatePilotPack(fixedPorts)
    const pack2 = await generatePilotPack(fixedPorts)

    for (let i = 0; i < pack1.manifest.sections.length; i++) {
      expect(pack1.manifest.sections[i].hash).toBe(
        pack2.manifest.sections[i].hash,
      )
    }
  })
})
