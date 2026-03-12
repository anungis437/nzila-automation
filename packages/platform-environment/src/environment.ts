/**
 * @nzila/platform-environment — Environment namespace helpers
 *
 * Produces deterministic, environment-scoped resource names for
 * databases, storage, queues, observability, etc.
 *
 * @module @nzila/platform-environment/environment
 */
import type { EnvironmentName, EnvironmentNamespace } from './types'
import { getEnvironment } from './env'

const ENV_PREFIX: Record<EnvironmentName, string> = {
  LOCAL: 'local',
  PREVIEW: 'preview',
  STAGING: 'staging',
  PRODUCTION: 'prod',
}

/**
 * Get the short prefix for an environment.
 */
export function getEnvironmentPrefix(env?: EnvironmentName): string {
  return ENV_PREFIX[env ?? getEnvironment()]
}

/**
 * Build environment-scoped namespace for all resource types.
 */
export function getEnvironmentNamespace(env?: EnvironmentName): EnvironmentNamespace {
  const prefix = getEnvironmentPrefix(env)
  return {
    database: `nzila-${prefix}-db`,
    storage: `nzila-${prefix}-storage`,
    queue: `nzila-${prefix}-queue`,
    observability: `nzila.${prefix}`,
    evidence: `nzila-${prefix}-evidence`,
    webhooks: `nzila-${prefix}-webhooks`,
  }
}

/**
 * Get the observability namespace for metric/log scoping.
 */
export function getObservabilityNamespace(env?: EnvironmentName): string {
  return getEnvironmentNamespace(env).observability
}

/**
 * Get the database name for an environment.
 */
export function getDatabaseName(env?: EnvironmentName): string {
  return getEnvironmentNamespace(env).database
}

/**
 * Get the storage container prefix for an environment.
 */
export function getStorageName(env?: EnvironmentName): string {
  return getEnvironmentNamespace(env).storage
}
