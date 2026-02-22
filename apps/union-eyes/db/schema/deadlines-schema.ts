/**
 * Deadlines Database Schema
 * 
 * Proactive deadline management system for:
 * - Deadline rules and auto-creation
 * - Extension requests and approvals
 * - Alert generation and tracking
 * - Compliance reporting
 * - Holiday tracking
 * 
 * @module deadlines-schema
 */

import { pgTable, uuid, text, timestamp, boolean, integer, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from '../schema-organizations';

// ============================================================================
// ENUMS
// ============================================================================

export const deadlineStatusEnum = pgEnum('deadline_status', [
  'pending',
  'completed',
  'missed',
  'extended',
  'waived'
]);

export const deadlinePriorityEnum = pgEnum('deadline_priority', [
  'low',
  'medium',
  'high',
  'critical'
]);

export const extensionStatusEnum = pgEnum('extension_status', [
  'pending',
  'approved',
  'denied',
  'cancelled'
]);

export const alertSeverityEnum = pgEnum('alert_severity', [
  'info',
  'warning',
  'urgent',
  'critical'
]);

export const deliveryMethodEnum = pgEnum('delivery_method', [
  'email',
  'sms',
  'push',
  'in_app'
]);

export const deliveryStatusEnum = pgEnum('delivery_status', [
  'pending',
  'sent',
  'delivered',
  'failed',
  'bounced'
]);

// ============================================================================
// DEADLINE RULES TABLE
// ============================================================================

export const deadlineRules = pgTable('deadline_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  ruleName: varchar('rule_name', { length: 255 }).notNull(),
  ruleCode: varchar('rule_code', { length: 100 }).notNull(),
  description: text('description'),
  claimType: varchar('claim_type', { length: 100 }),
  priorityLevel: varchar('priority_level', { length: 50 }),
  stepNumber: integer('step_number'),
  daysFromEvent: integer('days_from_event').notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull().default('claim_filed'),
  businessDaysOnly: boolean('business_days_only').notNull().default(true),
  allowsExtension: boolean('allows_extension').notNull().default(true),
  maxExtensionDays: integer('max_extension_days').notNull().default(30),
  requiresApproval: boolean('requires_approval').notNull().default(true),
  escalateToRole: varchar('escalate_to_role', { length: 100 }),
  escalationDelayDays: integer('escalation_delay_days').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  isSystemRule: boolean('is_system_rule').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================================================
// CLAIM DEADLINES TABLE
// ============================================================================

export const deadlines = pgTable('claim_deadlines', {
  id: uuid('id').defaultRandom().primaryKey(),
  claimId: uuid('claim_id').notNull(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  deadlineRuleId: uuid('deadline_rule_id'),
  deadlineName: varchar('deadline_name', { length: 255 }).notNull(),
  deadlineType: varchar('deadline_type', { length: 100 }).notNull(),
  eventDate: timestamp('event_date').notNull(),
  originalDeadline: timestamp('original_deadline').notNull(),
  dueDate: timestamp('due_date').notNull(), // Alias for currentDeadline
  completedAt: timestamp('completed_at'),
  status: deadlineStatusEnum('status').notNull().default('pending'),
  priority: deadlinePriorityEnum('priority').notNull().default('medium'),
  extensionCount: integer('extension_count').notNull().default(0),
  totalExtensionDays: integer('total_extension_days').notNull().default(0),
  lastExtensionDate: timestamp('last_extension_date'),
  lastExtensionReason: text('last_extension_reason'),
  completedBy: varchar('completed_by', { length: 255 }), // User ID - matches users.userId VARCHAR(255)
  completionNotes: text('completion_notes'),
  isOverdue: boolean('is_overdue').notNull().default(false),
  daysUntilDue: integer('days_until_due'),
  daysOverdue: integer('days_overdue').notNull().default(0),
  escalatedAt: timestamp('escalated_at'),
  escalatedTo: varchar('escalated_to', { length: 255 }), // User ID - matches users.userId VARCHAR(255)
  alertCount: integer('alert_count').notNull().default(0),
  lastAlertSent: timestamp('last_alert_sent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================================================
// DEADLINE EXTENSIONS TABLE
// ============================================================================

export const deadlineExtensions = pgTable('deadline_extensions', {
  id: uuid('id').defaultRandom().primaryKey(),
  deadlineId: uuid('deadline_id').notNull(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  requestedBy: varchar('requested_by', { length: 255 }).notNull(), // User ID - matches users.userId VARCHAR(255)
  requestedAt: timestamp('requested_at').notNull().defaultNow(),
  requestedDays: integer('requested_days').notNull(),
  requestReason: text('request_reason').notNull(),
  status: extensionStatusEnum('status').notNull().default('pending'),
  requiresApproval: boolean('requires_approval').notNull().default(true),
  approvedBy: varchar('approved_by', { length: 255 }), // User ID - matches users.userId VARCHAR(255)
  approvalDecisionAt: timestamp('approval_decision_at'),
  approvalNotes: text('approval_notes'),
  newDeadline: timestamp('new_deadline'),
  daysGranted: integer('days_granted'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================================
// DEADLINE ALERTS TABLE
// ============================================================================

export const deadlineAlerts = pgTable('deadline_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  deadlineId: uuid('deadline_id').notNull(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  alertType: varchar('alert_type', { length: 100 }).notNull(),
  alertSeverity: alertSeverityEnum('alert_severity').notNull(),
  alertTrigger: varchar('alert_trigger', { length: 100 }).notNull(),
  recipientId: varchar('recipient_id', { length: 255 }).notNull(), // User ID - matches users.userId VARCHAR(255)
  recipientRole: varchar('recipient_role', { length: 100 }),
  deliveryMethod: deliveryMethodEnum('delivery_method').notNull(),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  deliveredAt: timestamp('delivered_at'),
  deliveryStatus: deliveryStatusEnum('delivery_status').notNull().default('pending'),
  deliveryError: text('delivery_error'),
  viewedAt: timestamp('viewed_at'),
  acknowledgedAt: timestamp('acknowledged_at'),
  actionTaken: varchar('action_taken', { length: 255 }),
  actionTakenAt: timestamp('action_taken_at'),
  subject: varchar('subject', { length: 500 }),
  message: text('message'),
  actionUrl: varchar('action_url', { length: 500 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================================
// HOLIDAYS TABLE
// ============================================================================

export const holidays = pgTable('holidays', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, {
    onDelete: 'cascade',
  }),
  holidayDate: timestamp('holiday_date').notNull(),
  holidayName: varchar('holiday_name', { length: 255 }).notNull(),
  holidayType: varchar('holiday_type', { length: 100 }).notNull(),
  isRecurring: boolean('is_recurring').notNull().default(false),
  appliesTo: varchar('applies_to', { length: 100 }).notNull().default('all'),
  isObserved: boolean('is_observed').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const deadlineRulesRelations = relations(deadlineRules, ({ many }) => ({
  deadlines: many(deadlines),
}));

export const deadlinesRelations = relations(deadlines, ({ one, many }) => ({
  deadlineRule: one(deadlineRules, {
    fields: [deadlines.deadlineRuleId],
    references: [deadlineRules.id],
  }),
  extensions: many(deadlineExtensions),
  alerts: many(deadlineAlerts),
}));

export const deadlineExtensionsRelations = relations(deadlineExtensions, ({ one }) => ({
  deadline: one(deadlines, {
    fields: [deadlineExtensions.deadlineId],
    references: [deadlines.id],
  }),
}));

export const deadlineAlertsRelations = relations(deadlineAlerts, ({ one }) => ({
  deadline: one(deadlines, {
    fields: [deadlineAlerts.deadlineId],
    references: [deadlines.id],
  }),
}));

