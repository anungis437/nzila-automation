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
