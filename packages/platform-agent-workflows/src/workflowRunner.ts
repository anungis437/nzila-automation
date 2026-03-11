import { randomUUID } from 'node:crypto'
import type { AgentWorkflow, WorkflowStep, WorkflowStatus } from './types'
import { recordAuditEvent } from '@nzila/platform-governance'

export function createWorkflow(params: {
  name: string
  triggerEvent: string
  app: string
  orgId: string
  steps: Array<{ name: string }>
}): AgentWorkflow {
  const workflow: AgentWorkflow = {
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

  recordAuditEvent({
    eventType: 'workflow_created',
    actor: 'agent-workflow-runner',
    orgId: params.orgId,
    app: params.app,
    policyResult: 'pass',
    commitHash: 'runtime',
    details: { workflowId: workflow.id, workflowName: params.name, triggerEvent: params.triggerEvent },
  })

  return workflow
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

  const policyResult = anyBlocked || anyFailed ? 'fail' : 'pass'
  emitStepAuditEvent(workflow, stepId, policyResult, {
    stepStatus: updatedSteps.find((s) => s.id === stepId)?.status,
    workflowStatus: status,
    policyCheck: params.policyCheck,
  })

  return {
    ...workflow,
    steps: updatedSteps,
    status,
    completedAt: status === 'completed' ? new Date().toISOString() : undefined,
  }
}

function emitStepAuditEvent(
  workflow: AgentWorkflow,
  stepId: string,
  policyResult: 'pass' | 'fail' | 'warn',
  details: Record<string, unknown>,
): void {
  recordAuditEvent({
    eventType: 'workflow_step_executed',
    actor: 'agent-workflow-runner',
    orgId: workflow.orgId,
    app: workflow.app,
    policyResult,
    commitHash: 'runtime',
    details: { workflowId: workflow.id, stepId, ...details },
  })
}
