/**
 * @nzila/platform-observability — Telemetry Contracts
 *
 * Standardized telemetry primitives for all NzilaOS applications and packages.
 * These contracts enforce consistent observability across the platform.
 *
 * Usage:
 *   import { requestTelemetry, workflowTelemetry, integrationTelemetry } from '@nzila/platform-observability'
 *
 * @module @nzila/platform-observability/telemetry-contracts
 */

import { Span, trace } from './span'
import { Counter, Histogram, globalRegistry } from './metrics'
import { createLogger, type StructuredLogger } from './logger'
import type { CorrelationContext } from './types'

// ── Shared metric vocabulary ───────────────────────────────────────────────

// API metrics
export const apiRequestCount = globalRegistry.createCounter('api_request_count', 'Total API requests')
export const apiRequestLatency = globalRegistry.createHistogram('api_request_latency_ms', 'API request latency in ms')
export const apiErrorRate = globalRegistry.createCounter('api_error_count', 'Total API errors')
export const apiAuthFailures = globalRegistry.createCounter('api_auth_failures_total', 'Total authentication failures')

// Workflow metrics
export const workflowRuns = globalRegistry.createCounter('workflow_runs_total', 'Total workflow runs')
export const workflowFailures = globalRegistry.createCounter('workflow_failures_total', 'Total workflow failures')
export const workflowRetryCount = globalRegistry.createCounter('workflow_retry_count_total', 'Total workflow retries')
export const workflowRunDuration = globalRegistry.createHistogram('workflow_run_duration_ms', 'Workflow run duration in ms')
export const workflowQueueDepth = globalRegistry.createGauge('workflow_queue_depth', 'Current workflow queue depth')

// Integration metrics
export const integrationWebhookVolume = globalRegistry.createCounter('integration_webhook_volume_total', 'Total webhooks received')
export const integrationApiFailures = globalRegistry.createCounter('integration_api_failure_count', 'Total integration API failures')
export const integrationRetryAttempts = globalRegistry.createCounter('integration_retry_attempts_total', 'Total integration retry attempts')
export const integrationSyncDuration = globalRegistry.createHistogram('integration_sync_duration_ms', 'Integration sync duration in ms')
export const integrationProviderLatency = globalRegistry.createHistogram('integration_provider_latency_ms', 'Provider response latency in ms')

// Data fabric metrics
export const dataFabricIngestionRate = globalRegistry.createCounter('data_fabric_ingestion_total', 'Total records ingested')
export const dataFabricMappingConflicts = globalRegistry.createCounter('data_fabric_mapping_conflicts_total', 'Total mapping conflicts')
export const dataFabricSyncLag = globalRegistry.createGauge('data_fabric_sync_lag_ms', 'Current sync lag in ms')
export const dataFabricReconciliationFailures = globalRegistry.createCounter('data_fabric_reconciliation_failures_total', 'Total reconciliation failures')

// AI metrics
export const aiReasoningRuns = globalRegistry.createCounter('ai_reasoning_runs_total', 'Total AI reasoning runs')
export const aiReasoningLatency = globalRegistry.createHistogram('ai_reasoning_latency_ms', 'AI reasoning latency in ms')
export const aiCitationCoverage = globalRegistry.createGauge('ai_citation_coverage_pct', 'Citation coverage percentage')
export const aiApprovalRequired = globalRegistry.createCounter('ai_approval_required_total', 'Total AI runs requiring approval')
export const aiUnsafeOutputFlags = globalRegistry.createCounter('ai_unsafe_output_flags_total', 'Total unsafe output flags')

// Governance metrics
export const govPolicyViolations = globalRegistry.createCounter('governance_policy_violations_total', 'Total policy violations')
export const govApprovalBacklog = globalRegistry.createGauge('governance_approval_backlog', 'Current approval backlog count')
export const govAuditEvents = globalRegistry.createCounter('governance_audit_events_total', 'Total audit events')
export const govSensitiveActionFreq = globalRegistry.createCounter('governance_sensitive_actions_total', 'Total sensitive actions')

// ── Telemetry context type ──────────────────────────────────────────────

export interface TelemetryContext {
  readonly requestId: string
  readonly correlationId: string
  readonly traceId: string
  readonly spanId: string
  readonly actorId?: string
  readonly orgId?: string
  readonly workflowId?: string
  readonly jobId?: string
  readonly integrationProvider?: string
  readonly environment: string
  readonly service: string
}

// ── Request lifecycle telemetry ────────────────────────────────────────

const requestLogger = createLogger({ org_id: 'platform' })

export interface RequestTelemetryOptions {
  service: string
  method: string
  path: string
  correlation?: CorrelationContext
}

/**
 * Instrument an API request lifecycle.
 * Emits structured logs and metrics for each phase:
 * request_received → auth_checked → validation_passed → handler_started → handler_completed → response_sent
 */
