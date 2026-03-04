/**
 * @nzila/platform-assurance — barrel exports
 */

// types
export type {
  ScoreGrade,
  ComplianceScore,
  SecurityScore,
  OpsScore,
  CostScore,
  IntegrationReliabilityScore,
  AssuranceDashboard,
  PlatformAssuranceAggregate,
  AssurancePorts,
} from './types'

export { gradeFromScore, assuranceDashboardSchema } from './types'

// scorer
export { computeAssuranceDashboard, computePlatformAssurance } from './scorer'
