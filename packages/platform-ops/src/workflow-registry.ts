/**
 * @nzila/platform-ops — Workflow Registry
 *
 * Typed workflow registry with rich metadata: SLO targets, retry config,
 * danger levels, estimated durations, required permissions.
 *
 * Used by orchestrator-api to register/discover/validate workflows at runtime.
 */

// ── Workflow Metadata ───────────────────────────────────────────────────────

export type DangerLevel = 'safe' | 'moderate' | 'destructive'
export type WorkflowStatus = 'active' | 'deprecated' | 'disabled'

export interface RetryConfig {
  readonly maxAttempts: number
  readonly initialDelayMs: number
  readonly backoffMultiplier: number
  readonly maxDelayMs: number
}

export interface WorkflowSloTargets {
  readonly maxDurationMs: number
  readonly successRatePercent: number
}

export interface WorkflowDefinition {
  readonly name: string
  readonly description: string
  readonly version: string
  readonly status: WorkflowStatus
  readonly dangerLevel: DangerLevel
  readonly requiresApproval: boolean
  readonly defaultDryRun: boolean
  readonly estimatedDurationSeconds: number
  readonly requiredPermissions: readonly string[]
  readonly retry: RetryConfig
  readonly slo: WorkflowSloTargets
  readonly tags: readonly string[]
  readonly owner: string
  readonly registeredAt: string
}

// ── Default Configs ─────────────────────────────────────────────────────────

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30_000,
}

export const DEFAULT_SLO_TARGETS: WorkflowSloTargets = {
  maxDurationMs: 300_000, // 5 minutes
  successRatePercent: 99,
}

// ── Registry ────────────────────────────────────────────────────────────────

export interface WorkflowRegistry {
  register(definition: WorkflowDefinition): void
  get(name: string): WorkflowDefinition | undefined
  list(): readonly WorkflowDefinition[]
  listActive(): readonly WorkflowDefinition[]
  unregister(name: string): boolean
  has(name: string): boolean
  clear(): void
}

export function createWorkflowRegistry(): WorkflowRegistry {
  const workflows = new Map<string, WorkflowDefinition>()

  return {
    register(definition) {
      workflows.set(definition.name, definition)
    },

    get(name) {
      return workflows.get(name)
    },

    list() {
      return Array.from(workflows.values())
    },

    listActive() {
      return Array.from(workflows.values()).filter((w) => w.status === 'active')
    },

    unregister(name) {
      return workflows.delete(name)
    },

    has(name) {
      return workflows.has(name)
    },

    clear() {
      workflows.clear()
    },
  }
}
