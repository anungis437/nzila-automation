/**
 * @nzila/platform-observability — barrel exports
 */

// types
export type {
  TraceContext,
  SpanData,
  SpanEvent,
  MetricType,
  MetricDefinition,
  MetricSample,
  HealthStatus,
  HealthCheckResult,
  HealthReport,
  CorrelationContext,
} from './types'

export {
  traceContextSchema,
  healthCheckResultSchema,
} from './types'

// correlation
export {
  generateTraceId,
  generateSpanId,
  generateRequestId,
  extractCorrelationContext,
  buildCorrelationHeaders,
  createChildContext,
  withCorrelation,
  withFreshCorrelation,
} from './correlation'

// metrics
export {
  Counter,
  Gauge,
  Histogram,
  MetricsRegistry,
  globalRegistry,
} from './metrics'

// span
export { Span, trace } from './span'

// health
export {
  HealthChecker,
} from './health'
export type { HealthCheckFn, HealthCheckConfig } from './health'

// structured logger
export {
  StructuredLogger,
  createLogger,
} from './logger'
export type {
  Severity,
  StructuredLogEntry,
  LoggerContext,
  LogSink,
} from './logger'

// platform OS hooks
export {
  entityGraphOps,
  eventFabricPublished,
  decisionGraphCreated,
  aiRunExecutions,
  reasoningChainExecutions,
  dataFabricSyncJobs,
  searchLatency,
  aiRunLatency,
  reasoningChainLatency,
  ontologyLogger,
  entityGraphLogger,
  eventFabricLogger,
  knowledgeRegistryLogger,
  dataFabricLogger,
  decisionGraphLogger,
  contextOrchestratorLogger,
  semanticSearchLogger,
  governedAILogger,
  reasoningEngineLogger,
  tracePlatformOp,
} from './platform-os-hooks'

// telemetry contracts
export {
  requestTelemetry,
  workflowTelemetry,
  integrationTelemetry,
  aiRunTelemetry,
  governanceTelemetry,
  dataFabricTelemetry,
  requestContextMiddleware,
  apiRequestCount,
  apiRequestLatency,
  apiErrorRate,
  apiAuthFailures,
  workflowRuns,
  workflowFailures,
  workflowRetryCount,
  workflowRunDuration,
  workflowQueueDepth,
  integrationWebhookVolume,
  integrationApiFailures,
  integrationRetryAttempts,
  integrationSyncDuration,
  integrationProviderLatency,
  dataFabricIngestionRate,
  dataFabricMappingConflicts,
  dataFabricSyncLag,
  dataFabricReconciliationFailures,
  aiReasoningRuns,
  aiReasoningLatency,
  aiCitationCoverage,
  aiApprovalRequired,
  aiUnsafeOutputFlags,
  govPolicyViolations,
  govApprovalBacklog,
  govAuditEvents,
  govSensitiveActionFreq,
} from './telemetry-contracts'
export type { TelemetryContext, RequestTelemetryOptions } from './telemetry-contracts'

// reliability engineering (SLO / SLI)
export {
  PLATFORM_SLOS,
  computeErrorBudget,
  meetsSlo,
} from './reliability'
export type {
  SliMetric,
  SliDefinition,
  SloComparison,
  SloTarget,
  ErrorBudgetStatus,
} from './reliability'

// alerting model
export {
  PLATFORM_ALERT_RULES,
  fireAlert,
} from './alerting'
export type {
  AlertCategory,
  AlertSeverity,
  AlertRule,
  AlertAction,
  AlertActionType,
  AlertEvent,
  AlertSink,
} from './alerting'
