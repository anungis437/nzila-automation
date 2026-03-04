/**
 * Policy Enforcement Middleware for sensitive API flows
 *
 * Wraps break-glass, vote, and financial mutation endpoints
 * with policy engine evaluation. Emits audit events on every decision.
 *
 * Usage:
 *   const result = await enforcePolicies({
 *     action: 'break_glass.activate',
 *     resource: '/api/admin/break-glass',
 *     actor: { userId, roles: ['platform_admin'] },
 *     context: { environment: 'production' },
 *     orgId,
 *   })
 *   if (result.blocked) return NextResponse.json({ error: result.reason }, { status: 403 })
 */
import { recordAuditEvent } from '@/lib/audit-db'
import { createLogger } from '@nzila/os-core'
import {
  evaluatePolicies,
  isBlocked,
  requiresApproval,
  type PolicyDefinition,
  type PolicyEvaluationInput,
  type PolicyEvaluationOutput,
  type PolicyActor,
} from '@nzila/platform-policy-engine'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'

const logger = createLogger('policy-enforcement')

// ── Types ─────────────────────────────────────────────────────────────────

export interface EnforcePoliciesInput {
  /** The action being performed (e.g., 'break_glass.activate') */
  action: string
  /** The resource path (e.g., '/api/admin/break-glass') */
  resource: string
  /** The actor performing the action */
  actor: PolicyActor
  /** Additional context for policy evaluation */
  context: Record<string, unknown>
  /** Organization ID */
  orgId: string
  /** Environment (defaults to NODE_ENV) */
  environment?: string
}

export interface EnforcePoliciesResult {
  /** Whether the action is blocked by policy */
  blocked: boolean
  /** Whether the action requires approval */
  needsApproval: boolean
  /** Human-readable reason for block/approval */
  reason: string
  /** All evaluation outputs for audit trail */
  evaluations: readonly PolicyEvaluationOutput[]
  /** Approver roles required (if needsApproval) */
  approverRoles: readonly string[]
  /** Number of approvers required */
  requiredApprovers: number
}

// ── Policy Loading ────────────────────────────────────────────────────────

let _cachedPolicies: PolicyDefinition[] | null = null

function loadAllPolicies(): PolicyDefinition[] {
  if (_cachedPolicies) return _cachedPolicies

  const policiesDir = join(process.cwd(), 'ops', 'policies')
  const allPolicies: PolicyDefinition[] = []

  try {
    const files = readdirSync(policiesDir).filter((f) => f.endsWith('.yml'))
    for (const file of files) {
      try {
        const raw = readFileSync(join(policiesDir, file), 'utf-8')
        const parsed = parseYaml(raw) as { policies?: PolicyDefinition[] }
        if (parsed?.policies) {
          for (const policy of parsed.policies) {
            if (policy.enabled) {
              allPolicies.push(policy)
            }
          }
        }
      } catch (err) {
        logger.error('Failed to load policy file', { file, error: err })
      }
    }
  } catch {
    logger.warn('Policy directory not found — enforcement disabled', { policiesDir })
    return []
  }

  _cachedPolicies = allPolicies
  logger.info('Policies loaded for enforcement', { count: allPolicies.length })
  return allPolicies
}

/**
 * Clear cached policies (for testing or hot reload).
 */
export function clearPolicyCache(): void {
  _cachedPolicies = null
}

// ── Enforcement ───────────────────────────────────────────────────────────

/**
 * Evaluate all applicable policies against the given action context.
 * Records an audit event for every evaluation.
 */
export async function enforcePolicies(
  input: EnforcePoliciesInput,
): Promise<EnforcePoliciesResult> {
  const policies = loadAllPolicies()

  const evalInput: PolicyEvaluationInput = {
    policyId: '*', // evaluate all
    actor: input.actor,
    action: input.action,
    resource: input.resource,
    context: input.context,
    orgId: input.orgId,
    environment: input.environment ?? process.env.NODE_ENV ?? 'development',
  }

  const evaluations = evaluatePolicies(policies, evalInput)
  const blocked = isBlocked(evaluations)
  const needsApproval = !blocked && requiresApproval(evaluations)

  // Collect approver info from decisions that require approval
  const approverRoles = new Set<string>()
  let maxApprovers = 0
  for (const e of evaluations) {
    for (const d of e.decisions) {
      if (d.result === 'require_approval') {
        d.approverRoles?.forEach((r) => approverRoles.add(r))
        if (d.requireApprovers && d.requireApprovers > maxApprovers) {
          maxApprovers = d.requireApprovers
        }
      }
    }
  }

  // Build reason string
  let reason = 'allowed'
  if (blocked) {
    const blockReasons = evaluations
      .flatMap((e) => e.decisions)
      .filter((d) => d.result === 'fail')
      .map((d) => d.reason)
    reason = `Policy denied: ${blockReasons.join('; ')}`
  } else if (needsApproval) {
    reason = `Requires approval from: ${[...approverRoles].join(', ')}`
  }

  // Record audit event for policy enforcement
  await recordAuditEvent({
    orgId: input.orgId,
    targetType: 'policy_enforcement',
    targetId: input.resource,
    action: `policy.${blocked ? 'denied' : needsApproval ? 'approval_required' : 'allowed'}`,
    actorClerkUserId: input.actor.userId,
    afterJson: {
      enforcedAction: input.action,
      resource: input.resource,
      blocked,
      needsApproval,
      reason,
      evaluationCount: evaluations.length,
      policyIds: evaluations.map((e) => e.policyId),
    },
  })

  logger.info('Policy enforcement complete', {
    action: input.action,
    resource: input.resource,
    blocked,
    needsApproval,
    evaluationCount: evaluations.length,
  })

  return {
    blocked,
    needsApproval,
    reason,
    evaluations,
    approverRoles: [...approverRoles],
    requiredApprovers: maxApprovers,
  }
}
