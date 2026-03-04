/**
 * @nzila/platform-policy-engine — Evaluator
 *
 * Runtime policy evaluation engine.
 * Evaluates inputs against loaded policies, producing decisions with audit trails.
 *
 * @module @nzila/platform-policy-engine/evaluator
 */
import { randomUUID } from 'node:crypto'
import { createLogger } from '@nzila/os-core/telemetry'
import type {
  PolicyCondition,
  PolicyDecision,
  PolicyDefinition,
  PolicyEvaluationInput,
  PolicyEvaluationOutput,
  PolicyRule,
  EvaluationResult,
} from './types'

const logger = createLogger('policy-evaluator')

/**
 * Evaluate a single policy against the given input.
 */
export function evaluatePolicy(
  policy: PolicyDefinition,
  input: PolicyEvaluationInput,
): PolicyEvaluationOutput {
  const start = performance.now()
  const evaluationId = randomUUID()
  const decisions: PolicyDecision[] = []

  // Check scope applicability
  if (!isScopeApplicable(policy, input)) {
    return {
      evaluationId,
      policyId: policy.id,
      input,
      decisions: [],
      overallResult: 'pass',
      evaluatedAt: new Date().toISOString(),
      durationMs: performance.now() - start,
    }
  }

  for (const rule of policy.rules) {
    const conditionsMet = rule.conditions.every((c) =>
      evaluateCondition(c, input),
    )

    if (conditionsMet) {
      decisions.push({
        policyId: policy.id,
        ruleId: rule.id,
        result: effectToResult(rule.effect),
        effect: rule.effect,
        severity: rule.severity,
        reason: rule.description,
        requireApprovers: rule.requireApprovers,
        approverRoles: rule.approverRoles,
      })
    }
  }

  const overallResult = resolveOverallResult(decisions)
  const durationMs = performance.now() - start

  logger.info('Policy evaluated', {
    evaluationId,
    policyId: policy.id,
    overallResult,
    decisionCount: decisions.length,
    durationMs,
  })

  return {
    evaluationId,
    policyId: policy.id,
    input,
    decisions,
    overallResult,
    evaluatedAt: new Date().toISOString(),
    durationMs,
  }
}

/**
 * Evaluate all applicable policies against the given input.
 */
export function evaluatePolicies(
  policies: readonly PolicyDefinition[],
  input: PolicyEvaluationInput,
): PolicyEvaluationOutput[] {
  return policies
    .filter((p) => p.enabled)
    .map((p) => evaluatePolicy(p, input))
}

/**
 * Check whether any evaluation blocks the action.
 */
export function isBlocked(outputs: readonly PolicyEvaluationOutput[]): boolean {
  return outputs.some((o) => o.overallResult === 'fail')
}

/**
 * Check whether any evaluation requires approval.
 */
export function requiresApproval(outputs: readonly PolicyEvaluationOutput[]): boolean {
  return outputs.some((o) => o.overallResult === 'require_approval')
}

// ── Condition Evaluator ─────────────────────────────────────────────────────

function evaluateCondition(
  condition: PolicyCondition,
  input: PolicyEvaluationInput,
): boolean {
  const fieldValue = resolveField(condition.field, input)

  switch (condition.operator) {
    case 'eq':
      return fieldValue === condition.value
    case 'neq':
      return fieldValue !== condition.value
    case 'gt':
      return typeof fieldValue === 'number' && fieldValue > (condition.value as number)
    case 'gte':
      return typeof fieldValue === 'number' && fieldValue >= (condition.value as number)
    case 'lt':
      return typeof fieldValue === 'number' && fieldValue < (condition.value as number)
    case 'lte':
      return typeof fieldValue === 'number' && fieldValue <= (condition.value as number)
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue)
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue)
    case 'matches':
      return (
        typeof fieldValue === 'string' &&
        typeof condition.value === 'string' &&
        new RegExp(condition.value).test(fieldValue)
      )
    default:
      return false
  }
}

function resolveField(
  field: string,
  input: PolicyEvaluationInput,
): unknown {
  // Support dot-notation: "actor.roles", "context.amount", etc.
  const parts = field.split('.')
  let current: unknown = input

  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function effectToResult(
  effect: PolicyRule['effect'],
): EvaluationResult {
  switch (effect) {
    case 'allow':
      return 'pass'
    case 'deny':
      return 'fail'
    case 'require_approval':
      return 'require_approval'
  }
}

function resolveOverallResult(
  decisions: readonly PolicyDecision[],
): EvaluationResult {
  if (decisions.length === 0) return 'pass'
  if (decisions.some((d) => d.result === 'fail')) return 'fail'
  if (decisions.some((d) => d.result === 'require_approval')) return 'require_approval'
  return 'pass'
}

function isScopeApplicable(
  policy: PolicyDefinition,
  input: PolicyEvaluationInput,
): boolean {
  const { scope } = policy

  if (scope.orgId && scope.orgId !== input.orgId) return false

  if (
    scope.environments &&
    scope.environments.length > 0 &&
    !scope.environments.includes(input.environment)
  ) {
    return false
  }

  if (
    scope.resources &&
    scope.resources.length > 0 &&
    !scope.resources.some((r) => input.resource.startsWith(r))
  ) {
    return false
  }

  return true
}
