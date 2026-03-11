import { describe, it, expect, beforeEach } from 'vitest'
import {
  createWorkflowRegistry,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_SLO_TARGETS,
  type WorkflowDefinition,
} from './workflow-registry'

function createTestWorkflow(overrides: Partial<WorkflowDefinition> = {}): WorkflowDefinition {
  return {
    name: 'test_workflow',
    description: 'A test workflow',
    version: '1.0.0',
    status: 'active',
    dangerLevel: 'safe',
    requiresApproval: false,
    defaultDryRun: true,
    estimatedDurationSeconds: 30,
    requiredPermissions: ['workflow.execute'],
    retry: DEFAULT_RETRY_CONFIG,
    slo: DEFAULT_SLO_TARGETS,
    tags: ['test'],
    owner: 'platform-team',
    registeredAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('WorkflowRegistry', () => {
  let registry: ReturnType<typeof createWorkflowRegistry>

  beforeEach(() => {
    registry = createWorkflowRegistry()
  })

  it('registers and retrieves a workflow', () => {
    const wf = createTestWorkflow()
    registry.register(wf)
    expect(registry.get('test_workflow')).toEqual(wf)
  })

  it('returns undefined for unknown workflow', () => {
    expect(registry.get('nonexistent')).toBeUndefined()
  })

  it('lists all workflows', () => {
    registry.register(createTestWorkflow({ name: 'a' }))
    registry.register(createTestWorkflow({ name: 'b' }))
    expect(registry.list()).toHaveLength(2)
  })

  it('lists only active workflows', () => {
    registry.register(createTestWorkflow({ name: 'active_one', status: 'active' }))
    registry.register(createTestWorkflow({ name: 'deprecated_one', status: 'deprecated' }))
    registry.register(createTestWorkflow({ name: 'disabled_one', status: 'disabled' }))

    const active = registry.listActive()
    expect(active).toHaveLength(1)
    expect(active[0].name).toBe('active_one')
  })

  it('has() checks existence', () => {
    registry.register(createTestWorkflow())
    expect(registry.has('test_workflow')).toBe(true)
    expect(registry.has('nope')).toBe(false)
  })

  it('unregisters a workflow', () => {
    registry.register(createTestWorkflow())
    expect(registry.unregister('test_workflow')).toBe(true)
    expect(registry.has('test_workflow')).toBe(false)
    expect(registry.unregister('test_workflow')).toBe(false)
  })

  it('clear empties the registry', () => {
    registry.register(createTestWorkflow({ name: 'a' }))
    registry.register(createTestWorkflow({ name: 'b' }))
    registry.clear()
    expect(registry.list()).toHaveLength(0)
  })
})

describe('DEFAULT_RETRY_CONFIG', () => {
  it('has sensible defaults', () => {
    expect(DEFAULT_RETRY_CONFIG.maxAttempts).toBe(3)
    expect(DEFAULT_RETRY_CONFIG.initialDelayMs).toBe(1000)
    expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBe(2)
    expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(30_000)
  })
})

describe('DEFAULT_SLO_TARGETS', () => {
  it('has sensible defaults', () => {
    expect(DEFAULT_SLO_TARGETS.maxDurationMs).toBe(300_000)
    expect(DEFAULT_SLO_TARGETS.successRatePercent).toBe(99)
  })
})
