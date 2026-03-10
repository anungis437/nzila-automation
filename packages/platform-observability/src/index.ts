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
