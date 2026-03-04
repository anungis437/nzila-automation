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
