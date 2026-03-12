/**
 * Environment-scoped observability helpers.
 *
 * Provides namespace-prefixed loggers and metrics so that each environment
 * (LOCAL, PREVIEW, STAGING, PRODUCTION) emits telemetry into a separate
 * namespace, preventing data cross-contamination.
 */

import { getEnvironment, getObservabilityNamespace } from '@nzila/platform-environment'
import type { EnvironmentName } from '@nzila/platform-environment/types'

export interface EnvironmentLogEntry {
  environment: EnvironmentName
  namespace: string
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  data?: Record<string, unknown>
}

/**
 * Create an environment-scoped log entry.
 */
export function envLog(
  level: EnvironmentLogEntry['level'],
  message: string,
  data?: Record<string, unknown>,
): EnvironmentLogEntry {
  const environment = getEnvironment()
  return {
    environment,
    namespace: getObservabilityNamespace(environment),
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  }
}

/**
 * Returns the metric prefix for the current environment.
 * Example: "nzila.staging.api.request_count"
 */
export function envMetricName(metricName: string): string {
  const environment = getEnvironment()
  const ns = getObservabilityNamespace(environment)
  return `${ns}.${metricName}`
}

/**
 * Returns the alert tag map for environment-scoped alerting.
 */
export function envAlertTags(): Record<string, string> {
  const environment = getEnvironment()
  return {
    environment,
    namespace: getObservabilityNamespace(environment),
  }
}
