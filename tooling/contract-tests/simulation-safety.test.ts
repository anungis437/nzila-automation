/**
 * Nzila OS — Contract Test: Simulation Safety Lock
 *
 * Prevents accidental activation of failure simulation in production.
 *
 * Invariants:
 *   SIM_SAFETY_001 — Simulation module requires OPS_SIMULATION_ENABLED flag
 *   SIM_SAFETY_002 — Simulation environment guard rejects 'production'
 *   SIM_SAFETY_003 — canActivateSimulation() returns false when flag is off
 *   SIM_SAFETY_004 — canActivateSimulation() returns false in production env
 *   SIM_SAFETY_005 — Simulation source code uses ALLOWED_ENVIRONMENTS constant
 *   SIM_SAFETY_006 — Console simulation page checks canActivateSimulation()
 *
 * @invariant SIM_SAFETY_001
 * @invariant SIM_SAFETY_002
 * @invariant SIM_SAFETY_003
 * @invariant SIM_SAFETY_004
 * @invariant SIM_SAFETY_005
 * @invariant SIM_SAFETY_006
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '../..')

// ── Source file paths ──────────────────────────────────────────────────────

const SIMULATION_SRC = join(ROOT, 'packages/platform-ops/src/failure-simulation.ts')
const SIMULATION_PAGE = join(ROOT, 'apps/console/app/(dashboard)/failure-simulation/page.tsx')

// ── Helpers ────────────────────────────────────────────────────────────────

function readContent(filePath: string): string {
  if (!existsSync(filePath)) return ''
  return readFileSync(filePath, 'utf-8')
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Simulation Safety Lock', () => {
  const savedEnv: Record<string, string | undefined> = {}

  beforeEach(() => {
    savedEnv.OPS_SIMULATION_ENABLED = process.env.OPS_SIMULATION_ENABLED
    savedEnv.NODE_ENV = process.env.NODE_ENV
    savedEnv.NZILA_PILOT_MODE = process.env.NZILA_PILOT_MODE
  })

  afterEach(() => {
    process.env.OPS_SIMULATION_ENABLED = savedEnv.OPS_SIMULATION_ENABLED
    process.env.NODE_ENV = savedEnv.NODE_ENV
    process.env.NZILA_PILOT_MODE = savedEnv.NZILA_PILOT_MODE
  })

  /**
   * @invariant SIM_SAFETY_001
   * The simulation module source MUST check OPS_SIMULATION_ENABLED env var.
   */
  it('SIM_SAFETY_001 — simulation source checks OPS_SIMULATION_ENABLED', () => {
    const src = readContent(SIMULATION_SRC)
    expect(src).toBeTruthy()
    expect(src).toContain('OPS_SIMULATION_ENABLED')
    expect(src).toContain("process.env.OPS_SIMULATION_ENABLED === 'true'")
  })

  /**
   * @invariant SIM_SAFETY_002
   * The ALLOWED_ENVIRONMENTS list must NOT include 'production'.
   */
  it('SIM_SAFETY_002 — ALLOWED_ENVIRONMENTS excludes production', () => {
    const src = readContent(SIMULATION_SRC)
    expect(src).toBeTruthy()

    // Find the ALLOWED_ENVIRONMENTS declaration
    const envMatch = src.match(/ALLOWED_ENVIRONMENTS\s*=\s*\[([^\]]+)\]/)
    expect(envMatch).toBeTruthy()

    const envList = envMatch![1]
    expect(envList).not.toContain("'production'")
    expect(envList).not.toContain('"production"')

    // Positive check: only development, test, pilot allowed
    expect(envList).toContain('development')
    expect(envList).toContain('test')
    expect(envList).toContain('pilot')
  })

  /**
   * @invariant SIM_SAFETY_003
   * canActivateSimulation() must return false when OPS_SIMULATION_ENABLED is not 'true'.
   */
  it('SIM_SAFETY_003 — canActivateSimulation() rejects missing flag', async () => {
    // Dynamic import to get fresh module state
    delete process.env.OPS_SIMULATION_ENABLED
    process.env.NODE_ENV = 'development'

    const mod = await import(
      '../../packages/platform-ops/src/failure-simulation'
    )

    expect(mod.isSimulationFlagEnabled()).toBe(false)
    expect(mod.canActivateSimulation()).toBe(false)
  })

  /**
   * @invariant SIM_SAFETY_004
   * canActivateSimulation() must return false in production, even if flag enabled.
   */
  it('SIM_SAFETY_004 — canActivateSimulation() rejects production env', async () => {
    process.env.OPS_SIMULATION_ENABLED = 'true'
    process.env.NODE_ENV = 'production'
    delete process.env.NZILA_PILOT_MODE

    const mod = await import(
      '../../packages/platform-ops/src/failure-simulation'
    )

    expect(mod.isSimulationEnvironmentAllowed()).toBe(false)
    expect(mod.canActivateSimulation()).toBe(false)
  })

  /**
   * @invariant SIM_SAFETY_005
   * Simulation source must declare ALLOWED_ENVIRONMENTS as a constant
   * and use it in the guard function.
   */
  it('SIM_SAFETY_005 — source uses ALLOWED_ENVIRONMENTS guard pattern', () => {
    const src = readContent(SIMULATION_SRC)
    expect(src).toBeTruthy()

    // Must have a const declaration
    expect(src).toMatch(/const\s+ALLOWED_ENVIRONMENTS/)

    // Guard function must reference it
    expect(src).toContain('ALLOWED_ENVIRONMENTS.includes')

    // canActivateSimulation must combine flag + env checks
    const canActivateBody = src.match(
      /function\s+canActivateSimulation[^{]*\{([^}]+)\}/,
    )
    expect(canActivateBody).toBeTruthy()
    expect(canActivateBody![1]).toContain('isSimulationFlagEnabled')
    expect(canActivateBody![1]).toContain('isSimulationEnvironmentAllowed')
  })

  /**
   * @invariant SIM_SAFETY_006
   * Console failure-simulation page must guard against prod activation.
   */
  it('SIM_SAFETY_006 — console simulation page has safety guard', () => {
    const src = readContent(SIMULATION_PAGE)
    if (!src) {
      // Page doesn't exist — that's also safe (no simulation endpoint)
      return
    }

    // Page must either import canActivateSimulation or have visible
    // environment/flag check
    const hasGuard =
      src.includes('canActivateSimulation') ||
      src.includes('OPS_SIMULATION_ENABLED') ||
      src.includes('isSimulationFlagEnabled') ||
      src.includes('SIMULATION_ENABLED')

    expect(hasGuard).toBe(true)
  })

  /**
   * Additional structural check: startSimulation() must call canActivateSimulation().
   */
  it('startSimulation() has activation guard', () => {
    const src = readContent(SIMULATION_SRC)
    expect(src).toBeTruthy()

    // Find the startSimulation function body
    const fnMatch = src.match(/function\s+startSimulation[^{]*\{([\s\S]*?)^}/m)
    expect(fnMatch).toBeTruthy()
    expect(fnMatch![1]).toContain('canActivateSimulation')
  })
})
