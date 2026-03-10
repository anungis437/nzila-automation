import { describe, it, expect, beforeEach } from 'vitest'
import {
  requestTelemetry,
  workflowTelemetry,
  integrationTelemetry,
  aiRunTelemetry,
  governanceTelemetry,
  dataFabricTelemetry,
  requestContextMiddleware,
  apiRequestCount,
  apiErrorRate,
  workflowRuns,
  workflowFailures,
  integrationWebhookVolume,
  aiReasoningRuns,
  govPolicyViolations,
  dataFabricIngestionRate,
} from '../telemetry-contracts'

describe('telemetry-contracts', () => {
  beforeEach(() => {
    apiRequestCount.reset()
    apiErrorRate.reset()
    workflowRuns.reset()
    workflowFailures.reset()
    integrationWebhookVolume.reset()
    aiReasoningRuns.reset()
    govPolicyViolations.reset()
    dataFabricIngestionRate.reset()
  })

  describe('requestTelemetry', () => {
    it('increments request count on received', () => {
      const tel = requestTelemetry({ service: 'console', method: 'GET', path: '/api/test' })
      tel.received()
      expect(apiRequestCount.get()).toBe(1)
    })

    it('increments error count on 5xx response', () => {
      const tel = requestTelemetry({ service: 'console', method: 'POST', path: '/api/test' })
      tel.received()
      tel.handlerCompleted(500)
      expect(apiErrorRate.get()).toBe(1)
    })

    it('does not increment error count on 2xx response', () => {
      const tel = requestTelemetry({ service: 'console', method: 'GET', path: '/api/test' })
      tel.received()
      tel.handlerCompleted(200)
      expect(apiErrorRate.get()).toBe(0)
    })
  })

  describe('workflowTelemetry', () => {
    it('tracks workflow lifecycle', () => {
      const tel = workflowTelemetry('wf-1', 'procurement')
      tel.registered()
      tel.jobQueued('job-1')
      tel.jobStarted('job-1')
      expect(workflowRuns.get()).toBe(1)

      tel.stepCompleted('job-1', 'validate', 0)
      tel.jobSucceeded('job-1')
      expect(workflowFailures.get()).toBe(0)
    })

    it('tracks workflow failure', () => {
      const tel = workflowTelemetry('wf-2', 'onboarding')
      tel.jobStarted('job-2')
      tel.jobFailed('job-2', 'timeout')
      expect(workflowFailures.get()).toBe(1)
    })
  })

  describe('integrationTelemetry', () => {
    it('tracks webhook reception', () => {
      const tel = integrationTelemetry('hubspot', 'crm')
      tel.webhookReceived('contact.created')
      expect(integrationWebhookVolume.get()).toBe(1)
    })

    it('tracks sync completion', () => {
      const tel = integrationTelemetry('stripe', 'webhooks')
      tel.syncCompleted(true)
      // no error, just logs
    })
  })

  describe('aiRunTelemetry', () => {
    it('tracks AI reasoning lifecycle', () => {
      const tel = aiRunTelemetry('run-1', 'procurement-analysis')
      tel.contextBuilt(5)
      tel.retrievalPerformed(10)
      tel.modelInvoked('gpt-4o')
      expect(aiReasoningRuns.get()).toBe(1)

      tel.citationsAttached(3, 85.0)
      tel.policyChecked(true, 0)
      tel.resultPersisted()
    })

    it('flags unsafe output', () => {
      const tel = aiRunTelemetry('run-2', 'risk-assessment')
      tel.modelInvoked('gpt-4o')
      tel.unsafeOutputDetected('PII detected in output')
    })
  })

  describe('governanceTelemetry', () => {
    it('tracks policy evaluation', () => {
      const tel = governanceTelemetry('org-1')
      tel.policyEvaluated('policy-1', false)
      expect(govPolicyViolations.get()).toBe(1)
    })

    it('tracks approval lifecycle', () => {
      const tel = governanceTelemetry('org-1')
      tel.approvalRequested('appr-1', 'user-1')
      tel.approvalGranted('appr-1', 'admin-1')
    })
  })

  describe('dataFabricTelemetry', () => {
    it('tracks data ingestion', () => {
      const tel = dataFabricTelemetry('hubspot')
      tel.recordIngested('contact')
      expect(dataFabricIngestionRate.get()).toBe(1)
    })

    it('tracks conflict detection', () => {
      const tel = dataFabricTelemetry('qbo')
      tel.conflictDetected('entity-1', 'amount')
    })
  })

  describe('requestContextMiddleware', () => {
    it('extracts context from headers', () => {
      const mw = requestContextMiddleware('console')
      const ctx = mw.extractContext({
        'x-request-id': 'req-123',
        'x-org-id': 'org-456',
        'x-trace-id': 'trace-789',
      })

      expect(ctx.requestId).toBe('req-123')
      expect(ctx.tenantId).toBe('org-456')
      expect(ctx.traceId).toBe('trace-789')
      expect(ctx.service).toBe('console')
    })

    it('generates request ID when missing', () => {
      const mw = requestContextMiddleware('partners')
      const ctx = mw.extractContext({})
      expect(ctx.requestId).toBeTruthy()
      expect(ctx.service).toBe('partners')
    })
  })
})