export function requestTelemetry(opts: RequestTelemetryOptions) {
  const logger = createLogger({
    org_id: 'platform',
    request_id: opts.correlation?.requestId,
    correlation_id: opts.correlation?.traceId,
  })
  const startMs = performance.now()

  return {
    received() {
      apiRequestCount.inc()
      logger.info('request_received', { method: opts.method, path: opts.path, service: opts.service })
    },
    authChecked(success: boolean) {
      if (!success) apiAuthFailures.inc()
      logger.info('auth_checked', { success, method: opts.method, path: opts.path })
    },
    validationPassed() {
      logger.debug('validation_passed', { method: opts.method, path: opts.path })
    },
    handlerStarted() {
      logger.debug('handler_started', { method: opts.method, path: opts.path })
    },
    handlerCompleted(statusCode: number) {
      const durationMs = Math.round(performance.now() - startMs)
      if (statusCode >= 500) apiErrorRate.inc()
      apiRequestLatency.observe(durationMs)
      logger.info('handler_completed', { method: opts.method, path: opts.path, statusCode, durationMs })
    },
    responseSent(statusCode: number) {
      const durationMs = Math.round(performance.now() - startMs)
      logger.info('response_sent', { method: opts.method, path: opts.path, statusCode, durationMs, service: opts.service })
    },
  }
}

// ── Workflow telemetry ─────────────────────────────────────────────────

/**
 * Instrument a workflow/orchestrator lifecycle.
 */
export function workflowTelemetry(workflowId: string, workflowName: string) {
  const logger = createLogger({ org_id: 'platform' })
  const startMs = performance.now()

  return {
    registered() {
      logger.info('workflow_registered', { workflowId, workflowName })
    },
    jobQueued(jobId: string) {
      workflowQueueDepth.inc()
      logger.info('job_queued', { workflowId, workflowName, jobId })
    },
    jobStarted(jobId: string) {
      workflowRuns.inc()
      workflowQueueDepth.dec()
      logger.info('job_started', { workflowId, workflowName, jobId })
    },
    stepCompleted(jobId: string, stepName: string, stepIndex: number) {
      logger.info('step_completed', { workflowId, workflowName, jobId, stepName, stepIndex })
    },
    retryTriggered(jobId: string, attempt: number, reason: string) {
      workflowRetryCount.inc()
      logger.warn('retry_triggered', { workflowId, workflowName, jobId, attempt, reason })
    },
    jobFailed(jobId: string, error: string) {
      workflowFailures.inc()
      const durationMs = Math.round(performance.now() - startMs)
      logger.error('job_failed', { workflowId, workflowName, jobId, error, durationMs })
    },
    jobSucceeded(jobId: string) {
      const durationMs = Math.round(performance.now() - startMs)
      workflowRunDuration.observe(durationMs)
      logger.info('job_succeeded', { workflowId, workflowName, jobId, durationMs })
    },
    resultPersisted(jobId: string) {
      logger.info('result_persisted', { workflowId, workflowName, jobId })
    },
  }
}

// ── Integration telemetry ─────────────────────────────────────────────

/**
 * Instrument an integration adapter lifecycle.
 */
export function integrationTelemetry(provider: string, channel: string) {
  const logger = createLogger({ org_id: 'platform' })
  const startMs = performance.now()

  return {
    webhookReceived(eventType: string) {
      integrationWebhookVolume.inc()
      logger.info('webhook_received', { provider, channel, eventType })
    },
    payloadValidated(valid: boolean) {
      logger.info('payload_validated', { provider, channel, valid })
    },
    adapterExecuted() {
      logger.debug('adapter_executed', { provider, channel })
    },
    providerRequest() {
      logger.debug('provider_request', { provider, channel })
    },
    retryInvoked(attempt: number, reason: string) {
      integrationRetryAttempts.inc()
      logger.warn('retry_invoked', { provider, channel, attempt, reason })
    },
    providerResponse(statusCode: number, latencyMs: number) {
      integrationProviderLatency.observe(latencyMs)
      if (statusCode >= 400) integrationApiFailures.inc()
      logger.info('provider_response', { provider, channel, statusCode, latencyMs })
    },
    mappingApplied(mappingId: string) {
      logger.debug('mapping_applied', { provider, channel, mappingId })
    },
    auditEmitted(eventName: string) {
      logger.info('audit_emitted', { provider, channel, eventName })
    },
    syncCompleted(success: boolean) {
      const durationMs = Math.round(performance.now() - startMs)
      integrationSyncDuration.observe(durationMs)
      logger.info('sync_completed', { provider, channel, success, durationMs })
    },
  }
}

// ── AI reasoning telemetry ────────────────────────────────────────────

/**
 * Instrument an AI reasoning run lifecycle.
 */
