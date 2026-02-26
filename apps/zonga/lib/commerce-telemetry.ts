/**
 * Commerce observability — Zonga.
 *
 * Wires @nzila/commerce-observability for creator payouts,
 * content-asset lifecycle, and revenue event telemetry.
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
