import { describe, it, expect, beforeEach } from 'vitest'
import { createWorkflow, executeStep } from '../src/workflowRunner'
import { generateRecommendations } from '../src/recommendations'
import { getAuditTimeline, clearAuditTimeline } from '@nzila/platform-governance'

describe('platform-agent-workflows', () => {
  beforeEach(() => {
    clearAuditTimeline()
  })

  describe('workflowRunner', () => {
    it('creates workflow with pending steps', () => {
      const wf = createWorkflow({
        name: 'quote-approval',
        triggerEvent: 'quote_created',
        app: 'shop-quoter',
        orgId: 'org-1',
        steps: [{ name: 'validate' }, { name: 'policy-check' }, { name: 'notify' }],
      })

      expect(wf.id).toBeTruthy()
      expect(wf.status).toBe('pending')
      expect(wf.steps).toHaveLength(3)
      expect(wf.steps.every((s) => s.status === 'pending')).toBe(true)
    })

    it('completes step with policy allow', () => {
      const wf = createWorkflow({
        name: 'test',
        triggerEvent: 'test',
        app: 'cfo',
        orgId: 'org-1',
        steps: [{ name: 'step-1' }],
      })

      const result = executeStep(wf, wf.steps[0].id, {
        policyCheck: { policyId: 'p1', result: 'allow' },
        output: { done: true },
      })

      expect(result.status).toBe('completed')
      expect(result.steps[0].status).toBe('completed')
    })

    it('blocks step when policy denies', () => {
      const wf = createWorkflow({
        name: 'test',
        triggerEvent: 'test',
        app: 'partners',
        orgId: 'org-1',
        steps: [{ name: 'step-1' }, { name: 'step-2' }],
      })

      const result = executeStep(wf, wf.steps[0].id, {
        policyCheck: { policyId: 'p1', result: 'deny' },
      })

      expect(result.status).toBe('blocked')
      expect(result.steps[0].status).toBe('blocked')
    })

    it('blocks step when policy requires approval', () => {
      const wf = createWorkflow({
        name: 'test',
        triggerEvent: 'test',
        app: 'web',
        orgId: 'org-1',
        steps: [{ name: 'step-1' }],
      })

      const result = executeStep(wf, wf.steps[0].id, {
        policyCheck: { policyId: 'p1', result: 'requires_approval' },
      })

      expect(result.status).toBe('blocked')
    })
  })

  describe('recommendations', () => {
    it('generates approval recommendation for blocked step', () => {
      const wf = createWorkflow({
        name: 'test',
        triggerEvent: 'test',
        app: 'cfo',
        orgId: 'org-1',
        steps: [{ name: 'ledger-adjust' }],
      })

      const blocked = executeStep(wf, wf.steps[0].id, {
        policyCheck: { policyId: 'dual-approval', result: 'requires_approval' },
      })

      const recs = generateRecommendations(blocked)
      expect(recs).toHaveLength(1)
      expect(recs[0].priority).toBe('high')
      expect(recs[0].actionable).toBe(true)
    })

    it('generates non-actionable recommendation for denied step', () => {
      const wf = createWorkflow({
        name: 'test',
        triggerEvent: 'test',
        app: 'web',
        orgId: 'org-1',
        steps: [{ name: 'blocked-action' }],
      })

      const denied = executeStep(wf, wf.steps[0].id, {
        policyCheck: { policyId: 'p1', result: 'deny' },
      })

      const recs = generateRecommendations(denied)
      expect(recs).toHaveLength(1)
      expect(recs[0].actionable).toBe(false)
      expect(recs[0].humanReviewRequired).toBe(true)
    })
  })

  describe('audit event emission', () => {
    it('emits workflow_created audit event on createWorkflow', () => {
      createWorkflow({
        name: 'audit-test',
        triggerEvent: 'test',
        app: 'cfo',
        orgId: 'org-1',
        steps: [{ name: 'step-1' }],
      })

      const events = getAuditTimeline({ eventType: 'workflow_created' })
      expect(events).toHaveLength(1)
      expect(events[0].app).toBe('cfo')
    })

    it('emits workflow_step_executed audit event on executeStep', () => {
      const wf = createWorkflow({
        name: 'audit-test',
        triggerEvent: 'test',
        app: 'partners',
        orgId: 'org-1',
        steps: [{ name: 'step-1' }],
      })

      executeStep(wf, wf.steps[0].id, {
        policyCheck: { policyId: 'p1', result: 'allow' },
      })

      const events = getAuditTimeline({ eventType: 'workflow_step_executed' })
      expect(events).toHaveLength(1)
      expect(events[0].policyResult).toBe('pass')
    })

    it('emits recommendation_generated audit event', () => {
      const wf = createWorkflow({
        name: 'audit-test',
        triggerEvent: 'test',
        app: 'cfo',
        orgId: 'org-1',
        steps: [{ name: 'step-1' }],
      })

      const blocked = executeStep(wf, wf.steps[0].id, {
        policyCheck: { policyId: 'p1', result: 'requires_approval' },
      })

      generateRecommendations(blocked)

      const events = getAuditTimeline({ eventType: 'recommendation_generated' })
      expect(events).toHaveLength(1)
      expect(events[0].policyResult).toBe('warn')
    })
  })
})
