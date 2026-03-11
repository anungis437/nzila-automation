/**
 * @nzila/platform-governance — barrel exports
 */

// types
export type {
  GovernanceEventType,
  AuditTimelineEntry,
  ComplianceLevel,
  AppComplianceStatus,
  GovernanceStatusReport,
  GovernanceFinding,
  GovernanceStatus,
  GovernanceAuditTimelineEntry,
  PolicyEngineHealth,
  EvidencePackHealth,
  ComplianceSnapshotHealth,
  AuditTimelineHealth,
} from './types'

export {
  auditTimelineEntrySchema,
  appComplianceStatusSchema,
  governanceStatusReportSchema,
  governanceStatusSchema,
  governanceAuditTimelineEntrySchema,
} from './types'

// audit timeline
export {
  recordAuditEvent,
  getAuditTimeline,
  clearAuditTimeline,
  buildGovernanceAuditTimeline,
} from './auditTimeline'

// governance status
export {
  assessAppCompliance,
  generateFindings,
  buildGovernanceReport,
  getGovernanceStatus,
} from './governanceStatus'

// compliance validator
export {
  validateAppCompliance,
  validateAllApps,
} from './complianceValidator'

export type { ComplianceValidationConfig } from './complianceValidator'
