/**
 * Health & Safety Domain - Index
 * 
 * Exports all health and safety related schemas, types, and enums
 * 
 * @module health-safety
 */

export * from './health-safety-schema';

// Re-export commonly used types for convenience
export type {
  InsertWorkplaceIncident,
  SelectWorkplaceIncident,
  InsertSafetyInspection,
  SelectSafetyInspection,
  InsertHazardReport,
  SelectHazardReport,
  InsertSafetyCommitteeMeeting,
  SelectSafetyCommitteeMeeting,
  InsertSafetyTrainingRecord,
  SelectSafetyTrainingRecord,
  InsertPpeEquipment,
  SelectPpeEquipment,
  InsertSafetyAudit,
  SelectSafetyAudit,
  InsertInjuryLog,
  SelectInjuryLog,
  InsertSafetyPolicy,
  SelectSafetyPolicy,
  InsertCorrectiveAction,
  SelectCorrectiveAction,
  InsertSafetyCertification,
  SelectSafetyCertification,
} from './health-safety-schema';
