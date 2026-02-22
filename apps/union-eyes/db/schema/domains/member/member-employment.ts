/**
 * Member Employment Schema
 * 
 * Phase 1.2: Member Profile v2 - Employment Attributes
 * 
 * This schema stores detailed employment information for union members,
 * including:
 * - Employment status and dates
 * - Seniority tracking
 * - Job classification
 * - Compensation details
 * - Work schedule/shift information
 * 
 * Critical for Phase 2 dues calculation engine which requires:
 * - hourlyRate, baseSalary, grossWages
 * - hoursWorked, employment status
 * - Job classification for tiered dues
 */

import { 
  pgTable, 
  uuid, 
  varchar,
  text, 
  timestamp, 
  pgEnum,
  numeric,
  integer,
  boolean,
  date,
  jsonb,
  index
} from "drizzle-orm/pg-core";
import { organizationMembers } from "../../../schema-organizations";
import { employers } from "../../union-structure-schema";
import { worksites } from "../../union-structure-schema";
import { bargainingUnits } from "../../union-structure-schema";
import { organizations } from "../../../schema-organizations";
import { relations } from "drizzle-orm";

// =============================================================================
// ENUMS
// =============================================================================

/** Employment status */
export const employmentStatusEnum = pgEnum("employment_status", [
  "active",
  "on_leave",
  "layoff",
  "suspended",
  "terminated",
  "retired",
  "deceased"
]);

/** Employment type - affects dues calculation */
export const employmentTypeEnum = pgEnum("employment_type", [
  "full_time",
  "part_time",
  "casual",
  "seasonal",
  "temporary",
  "contract",
  "probationary"
]);

/** Pay frequency - critical for dues calculation */
export const payFrequencyEnum = pgEnum("pay_frequency", [
  "hourly",
  "weekly",
  "bi_weekly",
  "semi_monthly",
  "monthly",
  "annual",
  "per_diem"
]);

/** Shift type */
export const shiftTypeEnum = pgEnum("shift_type", [
  "day",
  "evening",
  "night",
  "rotating",
  "split",
  "on_call"
]);

/** Leave type */
export const leaveTypeEnum = pgEnum("leave_type", [
  "vacation",
  "sick",
  "maternity",
  "paternity",
  "parental",
  "bereavement",
  "medical",
  "disability",
  "union_business",
  "unpaid",
  "lwop", // Leave Without Pay
  "other"
]);

// =============================================================================
// MAIN TABLE: Member Employment
// =============================================================================

