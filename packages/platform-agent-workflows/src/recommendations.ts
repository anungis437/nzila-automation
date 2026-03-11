import { randomUUID } from 'node:crypto'
import type { AgentWorkflow, Recommendation } from './types'
import { recordAuditEvent } from '@nzila/platform-governance'

export function generateRecommendations(
  workflow: AgentWorkflow,
): Recommendation[] {
  const recommendations: Recommendation[] = []

  const blockedSteps = workflow.steps.filter((s) => s.status === 'blocked')
  for (const step of blockedSteps) {
    if (step.policyCheck?.result === 'requires_approval') {
      recommendations.push({
        id: randomUUID(),
        workflowId: workflow.id,
        timestamp: new Date().toISOString(),
        title: `Approval required for "${step.name}"`,
        description: `Step "${step.name}" in workflow "${workflow.name}" requires policy approval (${step.policyCheck.policyId})`,
        priority: 'high',
        actionable: true,
        suggestedAction: `Submit approval request for policy ${step.policyCheck.policyId}`,
        humanReviewRequired: true,
      })
    }

    if (step.policyCheck?.result === 'deny') {
      recommendations.push({
        id: randomUUID(),
        workflowId: workflow.id,
        timestamp: new Date().toISOString(),
        title: `Policy violation in "${step.name}"`,
        description: `Step "${step.name}" was denied by policy ${step.policyCheck.policyId}`,
        priority: 'high',
        actionable: false,
        humanReviewRequired: true,
      })
    }
  }

  const failedSteps = workflow.steps.filter((s) => s.status === 'failed')
  for (const step of failedSteps) {
    recommendations.push({
      id: randomUUID(),
      workflowId: workflow.id,
      timestamp: new Date().toISOString(),
      title: `Failed step: "${step.name}"`,
      description: step.error ?? `Step "${step.name}" failed without error details`,
      priority: 'medium',
      actionable: true,
      suggestedAction: 'Review step configuration and retry',
      humanReviewRequired: true,
    })
  }

  if (recommendations.length > 0) {
    recordAuditEvent({
      eventType: 'recommendation_generated',
      actor: 'agent-workflow-runner',
      orgId: workflow.orgId,
      app: workflow.app,
      policyResult: 'warn',
      commitHash: 'runtime',
      details: {
        workflowId: workflow.id,
        recommendationCount: recommendations.length,
        priorities: recommendations.map((r) => r.priority),
      },
    })
  }

  return recommendations
}
