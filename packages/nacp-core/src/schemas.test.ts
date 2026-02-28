/**
 * @nzila/nacp-core — Schema Validation Tests
 */
import { describe, it, expect } from 'vitest'
import {
  CreateExamSchema,
  CreateExamSessionSchema,
  CreateCandidateSchema,
  CreateCenterSchema,
  CreateSubjectSchema,
  RecordSubmissionSchema,
  MarkSubmissionSchema,
  ModerateSubmissionSchema,
  NacpOrgContextSchema,
} from './schemas/index'

describe('CreateExamSchema', () => {
  it('accepts valid input', () => {
    const result = CreateExamSchema.safeParse({
      title: 'Mathematics Final 2026',
      code: 'MATH-2026-F',
      subjectId: '550e8400-e29b-41d4-a716-446655440000',
      level: 'secondary',
      year: 2026,
      durationMinutes: 180,
      totalMarks: 100,
      passPercentage: 50,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty title', () => {
    const result = CreateExamSchema.safeParse({
      title: '',
      code: 'MATH-2026-F',
      subjectId: '550e8400-e29b-41d4-a716-446655440000',
      level: 'secondary',
      year: 2026,
      durationMinutes: 180,
      totalMarks: 100,
      passPercentage: 50,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid year', () => {
    const result = CreateExamSchema.safeParse({
      title: 'Test',
      code: 'T',
      subjectId: '550e8400-e29b-41d4-a716-446655440000',
      level: 'primary',
      year: 1990,
      durationMinutes: 60,
      totalMarks: 50,
      passPercentage: 40,
    })
    expect(result.success).toBe(false)
  })
})

describe('CreateCandidateSchema', () => {
  it('accepts valid candidate input', () => {
    const result = CreateCandidateSchema.safeParse({
      firstName: 'Jean',
      lastName: 'Kabila',
      dateOfBirth: '2005-03-15',
      gender: 'male',
      centerId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid gender', () => {
    const result = CreateCandidateSchema.safeParse({
      firstName: 'Marie',
      lastName: 'Lumumba',
      dateOfBirth: '2005-03-15',
      gender: 'other',
      centerId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(false)
  })
})

describe('MarkSubmissionSchema', () => {
  it('accepts valid score', () => {
    const result = MarkSubmissionSchema.safeParse({ rawScore: 85 })
    expect(result.success).toBe(true)
  })

  it('rejects negative score', () => {
    const result = MarkSubmissionSchema.safeParse({ rawScore: -1 })
    expect(result.success).toBe(false)
  })
})

describe('NacpOrgContextSchema', () => {
  it('validates org context', () => {
    const result = NacpOrgContextSchema.safeParse({
      orgId: '550e8400-e29b-41d4-a716-446655440000',
      actorId: '660e8400-e29b-41d4-a716-446655440000',
      role: 'admin',
      permissions: ['exam.create', 'session.seal'],
      requestId: 'req-001',
    })
    expect(result.success).toBe(true)
  })
})
