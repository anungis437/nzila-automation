/**
 * @nzila/platform-environment — Environment detection
 *
 * Detects the current environment via:
 *   1. ENVIRONMENT env variable
 *   2. CI env variable mapping
 *   3. Fallback to LOCAL
 *
 * @module @nzila/platform-environment/env
 */
import type { EnvironmentName } from './types'

const VALID_ENVIRONMENTS = new Set<string>(['LOCAL', 'PREVIEW', 'STAGING', 'PRODUCTION'])

/**
 * Detect the current environment.
 *
 * Resolution order:
 *   1. ENVIRONMENT env-var (explicit override)
 *   2. CI-platform heuristics (GITHUB_REF, etc.)
 *   3. Fallback → LOCAL
 */
export function getEnvironment(): EnvironmentName {
  // 1. Explicit env var
  const explicit = process.env.ENVIRONMENT?.toUpperCase()
  if (explicit && VALID_ENVIRONMENTS.has(explicit)) {
    return explicit as EnvironmentName
  }

  // 2. CI heuristics
  if (process.env.CI === 'true') {
    // GitHub Actions tag push → PRODUCTION
    const ref = process.env.GITHUB_REF ?? ''
    if (ref.startsWith('refs/tags/')) return 'PRODUCTION'

    // PR → PREVIEW
    if (process.env.GITHUB_EVENT_NAME === 'pull_request') return 'PREVIEW'

    // Main branch push → STAGING
    if (ref === 'refs/heads/main') return 'STAGING'

    return 'STAGING'
  }

  // 3. Fallback
  return 'LOCAL'
}

/**
 * Check if current environment is protected (STAGING or PRODUCTION).
 */
export function isProtectedEnvironment(env?: EnvironmentName): boolean {
  const e = env ?? getEnvironment()
  return e === 'STAGING' || e === 'PRODUCTION'
}

/**
 * Check if current environment allows debug logging.
 */
export function allowsDebugLogging(env?: EnvironmentName): boolean {
  const e = env ?? getEnvironment()
  return e === 'LOCAL' || e === 'PREVIEW' || e === 'STAGING'
}

/**
 * Check if current environment allows experimental AI features.
 */
export function allowsAIExperimental(env?: EnvironmentName): boolean {
  const e = env ?? getEnvironment()
  return e !== 'PRODUCTION'
}
