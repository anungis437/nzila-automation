/**
 * Commerce observability — Partners app.
 *
 * Wires @nzila/commerce-observability for partner deal/commission telemetry:
 * structured logging, org mismatch detection, and health checks.
 */
export {
  logTransition,
  logOrgMismatch,
  logAuditTrail,
  buildTransitionSpanAttrs,
  COMMERCE_SPAN,
  COMMERCE_METRIC,
  commerceMetrics,
  COMMERCE_HEALTH_CHECKS,
  buildHealthResult,
  aggregateHealth,
} from '@nzila/commerce-observability'
