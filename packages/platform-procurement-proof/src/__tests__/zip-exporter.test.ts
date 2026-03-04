/**
 * @nzila/platform-procurement-proof — Zip Exporter Tests
 */
import { describe, it, expect } from 'vitest'
import { createHash, verify } from 'node:crypto'
import { unzipSync } from 'fflate'
import {
  exportAsSignedZip,
  verifyZipSignature,
  getSigningKeyPair,
} from '../zip-exporter'
import type { ProcurementPack } from '../types'

function makePack(overrides: Partial<ProcurementPack> = {}): ProcurementPack {
  return {
    packId: 'test-pack-001',
    orgId: 'org-001',
    generatedAt: '2026-03-04T00:00:00.000Z',
    generatedBy: 'test-user',
    status: 'signed',
    sections: {
      security: {
        dependencyAudit: {
          totalDependencies: 100,
          directDependencies: 20,
          criticalVulnerabilities: 0,
          highVulnerabilities: 0,
          mediumVulnerabilities: 0,
          lowVulnerabilities: 0,
          blockedLicenses: [],
          lockfileIntegrity: true,
          auditedAt: '2026-03-04T00:00:00.000Z',
        },
        signedAttestation: {
          attestationId: 'att-001',
          algorithm: 'sha256',
          digest: 'abc123',
          signedBy: 'ci',
          signedAt: '2026-03-04T00:00:00.000Z',
          scope: 'full-build',
        },
        vulnerabilitySummary: {
          score: 100,
          grade: 'A',
          lastScanAt: '2026-03-04T00:00:00.000Z',
        },
      },
      dataLifecycle: {
        manifests: [
          {
            dataCategory: 'PII',
            classification: 'confidential',
            storageRegion: 'canadacentral',
            encryptionAtRest: true,
            encryptionInTransit: true,
            retentionDays: 2555,
            deletionPolicy: 'auto',
          },
        ],
        retentionControls: {
          policiesEnforced: 5,
          policiesTotal: 5,
          autoDeleteEnabled: true,
          lastPurgeAt: null,
        },
      },
      operational: {
        sloCompliance: {
          overall: 99.5,
          targets: [{ name: 'availability', target: 99.0, actual: 99.5, compliant: true }],
        },
        performanceMetrics: {
          p50Ms: 100,
          p95Ms: 300,
          p99Ms: 500,
          errorRate: 0.001,
          uptimePercent: 99.5,
        },
        incidentSummary: {
          totalIncidents: 0,
          resolvedIncidents: 0,
          meanTimeToResolutionMinutes: 0,
          lastIncidentAt: null,
        },
        trendWarnings: [],
      },
      governance: {
        evidencePackCount: 5,
        snapshotChainLength: 10,
        snapshotChainValid: true,
        policyComplianceRate: 1.0,
        lastEvidencePackAt: '2026-03-04T00:00:00.000Z',
        controlFamiliesCovered: ['access', 'financial'],
      },
      sovereignty: {
        deploymentRegion: 'Canada Central',
        dataResidency: 'Canada',
        regulatoryFrameworks: ['PIPEDA'],
        crossBorderTransfer: false,
        validated: true,
        validatedAt: '2026-03-04T00:00:00.000Z',
      },
    },
    manifest: {
      version: '1.0',
      sectionCount: 5,
      artifactCount: 8,
      generatedAt: '2026-03-04T00:00:00.000Z',
      checksums: {},
    },
    ...overrides,
  }
}

