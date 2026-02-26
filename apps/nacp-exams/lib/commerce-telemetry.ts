/**
 * Commerce observability — NACP Exams.
 *
 * Wires @nzila/commerce-observability for exam session lifecycle,
 * candidate registration, and submission pipeline telemetry.
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
