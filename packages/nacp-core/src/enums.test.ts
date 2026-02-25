/**
 * @nzila/nacp-core — Enum Tests
 */
import { describe, it, expect } from 'vitest'
import {
  ExamSessionStatus,
  CandidateStatus,
  SubmissionStatus,
  SubjectLevel,
  IntegrityStatus,
  CenterStatus,
  NacpRole,
} from './enums'

describe('ExamSessionStatus', () => {
  it('contains all required states', () => {
    expect(ExamSessionStatus.SCHEDULED).toBe('scheduled')
    expect(ExamSessionStatus.OPENED).toBe('opened')
    expect(ExamSessionStatus.IN_PROGRESS).toBe('in_progress')
    expect(ExamSessionStatus.SEALED).toBe('sealed')
    expect(ExamSessionStatus.EXPORTED).toBe('exported')
    expect(ExamSessionStatus.CLOSED).toBe('closed')
  })

  it('has exactly 6 states', () => {
    expect(Object.keys(ExamSessionStatus)).toHaveLength(6)
  })
})

describe('CandidateStatus', () => {
  it('contains all required statuses', () => {
    expect(CandidateStatus.REGISTERED).toBe('registered')
    expect(CandidateStatus.VERIFIED).toBe('verified')
    expect(CandidateStatus.ELIGIBLE).toBe('eligible')
    expect(CandidateStatus.SUSPENDED).toBe('suspended')
    expect(CandidateStatus.DISQUALIFIED).toBe('disqualified')
  })
})

describe('SubmissionStatus', () => {
  it('contains all required statuses', () => {
    expect(SubmissionStatus.PENDING).toBe('pending')
    expect(SubmissionStatus.SUBMITTED).toBe('submitted')
    expect(SubmissionStatus.MARKED).toBe('marked')
    expect(SubmissionStatus.MODERATED).toBe('moderated')
    expect(SubmissionStatus.FINALIZED).toBe('finalized')
    expect(SubmissionStatus.APPEALED).toBe('appealed')
  })
})

describe('NacpRole', () => {
  it('contains all NACP-specific roles', () => {
    expect(NacpRole.ADMIN).toBe('admin')
    expect(NacpRole.DIRECTOR).toBe('director')
    expect(NacpRole.EXAMINER).toBe('examiner')
    expect(NacpRole.SUPERVISOR).toBe('supervisor')
    expect(NacpRole.INVIGILATOR).toBe('invigilator')
    expect(NacpRole.CLERK).toBe('clerk')
    expect(NacpRole.VIEWER).toBe('viewer')
  })
})