export function aiRunTelemetry(runId: string, profileKey: string) {
  const logger = createLogger({ org_id: 'platform' })
  const startMs = performance.now()

  return {
    contextBuilt(sourceCount: number) {
      logger.info('context_built', { runId, profileKey, sourceCount })
    },
    retrievalPerformed(resultCount: number) {
      logger.info('retrieval_performed', { runId, profileKey, resultCount })
    },
    modelInvoked(model: string) {
      aiReasoningRuns.inc()
      logger.info('model_invoked', { runId, profileKey, model })
    },
    citationsAttached(citationCount: number, coveragePct: number) {
      aiCitationCoverage.set(coveragePct)
      logger.info('citations_attached', { runId, profileKey, citationCount, coveragePct })
    },
    policyChecked(passed: boolean, violations: number) {
      if (!passed) govPolicyViolations.inc()
      logger.info('policy_checked', { runId, profileKey, passed, violations })
    },
    approvalRequired(reason: string) {
      aiApprovalRequired.inc()
      logger.warn('approval_required', { runId, profileKey, reason })
    },
    unsafeOutputDetected(reason: string) {
      aiUnsafeOutputFlags.inc()
      logger.error('unsafe_output_detected', { runId, profileKey, reason })
    },
    resultPersisted() {
      const durationMs = Math.round(performance.now() - startMs)
      aiReasoningLatency.observe(durationMs)
      logger.info('result_persisted', { runId, profileKey, durationMs })
    },
  }
}

// ── Governance telemetry ──────────────────────────────────────────────

/**
 * Instrument governance / policy evaluation lifecycle.
 */
export function governanceTelemetry(orgId: string) {
  const logger = createLogger({ org_id: orgId })

  return {
    policyEvaluated(policyId: string, passed: boolean) {
      govAuditEvents.inc()
      if (!passed) govPolicyViolations.inc()
      logger.info('policy_evaluated', { policyId, passed })
    },
    decisionRecorded(decisionId: string, outcome: string) {
      govAuditEvents.inc()
      logger.info('decision_recorded', { decisionId, outcome })
    },
    approvalRequested(approvalId: string, requester: string) {
      govApprovalBacklog.inc()
      logger.info('approval_requested', { approvalId, requester })
    },
    approvalGranted(approvalId: string, approver: string) {
      govApprovalBacklog.dec()
      logger.info('approval_granted', { approvalId, approver })
    },
    approvalDenied(approvalId: string, approver: string, reason: string) {
      govApprovalBacklog.dec()
      logger.info('approval_denied', { approvalId, approver, reason })
    },
    auditEmitted(eventName: string, metadata: Record<string, unknown> = {}) {
      govAuditEvents.inc()
      logger.info('audit_emitted', { eventName, ...metadata })
    },
    sensitiveAction(action: string, actorId: string) {
      govSensitiveActionFreq.inc()
      logger.warn('sensitive_action', { action, actorId })
    },
  }
}

// ── Data fabric telemetry ─────────────────────────────────────────────

/**
 * Instrument data fabric operations.
 */
export function dataFabricTelemetry(sourceSystem: string) {
  const logger = createLogger({ org_id: 'platform' })

  return {
    recordIngested(entityType: string) {
      dataFabricIngestionRate.inc()
      logger.info('record_ingested', { sourceSystem, entityType })
    },
    mappingApplied(ruleId: string, entityType: string) {
      logger.info('mapping_applied', { sourceSystem, ruleId, entityType })
    },
    reconciliationPerformed(recordId: string, matched: boolean) {
      if (!matched) dataFabricReconciliationFailures.inc()
      logger.info('reconciliation_performed', { sourceSystem, recordId, matched })
    },
    conflictDetected(recordId: string, field: string) {
      dataFabricMappingConflicts.inc()
      logger.warn('conflict_detected', { sourceSystem, recordId, field })
    },
    lineageUpdated(recordId: string) {
      logger.info('lineage_updated', { sourceSystem, recordId })
    },
    syncLagUpdated(lagMs: number) {
      dataFabricSyncLag.set(lagMs)
      logger.info('sync_lag_updated', { sourceSystem, lagMs })
    },
  }
}

// ── Request context middleware ─────────────────────────────────────────

/**
 * Creates standard request context middleware for Fastify or Express-like frameworks.
 * Attaches correlation IDs, emits request/response telemetry, and measures latency.
 */
export function requestContextMiddleware(service: string) {
  return {
    /** Extract fields for structured logging from request headers */
    extractContext(headers: Record<string, string | string[] | undefined>): TelemetryContext {
      const getHeader = (name: string): string | undefined => {
        const val = headers[name]
        return Array.isArray(val) ? val[0] : val
      }

      return {
        requestId: getHeader('x-request-id') ?? crypto.randomUUID(),
        correlationId: getHeader('x-correlation-id') ?? crypto.randomUUID(),
        traceId: getHeader('x-trace-id') ?? '',
        spanId: getHeader('x-span-id') ?? '',
        actorId: getHeader('x-actor-id'),
        orgId: getHeader('x-org-id'),
        environment: process.env.NODE_ENV ?? 'development',
        service,
      }
    },
  }
}
