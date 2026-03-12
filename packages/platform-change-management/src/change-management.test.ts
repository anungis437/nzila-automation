/**
 * Tests for schema validation, approval requirements, window validation,
 * calendar conflict detection, and emergency rules.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { changeRecordSchema, calendarPolicySchema } from './schemas'
import { evaluateChangeRequirements, canClosePIR, recordPostImplementationReview } from './approvals'
import { validateChangeWindow } from './checks'
import { detectWindowConflicts, isWithinApprovedWindow, isInFreezePeriod } from './calendar'
import { loadChangeRecord, loadAllChanges, saveChangeRecord, listChangesByEnvironment, findApprovedChange } from './service'
import { generateChangeId, parseChangeId, windowsOverlap, isWithinWindow } from './utils'
import type { ChangeRecord, PostImplementationReview } from './types'

// ── Test data ───────────────────────────────────────────────────────────────

const now = new Date('2026-03-12T14:00:00.000Z')
const oneHourAgo = new Date(now.getTime() - 3600_000).toISOString()
const twoHoursFromNow = new Date(now.getTime() + 7200_000).toISOString()
const oneDayFromNow = new Date(now.getTime() + 86400_000).toISOString()

function baseChange(overrides: Partial<ChangeRecord> = {}): ChangeRecord {
  return {
    change_id: 'CHG-2026-0001',
    title: 'Test Change',
    description: 'Test description',
    service: 'web',
    environment: 'STAGING',
    change_type: 'NORMAL',
    risk_level: 'MEDIUM',
    impact_summary: 'Low impact',
    requested_by: 'tester',
    approvers_required: ['service_owner', 'change_manager'],
    approved_by: ['service_owner', 'change_manager'],
    approval_status: 'APPROVED',
    implementation_window_start: oneHourAgo,
    implementation_window_end: twoHoursFromNow,
    rollback_plan: 'Revert deploy',
    test_evidence_refs: ['test.json'],
    linked_prs: ['#100'],
    linked_commits: ['abc123'],
    status: 'APPROVED',
    created_at: oneHourAgo,
    updated_at: oneHourAgo,
    ...overrides,
  }
}

// ── Temp directory helper ───────────────────────────────────────────────────

let testDir: string

beforeEach(() => {
  testDir = join(tmpdir(), `change-mgmt-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(testDir, { recursive: true })
})

afterEach(() => {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true })
  }
})

// ── Schema Validation ───────────────────────────────────────────────────────

describe('changeRecordSchema', () => {
  it('validates a correct change record', () => {
    const result = changeRecordSchema.safeParse(baseChange())
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = changeRecordSchema.safeParse({ change_id: 'CHG-2026-0001' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid environment', () => {
    const result = changeRecordSchema.safeParse(baseChange({ environment: 'DEV' as 'STAGING' }))
    expect(result.success).toBe(false)
  })

  it('rejects invalid timestamps', () => {
    const result = changeRecordSchema.safeParse(baseChange({ created_at: 'not-a-date' }))
    expect(result.success).toBe(false)
  })

  it('accepts optional post_implementation_review', () => {
    const result = changeRecordSchema.safeParse(
      baseChange({
        post_implementation_review: {
          outcome: 'SUCCESS',
          incidents_triggered: false,
          incident_refs: [],
          observations: 'All good',
        },
      }),
    )
    expect(result.success).toBe(true)
  })
})

describe('calendarPolicySchema', () => {
  it('validates freeze periods', () => {
    const result = calendarPolicySchema.safeParse({
      freeze_periods: [
        {
          name: 'Holiday',
          start: '2026-12-20T00:00:00.000Z',
          end: '2027-01-03T00:00:00.000Z',
          environments: ['PROD'],
        },
      ],
    })
    expect(result.success).toBe(true)
  })
})

// ── Approval Requirements ───────────────────────────────────────────────────

describe('evaluateChangeRequirements', () => {
  it('STANDARD changes require no approvals', () => {
    const change = baseChange({ change_type: 'STANDARD', approved_by: [] })
    const result = evaluateChangeRequirements(change)
    expect(result.requiredApprovals).toEqual([])
    expect(result.approvalSatisfied).toBe(true)
    expect(result.cabRequired).toBe(false)
  })

  it('NORMAL MEDIUM needs service_owner + change_manager', () => {
    const change = baseChange({ approved_by: [] })
    const result = evaluateChangeRequirements(change)
    expect(result.requiredApprovals).toEqual(['service_owner', 'change_manager'])
    expect(result.missingApprovals).toEqual(['service_owner', 'change_manager'])
    expect(result.approvalSatisfied).toBe(false)
  })

  it('NORMAL HIGH needs security_approver too', () => {
    const change = baseChange({
      risk_level: 'HIGH',
      approved_by: ['service_owner', 'change_manager'],
    })
    const result = evaluateChangeRequirements(change)
    expect(result.requiredApprovals).toContain('security_approver')
    expect(result.missingApprovals).toEqual(['security_approver'])
    expect(result.cabRequired).toBe(true)
  })

  it('NORMAL CRITICAL requires CAB', () => {
    const change = baseChange({ risk_level: 'CRITICAL', approved_by: [] })
    const result = evaluateChangeRequirements(change)
    expect(result.cabRequired).toBe(true)
  })

  it('EMERGENCY needs only service_owner', () => {
    const change = baseChange({
      change_type: 'EMERGENCY',
      approved_by: ['service_owner'],
    })
    const result = evaluateChangeRequirements(change)
    expect(result.requiredApprovals).toEqual(['service_owner'])
    expect(result.approvalSatisfied).toBe(true)
  })

  it('fully approved NORMAL change is satisfied', () => {
    const change = baseChange({
      approved_by: ['service_owner', 'change_manager'],
    })
    const result = evaluateChangeRequirements(change)
    expect(result.approvalSatisfied).toBe(true)
  })
})

// ── PIR Rules ───────────────────────────────────────────────────────────────

describe('canClosePIR', () => {
  it('STANDARD changes can close without PIR', () => {
    const change = baseChange({ change_type: 'STANDARD' })
    expect(canClosePIR(change).canClose).toBe(true)
  })

  it('NORMAL changes cannot close without PIR', () => {
    const change = baseChange({ change_type: 'NORMAL' })
    const result = canClosePIR(change)
    expect(result.canClose).toBe(false)
    expect(result.reason).toContain('Post Implementation Review')
  })

  it('EMERGENCY changes cannot close without PIR', () => {
    const change = baseChange({ change_type: 'EMERGENCY' })
    expect(canClosePIR(change).canClose).toBe(false)
  })

  it('NORMAL changes can close with PIR', () => {
    const change = baseChange({
      change_type: 'NORMAL',
      post_implementation_review: {
        outcome: 'SUCCESS',
        incidents_triggered: false,
        incident_refs: [],
        observations: 'OK',
      },
    })
    expect(canClosePIR(change).canClose).toBe(true)
  })
})

// ── Window Validation ───────────────────────────────────────────────────────

describe('isWithinApprovedWindow', () => {
  it('returns true when now is inside window', () => {
    const change = baseChange()
    expect(isWithinApprovedWindow(change, now)).toBe(true)
  })

  it('returns false when now is outside window', () => {
    const change = baseChange({
      implementation_window_start: oneDayFromNow,
      implementation_window_end: new Date(now.getTime() + 172800_000).toISOString(),
    })
    expect(isWithinApprovedWindow(change, now)).toBe(false)
  })
})

// ── Calendar Conflict Detection ─────────────────────────────────────────────

describe('detectWindowConflicts', () => {
  it('detects overlapping windows', () => {
    const change = baseChange({ status: 'SCHEDULED' })
    saveChangeRecord(change, { baseDir: testDir })

    const conflicts = detectWindowConflicts(
      'STAGING',
      { start: oneHourAgo, end: twoHoursFromNow },
      { baseDir: testDir },
    )
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].conflicting_change_id).toBe('CHG-2026-0001')
  })

  it('returns empty for non-overlapping windows', () => {
    const change = baseChange({ status: 'SCHEDULED' })
    saveChangeRecord(change, { baseDir: testDir })

    const conflicts = detectWindowConflicts(
      'STAGING',
      {
        start: new Date(now.getTime() + 86400_000).toISOString(),
        end: new Date(now.getTime() + 172800_000).toISOString(),
      },
      { baseDir: testDir },
    )
    expect(conflicts).toHaveLength(0)
  })

  it('ignores different environments', () => {
    const change = baseChange({ environment: 'PROD', status: 'SCHEDULED' })
    saveChangeRecord(change, { baseDir: testDir })

    const conflicts = detectWindowConflicts(
      'STAGING',
      { start: oneHourAgo, end: twoHoursFromNow },
      { baseDir: testDir },
    )
    expect(conflicts).toHaveLength(0)
  })
})

// ── Freeze Period ───────────────────────────────────────────────────────────

describe('isInFreezePeriod', () => {
  it('detects freeze period conflict', () => {
    const policy = {
      freeze_periods: [
        {
          name: 'Holiday',
          start: '2026-12-20T00:00:00.000Z',
          end: '2027-01-03T00:00:00.000Z',
          environments: ['PROD' as const],
        },
      ],
    }

    const freeze = isInFreezePeriod(
      'PROD',
      { start: '2026-12-25T00:00:00.000Z', end: '2026-12-26T00:00:00.000Z' },
      policy,
    )
    expect(freeze).not.toBeNull()
    expect(freeze!.name).toBe('Holiday')
  })

  it('returns null when no freeze overlap', () => {
    const policy = {
      freeze_periods: [
        {
          name: 'Holiday',
          start: '2026-12-20T00:00:00.000Z',
          end: '2027-01-03T00:00:00.000Z',
          environments: ['PROD' as const],
        },
      ],
    }

    const freeze = isInFreezePeriod(
      'STAGING',
      { start: '2026-12-25T00:00:00.000Z', end: '2026-12-26T00:00:00.000Z' },
      policy,
    )
    expect(freeze).toBeNull()
  })
})

// ── File-Based Storage ──────────────────────────────────────────────────────

describe('file storage', () => {
  it('saves and loads a change record', () => {
    const change = baseChange()
    saveChangeRecord(change, { baseDir: testDir })
    const loaded = loadChangeRecord('CHG-2026-0001', { baseDir: testDir })
    expect(loaded).not.toBeNull()
    expect(loaded!.change_id).toBe('CHG-2026-0001')
  })

  it('loadAllChanges returns all records', () => {
    saveChangeRecord(baseChange({ change_id: 'CHG-2026-0001' }), { baseDir: testDir })
    saveChangeRecord(baseChange({ change_id: 'CHG-2026-0002', title: 'Second' }), { baseDir: testDir })
    const all = loadAllChanges({ baseDir: testDir })
    expect(all).toHaveLength(2)
  })

  it('listChangesByEnvironment filters correctly', () => {
    saveChangeRecord(baseChange({ change_id: 'CHG-2026-0001', environment: 'STAGING' }), { baseDir: testDir })
    saveChangeRecord(baseChange({ change_id: 'CHG-2026-0002', environment: 'PROD' }), { baseDir: testDir })
    const staging = listChangesByEnvironment('STAGING', { baseDir: testDir })
    expect(staging).toHaveLength(1)
    expect(staging[0].environment).toBe('STAGING')
  })

  it('returns null for non-existent record', () => {
    expect(loadChangeRecord('CHG-9999-9999', { baseDir: testDir })).toBeNull()
  })

  it('handles malformed JSON gracefully', () => {
    mkdirSync(testDir, { recursive: true })
    writeFileSync(join(testDir, 'BAD-0001.json'), '{ invalid json }')
    const record = loadChangeRecord('BAD-0001', { baseDir: testDir })
    expect(record).toBeNull()
  })
})

// ── Deployment Validation ───────────────────────────────────────────────────

describe('validateChangeWindow', () => {
  it('passes for a valid approved change within window', () => {
    saveChangeRecord(baseChange(), { baseDir: testDir })
    const result = validateChangeWindow({
      env: 'STAGING',
      service: 'web',
      now,
      baseDir: testDir,
    })
    expect(result.valid).toBe(true)
    expect(result.change_id).toBe('CHG-2026-0001')
  })

  it('fails when no approved change exists', () => {
    const result = validateChangeWindow({
      env: 'STAGING',
      service: 'web',
      now,
      baseDir: testDir,
    })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('No approved change record found')
  })

  it('fails when outside approved window', () => {
    const futureChange = baseChange({
      implementation_window_start: oneDayFromNow,
      implementation_window_end: new Date(now.getTime() + 172800_000).toISOString(),
    })
    saveChangeRecord(futureChange, { baseDir: testDir })
    const result = validateChangeWindow({
      env: 'STAGING',
      service: 'web',
      now,
      baseDir: testDir,
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('outside the approved implementation window'))).toBe(true)
  })

  it('EMERGENCY change outside window gives warning, not error', () => {
    const emergencyChange = baseChange({
      change_type: 'EMERGENCY',
      risk_level: 'CRITICAL',
      approved_by: ['service_owner'],
      implementation_window_start: oneDayFromNow,
      implementation_window_end: new Date(now.getTime() + 172800_000).toISOString(),
    })
    saveChangeRecord(emergencyChange, { baseDir: testDir })
    const result = validateChangeWindow({
      env: 'STAGING',
      service: 'web',
      now,
      baseDir: testDir,
    })
    expect(result.valid).toBe(true)
    expect(result.warnings.some((w) => w.includes('EMERGENCY'))).toBe(true)
  })

  it('fails when missing required approvals', () => {
    const unapproved = baseChange({
      approved_by: ['service_owner'], // missing change_manager
    })
    saveChangeRecord(unapproved, { baseDir: testDir })
    const result = validateChangeWindow({
      env: 'STAGING',
      service: 'web',
      now,
      baseDir: testDir,
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('missing required approvals'))).toBe(true)
  })
})

// ── Utilities ───────────────────────────────────────────────────────────────

describe('utils', () => {
  it('generateChangeId creates correct format', () => {
    const id = generateChangeId(42)
    expect(id).toMatch(/^CHG-\d{4}-0042$/)
  })

  it('parseChangeId parses valid IDs', () => {
    const parsed = parseChangeId('CHG-2026-0001')
    expect(parsed).toEqual({ year: 2026, sequence: 1 })
  })

  it('parseChangeId returns null for invalid', () => {
    expect(parseChangeId('invalid')).toBeNull()
  })

  it('windowsOverlap detects overlap', () => {
    expect(
      windowsOverlap(
        { start: '2026-01-01T00:00:00Z', end: '2026-01-03T00:00:00Z' },
        { start: '2026-01-02T00:00:00Z', end: '2026-01-04T00:00:00Z' },
      ),
    ).toBe(true)
  })

  it('windowsOverlap detects non-overlap', () => {
    expect(
      windowsOverlap(
        { start: '2026-01-01T00:00:00Z', end: '2026-01-02T00:00:00Z' },
        { start: '2026-01-03T00:00:00Z', end: '2026-01-04T00:00:00Z' },
      ),
    ).toBe(false)
  })

  it('isWithinWindow works correctly', () => {
    expect(
      isWithinWindow('2026-01-02T00:00:00Z', {
        start: '2026-01-01T00:00:00Z',
        end: '2026-01-03T00:00:00Z',
      }),
    ).toBe(true)
    expect(
      isWithinWindow('2026-01-05T00:00:00Z', {
        start: '2026-01-01T00:00:00Z',
        end: '2026-01-03T00:00:00Z',
      }),
    ).toBe(false)
  })
})

// ── PIR Recording ───────────────────────────────────────────────────────────

describe('recordPostImplementationReview', () => {
  it('records PIR on a completed change', () => {
    const change = baseChange({ status: 'COMPLETED' })
    saveChangeRecord(change, { baseDir: testDir })

    const review: PostImplementationReview = {
      outcome: 'SUCCESS',
      incidents_triggered: false,
      incident_refs: [],
      observations: 'Went smoothly',
    }

    const updated = recordPostImplementationReview('CHG-2026-0001', review, { baseDir: testDir })
    expect(updated.post_implementation_review).toBeDefined()
    expect(updated.post_implementation_review!.outcome).toBe('SUCCESS')
  })

  it('throws if change not found', () => {
    expect(() =>
      recordPostImplementationReview('CHG-9999-9999', {
        outcome: 'SUCCESS',
        incidents_triggered: false,
        incident_refs: [],
        observations: '',
      }, { baseDir: testDir }),
    ).toThrow('not found')
  })

  it('throws if change is not in terminal status', () => {
    saveChangeRecord(baseChange({ status: 'APPROVED' }), { baseDir: testDir })
    expect(() =>
      recordPostImplementationReview('CHG-2026-0001', {
        outcome: 'SUCCESS',
        incidents_triggered: false,
        incident_refs: [],
        observations: '',
      }, { baseDir: testDir }),
    ).toThrow('Cannot record PIR')
  })
})
