/**
 * HRIS Integration Schema
 * 
 * Stores employee, position, and department data from external HRIS systems.
 * This is separate from internal union member data to maintain clean data boundaries.
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { organizations } from '../../../schema-organizations';

// ============================================================================
// Enums
// ============================================================================

export const employmentStatusEnum = pgEnum('employment_status', [
  'active',
  'inactive',
  'on_leave',
  'terminated',
  'suspended',
]);

export const externalHrisProviderEnum = pgEnum('external_hris_provider', [
  'WORKDAY',
  'BAMBOOHR',
  'ADP',
  'CERIDIAN',
  'UKG',
]);

// ============================================================================
// External Employees Table
// ============================================================================

/**
 * Employees from external HRIS systems
 * Synced periodically from Workday, BambooHR, ADP, etc.
 */
export const externalEmployees = pgTable('external_employees', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // External system tracking
  externalId: varchar('external_id', { length: 255 }).notNull(),
  externalProvider: externalHrisProviderEnum('external_provider').notNull(),

  // Employee identification
  employeeId: varchar('employee_id', { length: 100 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),

  // Work information
  position: varchar('position', { length: 255 }),
  department: varchar('department', { length: 255 }),
  location: varchar('location', { length: 255 }),
  hireDate: timestamp('hire_date', { withTimezone: true }),
  
  // Employment details
  employmentStatus: employmentStatusEnum('employment_status'),
  workSchedule: varchar('work_schedule', { length: 100 }),
  supervisorId: varchar('supervisor_id', { length: 255 }),
  supervisorName: varchar('supervisor_name', { length: 255 }),

  // Sync tracking
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true),

  // Metadata
  rawData: text('raw_data'), // JSONB of full external record
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one employee per organization per provider
  uniqueExternalEmployee: undefined,
}));

// Add unique index manually
// CREATE UNIQUE INDEX external_employees_org_provider_external_id_idx 
// ON external_employees (organization_id, external_provider, external_id);

export type ExternalEmployee = typeof externalEmployees.$inferSelect;
export type NewExternalEmployee = typeof externalEmployees.$inferInsert;

// ============================================================================
// External Positions Table
// ============================================================================

/**
 * Position/Job Profile data from external HRIS
 */
export const externalPositions = pgTable('external_positions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // External system tracking
  externalId: varchar('external_id', { length: 255 }).notNull(),
  externalProvider: externalHrisProviderEnum('external_provider').notNull(),

  // Position details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  department: varchar('department', { length: 255 }),
  jobProfile: varchar('job_profile', { length: 255 }),
  effectiveDate: timestamp('effective_date', { withTimezone: true }),

  // Sync tracking
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true),

  // Metadata
  rawData: text('raw_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ExternalPosition = typeof externalPositions.$inferSelect;
export type NewExternalPosition = typeof externalPositions.$inferInsert;

// ============================================================================
// External Departments Table
// ============================================================================

/**
 * Department/Organization structure from external HRIS
 */
export const externalDepartments = pgTable('external_departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // External system tracking
  externalId: varchar('external_id', { length: 255 }).notNull(),
  externalProvider: externalHrisProviderEnum('external_provider').notNull(),

  // Department details
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 100 }),
  managerId: varchar('manager_id', { length: 255 }),
  managerName: varchar('manager_name', { length: 255 }),
  parentDepartmentId: varchar('parent_department_id', { length: 255 }),

  // Sync tracking
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true),

  // Metadata
  rawData: text('raw_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ExternalDepartment = typeof externalDepartments.$inferSelect;
export type NewExternalDepartment = typeof externalDepartments.$inferInsert;
