/**
 * Nzila OS — Platform Ops: Failure Simulation
 *
 * Feature-flagged failure simulation for testing runbooks and incident
 * response procedures. Only active when `OPS_SIMULATION_ENABLED=true`
 * AND the environment is `development` or `pilot`.
 *
 * Supported simulations:
 *   - Integration failure (provider goes down)
 *   - Database latency spike (artificial delay)
 *   - Error spike (elevated error rate)
 *
 * @module @nzila/platform-ops/failure-simulation
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type SimulationType = 'integration_failure' | 'db_latency_spike' | 'error_spike'

export interface SimulationConfig {
  /** Which simulation to run */
  type: SimulationType
  /** Duration in seconds (auto-clears after) */
  durationSec: number
  /** Severity multiplier (1.0 = default, 2.0 = double) */
  intensity: number
  /** Optional scope (e.g. provider name, route) */
  scope?: string
}

export interface SimulationState {
  /** Whether any simulation is currently active */
  active: boolean
  /** Currently running simulations */
  simulations: ActiveSimulation[]
  /** Whether the feature flag is enabled */
  featureFlagEnabled: boolean
  /** Whether the environment allows simulation */
  environmentAllowed: boolean
}

export interface ActiveSimulation {
  type: SimulationType
  startedAt: string
  expiresAt: string
  intensity: number
  scope: string
  /** Whether simulation has expired (for cleanup) */
  expired: boolean
}

export interface SimulationToggleResult {
  success: boolean
  message: string
  simulation?: ActiveSimulation
}

export interface SimulationAuditEvent {
  action: 'platform.ops.simulation_started' | 'platform.ops.simulation_stopped'
  timestamp: string
  simulationType: SimulationType
  scope: string
  intensity: number
  durationSec: number
}

// ── Environment Checks ─────────────────────────────────────────────────────

const ALLOWED_ENVIRONMENTS = ['development', 'test', 'pilot']

/**
 * Check whether the simulation feature flag is enabled.
 */
export function isSimulationFlagEnabled(): boolean {
  return process.env.OPS_SIMULATION_ENABLED === 'true'
}

/**
 * Check whether the current environment allows simulation.
 */
export function isSimulationEnvironmentAllowed(): boolean {
  const env = process.env.NODE_ENV ?? 'development'
  const pilotFlag = process.env.NZILA_PILOT_MODE === 'true'
  return ALLOWED_ENVIRONMENTS.includes(env) || pilotFlag
}

/**
 * Check whether simulation can be activated (flag + environment).
 */
export function canActivateSimulation(): boolean {
  return isSimulationFlagEnabled() && isSimulationEnvironmentAllowed()
}

// ── In-Memory Simulation Registry ──────────────────────────────────────────

const activeSimulations: Map<string, ActiveSimulation> = new Map()

function simulationKey(type: SimulationType, scope: string): string {
  return `${type}::${scope}`
}

function pruneExpired(): void {
  const now = Date.now()
  for (const [key, sim] of activeSimulations) {
    if (new Date(sim.expiresAt).getTime() <= now) {
      sim.expired = true
      activeSimulations.delete(key)
    }
  }
}

// ── Simulation Controls ────────────────────────────────────────────────────

/**
 * Start a failure simulation. Returns error if feature flag or environment
 * does not permit simulation.
 */
export function startSimulation(config: SimulationConfig): SimulationToggleResult {
  if (!canActivateSimulation()) {
    return {
      success: false,
      message: 'Simulation blocked: OPS_SIMULATION_ENABLED is not true or environment is not allowed.',
    }
  }

  pruneExpired()

  const scope = config.scope ?? 'global'
  const key = simulationKey(config.type, scope)

  if (activeSimulations.has(key)) {
    return {
      success: false,
      message: `Simulation ${config.type} for scope "${scope}" is already active.`,
    }
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + config.durationSec * 1000)

  const simulation: ActiveSimulation = {
    type: config.type,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    intensity: config.intensity,
    scope,
    expired: false,
  }

  activeSimulations.set(key, simulation)

  return {
    success: true,
    message: `Simulation ${config.type} started for scope "${scope}" (${config.durationSec}s, intensity: ${config.intensity}).`,
    simulation,
  }
}

/**
 * Stop a running simulation early.
 */
export function stopSimulation(type: SimulationType, scope = 'global'): SimulationToggleResult {
  const key = simulationKey(type, scope)
  const sim = activeSimulations.get(key)

  if (!sim) {
    return {
      success: false,
      message: `No active simulation found for ${type} / ${scope}.`,
    }
  }

  sim.expired = true
  activeSimulations.delete(key)

  return {
    success: true,
    message: `Simulation ${type} stopped for scope "${scope}".`,
    simulation: sim,
  }
}

/**
 * Get current simulation state.
 */
export function getSimulationState(): SimulationState {
  pruneExpired()

  return {
    active: activeSimulations.size > 0,
    simulations: Array.from(activeSimulations.values()),
    featureFlagEnabled: isSimulationFlagEnabled(),
    environmentAllowed: isSimulationEnvironmentAllowed(),
  }
}

/**
 * Check whether a specific simulation type is currently active for a scope.
 */
export function isSimulationActive(type: SimulationType, scope = 'global'): boolean {
  pruneExpired()
  const key = simulationKey(type, scope)
  return activeSimulations.has(key)
}

/**
 * Clear all active simulations (used in tests and cleanup).
 */
export function clearAllSimulations(): void {
  activeSimulations.clear()
}

// ── Simulation Effects (injectable into middleware) ─────────────────────────

/**
 * Get the simulated latency spike in ms for a given scope.
 * Returns 0 if no DB latency simulation is active.
 */
export function getSimulatedLatencyMs(scope = 'global'): number {
  if (!isSimulationActive('db_latency_spike', scope)) return 0
  const sim = activeSimulations.get(simulationKey('db_latency_spike', scope))
  if (!sim) return 0
  // Base: 500ms × intensity
  return Math.round(500 * sim.intensity)
}

/**
 * Check whether an integration failure simulation is active.
 */
export function shouldSimulateIntegrationFailure(provider = 'global'): boolean {
  return isSimulationActive('integration_failure', provider)
}

/**
 * Get multiplied error rate for error spike simulation.
 * Returns 1.0 (no change) if no simulation active.
 */
export function getErrorRateMultiplier(scope = 'global'): number {
  if (!isSimulationActive('error_spike', scope)) return 1.0
  const sim = activeSimulations.get(simulationKey('error_spike', scope))
  return sim ? sim.intensity : 1.0
}

// ── Audit Event ────────────────────────────────────────────────────────────

/**
 * Build an audit event for simulation start/stop.
 */
export function buildSimulationAuditEvent(
  action: 'platform.ops.simulation_started' | 'platform.ops.simulation_stopped',
  sim: ActiveSimulation,
  durationSec: number,
): SimulationAuditEvent {
  return {
    action,
    timestamp: new Date().toISOString(),
    simulationType: sim.type,
    scope: sim.scope,
    intensity: sim.intensity,
    durationSec,
  }
}
