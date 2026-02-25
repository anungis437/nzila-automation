/**
 * Nzila OS — NACP Exam Management tables
 *
 * National exam session management, candidates, submissions,
 * centers, subjects, and integrity artifacts.
 *
 * Every table is scoped by entity_id (org identity).
 * Follows existing patterns from commerce.ts.
 */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  integer,
  numeric,
  varchar,
  boolean,
} from 'drizzle-orm/pg-core'
import { entities } from './entities'

// ── NACP Enums ──────────────────────────────────────────────────────────────

export const nacpExamSessionStatusEnum = pgEnum('nacp_exam_session_status', [
  'scheduled',
  'opened',
  'in_progress',
  'sealed',
  'exported',
  'closed',
])

export const nacpCandidateStatusEnum = pgEnum('nacp_candidate_status', [
  'registered',
  'verified',
  'eligible',
  'suspended',
  'disqualified',
])

export const nacpSubmissionStatusEnum = pgEnum('nacp_submission_status', [
  'pending',
  'submitted',
  'marked',
  'moderated',
  'finalized',
  'appealed',
])

export const nacpSubjectLevelEnum = pgEnum('nacp_subject_level', [
  'primary',
  'secondary',
  'tertiary',
])

export const nacpCenterStatusEnum = pgEnum('nacp_center_status', [
  'active',
  'inactive',
  'suspended',
])

export const nacpIntegrityStatusEnum = pgEnum('nacp_integrity_status', [
  'pending',
  'verified',
  'tampered',
  'expired',
])

export const nacpGenderEnum = pgEnum('nacp_gender', ['male', 'female'])

// ── Subjects ────────────────────────────────────────────────────────────────

export const nacpSubjects = pgTable('nacp_subjects', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  level: nacpSubjectLevelEnum('level').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Centers ─────────────────────────────────────────────────────────────────

export const nacpCenters = pgTable('nacp_centers', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  province: varchar('province', { length: 255 }).notNull(),
  district: varchar('district', { length: 255 }).notNull(),
  capacity: integer('capacity').notNull(),
  status: nacpCenterStatusEnum('status').notNull().default('active'),
  latitude: numeric('latitude'),
  longitude: numeric('longitude'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Exams ────────────────────────────────────────────────────────────────────

export const nacpExams = pgTable('nacp_exams', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  title: varchar('title', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => nacpSubjects.id),
  level: nacpSubjectLevelEnum('level').notNull(),
  year: integer('year').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  totalMarks: integer('total_marks').notNull(),
  passPercentage: numeric('pass_percentage').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Exam Sessions ───────────────────────────────────────────────────────────

export const nacpExamSessions = pgTable('nacp_exam_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  examId: uuid('exam_id')
    .notNull()
    .references(() => nacpExams.id),
  centerId: uuid('center_id')
    .notNull()
    .references(() => nacpCenters.id),
  ref: varchar('ref', { length: 50 }).notNull(),
  status: nacpExamSessionStatusEnum('status').notNull().default('scheduled'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  sealedAt: timestamp('sealed_at', { withTimezone: true }),
  exportedAt: timestamp('exported_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  integrityHash: text('integrity_hash'),
  supervisorId: uuid('supervisor_id'),
  candidateCount: integer('candidate_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Candidates ──────────────────────────────────────────────────────────────

export const nacpCandidates = pgTable('nacp_candidates', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  ref: varchar('ref', { length: 50 }).notNull(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  dateOfBirth: text('date_of_birth').notNull(),
  gender: nacpGenderEnum('gender').notNull(),
  centerId: uuid('center_id')
    .notNull()
    .references(() => nacpCenters.id),
  status: nacpCandidateStatusEnum('status').notNull().default('registered'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Submissions ─────────────────────────────────────────────────────────────

export const nacpSubmissions = pgTable('nacp_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => nacpExamSessions.id),
  candidateId: uuid('candidate_id')
    .notNull()
    .references(() => nacpCandidates.id),
  examId: uuid('exam_id')
    .notNull()
    .references(() => nacpExams.id),
  status: nacpSubmissionStatusEnum('status').notNull().default('pending'),
  rawScore: numeric('raw_score'),
  moderatedScore: numeric('moderated_score'),
  finalScore: numeric('final_score'),
  grade: varchar('grade', { length: 10 }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  markedAt: timestamp('marked_at', { withTimezone: true }),
  markedBy: uuid('marked_by'),
  moderatedAt: timestamp('moderated_at', { withTimezone: true }),
  moderatedBy: uuid('moderated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Integrity Artifacts ─────────────────────────────────────────────────────

export const nacpIntegrityArtifacts = pgTable('nacp_integrity_artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => nacpExamSessions.id),
  hash: text('hash').notNull(),
  status: nacpIntegrityStatusEnum('status').notNull().default('pending'),
  candidateCount: integer('candidate_count').notNull(),
  submissionHashes: jsonb('submission_hashes').notNull().default([]),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── NACP Outbox ─────────────────────────────────────────────────────────────

export const nacpOutbox = pgTable('nacp_outbox', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  eventType: varchar('event_type', { length: 255 }).notNull(),
  payload: jsonb('payload').notNull().default({}),
  status: text('status').notNull().default('pending'),
  retryCount: integer('retry_count').notNull().default(0),
  maxRetries: integer('max_retries').notNull().default(3),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  dispatchedAt: timestamp('dispatched_at', { withTimezone: true }),
})

// ── NACP Sync Queue ─────────────────────────────────────────────────────────

export const nacpSyncQueue = pgTable('nacp_sync_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  action: varchar('action', { length: 20 }).notNull(),
  payload: jsonb('payload').notNull().default({}),
  idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  syncedAt: timestamp('synced_at', { withTimezone: true }),
  retryCount: integer('retry_count').notNull().default(0),
  lastError: text('last_error'),
})
