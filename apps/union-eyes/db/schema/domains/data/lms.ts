/**
 * Learning Management System (LMS) Integration Schema
 * 
 * Database schema for external LMS data.
 * Supports LinkedIn Learning, Udemy, Coursera, and other LMS platforms.
 * 
 * Tables:
 * - external_lms_courses: Courses from LMS platforms
 * - external_lms_enrollments: User enrollments in courses
 * - external_lms_progress: Learning progress tracking
 * - external_lms_completions: Course completion records
 * - external_lms_learners: Learner profiles
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from '../../../schema-organizations';

// ============================================================================
// External LMS Courses
// ============================================================================
/**
 * Courses from LMS platforms
 */
export const externalLmsCourses = pgTable(
  'external_lms_courses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    externalProvider: varchar('external_provider', { length: 50 }).notNull(),
    externalId: varchar('external_id', { length: 255 }).notNull(),
    courseName: varchar('course_name', { length: 500 }).notNull(),
    description: text('description'),
    difficultyLevel: varchar('difficulty_level', { length: 50 }), // beginner, intermediate, advanced
    durationMinutes: integer('duration_minutes'),
    publishedAt: timestamp('published_at'),
    lastUpdatedAt: timestamp('last_updated_at'),
    provider: varchar('provider', { length: 255 }), // Course provider name
    categoryId: varchar('category_id', { length: 255 }),
    lastSyncedAt: timestamp('last_synced_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueCourse: unique('unique_lms_course').on(
      table.orgId,
      table.externalProvider,
      table.externalId
    ),
    orgIdIdx: index('lms_courses_org_id_idx').on(table.orgId),
    providerIdx: index('lms_courses_provider_idx').on(table.externalProvider),
    externalIdIdx: index('lms_courses_external_id_idx').on(table.externalId),
    difficultyIdx: index('lms_courses_difficulty_idx').on(table.difficultyLevel),
    lastSyncIdx: index('lms_courses_last_sync_idx').on(table.lastSyncedAt),
  })
);

// ============================================================================
// External LMS Enrollments
// ============================================================================
/**
 * User enrollments in courses
 */
export const externalLmsEnrollments = pgTable(
  'external_lms_enrollments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    externalProvider: varchar('external_provider', { length: 50 }).notNull(),
    externalId: varchar('external_id', { length: 255 }).notNull(),
    courseId: varchar('course_id', { length: 255 }).notNull(), // External course ID
    learnerId: varchar('learner_id', { length: 255 }).notNull(), // External learner ID
    enrolledAt: timestamp('enrolled_at').notNull(),
    status: varchar('status', { length: 50 }).notNull(), // in_progress, completed, not_started
    progressPercentage: integer('progress_percentage').default(0),
    lastAccessedAt: timestamp('last_accessed_at'),
    completedAt: timestamp('completed_at'),
    lastSyncedAt: timestamp('last_synced_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueEnrollment: unique('unique_lms_enrollment').on(
      table.orgId,
      table.externalProvider,
      table.externalId
    ),
    orgIdIdx: index('lms_enrollments_org_id_idx').on(table.orgId),
    providerIdx: index('lms_enrollments_provider_idx').on(table.externalProvider),
    courseIdIdx: index('lms_enrollments_course_id_idx').on(table.courseId),
    learnerIdIdx: index('lms_enrollments_learner_id_idx').on(table.learnerId),
    statusIdx: index('lms_enrollments_status_idx').on(table.status),
    lastSyncIdx: index('lms_enrollments_last_sync_idx').on(table.lastSyncedAt),
  })
);

// ============================================================================
// External LMS Progress
// ============================================================================
/**
 * Learning progress tracking
 */
