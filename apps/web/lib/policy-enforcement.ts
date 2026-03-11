/**
 * Web — Policy Enforcement
 *
 * Integrates platform-policy-engine for content publishing
 * and admin analytics access.
 */
import type { PolicyEvaluationInput } from '@nzila/platform-policy-engine'
import { evaluatePolicy, isBlocked } from '@nzila/platform-policy-engine'
import type { PolicyDefinition } from '@nzila/platform-policy-engine'

export type WebPolicyAction = 'content_publishing' | 'admin_analytics_access'

const WEB_POLICIES: PolicyDefinition[] = [
  {
    id: 'web-content-publishing',
    name: 'Content Publishing Policy',
    description: 'Controls content publishing operations',
    version: '1.0.0',
    scope: { apps: ['web'], actions: ['content_publishing'] },
    rules: [
      {
        id: 'publish-role',
        description: 'Content publishing requires editor or admin role',
        conditions: [{ field: 'action', operator: 'eq', value: 'content_publishing' }],
        effect: 'allow',
        severity: 'medium',
      },
    ],
  },
  {
    id: 'web-admin-analytics',
    name: 'Admin Analytics Access Policy',
    description: 'Restricts analytics access to admin roles',
    version: '1.0.0',
    scope: { apps: ['web'], actions: ['admin_analytics_access'] },
    rules: [
      {
        id: 'analytics-admin-only',
        description: 'Analytics access requires admin role',
        conditions: [{ field: 'action', operator: 'eq', value: 'admin_analytics_access' }],
        effect: 'allow',
        severity: 'high',
      },
    ],
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
  const input: PolicyEvaluationInput = {
    action,
    resource: 'web',
    actor: {
      id: (context.userId as string) ?? 'system',
      type: 'user',
      roles: (context.roles as string[]) ?? [],
    },
    context,
    timestamp: new Date().toISOString(),
  }

  const policy = WEB_POLICIES.find((p) =>
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
