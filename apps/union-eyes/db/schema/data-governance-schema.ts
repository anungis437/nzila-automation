/**
 * Data Subject Rights (DSR) Schema
 * 
 * GDPR, CCPA, Quebec Law 25 compliance for data subject rights requests
 */

import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { organizations } from "../schema-organizations";

/**
 * DSR Requests Table
 * Data Subject Rights requests (GDPR Article 15-22, CCPA, Law 25)
 */
export const dsrRequests = pgTable("dsr_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Request details
  requestType: varchar("request_type", { length: 50 }).notNull(),
  // 'access' (Art 15) | 'rectification' (Art 16) | 'erasure' (Art 17, Right to Delete) | 
  // 'portability' (Art 20) | 'objection' (Art 21) | 'restriction' (Art 18)
  
  // Subject
  subjectType: varchar("subject_type", { length: 50 }).notNull(), // 'member' | 'user' | 'external'
  subjectId: uuid("subject_id"),
  subjectEmail: varchar("subject_email", { length: 255 }).notNull(),
  subjectName: varchar("subject_name", { length: 255 }),
  
  // Organization
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Request details
  description: text("description"),
  requestSource: varchar("request_source", { length: 50 }).default('portal'), 
  // 'portal' | 'email' | 'phone' | 'mail'
  
  // Verification
  verified: boolean("verified").default(false),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: varchar("verified_by", { length: 255 }),
  verificationMethod: varchar("verification_method", { length: 50 }),
  // 'email_link' | 'document_upload' | 'phone_call' | 'manual'
  
  // Status tracking
  status: varchar("status", { length: 50 }).default('submitted'),
  // 'submitted' | 'verifying' | 'verified' | 'in_progress' | 'completed' | 'rejected' | 'cancelled'
  
  // Timing (GDPR: 30 days, extensible to 90 days)
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
  dueDate: date("due_date").notNull(), // 30 days from submission
  completedAt: timestamp("completed_at", { withTimezone: true }),
  
  // Assignment
  assignedTo: varchar("assigned_to", { length: 255 }),
  assignedAt: timestamp("assigned_at", { withTimezone: true }),
  
  // Processing
  dataCollected: jsonb("data_collected"), // Summary of data found
  actionsPerformed: jsonb("actions_performed"), // [{ action, table, recordCount, timestamp }]
  
  // Response
  responseData: jsonb("response_data"), // Data package for access/portability requests
  responseNotes: text("response_notes"),
  responseDeliveryMethod: varchar("response_delivery_method", { length: 50 }),
  // 'secure_download' | 'email' | 'physical_media'
  
  // Legal
  legalBasis: varchar("legal_basis", { length: 100 }), // 'gdpr' | 'ccpa' | 'quebec_law_25' | 'other'
  jurisdiction: varchar("jurisdiction", { length: 50 }), // 'EU' | 'California' | 'Quebec' | 'Canada'
  
  // Rejection (if applicable)
  rejectionReason: text("rejection_reason"),
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  rejectedBy: varchar("rejected_by", { length: 255 }),
  
  // Audit trail
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
});

/**
 * DSR Activity Log
 * Detailed log of activities on DSR requests
 */
export const dsrActivityLog = pgTable("dsr_activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Request reference
  requestId: uuid("request_id").notNull().references(() => dsrRequests.id, { onDelete: "cascade" }),
  
  // Activity details
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  // 'status_change' | 'assignment' | 'verification' | 'data_collection' | 'response_sent' | 'comment'
  
  description: text("description").notNull(),
  
  // Actor
  performedBy: varchar("performed_by", { length: 255 }).notNull(),
  performedByRole: varchar("performed_by_role", { length: 50 }),
  
  // Details
  previousValue: text("previous_value"),
  newValue: text("new_value"),
  
  // Audit trail
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
});

/**
 * Data Residency Configuration
 * Geographic storage requirements for data localization
 */
export const dataResidencyConfigs = pgTable("data_residency_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Organization
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Residency requirements
  primaryRegion: varchar("primary_region", { length: 50 }).notNull(), // 'Canada' | 'EU' | 'US'
  allowedRegions: text("allowed_regions").array().notNull(), // Regions where data can be stored
  prohibitedRegions: text("prohibited_regions").array(), // Regions where data cannot be stored
  
  // Data classification
  dataType: varchar("data_type", { length: 100 }).notNull(),
  // 'personal_data' | 'financial_data' | 'health_data' | 'biometric_data' | 'sensitive_data'
  
  // Storage locations
  storageLocations: jsonb("storage_locations").notNull(),
  // [{ type: 'primary' | 'backup', region: 'Canada', provider: 'AWS', location: 'ca-central-1' }]
  
  // Transfer restrictions
  allowCrossBorderTransfer: boolean("allow_cross_border_transfer").default(false),
  transferMechanisms: text("transfer_mechanisms").array(),
  // ['standard_contractual_clauses', 'adequacy_decision', 'binding_corporate_rules']
  
  // Legal basis
  legalBasis: text("legal_basis"), // Why this residency is required
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
 * Consent Records
 * Track consent for data processing (GDPR Art 6, 7)
 */
export const consentRecords = pgTable("consent_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Subject
  subjectType: varchar("subject_type", { length: 50 }).notNull(),
  subjectId: uuid("subject_id").notNull(),
  
  // Organization
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  
  // Consent details
  purposeType: varchar("purpose_type", { length: 100 }).notNull(),
  // 'membership' | 'communications' | 'analytics' | 'marketing' | 'profiling'
  
  purposeDescription: text("purpose_description").notNull(),
  
  // Legal basis
  legalBasis: varchar("legal_basis", { length: 50 }).notNull(),
  // 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests'
  
  // Consent given
  consentGiven: boolean("consent_given").notNull(),
  consentMethod: varchar("consent_method", { length: 50 }),
  // 'explicit_opt_in' | 'checkbox' | 'electronic_signature' | 'physical_signature'
  
  consentText: text("consent_text"), // Exact text that was consented to
  consentVersion: varchar("consent_version", { length: 50 }),
  
  // Timing
  consentDate: timestamp("consent_date", { withTimezone: true }).notNull(),
  expiryDate: date("expiry_date"),
  
  // Withdrawal
  withdrawn: boolean("withdrawn").default(false),
  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  withdrawalMethod: varchar("withdrawal_method", { length: 50 }),
  
  // Evidence
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  evidenceUrl: text("evidence_url"), // URL to consent form screenshot/PDF
  
  // Audit trail
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
});

// Export types
export type DSRRequest = typeof dsrRequests.$inferSelect;
export type NewDSRRequest = typeof dsrRequests.$inferInsert;
export type DSRActivityLog = typeof dsrActivityLog.$inferSelect;
export type NewDSRActivityLog = typeof dsrActivityLog.$inferInsert;
export type DataResidencyConfig = typeof dataResidencyConfigs.$inferSelect;
export type NewDataResidencyConfig = typeof dataResidencyConfigs.$inferInsert;
export type ConsentRecord = typeof consentRecords.$inferSelect;
export type NewConsentRecord = typeof consentRecords.$inferInsert;