export const externalLmsProgress = pgTable(
  'external_lms_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    externalProvider: varchar('external_provider', { length: 50 }).notNull(),
    externalId: varchar('external_id', { length: 255 }).notNull(),
    courseId: varchar('course_id', { length: 255 }).notNull(),
    learnerId: varchar('learner_id', { length: 255 }).notNull(),
    contentId: varchar('content_id', { length: 255 }), // Video, chapter, module ID
    progressPercentage: integer('progress_percentage').default(0),
    timeSpentSeconds: integer('time_spent_seconds').default(0),
    completedAt: timestamp('completed_at'),
    lastSyncedAt: timestamp('last_synced_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueProgress: unique('unique_lms_progress').on(
      table.orgId,
      table.externalProvider,
      table.externalId
    ),
    orgIdIdx: index('lms_progress_org_id_idx').on(table.orgId),
    providerIdx: index('lms_progress_provider_idx').on(table.externalProvider),
    courseIdIdx: index('lms_progress_course_id_idx').on(table.courseId),
    learnerIdIdx: index('lms_progress_learner_id_idx').on(table.learnerId),
    lastSyncIdx: index('lms_progress_last_sync_idx').on(table.lastSyncedAt),
  })
);

// ============================================================================
// External LMS Completions
// ============================================================================
/**
 * Course completion records
 */
export const externalLmsCompletions = pgTable(
  'external_lms_completions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    externalProvider: varchar('external_provider', { length: 50 }).notNull(),
    externalId: varchar('external_id', { length: 255 }).notNull(),
    courseId: varchar('course_id', { length: 255 }).notNull(),
    learnerId: varchar('learner_id', { length: 255 }).notNull(),
    completedAt: timestamp('completed_at').notNull(),
    certificateId: varchar('certificate_id', { length: 255 }),
    grade: numeric('grade', { precision: 5, scale: 2 }), // Percentage or score
    lastSyncedAt: timestamp('last_synced_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueCompletion: unique('unique_lms_completion').on(
      table.orgId,
      table.externalProvider,
      table.externalId
    ),
    orgIdIdx: index('lms_completions_org_id_idx').on(table.orgId),
    providerIdx: index('lms_completions_provider_idx').on(table.externalProvider),
    courseIdIdx: index('lms_completions_course_id_idx').on(table.courseId),
    learnerIdIdx: index('lms_completions_learner_id_idx').on(table.learnerId),
    completedAtIdx: index('lms_completions_completed_at_idx').on(table.completedAt),
    lastSyncIdx: index('lms_completions_last_sync_idx').on(table.lastSyncedAt),
  })
);

// ============================================================================
// External LMS Learners
// ============================================================================
/**
 * Learner profiles from LMS platforms
 */
export const externalLmsLearners = pgTable(
  'external_lms_learners',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    externalProvider: varchar('external_provider', { length: 50 }).notNull(),
    externalId: varchar('external_id', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    email: varchar('email', { length: 255 }),
    profileUrl: text('profile_url'),
    lastSyncedAt: timestamp('last_synced_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueLearner: unique('unique_lms_learner').on(
      table.orgId,
      table.externalProvider,
      table.externalId
    ),
    orgIdIdx: index('lms_learners_org_id_idx').on(table.orgId),
    providerIdx: index('lms_learners_provider_idx').on(table.externalProvider),
    externalIdIdx: index('lms_learners_external_id_idx').on(table.externalId),
    emailIdx: index('lms_learners_email_idx').on(table.email),
    lastSyncIdx: index('lms_learners_last_sync_idx').on(table.lastSyncedAt),
  })
);

// ============================================================================
// Relations
// ============================================================================
export const externalLmsCoursesRelations = relations(
  externalLmsCourses,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [externalLmsCourses.orgId],
      references: [organizations.id],
    }),
  })
);

export const externalLmsEnrollmentsRelations = relations(
  externalLmsEnrollments,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [externalLmsEnrollments.orgId],
      references: [organizations.id],
    }),
  })
);

export const externalLmsProgressRelations = relations(
  externalLmsProgress,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [externalLmsProgress.orgId],
      references: [organizations.id],
    }),
  })
);

export const externalLmsCompletionsRelations = relations(
  externalLmsCompletions,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [externalLmsCompletions.orgId],
      references: [organizations.id],
    }),
  })
);

export const externalLmsLearnersRelations = relations(
  externalLmsLearners,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [externalLmsLearners.orgId],
      references: [organizations.id],
    }),
  })
);
