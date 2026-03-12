/**
 * @nzila/platform-change-management — barrel exports
 *
 * Enterprise Change Enablement for Nzila OS.
 * ITIL-aligned, Git-native, code-governed change control.
 */

// ── Types ───────────────────────────────────────────────────────────────────
export type {
  ChangeType,
  RiskLevel,
  ChangeStatus,
  ApprovalStatus,
  Environment,
  ApprovalRole,
  PIROutcome,
  PostImplementationReview,
  ChangeRecord,
  ApprovalRequirements,
  ChangeWindow,
  WindowConflict,
  FreezePeriod,
  CalendarPolicy,
  ChangeValidationResult,
  ChangeGovernanceEventType,
} from './types'

// ── Schemas ─────────────────────────────────────────────────────────────────
export {
  changeTypeSchema,
  riskLevelSchema,
  changeStatusSchema,
  approvalStatusSchema,
  environmentSchema,
  approvalRoleSchema,
  pirOutcomeSchema,
  postImplementationReviewSchema,
  changeRecordSchema,
  freezePeriodSchema,
  calendarPolicySchema,
  changeValidationResultSchema,
} from './schemas'

// ── Storage Service ─────────────────────────────────────────────────────────
export {
  loadChangeRecord,
  loadAllChanges,
  saveChangeRecord,
  listChangesByEnvironment,
  listChangesByService,
  findApprovedChange,
  getChangeRecordsDir,
} from './service'

// ── Approval Engine ─────────────────────────────────────────────────────────
export {
  evaluateChangeRequirements,
  canClosePIR,
  recordPostImplementationReview,
} from './approvals'

// ── Calendar ────────────────────────────────────────────────────────────────
export {
  loadCalendarPolicy,
  listUpcomingChanges,
  listChangesForEnvironment,
  detectWindowConflicts,
  isWithinApprovedWindow,
  isInFreezePeriod,
} from './calendar'

// ── Deployment Checks ───────────────────────────────────────────────────────
export {
  validateChangeWindow,
  listChangesPendingPIR,
} from './checks'
export type { ValidateChangeInput } from './checks'

// ── Audit / Governance Events ───────────────────────────────────────────────
export {
  emitChangeEvent,
  emitChangeCreated,
  emitChangeApproved,
  emitChangeRejected,
  emitChangeScheduled,
  emitChangeStarted,
  emitChangeCompleted,
  emitChangeFailed,
  emitChangeRolledBack,
  emitPIRRecorded,
} from './audit'

// ── Utilities ───────────────────────────────────────────────────────────────
export {
  generateChangeId,
  nowISO,
  parseChangeId,
  windowsOverlap,
  isWithinWindow,
} from './utils'
