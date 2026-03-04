/**
 * @nzila/platform-assurance — Scorer Tests
 */
import { describe, it, expect } from 'vitest'
import { computeAssuranceDashboard, computePlatformAssurance } from '../scorer'
import { gradeFromScore } from '../types'
import type { AssurancePorts } from '../types'

const mockPorts: AssurancePorts = {
  getComplianceScore: async () => ({
    score: 95,
    grade: 'A',
    snapshotChainVerified: true,
    policyComplianceRate: 100,
    controlFamiliesCovered: 4,
    controlFamiliesTotal: 4,
    lastSnapshotAt: '2026-03-04T00:00:00.000Z',
  }),
  getSecurityScore: async () => ({
    score: 88,
    grade: 'B',
    criticalVulnerabilities: 0,
    highVulnerabilities: 1,
    dependencyPosture: 92,
    attestationValid: true,
    lockfileIntegrity: true,
    lastScanAt: '2026-03-04T00:00:00.000Z',
  }),
  getOpsScore: async () => ({
    score: 91,
    grade: 'A',
    confidenceScore: 93,
    sloComplianceRate: 99.2,
    p95Ms: 320,
    errorRate: 0.3,
    uptimePercent: 99.95,
    trendDirection: 'stable',
    incidentCount: 2,
  }),
  getCostScore: async () => ({
    score: 82,
    grade: 'B',
    budgetUtilization: 0.72,
    dailySpendUsd: 360,
    monthlySpendUsd: 10800,
    monthlyBudgetUsd: 15000,
    overBudget: false,
    categoriesOverCap: [],
  }),
  getIntegrationReliabilityScore: async () => ({
    score: 96,
    grade: 'A',
    slaComplianceRate: 99.8,
    dlqBacklog: 0,
    circuitBreakersOpen: 0,
    providersHealthy: 3,
    providersTotal: 3,
    lastHealthCheckAt: '2026-03-04T00:00:00.000Z',
  }),
  listOrgIds: async () => ['org-1', 'org-2'],
}

describe('gradeFromScore', () => {
  it('maps scores to correct grades', () => {
    expect(gradeFromScore(95)).toBe('A')
    expect(gradeFromScore(85)).toBe('B')
    expect(gradeFromScore(75)).toBe('C')
    expect(gradeFromScore(65)).toBe('D')
    expect(gradeFromScore(50)).toBe('F')
  })
})

describe('computeAssuranceDashboard', () => {
  it('computes all 5 scores with weighted overall', async () => {
    const dashboard = await computeAssuranceDashboard('org-1', mockPorts)

    expect(dashboard.compliance.score).toBe(95)
    expect(dashboard.security.score).toBe(88)
    expect(dashboard.ops.score).toBe(91)
    expect(dashboard.cost.score).toBe(82)
    expect(dashboard.integrationReliability.score).toBe(96)

    // Weighted: 95*0.25 + 88*0.25 + 91*0.20 + 82*0.15 + 96*0.15 = 23.75 + 22 + 18.2 + 12.3 + 14.4 = 90.65 → 91
    expect(dashboard.overallScore).toBe(91)
    expect(dashboard.overallGrade).toBe('A')
  })
})

describe('computePlatformAssurance', () => {
  it('aggregates across all orgs', async () => {
    const aggregate = await computePlatformAssurance(mockPorts)
    expect(aggregate.orgCount).toBe(2)
    expect(aggregate.dashboards).toHaveLength(2)
    expect(aggregate.platformOverallScore).toBe(91) // Both orgs same mock data
    expect(aggregate.platformOverallGrade).toBe('A')
  })
})
