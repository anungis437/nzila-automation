import { describe, it, expect, beforeEach } from 'vitest'
import {
  recordAuditEvent,
  getAuditTimeline,
  clearAuditTimeline,
} from '../src/auditTimeline'

describe('auditTimeline', () => {
  beforeEach(() => {
    clearAuditTimeline()
  })

  it('records an audit event with unique ID and timestamp', () => {
    const entry = recordAuditEvent({
      eventType: 'policy_evaluated',
      actor: 'user:admin',
      orgId: 'org-1',
      app: 'shop-quoter',
      policyResult: 'pass',
      commitHash: 'abc123',
    })

    expect(entry.id).toBeTruthy()
    expect(entry.timestamp).toBeTruthy()
    expect(entry.eventType).toBe('policy_evaluated')
    expect(entry.policyResult).toBe('pass')
  })

  it('retrieves timeline filtered by app', () => {
    recordAuditEvent({
      eventType: 'policy_evaluated',
      actor: 'user:admin',
      orgId: 'org-1',
      app: 'shop-quoter',
      policyResult: 'pass',
      commitHash: 'abc123',
    })
    recordAuditEvent({
      eventType: 'compliance_check',
      actor: 'system',
      orgId: 'org-1',
      app: 'cfo',
      policyResult: 'fail',
      commitHash: 'abc123',
    })

    const results = getAuditTimeline({ app: 'cfo' })
    expect(results).toHaveLength(1)
    expect(results[0].app).toBe('cfo')
  })

  it('sorts timeline newest first', () => {
    recordAuditEvent({
      eventType: 'policy_evaluated',
      actor: 'user:a',
      orgId: 'org-1',
      app: 'web',
      policyResult: 'pass',
      commitHash: 'a1',
    })
    recordAuditEvent({
      eventType: 'compliance_check',
      actor: 'user:b',
      orgId: 'org-1',
      app: 'web',
      policyResult: 'warn',
      commitHash: 'a2',
    })

    const results = getAuditTimeline({ app: 'web' })
    expect(new Date(results[0].timestamp).getTime()).toBeGreaterThanOrEqual(
      new Date(results[1].timestamp).getTime(),
    )
  })

  it('clears timeline', () => {
    recordAuditEvent({
      eventType: 'drift_detected',
      actor: 'ci',
      orgId: 'org-1',
      app: 'partners',
      policyResult: 'fail',
      commitHash: 'x1',
    })
    clearAuditTimeline()
    expect(getAuditTimeline()).toHaveLength(0)
  })
})
