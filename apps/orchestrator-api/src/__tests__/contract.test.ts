/**
 * Orchestrator API — Contract Schema Tests
 *
 * Tests the Zod command contract validation that gates all incoming requests.
 */
import { describe, it, expect } from 'vitest'
import { CommandSchema, PlaybookName, CommandStatus } from '../contract.js'

describe('CommandSchema', () => {
  const validCommand = {
    correlation_id: '550e8400-e29b-41d4-a716-446655440000',
    playbook: 'lint_check' as const,
    dry_run: true,
    requested_by: 'ci-bot',
    args: { branch: 'main' },
  }

  it('accepts a valid command', () => {
    const result = CommandSchema.safeParse(validCommand)
    expect(result.success).toBe(true)
  })

  it('rejects unknown playbook names', () => {
    const result = CommandSchema.safeParse({ ...validCommand, playbook: 'delete_everything' })
    expect(result.success).toBe(false)
  })

  it('rejects non-UUID correlation_id', () => {
    const result = CommandSchema.safeParse({ ...validCommand, correlation_id: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('requires requested_by to be non-empty', () => {
    const result = CommandSchema.safeParse({ ...validCommand, requested_by: '' })
    expect(result.success).toBe(false)
  })

  it('defaults dry_run to true when omitted', () => {
    const { dry_run: _, ...withoutDryRun } = validCommand
    const result = CommandSchema.safeParse(withoutDryRun)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dry_run).toBe(true)
    }
  })

  it('defaults args to empty object when omitted', () => {
    const { args: _, ...withoutArgs } = validCommand
    const result = CommandSchema.safeParse(withoutArgs)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.args).toEqual({})
    }
  })
})

describe('PlaybookName', () => {
  it('includes all required playbooks', () => {
    expect(PlaybookName.options).toContain('contract_guardian')
    expect(PlaybookName.options).toContain('lint_check')
    expect(PlaybookName.options).toContain('typecheck')
    expect(PlaybookName.options).toContain('unit_tests')
    expect(PlaybookName.options).toContain('full_ci')
  })
})

describe('CommandStatus', () => {
  it('includes full lifecycle states', () => {
    expect(CommandStatus.options).toContain('pending')
    expect(CommandStatus.options).toContain('dispatched')
    expect(CommandStatus.options).toContain('running')
    expect(CommandStatus.options).toContain('succeeded')
    expect(CommandStatus.options).toContain('failed')
    expect(CommandStatus.options).toContain('cancelled')
  })
})
