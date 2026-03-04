/**
 * @nzila/platform-procurement-proof — Collectors barrel
 */

// Types
export type {
  CollectorStatus,
  CollectorResult,
  EvidencePackCollectorData,
  ComplianceSnapshotCollectorData,
  DependencyPostureCollectorData,
  IntegrationsHealthCollectorData,
  IntegrationProviderSummary,
  ObservabilitySummaryCollectorData,
  HealthCheckSummary,
} from './types'

export {
  collectorResultSchema,
  evidencePackCollectorDataSchema,
  complianceSnapshotCollectorDataSchema,
  dependencyPostureCollectorDataSchema,
  integrationsHealthCollectorDataSchema,
  observabilitySummaryCollectorDataSchema,
} from './types'

// Collectors
export { collectLatestEvidencePack } from './evidence-pack-latest'
export type { EvidencePackCollectorPorts } from './evidence-pack-latest'

export { collectLatestComplianceSnapshots } from './compliance-snapshots-latest'
export type { ComplianceSnapshotCollectorPorts } from './compliance-snapshots-latest'

export { collectDependencyPosture } from './dependency-posture'

export { collectIntegrationsHealth } from './integrations-health'
export type { IntegrationsHealthPorts } from './integrations-health'

export { collectObservabilitySummary } from './observability-summary'
export type { ObservabilityCollectorPorts } from './observability-summary'
