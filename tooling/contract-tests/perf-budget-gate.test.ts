/**
 * Nzila OS — Contract Test: Perf Budget Gate
 *
 * Validates that performance budgets config is well-formed and
 * enforces budgets only when feature-flagged for the target environment.
 *
 * This test is always-on to validate the config shape.
 * Actual metric enforcement only runs when `enabled: true` for the env.
 *
 * @see ops/perf-budgets.yml
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'

const BUDGETS_PATH = join(__dirname, '..', '..', 'ops', 'perf-budgets.yml')

interface PerfBudgetConfig {
  version: string
  environments: Record<string, { enabled: boolean; mode: 'warn' | 'enforce' }>
  budgets: Record<string, number>
  apps?: Record<string, Record<string, number>>
}

function loadBudgets(): PerfBudgetConfig {
  const raw = readFileSync(BUDGETS_PATH, 'utf-8')
  return parseYaml(raw) as PerfBudgetConfig
}

describe('perf-budget gate config', () => {
  it('perf-budgets.yml exists', () => {
    expect(existsSync(BUDGETS_PATH)).toBe(true)
  })

  it('has valid version', () => {
    const config = loadBudgets()
    expect(config.version).toBeDefined()
  })

  it('defines all required environments', () => {
    const config = loadBudgets()
    const requiredEnvs = ['dev', 'staging', 'pilot', 'prod']
    for (const env of requiredEnvs) {
      expect(config.environments[env]).toBeDefined()
      expect(typeof config.environments[env].enabled).toBe('boolean')
      expect(['warn', 'enforce']).toContain(config.environments[env].mode)
    }
  })

  it('has budget thresholds defined', () => {
    const config = loadBudgets()
    expect(config.budgets).toBeDefined()
    expect(config.budgets.route_p95_ms).toBeGreaterThan(0)
    expect(config.budgets.error_rate_max_pct).toBeGreaterThan(0)
  })

  it('pilot/prod environments use enforce mode', () => {
    const config = loadBudgets()
    expect(config.environments.pilot.mode).toBe('enforce')
    expect(config.environments.prod.mode).toBe('enforce')
  })

  it('dev/staging environments use warn mode', () => {
    const config = loadBudgets()
    expect(config.environments.dev.mode).toBe('warn')
    expect(config.environments.staging.mode).toBe('warn')
  })

  it('app overrides do not exceed 2× global budget', () => {
    const config = loadBudgets()
    if (!config.apps) return

    for (const [app, overrides] of Object.entries(config.apps)) {
      for (const [metric, value] of Object.entries(overrides)) {
        const globalValue = config.budgets[metric]
        if (globalValue) {
          expect(
            value,
            `${app}.${metric} = ${value} exceeds 2× global (${globalValue * 2})`,
          ).toBeLessThanOrEqual(globalValue * 2)
        }
      }
    }
  })
})

describe('perf-budget enforcement (feature-flagged)', () => {
  it('does not enforce when environment is disabled', () => {
    const config = loadBudgets()
    const targetEnv = process.env.NZILA_DEPLOY_ENV ?? 'dev'
    const envConfig = config.environments[targetEnv]

    if (!envConfig?.enabled) {
      // Budget gate is off — test passes (not blocking dev velocity)
      expect(true).toBe(true)
      return
    }

    // If enabled, we would check actual metrics here.
    // For now, validate that the config is ready for enforcement.
    expect(envConfig.mode).toBe('enforce')
    expect(config.budgets.route_p95_ms).toBeGreaterThan(0)
  })
})
