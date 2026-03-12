/**
 * @nzila/platform-decision-engine — Policy-aware decision filter
 *
 * Evaluates decisions against policy context and environment constraints.
 *
 * @module @nzila/platform-decision-engine/policy
 */
import type { DecisionRecord, PolicyContext } from './types'

/**
 * Evaluate whether a decision can be executed in its environment.
 * Returns an updated PolicyContext with blocking reasons.
 */
export function evaluateDecisionPolicyContext(decision: DecisionRecord): PolicyContext {
  const reasons: string[] = []

  if (decision.environment_context.protected_environment) {
    reasons.push('Protected environment — manual approval required')
  }

  if (decision.severity === 'CRITICAL') {
    reasons.push('Critical severity — escalation required before execution')
  }

  if (decision.required_approvals.length > 0 && (!decision.reviewed_by || decision.reviewed_by.length === 0)) {
    reasons.push(`Pending approvals: ${decision.required_approvals.join(', ')}`)
  }

  if (decision.expires_at && new Date(decision.expires_at) < new Date()) {
    reasons.push('Decision has expired')
  }

  return {
    execution_allowed: reasons.length === 0,
    reasons,
  }
}

/**
 * Filter decisions based on policy — returns only those allowed for execution.
 */
export function filterExecutableDecisions(decisions: readonly DecisionRecord[]): DecisionRecord[] {
  return decisions.filter((d) => {
    const ctx = evaluateDecisionPolicyContext(d)
    return ctx.execution_allowed
  })
}

/**
 * Classify decisions into executable and blocked groups.
 */
export function classifyDecisions(decisions: readonly DecisionRecord[]): {
  executable: DecisionRecord[]
  blocked: Array<{ decision: DecisionRecord; reasons: string[] }>
} {
  const executable: DecisionRecord[] = []
  const blocked: Array<{ decision: DecisionRecord; reasons: string[] }> = []

  for (const d of decisions) {
    const ctx = evaluateDecisionPolicyContext(d)
    if (ctx.execution_allowed) {
      executable.push(d)
    } else {
      blocked.push({ decision: d, reasons: [...ctx.reasons] })
    }
  }

  return { executable, blocked }
}
