/**
 * Web — Policy Enforcement
 *
 * Integrates platform-policy-engine for content publishing
 * and admin analytics access.
 */
import type { PolicyEvaluationInput, PolicyDefinition } from '@nzila/platform-policy-engine'
import { evaluatePolicy, isBlocked } from '@nzila/platform-policy-engine'

export type WebPolicyAction = 'content_publishing' | 'admin_analytics_access'

const WEB_POLICIES: PolicyDefinition[] = [
  {
    id: 'web-content-publishing',
    name: 'Content Publishing Policy',
    description: 'Controls content publishing operations',
    version: '1.0.0',
    type: 'access',
    enabled: true,
    scope: { resources: ['web'] },
    rules: [
      {
        id: 'publish-role',
        description: 'Content publishing requires editor or admin role',
        conditions: [{ field: 'action', operator: 'eq', value: 'content_publishing' }],
        effect: 'allow',
        severity: 'warning',
      },
    ],
    metadata: {},
  },
  {
    id: 'web-admin-analytics',
    name: 'Admin Analytics Access Policy',
    description: 'Restricts analytics access to admin roles',
    version: '1.0.0',
    type: 'access',
    enabled: true,
    scope: { resources: ['web'] },
    rules: [
      {
        id: 'analytics-admin-only',
        description: 'Analytics access requires admin role',
        conditions: [{ field: 'action', operator: 'eq', value: 'admin_analytics_access' }],
        effect: 'allow',
        severity: 'critical',
      },
    ],
    metadata: {},
  },
]

export interface PolicyCheckResult {
  allowed: boolean
  action: WebPolicyAction
  reason?: string
  policyId?: string
}

export async function checkWebPolicy(
  action: WebPolicyAction,
  context: Record<string, unknown>,
): Promise<PolicyCheckResult> {
  const orgId = (context.orgId as string) ?? 'default'
  const input: PolicyEvaluationInput = {
    policyId: '',
    action,
    resource: 'web',
    actor: {
      userId: (context.userId as string) ?? 'system',
      roles: (context.roles as string[]) ?? [],
    },
    context,
    orgId,
    environment: (context.environment as string) ?? 'production',
  }

  const policy = WEB_POLICIES.find((p) =>
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
