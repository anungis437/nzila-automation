/**
 * CFO — Policy Enforcement
 *
 * Integrates platform-policy-engine for financial export,
 * ledger adjustments, and budget changes.
 */
import type { PolicyEvaluationInput } from '@nzila/platform-policy-engine'
import { evaluatePolicy, isBlocked } from '@nzila/platform-policy-engine'
import type { PolicyDefinition } from '@nzila/platform-policy-engine'

export type CfoPolicyAction = 'financial_export' | 'ledger_adjustment' | 'budget_change'

const CFO_POLICIES: PolicyDefinition[] = [
  {
    id: 'cfo-financial-export',
    name: 'Financial Export Policy',
    description: 'Controls financial data export operations',
    version: '1.0.0',
    scope: { apps: ['cfo'], actions: ['financial_export'] },
    rules: [
      {
        id: 'export-role-check',
        description: 'Only finance roles can export financial data',
        conditions: [{ field: 'action', operator: 'eq', value: 'financial_export' }],
        effect: 'allow',
        severity: 'high',
      },
    ],
  },
  {
    id: 'cfo-ledger-adjustment',
    name: 'Ledger Adjustment Policy',
    description: 'Requires dual approval for ledger adjustments',
    version: '1.0.0',
    scope: { apps: ['cfo'], actions: ['ledger_adjustment'] },
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
  },
  {
    id: 'cfo-budget-change',
    name: 'Budget Change Policy',
    description: 'Controls budget modification operations',
    version: '1.0.0',
    scope: { apps: ['cfo'], actions: ['budget_change'] },
    rules: [
      {
        id: 'budget-threshold',
        description: 'Budget changes above $50,000 require CFO approval',
        conditions: [
          { field: 'context.amount', operator: 'gt', value: 50000 },
        ],
        effect: 'require_approval',
        severity: 'high',
        requireApprovers: 1,
        approverRoles: ['cfo'],
      },
    ],
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
  const input: PolicyEvaluationInput = {
    action,
    resource: 'cfo',
    actor: {
      id: (context.userId as string) ?? 'system',
      type: 'user',
      roles: (context.roles as string[]) ?? [],
    },
    context,
    timestamp: new Date().toISOString(),
  }

  const policy = CFO_POLICIES.find((p) =>
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
