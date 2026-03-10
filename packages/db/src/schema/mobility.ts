/* ── Mobility OS – Drizzle Schema ─────────────────────────
 *
 * Global Mobility OS schema for investment migration workflows.
 * All org-scoped tables reference orgs.id via org_id.
 *
 * @module @nzila/db/schema/mobility
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  varchar,
  boolean,
  numeric,
  date,
  real,
} from 'drizzle-orm/pg-core'
import { orgs } from './orgs'

/* ── Enums ────────────────────────────────────────────────── */

export const mobilityLicenseTypeEnum = pgEnum('mobility_license_type', [
  'regulated_agent',
  'authorized_representative',
  'law_firm',
  'consultancy',
])

export const mobilityAdvisorRoleEnum = pgEnum('mobility_advisor_role', [
  'lead_advisor',
  'associate',
  'compliance_officer',
  'admin',
])

export const mobilityWealthTierEnum = pgEnum('mobility_wealth_tier', [
  'standard',
  'hnw',
  'uhnw',
])

export const mobilityRiskProfileEnum = pgEnum('mobility_risk_profile', [
  'low',
  'medium',
  'high',
  'critical',
])

export const mobilityCaseStatusEnum = pgEnum('mobility_case_status', [
  'draft',
  'intake',
  'kyc_pending',
  'aml_screening',
  'document_verification',
  'compliance_review',
  'approved',
  'submitted',
  'processing',
  'granted',
  'rejected',
  'withdrawn',
  'archived',
])

export const mobilityCaseStageEnum = pgEnum('mobility_case_stage', [
  'pre_engagement',
  'onboarding',
  'due_diligence',
  'application_prep',
  'government_submission',
  'adjudication',
  'post_approval',
  'maintenance',
])

export const mobilityProgramTypeEnum = pgEnum('mobility_program_type', [
  'citizenship_by_investment',
  'residency_by_investment',
  'golden_visa',
  'startup_visa',
  'retirement_visa',
  'digital_nomad',
])

export const mobilityInvestmentTypeEnum = pgEnum('mobility_investment_type', [
  'real_estate',
  'government_bonds',
  'national_fund',
  'business_investment',
  'bank_deposit',
  'donation',
])

export const mobilityTaskTypeEnum = pgEnum('mobility_task_type', [
  'document_collection',
  'kyc_review',
  'aml_check',
  'client_meeting',
  'government_filing',
  'payment_verification',
  'follow_up',
])

export const mobilityTaskStatusEnum = pgEnum('mobility_task_status', [
  'pending',
  'in_progress',
  'completed',
  'blocked',
  'cancelled',
])

export const mobilityDocTypeEnum = pgEnum('mobility_doc_type', [
  'passport',
  'birth_certificate',
  'marriage_certificate',
  'bank_statement',
  'tax_return',
  'police_clearance',
  'medical_report',
  'proof_of_address',
  'source_of_funds',
  'investment_agreement',
  'power_of_attorney',
  'other',
])

export const mobilityVerificationStatusEnum = pgEnum('mobility_verification_status', [
  'pending',
  'verified',
  'rejected',
  'expired',
])

export const mobilityComplianceEventEnum = pgEnum('mobility_compliance_event', [
  'kyc_initiated',
  'kyc_completed',
  'aml_clear',
  'aml_flag',
  'pep_flag',
  'source_of_funds_verified',
  'document_verified',
  'compliance_approved',
  'compliance_rejected',
  'risk_escalation',
])

export const mobilitySeverityEnum = pgEnum('mobility_severity', [
  'info',
  'warning',
  'critical',
])

export const mobilityFamilyRelationEnum = pgEnum('mobility_family_relation', [
  'spouse',
  'child',
  'parent',
  'sibling',
  'dependent',
])

export const mobilityCommChannelEnum = pgEnum('mobility_comm_channel', [
  'email',
  'whatsapp',
  'teams',
  'sms',
  'in_app',
])

export const mobilityCommDirectionEnum = pgEnum('mobility_comm_direction', [
  'inbound',
  'outbound',
])

export const mobilityMessageTypeEnum = pgEnum('mobility_message_type', [
  'case_status',
  'document_request',
  'appointment_scheduling',
  'renewal_reminder',
  'general',
])

/* ── Tables ───────────────────────────────────────────────── */

