/**
 * Reports Database Schema
 * 
 * Advanced reporting and analytics system for:
 * - Custom report definitions
 * - Report templates
 * - Report execution history
 * - Scheduled reports
 * - Report sharing and permissions
 * 
 * @module reports-schema
 */

import { pgTable, uuid, text, timestamp, boolean, varchar, jsonb, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from '../../../schema-organizations';

// ============================================================================
// ENUMS
// ============================================================================

export const reportTypeEnum = pgEnum('report_type', [
  'custom',
  'template',
  'system',
  'scheduled'
]);

export const reportCategoryEnum = pgEnum('report_category', [
  'claims',
  'members',
  'financial',
  'compliance',
  'performance',
  'custom'
]);

export const reportFormatEnum = pgEnum('report_format', [
  'pdf',
  'excel',
  'csv',
  'json',
  'html'
]);

export const scheduleFrequencyEnum = pgEnum('schedule_frequency', [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly'
]);

// ============================================================================
// REPORTS TABLE
// ============================================================================

export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  reportType: reportTypeEnum('report_type').notNull().default('custom'),
  category: reportCategoryEnum('category').notNull().default('custom'),
  config: jsonb('config').notNull(), // Report configuration (data sources, fields, filters, etc.)
  isPublic: boolean('is_public').notNull().default(false),
  isTemplate: boolean('is_template').notNull().default(false),
  templateId: uuid('template_id'), // If created from a template
  createdBy: varchar('created_by', { length: 255 }).notNull(), // User ID - matches users.userId VARCHAR(255)
  updatedBy: varchar('updated_by', { length: 255 }), // User ID - matches users.userId VARCHAR(255)
  lastRunAt: timestamp('last_run_at'),
  runCount: integer('run_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================================================
// REPORT TEMPLATES TABLE
// ============================================================================

export const reportTemplates = pgTable('report_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: reportCategoryEnum('category').notNull(),
  config: jsonb('config').notNull(),
  isSystem: boolean('is_system').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  thumbnail: varchar('thumbnail', { length: 500 }),
  tags: jsonb('tags'), // Array of tags for filtering
  createdBy: varchar('created_by', { length: 255 }), // User ID - matches users.userId VARCHAR(255)
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================================================
// REPORT EXECUTIONS TABLE
// ============================================================================

export const reportExecutions = pgTable('report_executions', {
  id: uuid('id').defaultRandom().primaryKey(),
  reportId: uuid('report_id').notNull(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  executedBy: varchar('executed_by', { length: 255 }).notNull(), // User ID - matches users.userId VARCHAR(255)
  executedAt: timestamp('executed_at').notNull().defaultNow(),
  format: reportFormatEnum('format').notNull().default('pdf'),
  parameters: jsonb('parameters'), // Runtime parameters used
  resultCount: varchar('result_count', { length: 50 }),
  executionTimeMs: varchar('execution_time_ms', { length: 50 }),
  fileUrl: varchar('file_url', { length: 500 }),
  fileSize: varchar('file_size', { length: 50 }),
  status: varchar('status', { length: 50 }).notNull().default('completed'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================================
// SCHEDULED REPORTS TABLE
// ============================================================================

export const scheduledReports = pgTable('scheduled_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  reportId: uuid('report_id').notNull(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  frequency: scheduleFrequencyEnum('frequency').notNull(),
  dayOfWeek: varchar('day_of_week', { length: 20 }), // For weekly reports
  dayOfMonth: varchar('day_of_month', { length: 20 }), // For monthly reports
  timeOfDay: varchar('time_of_day', { length: 10 }).notNull(), // HH:MM format
  timezone: varchar('timezone', { length: 100 }).notNull().default('UTC'),
  format: reportFormatEnum('format').notNull().default('pdf'),
  recipients: jsonb('recipients').notNull(), // Array of email addresses
  parameters: jsonb('parameters'), // Default parameters
  isActive: boolean('is_active').notNull().default(true),
  lastExecutedAt: timestamp('last_executed_at'),
  nextExecutionAt: timestamp('next_execution_at'),
  createdBy: varchar('created_by', { length: 255 }).notNull(), // User ID - matches users.userId VARCHAR(255)
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================================================
// REPORT SHARES TABLE
// ============================================================================

export const reportShares = pgTable('report_shares', {
  id: uuid('id').defaultRandom().primaryKey(),
  reportId: uuid('report_id').notNull(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  sharedBy: varchar('shared_by', { length: 255 }).notNull(), // User ID - matches users.userId VARCHAR(255)
  sharedWith: varchar('shared_with', { length: 255 }), // User ID or null for public - matches users.userId VARCHAR(255)
  canEdit: boolean('can_edit').notNull().default(false),
  canExecute: boolean('can_execute').notNull().default(true),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const reportsRelations = relations(reports, ({ one, many }) => ({
  template: one(reportTemplates, {
    fields: [reports.templateId],
    references: [reportTemplates.id],
  }),
  executions: many(reportExecutions),
  schedules: many(scheduledReports),
  shares: many(reportShares),
}));

export const reportTemplatesRelations = relations(reportTemplates, ({ many }) => ({
  reports: many(reports),
}));

export const reportExecutionsRelations = relations(reportExecutions, ({ one }) => ({
  report: one(reports, {
    fields: [reportExecutions.reportId],
    references: [reports.id],
  }),
}));

export const scheduledReportsRelations = relations(scheduledReports, ({ one }) => ({
  report: one(reports, {
    fields: [scheduledReports.reportId],
    references: [reports.id],
  }),
}));

export const reportSharesRelations = relations(reportShares, ({ one }) => ({
  report: one(reports, {
    fields: [reportShares.reportId],
    references: [reports.id],
  }),
}));