describe('Zip Exporter', () => {
  const pack = makePack()

  describe('exportAsSignedZip', () => {
    it('returns a valid zip buffer', () => {
      const result = exportAsSignedZip(pack, 'test-user')
      expect(result.zipBuffer).toBeInstanceOf(Uint8Array)
      expect(result.zipBuffer.byteLength).toBeGreaterThan(0)
    })

    it('filename follows Nzila-Procurement-Pack-YYYY-MM-DD.zip pattern', () => {
      const result = exportAsSignedZip(pack, 'test-user')
      expect(result.filename).toMatch(/^Nzila-Procurement-Pack-\d{4}-\d{2}-\d{2}\.zip$/)
    })

    it('zip contains all required files', () => {
      const result = exportAsSignedZip(pack, 'test-user')
      const unzipped = unzipSync(result.zipBuffer)
      const filenames = Object.keys(unzipped)

      expect(filenames).toContain('MANIFEST.json')
      expect(filenames).toContain('procurement-pack.json')
      expect(filenames).toContain('signatures.json')
      expect(filenames).toContain('verification.json')
      expect(filenames).toContain('sections/security.json')
      expect(filenames).toContain('sections/dataLifecycle.json')
      expect(filenames).toContain('sections/operational.json')
      expect(filenames).toContain('sections/governance.json')
      expect(filenames).toContain('sections/sovereignty.json')
    })

    it('MANIFEST.json contains valid file hashes', () => {
      const result = exportAsSignedZip(pack, 'test-user')
      const unzipped = unzipSync(result.zipBuffer)
      const manifest = JSON.parse(
        new TextDecoder().decode(unzipped['MANIFEST.json']),
      )

      expect(manifest.version).toBe('1.0')
      expect(manifest.packId).toBe('test-pack-001')
      expect(manifest.integrityAlgorithm).toBe('sha256')
      expect(manifest.files.length).toBeGreaterThanOrEqual(6) // pack + 5 sections

      // Verify each hash
      for (const entry of manifest.files) {
        const fileContent = new TextDecoder().decode(unzipped[entry.path])
        const hash = createHash('sha256').update(fileContent).digest('hex')
        expect(hash).toBe(entry.sha256)
      }
    })

    it('signatures.json contains valid Ed25519 signature', () => {
      const result = exportAsSignedZip(pack, 'test-user')
      const unzipped = unzipSync(result.zipBuffer)
      const sig = JSON.parse(
        new TextDecoder().decode(unzipped['signatures.json']),
      )

      expect(sig.algorithm).toBe('Ed25519')
      expect(sig.signedBy).toBe('test-user')
      expect(sig.keyId).toHaveLength(16)
      expect(sig.signature).toBeTruthy()
      expect(sig.manifestDigest).toBeTruthy()
    })

    it('signature verifies against manifest digest', () => {
      const result = exportAsSignedZip(pack, 'test-user')
      const unzipped = unzipSync(result.zipBuffer)
      const manifestJson = new TextDecoder().decode(unzipped['MANIFEST.json'])
      const sig = JSON.parse(
        new TextDecoder().decode(unzipped['signatures.json']),
      )

      // Get the public key used
      const { publicKey } = getSigningKeyPair()

      const manifestDigest = createHash('sha256')
        .update(manifestJson)
        .digest('hex')
      expect(manifestDigest).toBe(sig.manifestDigest)

      const valid = verify(
        null,
        Buffer.from(manifestDigest),
        publicKey,
        Buffer.from(sig.signature, 'hex'),
      )
      expect(valid).toBe(true)
    })

    it('verification.json lists all expected files', () => {
      const result = exportAsSignedZip(pack, 'test-user')
      const unzipped = unzipSync(result.zipBuffer)
      const ver = JSON.parse(
        new TextDecoder().decode(unzipped['verification.json']),
      )

      expect(ver.algorithm).toBe('Ed25519')
      expect(ver.expectedFiles).toContain('MANIFEST.json')
      expect(ver.expectedFiles).toContain('procurement-pack.json')
      expect(ver.expectedFiles).toContain('signatures.json')
      expect(ver.expectedFiles).toContain('verification.json')
      expect(ver.verificationSteps.length).toBeGreaterThanOrEqual(5)
    })

    it('Content-Type should be application/zip', () => {
      const result = exportAsSignedZip(pack, 'test-user')
      // The route is responsible for headers, but verify the buffer is valid zip
      // Zip magic bytes: PK\x03\x04
      expect(result.zipBuffer[0]).toBe(0x50) // P
      expect(result.zipBuffer[1]).toBe(0x4b) // K
    })
  })

  describe('verifyZipSignature', () => {
    it('returns true for a valid signature', () => {
      const result = exportAsSignedZip(pack, 'test-user')
      const unzipped = unzipSync(result.zipBuffer)
      const manifestJson = new TextDecoder().decode(unzipped['MANIFEST.json'])
      const sig = JSON.parse(
        new TextDecoder().decode(unzipped['signatures.json']),
      )

      const { publicKey } = getSigningKeyPair()
      expect(verifyZipSignature(manifestJson, sig, publicKey)).toBe(true)
    })

    it('returns false for tampered manifest', () => {
      const result = exportAsSignedZip(pack, 'test-user')
      const unzipped = unzipSync(result.zipBuffer)
      const manifestJson = new TextDecoder().decode(unzipped['MANIFEST.json'])
      const sig = JSON.parse(
        new TextDecoder().decode(unzipped['signatures.json']),
      )

      const { publicKey } = getSigningKeyPair()
      const tampered = manifestJson.replace('"1.0"', '"2.0"')
      expect(verifyZipSignature(tampered, sig, publicKey)).toBe(false)
    })
  })

  describe('getSigningKeyPair', () => {
    it('generates a consistent ephemeral key pair', () => {
      const kp1 = getSigningKeyPair()
      expect(kp1.privateKey).toContain('PRIVATE KEY')
      expect(kp1.publicKey).toContain('PUBLIC KEY')
      expect(kp1.keyId).toHaveLength(16)
    })
  })
})
