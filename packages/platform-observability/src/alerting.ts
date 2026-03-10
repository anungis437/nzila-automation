/**
 * @nzila/platform-observability — Alerting Model
 *
 * Defines alert categories, severity levels, and alert rule definitions
 * for NzilaOS operational monitoring.
 *
 * @module @nzila/platform-observability/alerting
 */

import { createLogger } from './logger'

const logger = createLogger({ org_id: 'platform' })

// ── Alert Categories ─────────────────────────────────────────────────────

export type AlertCategory =
  | 'service_downtime'
  | 'latency_spike'
  | 'integration_failure'
  | 'queue_backlog'
  | 'job_failure_burst'
  | 'policy_violation_spike'
  | 'missing_audit_logs'
  | 'sync_lag'
  | 'ai_safety_flag'
  | 'error_budget_burn'
  | 'health_degraded'
  | 'circuit_breaker_open'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface AlertRule {
  readonly id: string
  readonly category: AlertCategory
  readonly severity: AlertSeverity
  readonly name: string
  readonly description: string
  readonly metric: string
  readonly condition: string
  readonly thresholdValue: number
  readonly windowMinutes: number
  readonly actions: readonly AlertAction[]
}

export type AlertActionType = 'log' | 'webhook' | 'pagerduty' | 'slack' | 'email'

export interface AlertAction {
  readonly type: AlertActionType
  readonly target?: string
}

// ── Alert Event ──────────────────────────────────────────────────────────

export interface AlertEvent {
  readonly ruleId: string
  readonly category: AlertCategory
  readonly severity: AlertSeverity
  readonly message: string
  readonly currentValue: number
  readonly threshold: number
  readonly service: string
  readonly timestamp: string
  readonly traceId?: string
  readonly correlationId?: string
  readonly metadata: Record<string, unknown>
}

// ── Default Alert Rules ──────────────────────────────────────────────────

export const PLATFORM_ALERT_RULES: readonly AlertRule[] = [
  {
    id: 'alert-service-down',
    category: 'service_downtime',
    severity: 'critical',
    name: 'Service Downtime',
    description: 'Health check reports service as down',
    metric: 'health_status',
    condition: 'status == down',
    thresholdValue: 1,
    windowMinutes: 1,
    actions: [{ type: 'log' }, { type: 'slack' }],
  },
  {
    id: 'alert-latency-p95',
    category: 'latency_spike',
    severity: 'warning',
    name: 'API Latency Spike',
    description: 'p95 API latency exceeds 400ms',
    metric: 'api_request_latency_ms_p95',
    condition: 'p95 > threshold',
    thresholdValue: 400,
    windowMinutes: 5,
    actions: [{ type: 'log' }],
  },
  {
    id: 'alert-integration-failure-rate',
    category: 'integration_failure',
    severity: 'warning',
    name: 'Integration Failure Rate',
    description: 'Integration failure rate exceeds 5%',
    metric: 'integration_api_failure_rate_pct',
    condition: 'rate > threshold',
    thresholdValue: 5,
    windowMinutes: 15,
    actions: [{ type: 'log' }],
  },
  {
    id: 'alert-queue-backlog',
    category: 'queue_backlog',
    severity: 'warning',
    name: 'Workflow Queue Backlog',
    description: 'Workflow queue depth exceeds threshold',
    metric: 'workflow_queue_depth',
    condition: 'depth > threshold',
    thresholdValue: 100,
    windowMinutes: 5,
    actions: [{ type: 'log' }],
  },
  {
    id: 'alert-job-failure-burst',
    category: 'job_failure_burst',
    severity: 'critical',
    name: 'Job Failure Burst',
    description: 'More than 10 job failures in 5 minutes',
    metric: 'workflow_failures_total',
    condition: 'count > threshold in window',
    thresholdValue: 10,
    windowMinutes: 5,
    actions: [{ type: 'log' }, { type: 'slack' }],
  },
  {
    id: 'alert-policy-violation-spike',
    category: 'policy_violation_spike',
    severity: 'warning',
    name: 'Policy Violation Spike',
    description: 'Policy violations exceed normal rate',
    metric: 'governance_policy_violations_total',
    condition: 'count > threshold in window',
    thresholdValue: 20,
    windowMinutes: 15,
    actions: [{ type: 'log' }],
  },
  {
    id: 'alert-sync-lag',
    category: 'sync_lag',
    severity: 'warning',
    name: 'Data Fabric Sync Lag',
    description: 'Sync lag exceeds 5 minutes',
    metric: 'data_fabric_sync_lag_ms',
    condition: 'lag > threshold',
    thresholdValue: 300_000,
    windowMinutes: 5,
    actions: [{ type: 'log' }],
  },
  {
    id: 'alert-ai-safety',
    category: 'ai_safety_flag',
    severity: 'critical',
    name: 'AI Safety Flag',
    description: 'Unsafe AI output detected',
    metric: 'ai_unsafe_output_flags_total',
    condition: 'count > 0 in window',
    thresholdValue: 1,
    windowMinutes: 1,
    actions: [{ type: 'log' }, { type: 'slack' }],
  },
  {
    id: 'alert-error-budget-burn',
    category: 'error_budget_burn',
    severity: 'warning',
    name: 'Error Budget Burn Rate',
    description: 'Error budget consumed exceeds 80%',
    metric: 'error_budget_consumed_pct',
    condition: 'consumed > threshold',
    thresholdValue: 80,
    windowMinutes: 60,
    actions: [{ type: 'log' }],
  },
  {
    id: 'alert-circuit-breaker-open',
    category: 'circuit_breaker_open',
    severity: 'warning',
    name: 'Circuit Breaker Open',
    description: 'Integration circuit breaker has opened',
    metric: 'integration_circuit_state',
    condition: 'state == open',
    thresholdValue: 1,
    windowMinutes: 1,
    actions: [{ type: 'log' }],
  },
]

// ── Alert Evaluator ──────────────────────────────────────────────────────

export type AlertSink = (event: AlertEvent) => void

function defaultAlertSink(event: AlertEvent): void {
  const prefix = event.severity === 'critical' ? '🚨' : event.severity === 'warning' ? '⚠️' : 'ℹ️'
  logger.emit(
    event.severity === 'critical' ? 'critical' : event.severity === 'warning' ? 'warn' : 'info',
    `alert.fired`,
    {
      ruleId: event.ruleId,
      category: event.category,
      message: event.message,
      currentValue: event.currentValue,
      threshold: event.threshold,
      service: event.service,
    },
  )
}

/**
 * Fire an alert event. Logs by default; can be extended with webhooks.
 */
export function fireAlert(
  rule: AlertRule,
  service: string,
  currentValue: number,
  metadata: Record<string, unknown> = {},
  sink: AlertSink = defaultAlertSink,
): AlertEvent {
  const event: AlertEvent = {
    ruleId: rule.id,
    category: rule.category,
    severity: rule.severity,
    message: `${rule.name}: ${rule.description} (current: ${currentValue}, threshold: ${rule.thresholdValue})`,
    currentValue,
    threshold: rule.thresholdValue,
    service,
    timestamp: new Date().toISOString(),
    metadata,
  }
  sink(event)
  return event
}