/** Investment migration firms */
export const mobilityFirms = pgTable('mobility_firms', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  name: text('name').notNull(),
  jurisdiction: varchar('jurisdiction', { length: 10 }).notNull(),
  licenseType: mobilityLicenseTypeEnum('license_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Advisors within a firm */
export const mobilityAdvisors = pgTable('mobility_advisors', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  firmId: uuid('firm_id')
    .notNull()
    .references(() => mobilityFirms.id),
  userId: text('user_id').notNull(),
  role: mobilityAdvisorRoleEnum('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/** HNW clients */
export const mobilityClients = pgTable('mobility_clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  firmId: uuid('firm_id')
    .notNull()
    .references(() => mobilityFirms.id),
  hubspotContactId: text('hubspot_contact_id'),
  primaryNationality: varchar('primary_nationality', { length: 3 }).notNull(),
  residenceCountry: varchar('residence_country', { length: 3 }).notNull(),
  wealthTier: mobilityWealthTierEnum('wealth_tier').notNull(),
  riskProfile: mobilityRiskProfileEnum('risk_profile').notNull().default('low'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Family members linked to a client */
export const mobilityFamilyMembers = pgTable('mobility_family_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  clientId: uuid('client_id')
    .notNull()
    .references(() => mobilityClients.id),
  relation: mobilityFamilyRelationEnum('relation').notNull(),
  nationality: varchar('nationality', { length: 3 }).notNull(),
  dob: date('dob'),
  passportExpiry: date('passport_expiry'),
})

/** Citizenship / residency programs (global reference data, still org-scoped for customisation) */
export const mobilityPrograms = pgTable('mobility_programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  country: varchar('country', { length: 3 }).notNull(),
  programName: text('program_name').notNull(),
  programType: mobilityProgramTypeEnum('program_type').notNull(),
  investmentType: mobilityInvestmentTypeEnum('investment_type').notNull(),
  minimumInvestment: numeric('minimum_investment', { precision: 18, scale: 2 }).notNull(),
  physicalPresenceRequired: boolean('physical_presence_required').notNull().default(false),
  timeToCitizenship: text('time_to_citizenship'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Investment migration cases */
export const mobilityCases = pgTable('mobility_cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  clientId: uuid('client_id')
    .notNull()
    .references(() => mobilityClients.id),
  advisorId: uuid('advisor_id')
    .notNull()
    .references(() => mobilityAdvisors.id),
  programId: uuid('program_id')
    .notNull()
    .references(() => mobilityPrograms.id),
  hubspotDealId: text('hubspot_deal_id'),
  status: mobilityCaseStatusEnum('status').notNull().default('draft'),
  stage: mobilityCaseStageEnum('stage').notNull().default('pre_engagement'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Tasks within a case */
export const mobilityCaseTasks = pgTable('mobility_case_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  caseId: uuid('case_id')
    .notNull()
    .references(() => mobilityCases.id),
  taskType: mobilityTaskTypeEnum('task_type').notNull(),
  assignedTo: text('assigned_to').notNull(),
  dueDate: date('due_date'),
  status: mobilityTaskStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Documents attached to a case */
export const mobilityDocuments = pgTable('mobility_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  caseId: uuid('case_id')
    .notNull()
    .references(() => mobilityCases.id),
  fileUrl: text('file_url').notNull(),
  sharepointUrl: text('sharepoint_url'),
  documentType: mobilityDocTypeEnum('document_type').notNull(),
  verificationStatus: mobilityVerificationStatusEnum('verification_status')
    .notNull()
    .default('pending'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Compliance / KYC / AML events */
export const mobilityComplianceEvents = pgTable('mobility_compliance_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  caseId: uuid('case_id')
    .notNull()
    .references(() => mobilityCases.id),
  eventType: mobilityComplianceEventEnum('event_type').notNull(),
  severity: mobilitySeverityEnum('severity').notNull().default('info'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Communication log (email, WhatsApp, Teams, etc.) */
export const mobilityCommunications = pgTable('mobility_communications', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  caseId: uuid('case_id').references(() => mobilityCases.id),
  clientId: uuid('client_id')
    .notNull()
    .references(() => mobilityClients.id),
  channel: mobilityCommChannelEnum('channel').notNull(),
  direction: mobilityCommDirectionEnum('direction').notNull(),
  messageType: mobilityMessageTypeEnum('message_type').notNull().default('general'),
  subject: text('subject'),
  body: text('body').notNull(),
  externalId: text('external_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/** AI advisory outputs — audit-logged, require human approval */
export const mobilityAiOutputs = pgTable('mobility_ai_outputs', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  caseId: uuid('case_id').references(() => mobilityCases.id),
  clientId: uuid('client_id').references(() => mobilityClients.id),
  outputType: text('output_type').notNull(),
  content: text('content').notNull(),
  confidenceScore: real('confidence_score').notNull(),
  reasoningTrace: text('reasoning_trace').notNull(),
  jurisdictionRefs: jsonb('jurisdiction_refs').default([]),
  approved: boolean('approved').notNull().default(false),
  approvedBy: text('approved_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Immutable audit log for all mobility actions */
export const mobilityAuditLog = pgTable('mobility_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => orgs.id),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  targetEntityId: uuid('entity_id'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
