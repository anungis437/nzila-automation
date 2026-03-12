/**
 * @nzila/platform-environment — barrel exports
 */

// types
export type {
  EnvironmentName,
  EnvironmentConfig,
  DeploymentArtifact,
  EnvironmentHealthCheck,
  EnvironmentHealthReport,
  GovernanceSnapshot,
  FeatureFlag,
  EnvironmentNamespace,
} from './types'

export { PROTECTED_ENVIRONMENTS, ALL_ENVIRONMENTS } from './types'

// schemas
export {
  environmentNameSchema,
  environmentConfigSchema,
  deploymentArtifactSchema,
  environmentHealthCheckSchema,
  environmentHealthReportSchema,
  governanceSnapshotSchema,
  featureFlagSchema,
} from './schemas'

// env detection
export {
  getEnvironment,
  isProtectedEnvironment,
  allowsDebugLogging,
  allowsAIExperimental,
} from './env'

// environment namespaces
export {
  getEnvironmentPrefix,
  getEnvironmentNamespace,
  getObservabilityNamespace,
  getDatabaseName,
  getStorageName,
} from './environment'

// service configuration
export {
  getEnvironmentConfig,
  resolveServiceConfig,
} from './service'

// config / artifact / snapshot helpers
export {
  loadEnvFile,
  saveArtifactManifest,
  loadLatestArtifact,
  loadArtifactByDigest,
  saveGovernanceSnapshot,
  loadGovernanceSnapshots,
} from './config'

// environment-scoped observability
export {
  envLog,
  envMetricName,
  envAlertTags,
} from './observability'
export type { EnvironmentLogEntry } from './observability'
