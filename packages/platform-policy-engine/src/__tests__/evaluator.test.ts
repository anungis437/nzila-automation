/**
 * @nzila/platform-policy-engine — Evaluator Tests
 */
import { describe, it, expect } from 'vitest'
import { evaluatePolicy, evaluatePolicies, isBlocked, requiresApproval } from '../evaluator'
import type { PolicyDefinition, PolicyEvaluationInput } from '../types'

const basePolicy: PolicyDefinition = {
  id: 'test-policy',
  name: 'Test Policy',
  version: '1.0',
  type: 'approval',
  description: 'Test policy',
  enabled: true,
  scope: { environments: ['prod'] },
  rules: [
    {
      id: 'high-value',
      description: 'Block high-value actions',
      conditions: [
        { field: 'context.amount', operator: 'gt', value: 10000 },
      ],
      effect: 'deny',
      severity: 'critical',
    },
    {
      id: 'medium-value',
      description: 'Require approval for medium values',
      conditions: [
        { field: 'context.amount', operator: 'gt', value: 1000 },
        { field: 'context.amount', operator: 'lte', value: 10000 },
      ],
      effect: 'require_approval',
      severity: 'warning',
      requireApprovers: 1,
      approverRoles: ['finance_admin'],
    },
  ],
  metadata: {},
}

const baseInput: PolicyEvaluationInput = {
  policyId: 'test-policy',
  actor: { userId: 'user-1', roles: ['member'] },
  action: 'payout.create',
  resource: '/api/finance/payouts',
  context: { amount: 500 },
  orgId: '00000000-0000-0000-0000-000000000001',
  environment: 'prod',
}

describe('evaluatePolicy', () => {
  it('passes when no conditions are met', () => {
    const result = evaluatePolicy(basePolicy, baseInput)
    expect(result.overallResult).toBe('pass')
    expect(result.decisions).toHaveLength(0)
  })

  it('denies when high-value condition is met', () => {
    const input = { ...baseInput, context: { amount: 50000 } }
    const result = evaluatePolicy(basePolicy, input)
    expect(result.overallResult).toBe('fail')
    expect(result.decisions).toHaveLength(1)
    expect(result.decisions[0].ruleId).toBe('high-value')
  })

  it('requires approval for medium values', () => {
    const input = { ...baseInput, context: { amount: 5000 } }
    const result = evaluatePolicy(basePolicy, input)
    expect(result.overallResult).toBe('require_approval')
    expect(result.decisions[0].requireApprovers).toBe(1)
  })

  it('skips policy when environment is out of scope', () => {
    const input = { ...baseInput, environment: 'dev' }
    const result = evaluatePolicy(basePolicy, input)
    expect(result.overallResult).toBe('pass')
    expect(result.decisions).toHaveLength(0)
  })
})

describe('evaluatePolicies', () => {
  it('evaluates multiple policies', () => {
    const policies = [basePolicy, { ...basePolicy, id: 'policy-2' }]
    const input = { ...baseInput, context: { amount: 50000 } }
    const results = evaluatePolicies(policies, input)
    expect(results).toHaveLength(2)
    expect(results.every((r) => r.overallResult === 'fail')).toBe(true)
  })
})

describe('isBlocked / requiresApproval', () => {
  it('detects blocked actions', () => {
    const input = { ...baseInput, context: { amount: 50000 } }
    const results = evaluatePolicies([basePolicy], input)
    expect(isBlocked(results)).toBe(true)
    expect(requiresApproval(results)).toBe(false)
  })

  it('detects approval-required actions', () => {
    const input = { ...baseInput, context: { amount: 5000 } }
    const results = evaluatePolicies([basePolicy], input)
    expect(isBlocked(results)).toBe(false)
    expect(requiresApproval(results)).toBe(true)
  })
})