export const memberEmployment = pgTable("member_employment", {
  // Identity
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  memberId: uuid("member_id").notNull().references(() => organizationMembers.id),
  
  // Employment Context
  employerId: uuid("employer_id").references(() => employers.id),
  worksiteId: uuid("worksite_id").references(() => worksites.id),
  bargainingUnitId: uuid("bargaining_unit_id").references(() => bargainingUnits.id),
  
  // Employment Status & Type
  employmentStatus: employmentStatusEnum("employment_status").notNull().default("active"),
  employmentType: employmentTypeEnum("employment_type").notNull().default("full_time"),
  
  // Key Dates
  hireDate: date("hire_date").notNull(),
  seniorityDate: date("seniority_date").notNull(), // May differ from hire date
  terminationDate: date("termination_date"),
  expectedReturnDate: date("expected_return_date"), // For leaves
  
  // Seniority Tracking
  seniorityYears: numeric("seniority_years", { precision: 10, scale: 2 }), // Calculated field
  adjustedSeniorityDate: date("adjusted_seniority_date"), // Adjusted for breaks in service
  seniorityAdjustmentReason: text("seniority_adjustment_reason"),
  
  // Job Classification
  jobTitle: varchar("job_title", { length: 255 }).notNull(),
  jobCode: varchar("job_code", { length: 100 }), // Union classification code
  jobClassification: varchar("job_classification", { length: 255 }), // e.g., "Journeyman", "Apprentice"
  jobLevel: integer("job_level"), // Numeric level within classification
  department: varchar("department", { length: 255 }),
  division: varchar("division", { length: 255 }),
  
  // Compensation - Critical for Dues Calculation
  payFrequency: payFrequencyEnum("pay_frequency").notNull().default("hourly"),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }), // Used by hourly dues calculation
  baseSalary: numeric("base_salary", { precision: 12, scale: 2 }), // Annual salary
  grossWages: numeric("gross_wages", { precision: 12, scale: 2 }), // For percentage-based dues
  
  // Work Schedule
  regularHoursPerWeek: numeric("regular_hours_per_week", { precision: 5, scale: 2 }).default("40.00"),
  regularHoursPerPeriod: numeric("regular_hours_per_period", { precision: 7, scale: 2 }), // For dues calculation
  shiftType: shiftTypeEnum("shift_type"),
  shiftStartTime: varchar("shift_start_time", { length: 10 }), // e.g., "08:00"
  shiftEndTime: varchar("shift_end_time", { length: 10 }),
  operatesWeekends: boolean("operates_weekends").default(false),
  operates24Hours: boolean("operates_24_hours").default(false),
  
  // Additional Employment Details
  supervisorName: varchar("supervisor_name", { length: 255 }),
  supervisorId: uuid("supervisor_id"), // Reference to another member if supervisor is union
  
  // Probation
  isProbationary: boolean("is_probationary").default(false),
  probationEndDate: date("probation_end_date"),
  
  // Union-specific
  checkoffAuthorized: boolean("checkoff_authorized").default(true), // Dues deduction authorization
  checkoffDate: date("checkoff_date"), // Date authorization signed
  randExempt: boolean("rand_exempt").default(false), // Rand Formula exempt
  
  // Custom Fields (for organization-specific needs)
  customFields: jsonb("custom_fields"), // { badge_number, employee_id, etc. }
  
  // Audit
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: varchar("created_by", { length: 255 }),
  updatedBy: varchar("updated_by", { length: 255 }),
}, (table) => ({
  // Indexes for performance
  memberIdIdx: index("idx_member_employment_member").on(table.memberId),
  employerIdIdx: index("idx_member_employment_employer").on(table.employerId),
  worksiteIdIdx: index("idx_member_employment_worksite").on(table.worksiteId),
  bargainingUnitIdIdx: index("idx_member_employment_bargaining_unit").on(table.bargainingUnitId),
  statusIdx: index("idx_member_employment_status").on(table.employmentStatus),
  seniorityDateIdx: index("idx_member_employment_seniority_date").on(table.seniorityDate),
  jobCodeIdx: index("idx_member_employment_job_code").on(table.jobCode),
}));

// =============================================================================
// RELATED TABLE: Employment History
// =============================================================================

export const employmentHistory = pgTable("employment_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  memberId: uuid("member_id").notNull().references(() => organizationMembers.id),
  memberEmploymentId: uuid("member_employment_id").references(() => memberEmployment.id),
  
  // Change Tracking
  changeType: varchar("change_type", { length: 100 }).notNull(), // 'hire', 'promotion', 'transfer', 'leave', 'termination', 'wage_change'
  effectiveDate: date("effective_date").notNull(),
  
  // Before/After Snapshots
  previousValues: jsonb("previous_values"), // Snapshot of changed fields before
  newValues: jsonb("new_values"), // Snapshot of changed fields after
  
  // Details
  reason: text("reason"),
  notes: text("notes"),
  
  // Audit
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: varchar("created_by", { length: 255 }),
}, (table) => ({
  memberIdIdx: index("idx_employment_history_member").on(table.memberId),
  effectiveDateIdx: index("idx_employment_history_effective_date").on(table.effectiveDate),
  changeTypeIdx: index("idx_employment_history_change_type").on(table.changeType),
}));

// =============================================================================
// RELATED TABLE: Member Leaves
// =============================================================================

