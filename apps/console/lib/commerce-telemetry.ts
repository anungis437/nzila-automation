/**
 * Commerce observability — Console app.
 *
 * Wires @nzila/commerce-observability into the console app for structured
 * commerce logging, metrics, health checks, and span instrumentation.
 */
export {
  // Structured logging for commerce lifecycle events
  logTransition,
  logSagaExecution,
  logGovernanceGate,
  logOrgMismatch,
  logEvidencePack,
  logAuditTrail,
  // Span builders for distributed tracing
  buildTransitionSpanAttrs,
  buildSagaSpanAttrs,
  buildGateSpanAttrs,
  buildEvidenceSpanAttrs,
  COMMERCE_SPAN,
  COMMERCE_SPAN_ATTR,
  // Metrics
  COMMERCE_METRIC,
  commerceMetrics,
  // Health
  COMMERCE_HEALTH_CHECKS,
  buildHealthResult,
  aggregateHealth,
} from '@nzila/commerce-observability'
