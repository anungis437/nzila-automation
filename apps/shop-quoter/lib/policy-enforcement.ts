/**
 * Shop Quoter — Policy Enforcement
 *
 * Integrates platform-policy-engine for quote generation,
 * price override, and quote export operations.
 */
import type { PolicyEvaluationInput } from '@nzila/platform-policy-engine'
import { evaluatePolicy, isBlocked } from '@nzila/platform-policy-engine'
import type { PolicyDefinition } from '@nzila/platform-policy-engine'

export type QuoterPolicyAction = 'quote_generation' | 'price_override' | 'quote_export'

const QUOTER_POLICIES: PolicyDefinition[] = [
  {
    id: 'quoter-generation',
    name: 'Quote Generation Policy',
    description: 'Controls who can generate quotes and under what conditions',
    version: '1.0.0',
    scope: { apps: ['shop-quoter'], actions: ['quote_generation'] },
    rules: [
      {
        id: 'require-org',
        description: 'Require valid org context',
        conditions: [{ field: 'context.orgId', operator: 'exists' }],
        effect: 'allow',
        severity: 'high',
      },
    ],
  },
  {
    id: 'quoter-price-override',
    name: 'Price Override Policy',
    description: 'Requires approval for price overrides above threshold',
    version: '1.0.0',
    scope: { apps: ['shop-quoter'], actions: ['price_override'] },
    rules: [
      {
        id: 'override-approval',
        description: 'Price overrides above $10,000 require approval',
        conditions: [
          { field: 'context.amount', operator: 'gt', value: 10000 },
        ],
        effect: 'require_approval',
        severity: 'high',
        requireApprovers: 1,
        approverRoles: ['admin', 'finance'],
      },
    ],
  },
  {
    id: 'quoter-export',
    name: 'Quote Export Policy',
    description: 'Controls quote export operations',
    version: '1.0.0',
    scope: { apps: ['shop-quoter'], actions: ['quote_export'] },
    rules: [
      {
        id: 'export-audit',
        description: 'All exports must be audited',
        conditions: [{ field: 'action', operator: 'eq', value: 'quote_export' }],
        effect: 'allow',
        severity: 'medium',
      },
    ],
  },
]

export interface PolicyCheckResult {
  allowed: boolean
  action: QuoterPolicyAction
  reason?: string
  policyId?: string
}

export async function checkQuoterPolicy(
  action: QuoterPolicyAction,
  context: Record<string, unknown>,
): Promise<PolicyCheckResult> {
  const input: PolicyEvaluationInput = {
    action,
    resource: 'shop-quoter',
    actor: {
      id: (context.userId as string) ?? 'system',
      type: 'user',
      roles: (context.roles as string[]) ?? [],
    },
    context,
    timestamp: new Date().toISOString(),
  }

  const policy = QUOTER_POLICIES.find((p) =>
    p.scope.actions?.includes(action),
  )

  if (!policy) {
    return { allowed: true, action }
  }

  const result = evaluatePolicy(policy, input)
  const blocked = isBlocked(result)

  return {
    allowed: !blocked,
    action,
    reason: blocked ? result.decisions[0]?.reason : undefined,
    policyId: policy.id,
  }
}
