import { randomUUID } from 'node:crypto'
import type { AgentWorkflow, WorkflowStep, WorkflowStatus } from './types'

export function createWorkflow(params: {
  name: string
  triggerEvent: string
  app: string
  orgId: string
  steps: Array<{ name: string }>
}): AgentWorkflow {
  return {
    id: randomUUID(),
    name: params.name,
    triggerEvent: params.triggerEvent,
    app: params.app,
    orgId: params.orgId,
    status: 'pending',
    steps: params.steps.map((s) => ({
      id: randomUUID(),
      name: s.name,
      status: 'pending' as WorkflowStatus,
    })),
    createdAt: new Date().toISOString(),
  }
}

export function executeStep(
  workflow: AgentWorkflow,
  stepId: string,
  params: {
    policyCheck?: { policyId: string; result: 'allow' | 'deny' | 'requires_approval' }
    output?: Record<string, unknown>
  },
): AgentWorkflow {
  const updatedSteps = workflow.steps.map((step) => {
    if (step.id !== stepId) return step

    if (params.policyCheck?.result === 'deny') {
      return { ...step, status: 'blocked' as WorkflowStatus, policyCheck: params.policyCheck }
    }

    if (params.policyCheck?.result === 'requires_approval') {
      return { ...step, status: 'blocked' as WorkflowStatus, policyCheck: params.policyCheck }
    }

    return {
      ...step,
      status: 'completed' as WorkflowStatus,
      policyCheck: params.policyCheck,
      output: params.output,
    }
  })

  const allCompleted = updatedSteps.every((s) => s.status === 'completed')
  const anyFailed = updatedSteps.some((s) => s.status === 'failed')
  const anyBlocked = updatedSteps.some((s) => s.status === 'blocked')

  let status: WorkflowStatus = 'running'
  if (allCompleted) status = 'completed'
  else if (anyFailed) status = 'failed'
  else if (anyBlocked) status = 'blocked'

  return {
    ...workflow,
    steps: updatedSteps,
    status,
    completedAt: status === 'completed' ? new Date().toISOString() : undefined,
  }
}
