/**
 * Shop Quoter — Policy Enforcement
 *
 * Integrates platform-policy-engine for quote generation,
 * price override, and quote export operations.
 */
import type { PolicyEvaluationInput, PolicyDefinition } from '@nzila/platform-policy-engine'
import { evaluatePolicy, isBlocked } from '@nzila/platform-policy-engine'

export type QuoterPolicyAction = 'quote_generation' | 'price_override' | 'quote_export'

const QUOTER_POLICIES: PolicyDefinition[] = [
  {
    id: 'quoter-generation',
    name: 'Quote Generation Policy',
    description: 'Controls who can generate quotes and under what conditions',
    version: '1.0.0',
    type: 'access',
    enabled: true,
    scope: { resources: ['shop-quoter'] },
    rules: [
      {
        id: 'require-org',
        description: 'Require valid org context',
        conditions: [{ field: 'action', operator: 'eq', value: 'quote_generation' }],
        effect: 'allow',
        severity: 'critical',
      },
    ],
    metadata: {},
  },
  {
    id: 'quoter-price-override',
    name: 'Price Override Policy',
    description: 'Requires approval for price overrides above threshold',
    version: '1.0.0',
    type: 'approval',
    enabled: true,
    scope: { resources: ['shop-quoter'] },
    rules: [
      {
        id: 'override-approval',
        description: 'Price overrides above $10,000 require approval',
        conditions: [
          { field: 'context.amount', operator: 'gt', value: 10000 },
        ],
        effect: 'require_approval',
        severity: 'critical',
        requireApprovers: 1,
        approverRoles: ['admin', 'finance'],
      },
    ],
    metadata: {},
  },
  {
    id: 'quoter-export',
    name: 'Quote Export Policy',
    description: 'Controls quote export operations',
    version: '1.0.0',
    type: 'access',
    enabled: true,
    scope: { resources: ['shop-quoter'] },
    rules: [
      {
        id: 'export-audit',
        description: 'All exports must be audited',
        conditions: [{ field: 'action', operator: 'eq', value: 'quote_export' }],
        effect: 'allow',
        severity: 'warning',
      },
    ],
    metadata: {},
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
  const orgId = (context.orgId as string) ?? 'default'
  const input: PolicyEvaluationInput = {
    policyId: '',
    action,
    resource: 'shop-quoter',
    actor: {
      userId: (context.userId as string) ?? 'system',
      roles: (context.roles as string[]) ?? [],
    },
    context,
    orgId,
    environment: (context.environment as string) ?? 'production',
  }

  const policy = QUOTER_POLICIES.find((p) =>
    p.rules.some((r) => r.conditions.some((c) => c.value === action)),
  )

  if (!policy) {
    return { allowed: true, action }
  }

  const result = evaluatePolicy(policy, { ...input, policyId: policy.id })
  const blocked = isBlocked([result])

  return {
    allowed: !blocked,
    action,
    reason: blocked ? result.decisions[0]?.reason : undefined,
    policyId: policy.id,
  }
}
