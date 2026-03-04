/**
 * @nzila/platform-assurance — Types
 *
 * Executive Assurance Dashboard: 5 org-scoped KPI scores
 * with platform-admin aggregate view.
 *
 * @module @nzila/platform-assurance/types
 */
import { z } from 'zod'

// ── Score Grades ────────────────────────────────────────────────────────────

export type ScoreGrade = 'A' | 'B' | 'C' | 'D' | 'F'

export function gradeFromScore(score: number): ScoreGrade {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

// ── Individual Scores ───────────────────────────────────────────────────────

export interface ComplianceScore {
  readonly score: number
  readonly grade: ScoreGrade
  readonly snapshotChainVerified: boolean
  readonly policyComplianceRate: number
  readonly controlFamiliesCovered: number
  readonly controlFamiliesTotal: number
  readonly lastSnapshotAt: string | null
}

export interface SecurityScore {
  readonly score: number
  readonly grade: ScoreGrade
  readonly criticalVulnerabilities: number
  readonly highVulnerabilities: number
  readonly dependencyPosture: number
  readonly attestationValid: boolean
  readonly lockfileIntegrity: boolean
  readonly lastScanAt: string | null
}

export interface OpsScore {
  readonly score: number
  readonly grade: ScoreGrade
  readonly confidenceScore: number
  readonly sloComplianceRate: number
  readonly p95Ms: number
  readonly errorRate: number
  readonly uptimePercent: number
  readonly trendDirection: 'improving' | 'stable' | 'degrading'
  readonly incidentCount: number
}

export interface CostScore {
  readonly score: number
  readonly grade: ScoreGrade
  readonly budgetUtilization: number
  readonly dailySpendUsd: number
  readonly monthlySpendUsd: number
  readonly monthlyBudgetUsd: number
  readonly overBudget: boolean
  readonly categoriesOverCap: readonly string[]
}

export interface IntegrationReliabilityScore {
  readonly score: number
  readonly grade: ScoreGrade
  readonly slaComplianceRate: number
  readonly dlqBacklog: number
  readonly circuitBreakersOpen: number
  readonly providersHealthy: number
  readonly providersTotal: number
  readonly lastHealthCheckAt: string | null
}

// ── Assurance Dashboard (aggregate) ─────────────────────────────────────────

export interface AssuranceDashboard {
  readonly orgId: string
  readonly generatedAt: string
  readonly compliance: ComplianceScore
  readonly security: SecurityScore
  readonly ops: OpsScore
  readonly cost: CostScore
  readonly integrationReliability: IntegrationReliabilityScore
  readonly overallScore: number
  readonly overallGrade: ScoreGrade
}

export interface PlatformAssuranceAggregate {
  readonly generatedAt: string
  readonly orgCount: number
  readonly dashboards: readonly AssuranceDashboard[]
  readonly platformOverallScore: number
  readonly platformOverallGrade: ScoreGrade
}

// ── Ports ───────────────────────────────────────────────────────────────────

export interface AssurancePorts {
  readonly getComplianceScore: (orgId: string) => Promise<ComplianceScore>
  readonly getSecurityScore: (orgId: string) => Promise<SecurityScore>
  readonly getOpsScore: (orgId: string) => Promise<OpsScore>
  readonly getCostScore: (orgId: string) => Promise<CostScore>
  readonly getIntegrationReliabilityScore: (orgId: string) => Promise<IntegrationReliabilityScore>
  readonly listOrgIds: () => Promise<readonly string[]>
}

// ── Zod Schemas ─────────────────────────────────────────────────────────────

export const assuranceDashboardSchema = z.object({
  orgId: z.string(),
  generatedAt: z.string().datetime(),
  compliance: z.object({ score: z.number(), grade: z.string() }),
  security: z.object({ score: z.number(), grade: z.string() }),
  ops: z.object({ score: z.number(), grade: z.string() }),
  cost: z.object({ score: z.number(), grade: z.string() }),
  integrationReliability: z.object({ score: z.number(), grade: z.string() }),
  overallScore: z.number(),
  overallGrade: z.string(),
})
