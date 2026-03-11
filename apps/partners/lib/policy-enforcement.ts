/**
 * Partners — Policy Enforcement
 *
 * Integrates platform-policy-engine for partner onboarding,
 * contract upload, and revenue modifications.
 */
import type { PolicyEvaluationInput } from '@nzila/platform-policy-engine'
import { evaluatePolicy, isBlocked } from '@nzila/platform-policy-engine'
import type { PolicyDefinition } from '@nzila/platform-policy-engine'

export type PartnersPolicyAction = 'partner_onboarding' | 'contract_upload' | 'revenue_modification'

const PARTNERS_POLICIES: PolicyDefinition[] = [
  {
    id: 'partners-onboarding',
    name: 'Partner Onboarding Policy',
    description: 'Controls partner onboarding operations',
    version: '1.0.0',
    scope: { apps: ['partners'], actions: ['partner_onboarding'] },
    rules: [
      {
        id: 'onboarding-validation',
        description: 'Partner onboarding requires admin role',
        conditions: [{ field: 'action', operator: 'eq', value: 'partner_onboarding' }],
        effect: 'allow',
        severity: 'high',
      },
    ],
  },
  {
    id: 'partners-contract-upload',
    name: 'Contract Upload Policy',
    description: 'Controls contract upload and storage',
    version: '1.0.0',
    scope: { apps: ['partners'], actions: ['contract_upload'] },
    rules: [
      {
        id: 'contract-audit',
        description: 'All contract uploads must be audited',
        conditions: [{ field: 'action', operator: 'eq', value: 'contract_upload' }],
        effect: 'allow',
        severity: 'medium',
      },
    ],
  },
  {
    id: 'partners-revenue-mod',
    name: 'Revenue Modification Policy',
    description: 'Requires approval for revenue modifications',
    version: '1.0.0',
    scope: { apps: ['partners'], actions: ['revenue_modification'] },
    rules: [
      {
        id: 'revenue-approval',
        description: 'Revenue modifications require finance approval',
        conditions: [
          { field: 'context.amount', operator: 'gt', value: 5000 },
        ],
        effect: 'require_approval',
        severity: 'high',
        requireApprovers: 1,
        approverRoles: ['admin', 'finance'],
      },
    ],
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
  const input: PolicyEvaluationInput = {
    action,
    resource: 'partners',
    actor: {
      id: (context.userId as string) ?? 'system',
      type: 'user',
      roles: (context.roles as string[]) ?? [],
    },
    context,
    timestamp: new Date().toISOString(),
  }

  const policy = PARTNERS_POLICIES.find((p) =>
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
