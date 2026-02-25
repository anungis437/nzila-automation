/**
 * @nzila/nacp-core — Enums & Status Codes
 *
 * Exam management domain enumerations.
 * No DB, no framework — pure TypeScript.
 *
 * @module @nzila/nacp-core/enums
 */

// ── Exam Session ────────────────────────────────────────────────────────────

export const ExamSessionStatus = {
  SCHEDULED: 'scheduled',
  OPENED: 'opened',
  IN_PROGRESS: 'in_progress',
  SEALED: 'sealed',
  EXPORTED: 'exported',
  CLOSED: 'closed',
} as const
export type ExamSessionStatus = (typeof ExamSessionStatus)[keyof typeof ExamSessionStatus]

// ── Candidate ───────────────────────────────────────────────────────────────

export const CandidateStatus = {
  REGISTERED: 'registered',
  VERIFIED: 'verified',
  ELIGIBLE: 'eligible',
  SUSPENDED: 'suspended',
  DISQUALIFIED: 'disqualified',
} as const
export type CandidateStatus = (typeof CandidateStatus)[keyof typeof CandidateStatus]

// ── Submission ──────────────────────────────────────────────────────────────

export const SubmissionStatus = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  MARKED: 'marked',
  MODERATED: 'moderated',
  FINALIZED: 'finalized',
  APPEALED: 'appealed',
} as const
export type SubmissionStatus = (typeof SubmissionStatus)[keyof typeof SubmissionStatus]

// ── Subject ─────────────────────────────────────────────────────────────────

export const SubjectLevel = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary',
} as const
export type SubjectLevel = (typeof SubjectLevel)[keyof typeof SubjectLevel]

// ── Integrity ───────────────────────────────────────────────────────────────

export const IntegrityStatus = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  TAMPERED: 'tampered',
  EXPIRED: 'expired',
} as const
export type IntegrityStatus = (typeof IntegrityStatus)[keyof typeof IntegrityStatus]

// ── Center ──────────────────────────────────────────────────────────────────

export const CenterStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
} as const
export type CenterStatus = (typeof CenterStatus)[keyof typeof CenterStatus]

// ── Org Role (NACP-specific) ────────────────────────────────────────────────

export const NacpRole = {
  ADMIN: 'admin',
  DIRECTOR: 'director',
  EXAMINER: 'examiner',
  SUPERVISOR: 'supervisor',
  INVIGILATOR: 'invigilator',
  CLERK: 'clerk',
  VIEWER: 'viewer',
} as const
export type NacpRole = (typeof NacpRole)[keyof typeof NacpRole]
