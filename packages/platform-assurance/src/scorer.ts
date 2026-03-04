/**
 * @nzila/platform-assurance — Scorer
 *
 * Computes the Executive Assurance Dashboard by aggregating all 5 KPI scores.
 * Supports org-scoped view and platform-admin aggregate view.
 *
 * @module @nzila/platform-assurance/scorer
 */
import { createLogger } from '@nzila/os-core/telemetry'
import {
  gradeFromScore,
  type AssuranceDashboard,
  type AssurancePorts,
  type PlatformAssuranceAggregate,
} from './types'

const logger = createLogger('assurance-scorer')

/** Weights for each KPI category (must sum to 1.0) */
const WEIGHTS = {
  compliance: 0.25,
  security: 0.25,
  ops: 0.20,
  cost: 0.15,
  integrationReliability: 0.15,
} as const

/**
 * Compute the assurance dashboard for a single org.
 */
export async function computeAssuranceDashboard(
  orgId: string,
  ports: AssurancePorts,
): Promise<AssuranceDashboard> {
  logger.info('Computing assurance dashboard', { orgId })

  const [compliance, security, ops, cost, integrationReliability] =
    await Promise.all([
      ports.getComplianceScore(orgId),
      ports.getSecurityScore(orgId),
      ports.getOpsScore(orgId),
      ports.getCostScore(orgId),
      ports.getIntegrationReliabilityScore(orgId),
    ])

  const overallScore = Math.round(
    compliance.score * WEIGHTS.compliance +
    security.score * WEIGHTS.security +
    ops.score * WEIGHTS.ops +
    cost.score * WEIGHTS.cost +
    integrationReliability.score * WEIGHTS.integrationReliability,
  )

  const overallGrade = gradeFromScore(overallScore)

  logger.info('Assurance dashboard computed', {
    orgId,
    overallScore,
    overallGrade,
  })

  return {
    orgId,
    generatedAt: new Date().toISOString(),
    compliance,
    security,
    ops,
    cost,
    integrationReliability,
    overallScore,
    overallGrade,
  }
}

/**
 * Compute the platform-wide aggregate assurance view (for platform_admin).
 */
export async function computePlatformAssurance(
  ports: AssurancePorts,
): Promise<PlatformAssuranceAggregate> {
  logger.info('Computing platform-wide assurance aggregate')

  const orgIds = await ports.listOrgIds()
  const dashboards: AssuranceDashboard[] = []

  for (const orgId of orgIds) {
    const dashboard = await computeAssuranceDashboard(orgId, ports)
    dashboards.push(dashboard)
  }

  const platformOverallScore =
    dashboards.length > 0
      ? Math.round(
          dashboards.reduce((sum, d) => sum + d.overallScore, 0) / dashboards.length,
        )
      : 0

  const platformOverallGrade = gradeFromScore(platformOverallScore)

  logger.info('Platform assurance aggregate computed', {
    orgCount: orgIds.length,
    platformOverallScore,
    platformOverallGrade,
  })

  return {
    generatedAt: new Date().toISOString(),
    orgCount: orgIds.length,
    dashboards,
    platformOverallScore,
    platformOverallGrade,
  }
}
