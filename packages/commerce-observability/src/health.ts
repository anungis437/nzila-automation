/**
 * @nzila/commerce-observability — Health Check Definitions
 *
 * Commerce-specific health check definitions for operational readiness.
 * Each health check maps to a module/subsystem and defines what
 * "healthy" means for that component.
 *
 * @module @nzila/commerce-observability/health
 */

// ── Health Check Types ────────────────────────────────────────────────────

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface HealthCheck {
  readonly name: string
  readonly module: string
  readonly description: string
  /** Check function — returns status + optional diagnostics */
  check(): HealthCheckResult
}

export interface HealthCheckResult {
  readonly status: HealthStatus
  readonly message: string
  readonly timestamp: string
  readonly details?: Record<string, unknown>
}

// ── Commerce Health Checks ────────────────────────────────────────────────

/**
 * Build a health check result.
 */
export function buildHealthResult(
  status: HealthStatus,
  message: string,
  details?: Record<string, unknown>,
): HealthCheckResult {
  return {
    status,
    message,
    timestamp: new Date().toISOString(),
    details,
  }
}

/**
 * Commerce module health check definitions.
 * These are used by health endpoints to report operational status.
 */
export const COMMERCE_HEALTH_CHECKS = {
  STATE_MACHINE: {
    name: 'commerce-state-machine',
    module: 'commerce-state',
    description: 'State machine engine is responsive and can validate machines',
  },
  GOVERNANCE: {
    name: 'commerce-governance',
    module: 'commerce-governance',
    description: 'Governance gates can be evaluated and policy resolved',
  },
  EVENT_BUS: {
    name: 'commerce-event-bus',
    module: 'commerce-events',
    description: 'Event bus can emit and receive domain events',
  },
  SAGA_ORCHESTRATOR: {
    name: 'commerce-saga-orchestrator',
    module: 'commerce-events',
    description: 'Saga orchestrator can register and list sagas',
  },
  AUDIT_TRAIL: {
    name: 'commerce-audit-trail',
    module: 'commerce-audit',
    description: 'Audit entries can be created and hashed',
  },
  EVIDENCE_PACKS: {
    name: 'commerce-evidence-packs',
    module: 'commerce-evidence',
    description: 'Evidence packs can be built and validated',
  },
} as const

/**
 * Aggregate multiple health check results into a summary.
 */
export function aggregateHealth(
  results: readonly HealthCheckResult[],
): { overall: HealthStatus; checks: readonly HealthCheckResult[] } {
  const hasUnhealthy = results.some((r) => r.status === 'unhealthy')
  const hasDegraded = results.some((r) => r.status === 'degraded')

  const overall: HealthStatus = hasUnhealthy
    ? 'unhealthy'
    : hasDegraded
      ? 'degraded'
      : 'healthy'

  return { overall, checks: results }
}
