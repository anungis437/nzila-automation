/**
 * Policy Engine Schema
 * 
 * Encodes bylaws and organizational policies as executable rules
 * Supports eligibility rules, cooling-off periods, quorum requirements, and retention policies
 */

import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, boolean, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { organizations } from "../schema-organizations";

/**
 * Policy Rules Table
 * Encoded organizational rules (bylaws, policies, procedures)
 */
export const policyRules = pgTable("policy_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Rule metadata
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Organization
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Rule classification
  ruleType: varchar("rule_type", { length: 50 }).notNull(), 
  // 'eligibility' | 'cooling_off' | 'quorum' | 'retention' | 'approval' | 'access_control' | 'custom'
  
  category: varchar("category", { length: 50 }).notNull(),
  // 'membership' | 'voting' | 'finance' | 'governance' | 'data' | 'employment' | 'operational'
  
  // Rule definition
  conditions: jsonb("conditions").notNull(), // Rule logic in JSON format
  // Example for eligibility: { field: 'membershipMonths', operator: '>=', value: 6 }
  // Example for quorum: { participantType: 'voting_members', percentage: 50, minimum: 20 }
  
  actions: jsonb("actions").notNull(), // Actions to take when rule applies
  // Example: { allow: true, message: 'Eligible to vote' }
  // Example: { deny: true, reason: 'Must be member for 6 months' }
  
  exceptions: jsonb("exceptions"), // Exception conditions
  
  // Enforcement
  enforced: boolean("enforced").default(true),
  severity: varchar("severity", { length: 20 }).default('medium'), // 'low' | 'medium' | 'high' | 'critical'
  
  // Effective dates
  effectiveDate: date("effective_date").notNull(),
  expirationDate: date("expiration_date"),
  
  // Source
  sourceDocument: varchar("source_document", { length: 255 }), // Bylaw section, policy number
  legalReference: text("legal_reference"), // Legal citation if applicable
  
  // Status
  status: varchar("status", { length: 50 }).default('active'), // 'draft' | 'active' | 'suspended' | 'archived'
  
  // Version control
  version: integer("version").default(1),
  previousVersionId: uuid("previous_version_id"),
  
  // Approval
  approvedBy: varchar("approved_by", { length: 255 }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  
  // Audit trail
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  updatedBy: varchar("updated_by", { length: 255 }),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
});

/**
 * Policy Evaluations Table
 * Log of policy rule evaluations and outcomes
 */
export const policyEvaluations = pgTable("policy_evaluations", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Rule reference
  ruleId: uuid("rule_id").notNull().references(() => policyRules.id, { onDelete: "cascade" }),
  
  // Context
  subjectType: varchar("subject_type", { length: 50 }).notNull(), // 'member' | 'user' | 'organization' | 'action'
  subjectId: uuid("subject_id").notNull(),
  
  // Evaluation
  evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).defaultNow(),
  inputData: jsonb("input_data").notNull(), // Data provided for evaluation
  
  // Outcome
  passed: boolean("passed").notNull(),
  failureReason: text("failure_reason"),
  actionTaken: text("action_taken"), // 'allowed' | 'denied' | 'warning' | 'escalated'
  
  // Context
  context: jsonb("context"), // Additional context (e.g., { action: 'vote', sessionId: '...' })
  
  // Audit trail
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/**
 * Retention Policies Table
 * Data retention and deletion policies
 */
export const retentionPolicies = pgTable("retention_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Policy metadata
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Organization
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Data classification
  dataType: varchar("data_type", { length: 100 }).notNull(), 
  // 'member_records' | 'financial_records' | 'case_files' | 'communications' | 'audit_logs'
  
  dataCategory: varchar("data_category", { length: 50 }),
  // 'personal' | 'financial' | 'legal' | 'operational' | 'audit'
  
  // Retention rules
  retentionPeriodYears: integer("retention_period_years").notNull(),
  retentionTrigger: varchar("retention_trigger", { length: 50 }).notNull(),
  // 'from_creation' | 'from_closure' | 'from_termination' | 'from_resolution' | 'from_filing'
  
  // Actions
  actionOnExpiry: varchar("action_on_expiry", { length: 50 }).notNull(),
  // 'delete' | 'archive' | 'anonymize' | 'review_required'
  
  // Legal holds
  canBeHeld: boolean("can_be_held").default(true), // Can legal hold override retention?
  minimumRetention: integer("minimum_retention"), // Minimum years before deletion allowed
  
  // Compliance
  legalBasis: text("legal_basis"), // Legal requirement for this retention
  regulatoryReference: text("regulatory_reference"),
  
  // Status
  status: varchar("status", { length: 50 }).default('active'),
  effectiveDate: date("effective_date").notNull(),
  
  // Audit trail
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
});

/**
 * Legal Holds Table
 * Suspension of retention policies for legal/audit purposes
 */
export const legalHolds = pgTable("legal_holds", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Hold details
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  caseNumber: varchar("case_number", { length: 100 }),
  
  // Organization
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Scope
  dataTypes: text("data_types").array().notNull(), // Which data types are on hold
  dateRangeStart: date("date_range_start"), // Hold data from this date
  dateRangeEnd: date("date_range_end"), // Hold data until this date
  
  // Custodians
  custodians: jsonb("custodians"), // [{ name, role, notified_at }]
  
  // Status
  status: varchar("status", { length: 50 }).default('active'), // 'active' | 'released' | 'expired'
  
  // Dates
  issuedDate: date("issued_date").notNull(),
  releasedDate: date("released_date"),
  expirationDate: date("expiration_date"),
  
  // Legal details
  legalAuthority: text("legal_authority"), // Court order, subpoena, etc.
  attorney: varchar("attorney", { length: 255 }),
  matterDescription: text("matter_description"),
  
  // Notifications
  notificationsSent: boolean("notifications_sent").default(false),
  notificationsSentAt: timestamp("notifications_sent_at", { withTimezone: true }),
  
  // Audit trail
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  releasedBy: varchar("released_by", { length: 255 }),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
});

/**
 * Policy Exceptions Table
 * Approved exceptions to policy rules
 */
export const policyExceptions = pgTable("policy_exceptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Rule reference
  ruleId: uuid("rule_id").notNull().references(() => policyRules.id, { onDelete: "cascade" }),
  
  // Exception details
  subjectType: varchar("subject_type", { length: 50 }).notNull(),
  subjectId: uuid("subject_id").notNull(),
  
  // Justification
  reason: text("reason").notNull(),
  approvedBy: varchar("approved_by", { length: 255 }).notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }).notNull(),
  
  // Validity
  effectiveDate: date("effective_date").notNull(),
  expirationDate: date("expiration_date"),
  
  // Status
  status: varchar("status", { length: 50 }).default('active'),
  
  // Audit trail
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
});

// Export types
export type PolicyRule = typeof policyRules.$inferSelect;
export type NewPolicyRule = typeof policyRules.$inferInsert;
export type PolicyEvaluation = typeof policyEvaluations.$inferSelect;
export type NewPolicyEvaluation = typeof policyEvaluations.$inferInsert;
export type RetentionPolicy = typeof retentionPolicies.$inferSelect;
export type NewRetentionPolicy = typeof retentionPolicies.$inferInsert;
export type LegalHold = typeof legalHolds.$inferSelect;
export type NewLegalHold = typeof legalHolds.$inferInsert;
export type PolicyException = typeof policyExceptions.$inferSelect;
export type NewPolicyException = typeof policyExceptions.$inferInsert;
