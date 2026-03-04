/**
 * @nzila/platform-procurement-proof — Collector Tests
 */
import { describe, it, expect } from 'vitest'
import { collectProcurementPack, signProcurementPack } from '../collector'
import { exportAsJson, exportAsBundle } from '../exporter'
import type { ProcurementProofPorts } from '../types'

const mockPorts: ProcurementProofPorts = {
  getSecurityPosture: async () => ({
    dependencyAudit: {
      totalDependencies: 120,
      directDependencies: 45,
      criticalVulnerabilities: 0,
      highVulnerabilities: 1,
      mediumVulnerabilities: 3,
      lowVulnerabilities: 5,
      blockedLicenses: [],
      lockfileIntegrity: true,
      auditedAt: '2026-03-04T00:00:00.000Z',
    },
    signedAttestation: {
      attestationId: 'att-001',
      algorithm: 'sha256',
      digest: 'abc123',
      signedBy: 'ci-pipeline',
      signedAt: '2026-03-04T00:00:00.000Z',
      scope: 'full-platform',
    },
    vulnerabilitySummary: {
      score: 92,
      grade: 'A',
      lastScanAt: '2026-03-04T00:00:00.000Z',
    },
  }),
  getDataLifecycle: async () => ({
    manifests: [
      {
        dataCategory: 'user_pii',
        classification: 'confidential',
        storageRegion: 'southafricanorth',
        encryptionAtRest: true,
        encryptionInTransit: true,
        retentionDays: 365,
        deletionPolicy: 'auto',
      },
    ],
    retentionControls: {
      policiesEnforced: 5,
      policiesTotal: 5,
      autoDeleteEnabled: true,
      lastPurgeAt: '2026-03-01T00:00:00.000Z',
    },
  }),
  getOperationalEvidence: async () => ({
    sloCompliance: {
      overall: 99.2,
      targets: [
        { name: 'p95 latency', target: 500, actual: 320, compliant: true },
        { name: 'error rate', target: 1, actual: 0.3, compliant: true },
      ],
    },
    performanceMetrics: {
      p50Ms: 120, p95Ms: 320, p99Ms: 480,
      errorRate: 0.3, uptimePercent: 99.95,
    },
    incidentSummary: {
      totalIncidents: 2,
      resolvedIncidents: 2,
      meanTimeToResolutionMinutes: 18,
      lastIncidentAt: '2026-02-15T00:00:00.000Z',
    },
    trendWarnings: [],
  }),
  getGovernanceEvidence: async () => ({
    evidencePackCount: 12,
    snapshotChainLength: 48,
    snapshotChainValid: true,
    policyComplianceRate: 100,
    lastEvidencePackAt: '2026-03-03T00:00:00.000Z',
    controlFamiliesCovered: ['access', 'financial', 'data', 'operational'],
  }),
  getSovereigntyProfile: async () => ({
    deploymentRegion: 'southafricanorth',
    dataResidency: 'ZA',
    regulatoryFrameworks: ['POPIA', 'GDPR'],
    crossBorderTransfer: false,
    validated: true,
    validatedAt: '2026-03-01T00:00:00.000Z',
  }),
  signPack: async (digest) => ({
    algorithm: 'hmac-sha256',
    digest,
    signedAt: new Date().toISOString(),
    signedBy: 'platform-signer',
    keyId: 'key-001',
  }),
}

describe('collectProcurementPack', () => {
  it('collects all 5 sections', async () => {
    const pack = await collectProcurementPack('org-1', 'user-1', mockPorts)
    expect(pack.sections.security).toBeDefined()
    expect(pack.sections.dataLifecycle).toBeDefined()
    expect(pack.sections.operational).toBeDefined()
    expect(pack.sections.governance).toBeDefined()
    expect(pack.sections.sovereignty).toBeDefined()
    expect(pack.manifest.sectionCount).toBe(5)
    expect(pack.status).toBe('complete')
  })

  it('generates checksums for each section', async () => {
    const pack = await collectProcurementPack('org-1', 'user-1', mockPorts)
    expect(Object.keys(pack.manifest.checksums)).toHaveLength(5)
  })
})

describe('signProcurementPack', () => {
  it('signs the pack and updates status', async () => {
    const pack = await collectProcurementPack('org-1', 'user-1', mockPorts)
    const signed = await signProcurementPack(pack, mockPorts)
    expect(signed.status).toBe('signed')
    expect(signed.signature).toBeDefined()
    expect(signed.signature?.algorithm).toBe('hmac-sha256')
  })
})

describe('export', () => {
  it('exports as JSON with manifest and signature', async () => {
    const pack = await collectProcurementPack('org-1', 'user-1', mockPorts)
    const signed = await signProcurementPack(pack, mockPorts)
    const result = exportAsJson(signed)
    expect(result.format).toBe('json')
    const parsed = JSON.parse(result.data)
    expect(parsed.MANIFEST).toBeDefined()
    expect(parsed.SIGNATURE).toBeDefined()
  })

  it('exports as bundle with sections', async () => {
    const pack = await collectProcurementPack('org-1', 'user-1', mockPorts)
    const result = exportAsBundle(pack)
    expect(result.format).toBe('zip')
    const parsed = JSON.parse(result.data)
    expect(parsed['MANIFEST.json']).toBeDefined()
    expect(parsed['sections/security.json']).toBeDefined()
    expect(parsed['INTEGRITY.sha256']).toBeDefined()
  })
})
