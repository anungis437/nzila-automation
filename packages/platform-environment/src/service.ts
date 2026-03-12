/**
 * @nzila/platform-environment — Service configuration resolver
 *
 * Builds a complete EnvironmentConfig for a given service by combining
 * environment detection with service-specific defaults.
 *
 * @module @nzila/platform-environment/service
 */
import type { EnvironmentName, EnvironmentConfig } from './types'
import { getEnvironment, isProtectedEnvironment, allowsDebugLogging, allowsAIExperimental } from './env'
import { getEnvironmentNamespace } from './environment'

/**
 * Build the canonical environment config for a service.
 */
export function getEnvironmentConfig(service: string, env?: EnvironmentName): EnvironmentConfig {
  const environment = env ?? getEnvironment()
  const ns = getEnvironmentNamespace(environment)

  return {
    environment,
    service,
    deployment_region: process.env.DEPLOYMENT_REGION ?? 'eastus',
    observability_namespace: ns.observability,
    evidence_namespace: ns.evidence,
    allow_ai_experimental: allowsAIExperimental(environment),
    allow_debug_logging: allowsDebugLogging(environment),
    protected_environment: isProtectedEnvironment(environment),
  }
}

/**
 * Resolve environment config for a specific app by name.
 * Convenience wrapper used in CI and runtime bootstrapping.
 */
export function resolveServiceConfig(service: string): EnvironmentConfig {
  return getEnvironmentConfig(service)
}
