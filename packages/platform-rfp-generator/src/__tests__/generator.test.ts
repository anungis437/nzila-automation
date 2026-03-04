/**
 * @nzila/platform-rfp-generator — Generator Tests
 */
import { describe, it, expect } from 'vitest'
import { generateRfpResponse, renderRfpMarkdown } from '../generator'
import type { RfpGeneratorInput } from '../types'
import type { ProcurementPack } from '@nzila/platform-procurement-proof/types'
import type { AssuranceDashboard } from '@nzila/platform-assurance/types'

const mockPack: ProcurementPack = {
  packId: 'pack-001',
  orgId: 'org-1',
  generatedAt: '2026-03-04T00:00:00.000Z',
  generatedBy: 'user-1',
  status: 'signed',
  sections: {
    security: {
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
      vulnerabilitySummary: { score: 92, grade: 'A', lastScanAt: '2026-03-04T00:00:00.000Z' },
    },
    dataLifecycle: {
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
    },
    operational: {
      sloCompliance: {
        overall: 99.2,
        targets: [
          { name: 'p95 latency', target: 500, actual: 320, compliant: true },
          { name: 'error rate', target: 1, actual: 0.3, compliant: true },
        ],
      },
      performanceMetrics: { p50Ms: 120, p95Ms: 320, p99Ms: 480, errorRate: 0.3, uptimePercent: 99.95 },
      incidentSummary: {
        totalIncidents: 2,
        resolvedIncidents: 2,
        meanTimeToResolutionMinutes: 18,
        lastIncidentAt: '2026-02-15T00:00:00.000Z',
      },
      trendWarnings: [],
    },
    governance: {
      evidencePackCount: 12,
      snapshotChainLength: 48,
      snapshotChainValid: true,
      policyComplianceRate: 100,
      lastEvidencePackAt: '2026-03-03T00:00:00.000Z',
      controlFamiliesCovered: ['access', 'financial', 'data', 'operational'],
    },
    sovereignty: {
      deploymentRegion: 'southafricanorth',
      dataResidency: 'ZA',
      regulatoryFrameworks: ['POPIA', 'GDPR'],
      crossBorderTransfer: false,
      validated: true,
      validatedAt: '2026-03-01T00:00:00.000Z',
    },
  },
  manifest: {
    version: '1.0',
    sectionCount: 5,
    artifactCount: 12,
    generatedAt: '2026-03-04T00:00:00.000Z',
    checksums: {},
  },
  signature: {
    algorithm: 'hmac-sha256',
    digest: 'xyz789',
    signedAt: '2026-03-04T00:00:00.000Z',
    signedBy: 'platform-signer',
    keyId: 'key-001',
  },
}

const mockDashboard: AssuranceDashboard = {
  orgId: 'org-1',
  generatedAt: '2026-03-04T00:00:00.000Z',
  compliance: {
    score: 95, grade: 'A', snapshotChainVerified: true,
    policyComplianceRate: 100, controlFamiliesCovered: 4, controlFamiliesTotal: 4,
    lastSnapshotAt: '2026-03-04T00:00:00.000Z',
  },
  security: {
    score: 88, grade: 'B', criticalVulnerabilities: 0, highVulnerabilities: 1,
    dependencyPosture: 92, attestationValid: true, lockfileIntegrity: true,
    lastScanAt: '2026-03-04T00:00:00.000Z',
  },
  ops: {
    score: 91, grade: 'A', confidenceScore: 93, sloComplianceRate: 99.2,
    p95Ms: 320, errorRate: 0.3, uptimePercent: 99.95, trendDirection: 'stable',
    incidentCount: 2,
  },
  cost: {
    score: 82, grade: 'B', budgetUtilization: 0.72, dailySpendUsd: 360,
    monthlySpendUsd: 10800, monthlyBudgetUsd: 15000, overBudget: false,
    categoriesOverCap: [],
  },
  integrationReliability: {
    score: 96, grade: 'A', slaComplianceRate: 99.8, dlqBacklog: 0,
    circuitBreakersOpen: 0, providersHealthy: 3, providersTotal: 3,
    lastHealthCheckAt: '2026-03-04T00:00:00.000Z',
  },
  overallScore: 91,
  overallGrade: 'A',
}

describe('generateRfpResponse', () => {
  it('generates responses for all 8 RFP sections', () => {
    const input: RfpGeneratorInput = {
      orgId: 'org-1',
      generatedBy: 'user-1',
      procurementPack: mockPack,
      assuranceDashboard: mockDashboard,
    }

    const response = generateRfpResponse(input)
    expect(response.sections).toHaveLength(10)
    expect(response.totalQuestions).toBeGreaterThanOrEqual(10)
    expect(response.totalAnswered).toBe(response.totalQuestions)

    // Check all sections present
    const sectionNames = response.sections.map((s) => s.section)
    expect(sectionNames).toContain('security')
    expect(sectionNames).toContain('privacy')
    expect(sectionNames).toContain('operations')
    expect(sectionNames).toContain('disaster_recovery')
    expect(sectionNames).toContain('data_governance')
    expect(sectionNames).toContain('compliance')
    expect(sectionNames).toContain('integration')
    expect(sectionNames).toContain('cost_management')
    expect(sectionNames).toContain('hosting_sovereignty')
    expect(sectionNames).toContain('verification')
  })

  it('includes evidence references in answers', () => {
    const input: RfpGeneratorInput = {
      orgId: 'org-1',
      generatedBy: 'user-1',
      procurementPack: mockPack,
      assuranceDashboard: mockDashboard,
    }

    const response = generateRfpResponse(input)
    for (const section of response.sections) {
      for (const answer of section.answers) {
        expect(answer.evidenceRefs.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('renderRfpMarkdown', () => {
  it('renders a complete markdown document', () => {
    const input: RfpGeneratorInput = {
      orgId: 'org-1',
      generatedBy: 'user-1',
      procurementPack: mockPack,
      assuranceDashboard: mockDashboard,
    }

    const response = generateRfpResponse(input)
    const md = renderRfpMarkdown(response)

    expect(md).toContain('# RFP Response')
    expect(md).toContain('## Security')
    expect(md).toContain('## Privacy')
    expect(md).toContain('## Operations')
    expect(md).toContain('## Disaster Recovery')
    expect(md).toContain('## Data Governance')
    expect(md).toContain('## Compliance')
    expect(md).toContain('## Integration')
    expect(md).toContain('## Cost Management')
    expect(md).toContain('## Hosting & Sovereignty Modes')
    expect(md).toContain('## Appendix: Verification Steps')
    expect(md).toContain('**Evidence:**')
  })
})
