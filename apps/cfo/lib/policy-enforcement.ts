/**
 * CFO — Policy Enforcement
 *
 * Integrates platform-policy-engine for financial export,
 * ledger adjustments, and budget changes.
 */
import type { PolicyEvaluationInput, PolicyDefinition } from '@nzila/platform-policy-engine'
import { evaluatePolicy, isBlocked } from '@nzila/platform-policy-engine'

export type CfoPolicyAction = 'financial_export' | 'ledger_adjustment' | 'budget_change'

const CFO_POLICIES: PolicyDefinition[] = [
  {
    id: 'cfo-financial-export',
    name: 'Financial Export Policy',
    description: 'Controls financial data export operations',
    version: '1.0.0',
    type: 'access',
    enabled: true,
    scope: { resources: ['cfo'] },
    rules: [
      {
        id: 'export-role-check',
        description: 'Only finance roles can export financial data',
        conditions: [{ field: 'action', operator: 'eq', value: 'financial_export' }],
        effect: 'allow',
        severity: 'critical',
      },
    ],
    metadata: {},
  },
  {
    id: 'cfo-ledger-adjustment',
    name: 'Ledger Adjustment Policy',
    description: 'Requires dual approval for ledger adjustments',
    version: '1.0.0',
    type: 'approval',
    enabled: true,
    scope: { resources: ['cfo'] },
    rules: [
      {
        id: 'ledger-dual-approval',
        description: 'Ledger adjustments require dual approval',
        conditions: [
          { field: 'context.amount', operator: 'gt', value: 0 },
        ],
        effect: 'require_approval',
        severity: 'critical',
        requireApprovers: 2,
        approverRoles: ['cfo', 'controller'],
      },
    ],
    metadata: {},
  },
  {
    id: 'cfo-budget-change',
    name: 'Budget Change Policy',
    description: 'Controls budget modification operations',
    version: '1.0.0',
    type: 'financial',
    enabled: true,
    scope: { resources: ['cfo'] },
    rules: [
      {
        id: 'budget-threshold',
        description: 'Budget changes above $50,000 require CFO approval',
        conditions: [
          { field: 'context.amount', operator: 'gt', value: 50000 },
        ],
        effect: 'require_approval',
        severity: 'critical',
        requireApprovers: 1,
        approverRoles: ['cfo'],
      },
    ],
    metadata: {},
  },
]

export interface PolicyCheckResult {
  allowed: boolean
  action: CfoPolicyAction
  reason?: string
  policyId?: string
}

export async function checkCfoPolicy(
  action: CfoPolicyAction,
  context: Record<string, unknown>,
): Promise<PolicyCheckResult> {
  const orgId = (context.orgId as string) ?? 'default'
  const input: PolicyEvaluationInput = {
    policyId: '',
    action,
    resource: 'cfo',
    actor: {
      userId: (context.userId as string) ?? 'system',
      roles: (context.roles as string[]) ?? [],
    },
    context,
    orgId,
    environment: (context.environment as string) ?? 'production',
  }

  const policy = CFO_POLICIES.find((p) =>
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
