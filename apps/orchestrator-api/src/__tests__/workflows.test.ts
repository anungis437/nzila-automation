/**
 * Orchestrator API — Workflow & Job route tests
 */
import { describe, it, expect } from 'vitest'
import { PlaybookName } from '../contract.js'

// Test the workflow definitions (unit-level, no server needed)
describe('WorkflowDefinitions', () => {
  it('PlaybookName enum includes all expected playbooks', () => {
    const expected = ['contract_guardian', 'lint_check', 'typecheck', 'unit_tests', 'full_ci']
    for (const name of expected) {
      expect(PlaybookName.safeParse(name).success).toBe(true)
    }
  })

  it('PlaybookName rejects invalid playbook names', () => {
    expect(PlaybookName.safeParse('nuke_everything').success).toBe(false)
  })
})
