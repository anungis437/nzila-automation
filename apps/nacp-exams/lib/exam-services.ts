/**
 * NACP exam domain services — NACP-Exams app.
 *
 * Wires @nzila/nacp-core for exam session lifecycle management,
 * candidate registration, submission recording, and integrity hashing.
 */
import { examSessionMachine } from '@nzila/nacp-core/machines'

import {
  CreateExamSchema,
  CreateExamSessionSchema,
  CreateSubjectSchema,
  CreateCenterSchema,
  CreateCandidateSchema,
  RecordSubmissionSchema,
  MarkSubmissionSchema,
  ModerateSubmissionSchema,
  NacpOrgContextSchema,
  type CreateExamInput,
  type CreateExamSessionInput,
  type CreateCandidateInput,
  type RecordSubmissionInput,
  type MarkSubmissionInput,
  type ModerateSubmissionInput,
} from '@nzila/nacp-core/schemas'

import {
  ExamSessionStatus,
  CandidateStatus,
  SubmissionStatus,
  SubjectLevel,
  IntegrityStatus,
  CenterStatus,
} from '@nzila/nacp-core/enums'

import type {
  Exam,
  ExamSession,
  Subject,
  Center,
  Candidate,
  Submission,
  IntegrityArtifact,
  NacpOrgContext,
} from '@nzila/nacp-core/types'

// ── Machine ──
export { examSessionMachine }

// ── Schemas (Zod validation) ──
export {
  CreateExamSchema,
  CreateExamSessionSchema,
  CreateSubjectSchema,
  CreateCenterSchema,
  CreateCandidateSchema,
  RecordSubmissionSchema,
  MarkSubmissionSchema,
  ModerateSubmissionSchema,
  NacpOrgContextSchema,
}
export type {
  CreateExamInput,
  CreateExamSessionInput,
  CreateCandidateInput,
  RecordSubmissionInput,
  MarkSubmissionInput,
  ModerateSubmissionInput,
}

// ── Enums ──
export {
  ExamSessionStatus,
  CandidateStatus,
  SubmissionStatus,
  SubjectLevel,
  IntegrityStatus,
  CenterStatus,
}

// ── Domain types ──
export type {
  Exam,
  ExamSession,
  Subject,
  Center,
  Candidate,
  Submission,
  IntegrityArtifact,
  NacpOrgContext,
}
