/**
 * @nzila/commerce-observability — Barrel Export
 *
 * Commerce observability module providing:
 *   - RED metrics for all commerce operations
 *   - SLO definitions + alert rules
 *   - Structured logging helpers
 *   - Span attribute conventions for distributed tracing
 *   - Health check definitions
 *
 * @module @nzila/commerce-observability
 */

// ── Metrics ───────────────────────────────────────────────────────────────
export {
  COMMERCE_METRIC,
  CommerceMetrics,
  commerceMetrics,
  type CommerceMetricName,
  type MetricEntry,
  type HistogramEntry,
  type TransitionMetricLabels,
  type SagaMetricLabels,
  type GovernanceMetricLabels,
} from './metrics'

// ── Spans ─────────────────────────────────────────────────────────────────
export {
  COMMERCE_SPAN,
  COMMERCE_SPAN_ATTR,
  buildTransitionSpanAttrs,
  buildSagaSpanAttrs,
  buildGateSpanAttrs,
  buildEvidenceSpanAttrs,
  type CommerceSpanName,
  type CommerceSpanAttribute,
} from './spans'

// ── SLOs + Alerts ─────────────────────────────────────────────────────────
export {
  COMMERCE_SLOS,
  COMMERCE_ALERT_RULES,
  type CommerceSloDefinition,
  type AlertRule,
} from './slo'

// ── Structured Logging ────────────────────────────────────────────────────
export {
  logTransition,
  logSagaExecution,
  logGovernanceGate,
  logOrgMismatch,
  logEvidencePack,
  logAuditTrail,
  type CommerceLogEntry,
  type CommerceLogContext,
  type LogLevel,
} from './logging'

// ── Health Checks ─────────────────────────────────────────────────────────
export {
  COMMERCE_HEALTH_CHECKS,
  buildHealthResult,
  aggregateHealth,
  type HealthCheck,
  type HealthCheckResult,
  type HealthStatus,
} from './health'
