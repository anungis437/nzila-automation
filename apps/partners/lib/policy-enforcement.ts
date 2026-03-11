/**
 * Partners — Policy Enforcement
 *
 * Integrates platform-policy-engine for partner onboarding,
 * contract upload, and revenue modifications.
 */
import type { PolicyEvaluationInput, PolicyDefinition } from '@nzila/platform-policy-engine'
import { evaluatePolicy, isBlocked } from '@nzila/platform-policy-engine'

export type PartnersPolicyAction = 'partner_onboarding' | 'contract_upload' | 'revenue_modification'

const PARTNERS_POLICIES: PolicyDefinition[] = [
  {
    id: 'partners-onboarding',
    name: 'Partner Onboarding Policy',
    description: 'Controls partner onboarding operations',
    version: '1.0.0',
    type: 'access',
    enabled: true,
    scope: { resources: ['partners'] },
    rules: [
      {
        id: 'onboarding-validation',
        description: 'Partner onboarding requires admin role',
        conditions: [{ field: 'action', operator: 'eq', value: 'partner_onboarding' }],
        effect: 'allow',
        severity: 'critical',
      },
    ],
    metadata: {},
  },
  {
    id: 'partners-contract-upload',
    name: 'Contract Upload Policy',
    description: 'Controls contract upload and storage',
    version: '1.0.0',
    type: 'access',
    enabled: true,
    scope: { resources: ['partners'] },
    rules: [
      {
        id: 'contract-audit',
        description: 'All contract uploads must be audited',
        conditions: [{ field: 'action', operator: 'eq', value: 'contract_upload' }],
        effect: 'allow',
        severity: 'warning',
      },
    ],
    metadata: {},
  },
  {
    id: 'partners-revenue-mod',
    name: 'Revenue Modification Policy',
    description: 'Requires approval for revenue modifications',
    version: '1.0.0',
    type: 'financial',
    enabled: true,
    scope: { resources: ['partners'] },
    rules: [
      {
        id: 'revenue-approval',
        description: 'Revenue modifications require finance approval',
        conditions: [
          { field: 'context.amount', operator: 'gt', value: 5000 },
        ],
        effect: 'require_approval',
        severity: 'critical',
        requireApprovers: 1,
        approverRoles: ['admin', 'finance'],
      },
    ],
    metadata: {},
  },
]

export interface PolicyCheckResult {
  allowed: boolean
  action: PartnersPolicyAction
  reason?: string
  policyId?: string
}

export async function checkPartnersPolicy(
  action: PartnersPolicyAction,
  context: Record<string, unknown>,
): Promise<PolicyCheckResult> {
  const orgId = (context.orgId as string) ?? 'default'
  const input: PolicyEvaluationInput = {
    policyId: '',
    action,
    resource: 'partners',
    actor: {
      userId: (context.userId as string) ?? 'system',
      roles: (context.roles as string[]) ?? [],
    },
    context,
    orgId,
    environment: (context.environment as string) ?? 'production',
  }

  const policy = PARTNERS_POLICIES.find((p) =>
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
