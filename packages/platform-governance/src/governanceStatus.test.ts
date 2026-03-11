import { describe, it, expect } from 'vitest'
import {
  assessAppCompliance,
  generateFindings,
  buildGovernanceReport,
} from '../src/governanceStatus'

describe('governanceStatus', () => {
  it('returns full compliance when all checks pass', () => {
    const status = assessAppCompliance({
      name: 'shop-quoter',
      hasSbom: true,
      hasPolicyEngine: true,
      hasEvidencePack: true,
      hasHealthEndpoint: true,
      hasMetricsEndpoint: true,
      hasTests: true,
    })

    expect(status.complianceLevel).toBe('full')
    expect(status.app).toBe('shop-quoter')
  })

  it('returns partial compliance when ≥50% checks pass', () => {
    const status = assessAppCompliance({
      name: 'cfo',
      hasSbom: true,
      hasPolicyEngine: true,
      hasEvidencePack: true,
      hasHealthEndpoint: false,
      hasMetricsEndpoint: false,
      hasTests: false,
    })

    expect(status.complianceLevel).toBe('partial')
  })

  it('returns non_compliant when <50% checks pass', () => {
    const status = assessAppCompliance({
      name: 'web',
      hasSbom: false,
      hasPolicyEngine: false,
      hasEvidencePack: false,
      hasHealthEndpoint: true,
      hasMetricsEndpoint: false,
      hasTests: true,
    })

    expect(status.complianceLevel).toBe('non_compliant')
  })

  it('generates findings for missing capabilities', () => {
    const status = assessAppCompliance({
      name: 'partners',
      hasSbom: false,
      hasPolicyEngine: true,
      hasEvidencePack: true,
      hasHealthEndpoint: true,
      hasMetricsEndpoint: true,
      hasTests: true,
    })

    const findings = generateFindings([status])
    expect(findings).toHaveLength(1)
    expect(findings[0].category).toBe('sbom')
    expect(findings[0].severity).toBe('high')
  })

  it('builds governance report with overall compliance', () => {
    const statuses = [
      assessAppCompliance({
        name: 'shop-quoter',
        hasSbom: true,
        hasPolicyEngine: true,
        hasEvidencePack: true,
        hasHealthEndpoint: true,
        hasMetricsEndpoint: true,
        hasTests: true,
      }),
      assessAppCompliance({
        name: 'cfo',
        hasSbom: false,
        hasPolicyEngine: true,
        hasEvidencePack: true,
        hasHealthEndpoint: true,
        hasMetricsEndpoint: true,
        hasTests: true,
      }),
    ]

    const report = buildGovernanceReport(statuses, 'abc123')
    expect(report.overallCompliance).toBe('partial')
    expect(report.driftDetected).toBe(true)
    expect(report.findings.length).toBeGreaterThan(0)
    expect(report.commitHash).toBe('abc123')
  })
})
