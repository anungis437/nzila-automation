/**
 * @nzila/platform-rfp-generator — Jurisdiction Tests
 *
 * Verifies:
 * - Canada-focused RFP uses PIPEDA / Québec Law 25 language
 * - POPIA text does NOT appear unless international mode
 * - "we are compliant" phrasing is forbidden (evidence-based only)
 * - New sections (hosting_sovereignty, verification) are present
 */
import { describe, it, expect } from 'vitest'
import { generateRfpResponse, renderRfpMarkdown } from '../generator'
import type { RfpGeneratorInput } from '../types'
import type { ProcurementPack } from '@nzila/platform-procurement-proof/types'
import type { AssuranceDashboard } from '@nzila/platform-assurance/types'

// ── Test data: Canada pack ──────────────────────────────────────────────────

const canadaPack: ProcurementPack = {
  packId: 'pack-ca-001',
  orgId: 'org-ca',
  generatedAt: '2026-06-01T00:00:00.000Z',
  generatedBy: 'test-user',
  status: 'signed',
  sections: {
    security: {
      dependencyAudit: {
        totalDependencies: 100, directDependencies: 30,
        criticalVulnerabilities: 0, highVulnerabilities: 0,
        mediumVulnerabilities: 1, lowVulnerabilities: 2,
        blockedLicenses: [], lockfileIntegrity: true,
        auditedAt: '2026-06-01T00:00:00.000Z',
      },
      signedAttestation: {
        attestationId: 'att-ca-001', algorithm: 'sha256',
        digest: 'ca-digest', signedBy: 'ci-pipeline',
        signedAt: '2026-06-01T00:00:00.000Z', scope: 'full-platform',
      },
      vulnerabilitySummary: { score: 94, grade: 'A', lastScanAt: '2026-06-01T00:00:00.000Z' },
    },
    dataLifecycle: {
      manifests: [
        { dataCategory: 'PII', classification: 'confidential', storageRegion: 'canadacentral', encryptionAtRest: true, encryptionInTransit: true, retentionDays: 2555, deletionPolicy: 'auto' },
        { dataCategory: 'financial', classification: 'restricted', storageRegion: 'canadacentral', encryptionAtRest: true, encryptionInTransit: true, retentionDays: 2555, deletionPolicy: 'legal_hold' },
      ],
      retentionControls: { policiesEnforced: 5, policiesTotal: 5, autoDeleteEnabled: true, lastPurgeAt: '2026-05-01T00:00:00.000Z' },
    },
    operational: {
      sloCompliance: { overall: 99.5, targets: [{ name: 'availability', target: 99, actual: 99.5, compliant: true }] },
      performanceMetrics: { p50Ms: 100, p95Ms: 280, p99Ms: 420, errorRate: 0.2, uptimePercent: 99.5 },
      incidentSummary: { totalIncidents: 0, resolvedIncidents: 0, meanTimeToResolutionMinutes: 0, lastIncidentAt: null },
      trendWarnings: [],
    },
    governance: {
      evidencePackCount: 5, snapshotChainLength: 10, snapshotChainValid: true,
      policyComplianceRate: 100, lastEvidencePackAt: '2026-06-01T00:00:00.000Z',
      controlFamiliesCovered: ['access', 'financial', 'data', 'operational'],
    },
    sovereignty: {
      deploymentRegion: 'Canada Central',
      dataResidency: 'Canada',
      regulatoryFrameworks: ['PIPEDA', 'Québec Law 25'],
      crossBorderTransfer: false,
      validated: true,
      validatedAt: '2026-06-01T00:00:00.000Z',
    },
  },
  manifest: { version: '1.0', sectionCount: 5, artifactCount: 10, generatedAt: '2026-06-01T00:00:00.000Z', checksums: {} },
  signature: { algorithm: 'Ed25519', digest: 'ca-sig', signedAt: '2026-06-01T00:00:00.000Z', signedBy: 'platform', keyId: 'key-ca-001' },
}