export const memberLeaves = pgTable("member_leaves", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  memberId: uuid("member_id").notNull().references(() => organizationMembers.id),
  memberEmploymentId: uuid("member_employment_id").references(() => memberEmployment.id),
  
  // Leave Details
  leaveType: leaveTypeEnum("leave_type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  expectedReturnDate: date("expected_return_date"),
  actualReturnDate: date("actual_return_date"),
  
  // Leave Status
  isApproved: boolean("is_approved").default(false),
  approvedBy: varchar("approved_by", { length: 255 }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  
  // Seniority Impact
  affectsSeniority: boolean("affects_seniority").default(false),
  seniorityAdjustmentDays: integer("seniority_adjustment_days"), // Days to subtract from seniority
  
  // Dues Impact
  affectsDues: boolean("affects_dues").default(true),
  duesWaiverApproved: boolean("dues_waiver_approved").default(false),
  
  // Documentation
  reason: text("reason"),
  notes: text("notes"),
  documents: jsonb("documents"), // Array of document references
  
  // Audit
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: varchar("created_by", { length: 255 }),
}, (table) => ({
  memberIdIdx: index("idx_member_leaves_member").on(table.memberId),
  leaveTypeIdx: index("idx_member_leaves_type").on(table.leaveType),
  startDateIdx: index("idx_member_leaves_start_date").on(table.startDate),
  statusIdx: index("idx_member_leaves_approved").on(table.isApproved),
}));

// =============================================================================
// RELATED TABLE: Job Classifications
// =============================================================================

export const jobClassifications = pgTable("job_classifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  bargainingUnitId: uuid("bargaining_unit_id").references(() => bargainingUnits.id),
  
  // Classification Identity
  jobCode: varchar("job_code", { length: 100 }).notNull(),
  jobTitle: varchar("job_title", { length: 255 }).notNull(),
  jobFamily: varchar("job_family", { length: 255 }), // e.g., "Maintenance", "Operations"
  jobLevel: integer("job_level"), // Hierarchical level
  
  // Wage Information (for dues calculation)
  minimumRate: numeric("minimum_rate", { precision: 10, scale: 2 }),
  maximumRate: numeric("maximum_rate", { precision: 10, scale: 2 }),
  standardRate: numeric("standard_rate", { precision: 10, scale: 2 }),
  
  // Classification Details
  description: text("description"),
  requirements: jsonb("requirements"), // Skills, certifications, etc.
  
  // Status
  isActive: boolean("is_active").default(true),
  effectiveDate: date("effective_date"),
  expiryDate: date("expiry_date"),
  
  // Audit
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: varchar("created_by", { length: 255 }),
}, (table) => ({
  jobCodeIdx: index("idx_job_classifications_code").on(table.jobCode),
  bargainingUnitIdx: index("idx_job_classifications_unit").on(table.bargainingUnitId),
  activeIdx: index("idx_job_classifications_active").on(table.isActive),
}));

// =============================================================================
// RELATIONS
// =============================================================================

export const memberEmploymentRelations = relations(memberEmployment, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [memberEmployment.organizationId],
    references: [organizations.id],
  }),
  member: one(organizationMembers, {
    fields: [memberEmployment.memberId],
    references: [organizationMembers.id],
  }),
  employer: one(employers, {
    fields: [memberEmployment.employerId],
    references: [employers.id],
  }),
  worksite: one(worksites, {
    fields: [memberEmployment.worksiteId],
    references: [worksites.id],
  }),
  bargainingUnit: one(bargainingUnits, {
    fields: [memberEmployment.bargainingUnitId],
    references: [bargainingUnits.id],
  }),
  history: many(employmentHistory),
  leaves: many(memberLeaves),
}));

export const employmentHistoryRelations = relations(employmentHistory, ({ one }) => ({
  organization: one(organizations, {
    fields: [employmentHistory.organizationId],
    references: [organizations.id],
  }),
  member: one(organizationMembers, {
    fields: [employmentHistory.memberId],
    references: [organizationMembers.id],
  }),
  employment: one(memberEmployment, {
    fields: [employmentHistory.memberEmploymentId],
    references: [memberEmployment.id],
  }),
}));

export const memberLeavesRelations = relations(memberLeaves, ({ one }) => ({
  organization: one(organizations, {
    fields: [memberLeaves.organizationId],
    references: [organizations.id],
  }),
  member: one(organizationMembers, {
    fields: [memberLeaves.memberId],
    references: [organizationMembers.id],
  }),
  employment: one(memberEmployment, {
    fields: [memberLeaves.memberEmploymentId],
    references: [memberEmployment.id],
  }),
}));

export const jobClassificationsRelations = relations(jobClassifications, ({ one }) => ({
  organization: one(organizations, {
    fields: [jobClassifications.organizationId],
    references: [organizations.id],
  }),
  bargainingUnit: one(bargainingUnits, {
    fields: [jobClassifications.bargainingUnitId],
    references: [bargainingUnits.id],
  }),
}));

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type MemberEmployment = typeof memberEmployment.$inferSelect;
export type NewMemberEmployment = typeof memberEmployment.$inferInsert;

export type EmploymentHistory = typeof employmentHistory.$inferSelect;
export type NewEmploymentHistory = typeof employmentHistory.$inferInsert;

export type MemberLeave = typeof memberLeaves.$inferSelect;
export type NewMemberLeave = typeof memberLeaves.$inferInsert;

export type JobClassification = typeof jobClassifications.$inferSelect;
export type NewJobClassification = typeof jobClassifications.$inferInsert;
