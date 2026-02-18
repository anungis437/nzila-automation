/**
 * Nzila OS — Finance overlay tables (Close + QBO + Evidence)
 *
 * These tables sit *above* QuickBooks Online as a governance overlay:
 * close control engine, evidence pack generator, and QBO sync tracker.
 * All scoped by entity_id for multi-entity from day one.
 */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  varchar,
  date,
  boolean,
  integer,
} from 'drizzle-orm/pg-core'
import { entities } from './entities'

// ── Enums ───────────────────────────────────────────────────────────────────

export const closePeriodStatusEnum = pgEnum('close_period_status', [
  'open',
  'in_progress',
  'pending_approval',
  'closed',
])

export const closeTaskStatusEnum = pgEnum('close_task_status', [
  'not_started',
  'in_progress',
  'completed',
  'blocked',
])

export const closeExceptionSeverityEnum = pgEnum('close_exception_severity', [
  'low',
  'medium',
  'high',
  'critical',
])

export const closeExceptionStatusEnum = pgEnum('close_exception_status', [
  'open',
  'acknowledged',
  'resolved',
  'waived',
])

export const closeApprovalStatusEnum = pgEnum('close_approval_status', [
  'pending',
  'approved',
  'rejected',
])

export const qboSyncStatusEnum = pgEnum('qbo_sync_status', [
  'pending',
  'running',
  'completed',
  'failed',
])

export const qboReportTypeEnum = pgEnum('qbo_report_type', [
  'trial_balance',
  'profit_and_loss',
  'balance_sheet',
  'cash_flow',
  'aging_receivable',
  'aging_payable',
  'general_ledger',
])

// ── Close Period Tables ─────────────────────────────────────────────────────

export const closePeriods = pgTable('close_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  periodLabel: varchar('period_label', { length: 20 }).notNull(), // e.g. 2026-01, FY2026
  periodType: varchar('period_type', { length: 10 }).notNull(), // month | quarter | year
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: closePeriodStatusEnum('status').notNull().default('open'),
  openedBy: text('opened_by').notNull(), // clerk_user_id
  closedBy: text('closed_by'),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const closeTasks = pgTable('close_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  periodId: uuid('period_id')
    .notNull()
    .references(() => closePeriods.id),
  taskName: text('task_name').notNull(),
  description: text('description'),
  assignedTo: text('assigned_to'), // clerk_user_id
  status: closeTaskStatusEnum('status').notNull().default('not_started'),
  dueDate: date('due_date'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completedBy: text('completed_by'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const closeTaskEvidence = pgTable('close_task_evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => closeTasks.id),
  documentId: uuid('document_id').notNull(), // FK to documents
  sha256: text('sha256').notNull(),
  uploadedBy: text('uploaded_by').notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
})

export const closeExceptions = pgTable('close_exceptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  periodId: uuid('period_id')
    .notNull()
    .references(() => closePeriods.id),
  title: text('title').notNull(),
  description: text('description'),
  severity: closeExceptionSeverityEnum('severity').notNull().default('medium'),
  status: closeExceptionStatusEnum('status').notNull().default('open'),
  raisedBy: text('raised_by').notNull(),
  resolvedBy: text('resolved_by'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  waiverDocumentId: uuid('waiver_document_id'), // FK to documents if waived
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const closeApprovals = pgTable('close_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  periodId: uuid('period_id')
    .notNull()
    .references(() => closePeriods.id),
  approverClerkUserId: text('approver_clerk_user_id').notNull(),
  approverRole: text('approver_role').notNull(), // finance_approver | entity_admin
  status: closeApprovalStatusEnum('status').notNull().default('pending'),
  comments: text('comments'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── QBO Integration Tables ──────────────────────────────────────────────────

export const qboConnections = pgTable('qbo_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  realmId: text('realm_id').notNull(), // QBO company ID
  companyName: text('company_name'),
  isActive: boolean('is_active').notNull().default(true),
  connectedBy: text('connected_by').notNull(),
  connectedAt: timestamp('connected_at', { withTimezone: true }).notNull().defaultNow(),
  disconnectedAt: timestamp('disconnected_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const qboTokens = pgTable('qbo_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  connectionId: uuid('connection_id')
    .notNull()
    .references(() => qboConnections.id),
  accessToken: text('access_token').notNull(), // encrypted at rest
  refreshToken: text('refresh_token').notNull(), // encrypted at rest
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }).notNull(),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const qboSyncRuns = pgTable('qbo_sync_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  connectionId: uuid('connection_id')
    .notNull()
    .references(() => qboConnections.id),
  reportType: qboReportTypeEnum('report_type').notNull(),
  periodStart: date('period_start'),
  periodEnd: date('period_end'),
  status: qboSyncStatusEnum('status').notNull().default('pending'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const qboReports = pgTable('qbo_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  syncRunId: uuid('sync_run_id')
    .notNull()
    .references(() => qboSyncRuns.id),
  reportType: qboReportTypeEnum('report_type').notNull(),
  periodStart: date('period_start'),
  periodEnd: date('period_end'),
  documentId: uuid('document_id').notNull(), // FK to documents (Blob-stored)
  sha256: text('sha256').notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Governance ↔ Finance Link ───────────────────────────────────────────────

export const financeGovernanceLinks = pgTable('finance_governance_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  sourceType: varchar('source_type', { length: 40 }).notNull(), // close_period | tax_year | tax_filing
  sourceId: uuid('source_id').notNull(),
  governanceType: varchar('governance_type', { length: 40 }).notNull(), // resolution | governance_action | approval
  governanceId: uuid('governance_id').notNull(),
  linkDescription: text('link_description'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
