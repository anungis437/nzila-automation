/**
 * Commerce observability — CFO app.
 *
 * Wires @nzila/commerce-observability for financial commerce telemetry:
 * invoice/payment lifecycle logging, governance gate spans, and health checks.
 */
export {
  logTransition,
  logSagaExecution,
  logGovernanceGate,
  logOrgMismatch,
  logEvidencePack,
  logAuditTrail,
  buildTransitionSpanAttrs,
  buildGateSpanAttrs,
  COMMERCE_SPAN,
  COMMERCE_METRIC,
  commerceMetrics,
  COMMERCE_HEALTH_CHECKS,
  buildHealthResult,
  aggregateHealth,
} from '@nzila/commerce-observability'
