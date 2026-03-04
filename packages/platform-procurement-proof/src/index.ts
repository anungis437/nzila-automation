/**
 * @nzila/platform-procurement-proof — barrel exports
 */

// types
export type {
  ProofSection,
  ProofPackStatus,
  SecurityPosture,
  DependencyAuditResult,
  SignedAttestation,
  VulnerabilitySummary,
  DataLifecycle,
  DataManifest,
  RetentionControls,
  OperationalEvidence,
  SloCompliance,
  SloTarget,
  PerformanceMetrics,
  IncidentSummary,
  TrendWarning,
  GovernanceEvidence,
  SovereigntyProfile,
  ProcurementPack,
  ProcurementManifest,
  PackSignature,
  ProcurementProofPorts,
} from './types'

export {
  procurementManifestSchema,
  packSignatureSchema,
} from './types'

// collector
export { collectProcurementPack, signProcurementPack } from './collector'

// exporter
export { exportAsJson, exportAsBundle } from './exporter'
export type { ProcurementExportResult } from './exporter'

// zip exporter (signed zip bundle)
export { exportAsSignedZip, verifyZipSignature, getSigningKeyPair } from './zip-exporter'
export type {
  ZipManifest,
  ManifestFileEntry,
  ZipSignature,
  ZipVerification,
  ZipExportResult,
} from './zip-exporter'

// real ports factory
export { createRealPorts } from './real-ports'
export type { RealPortsDeps } from './real-ports'

// collectors
export {
  collectLatestEvidencePack,
  collectLatestComplianceSnapshots,
  collectDependencyPosture,
  collectIntegrationsHealth,
  collectObservabilitySummary,
} from './collectors'
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
  EvidencePackCollectorPorts,
  ComplianceSnapshotCollectorPorts,
  IntegrationsHealthPorts,
  ObservabilityCollectorPorts,
} from './collectors'

// schemas
export {
  ProcurementSectionSchema,
  validateSection,
  safeValidateSection,
} from './schemas/section.schema'
export type { ProcurementSection } from './schemas/section.schema'
