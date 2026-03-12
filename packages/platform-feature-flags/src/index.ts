/**
 * @nzila/platform-feature-flags — Feature flag registry
 *
 * Environment-aware feature flags for Nzila OS.
 *
 * Rules:
 *   - Experimental AI features: allowed only outside PRODUCTION
 *   - Production flags must be explicitly enabled
 *   - Flags can be scoped to specific environments
 *
 * @module @nzila/platform-feature-flags
 */
import { getEnvironment } from '@nzila/platform-environment'
import type { EnvironmentName } from '@nzila/platform-environment'
import type { FeatureFlag, FeatureFlagEvaluation } from './types'

// ── Default Flags ───────────────────────────────────────────────────────────

const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    name: 'ai_experimental',
    enabled: true,
    environments: ['LOCAL', 'PREVIEW', 'STAGING'],
    description: 'Experimental AI features — never allowed in production',
  },
  {
    name: 'governance_debug',
    enabled: true,
    environments: ['LOCAL', 'PREVIEW', 'STAGING'],
    description: 'Verbose governance logging for debugging',
  },
  {
    name: 'advanced_intelligence',
    enabled: true,
    environments: ['LOCAL', 'PREVIEW', 'STAGING'],
    description: 'Advanced intelligence layer features in preview',
  },
]

// ── Registry ────────────────────────────────────────────────────────────────

let flagRegistry: FeatureFlag[] = [...DEFAULT_FLAGS]

/**
 * Register a feature flag. Overwrites if name already exists.
 */
export function registerFlag(flag: FeatureFlag): void {
  flagRegistry = flagRegistry.filter((f) => f.name !== flag.name)
  flagRegistry.push(flag)
}

/**
 * Remove a flag from the registry.
 */
export function unregisterFlag(name: string): void {
  flagRegistry = flagRegistry.filter((f) => f.name !== name)
}

/**
 * Reset registry to defaults (useful for testing).
 */
export function resetFlags(): void {
  flagRegistry = [...DEFAULT_FLAGS]
}

/**
 * Get all registered flags.
 */
export function getAllFlags(): readonly FeatureFlag[] {
  return flagRegistry
}

// ── Evaluation ──────────────────────────────────────────────────────────────

/**
 * Check if a feature flag is enabled for the current (or specified) environment.
 */
export function isFeatureEnabled(name: string, env?: EnvironmentName): boolean {
  const environment = env ?? getEnvironment()
  const flag = flagRegistry.find((f) => f.name === name)
  if (!flag || !flag.enabled) return false
  return flag.environments.includes(environment)
}

/**
 * Evaluate a feature flag with detail.
 */
export function evaluateFlag(name: string, env?: EnvironmentName): FeatureFlagEvaluation {
  const environment = env ?? getEnvironment()
  const flag = flagRegistry.find((f) => f.name === name)

  if (!flag || !flag.enabled) {
    return { flag: name, enabled: false, environment, reason: 'flag_disabled' }
  }

  if (flag.environments.includes(environment)) {
    return { flag: name, enabled: true, environment, reason: 'environment_allowed' }
  }

  return { flag: name, enabled: false, environment, reason: 'environment_blocked' }
}

/**
 * Get all flags enabled in a given environment.
 */
export function getEnabledFlags(env?: EnvironmentName): FeatureFlag[] {
  const environment = env ?? getEnvironment()
  return flagRegistry.filter(
    (f) => f.enabled && f.environments.includes(environment),
  )
}

// Re-export types
export type { FeatureFlag, FeatureFlagEvaluation } from './types'