const canadaDashboard: AssuranceDashboard = {
  orgId: 'org-ca',
  generatedAt: '2026-06-01T00:00:00.000Z',
  compliance: { score: 97, grade: 'A', snapshotChainVerified: true, policyComplianceRate: 100, controlFamiliesCovered: 4, controlFamiliesTotal: 4, lastSnapshotAt: '2026-06-01T00:00:00.000Z' },
  security: { score: 94, grade: 'A', criticalVulnerabilities: 0, highVulnerabilities: 0, dependencyPosture: 94, attestationValid: true, lockfileIntegrity: true, lastScanAt: '2026-06-01T00:00:00.000Z' },
  ops: { score: 92, grade: 'A', confidenceScore: 92, sloComplianceRate: 99.5, p95Ms: 280, errorRate: 0.2, uptimePercent: 99.5, trendDirection: 'stable', incidentCount: 0 },
  cost: { score: 85, grade: 'B', budgetUtilization: 0.8, dailySpendUsd: 130, monthlySpendUsd: 4000, monthlyBudgetUsd: 5000, overBudget: false, categoriesOverCap: [] },
  integrationReliability: { score: 90, grade: 'A', slaComplianceRate: 99.5, dlqBacklog: 0, circuitBreakersOpen: 0, providersHealthy: 2, providersTotal: 2, lastHealthCheckAt: '2026-06-01T00:00:00.000Z' },
  overallScore: 92,
  overallGrade: 'A',
}

function generateCanadaRfp(): ReturnType<typeof generateRfpResponse> {
  return generateRfpResponse({
    orgId: 'org-ca',
    generatedBy: 'test-user',
    procurementPack: canadaPack,
    assuranceDashboard: canadaDashboard,
  })
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('RFP jurisdiction — Canada (PIPEDA + Québec Law 25)', () => {
  it('references PIPEDA in compliance section', () => {
    const response = generateCanadaRfp()
    const md = renderRfpMarkdown(response)

    expect(md).toContain('PIPEDA')
  })

  it('references Québec Law 25 in compliance section', () => {
    const response = generateCanadaRfp()
    const md = renderRfpMarkdown(response)

    expect(md).toContain('Québec Law 25')
  })

  it('references Canada Central deployment region', () => {
    const response = generateCanadaRfp()
    const md = renderRfpMarkdown(response)

    expect(md).toContain('Canada Central')
    expect(md).toContain('Canada')
  })

  it('does NOT contain POPIA unless international mode', () => {
    const response = generateCanadaRfp()
    const md = renderRfpMarkdown(response)

    // POPIA should not appear in a Canada-focused RFP
    expect(md).not.toContain('POPIA')
  })

  it('does NOT contain South Africa references', () => {
    const response = generateCanadaRfp()
    const md = renderRfpMarkdown(response)

    expect(md.toLowerCase()).not.toContain('south africa')
    expect(md).not.toContain('southafricanorth')
    expect(md).not.toContain('ZA')
  })

  it('never uses "we are compliant" phrasing', () => {
    const response = generateCanadaRfp()
    const md = renderRfpMarkdown(response).toLowerCase()

    expect(md).not.toContain('we are compliant')
    expect(md).not.toContain('we are fully compliant')
    expect(md).not.toContain('100% compliant')
  })
})

describe('RFP new sections', () => {
  it('includes Hosting & Sovereignty section', () => {
    const response = generateCanadaRfp()
    const sections = response.sections.map((s) => s.section)
    expect(sections).toContain('hosting_sovereignty')

    const md = renderRfpMarkdown(response)
    expect(md).toContain('Hosting & Sovereignty')
  })

  it('includes Verification Appendix', () => {
    const response = generateCanadaRfp()
    const sections = response.sections.map((s) => s.section)
    expect(sections).toContain('verification')

    const md = renderRfpMarkdown(response)
    expect(md).toContain('Verification Appendix')
    expect(md).toContain('Ed25519')
    expect(md).toContain('MANIFEST')
  })

  it('generates 8 total sections', () => {
    const response = generateCanadaRfp()
    expect(response.sections).toHaveLength(8)
  })

  it('privacy section includes PIPEDA + Québec Law 25 question', () => {
    const response = generateCanadaRfp()
    const privacy = response.sections.find((s) => s.section === 'privacy')!
    const questions = privacy.answers.map((a) => a.question)
    expect(questions).toContain('How do you comply with PIPEDA and Québec Law 25 (Bill 64)?')
  })
})
