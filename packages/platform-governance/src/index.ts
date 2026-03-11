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
} from './types'

export {
  auditTimelineEntrySchema,
  appComplianceStatusSchema,
  governanceStatusReportSchema,
} from './types'

// audit timeline
export {
  recordAuditEvent,
  getAuditTimeline,
  clearAuditTimeline,
} from './auditTimeline'

// governance status
export {
  assessAppCompliance,
  generateFindings,
  buildGovernanceReport,
} from './governanceStatus'

// compliance validator
export {
  validateAppCompliance,
  validateAllApps,
} from './complianceValidator'

export type { ComplianceValidationConfig } from './complianceValidator'
