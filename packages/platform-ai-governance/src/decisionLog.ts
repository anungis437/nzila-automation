import { randomUUID } from 'node:crypto'
import type { AIDecisionLogEntry } from './types'

const decisionLog: AIDecisionLogEntry[] = []

export function logAIDecision(params: {
  modelId: string
  promptId: string
  app: string
  orgId: string
  inputSummary: string
  outputSummary: string
  confidence: number
  confidenceThreshold?: number
}): AIDecisionLogEntry {
  const threshold = params.confidenceThreshold ?? 0.7
  const requiresHumanReview = params.confidence < threshold

  const entry: AIDecisionLogEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    modelId: params.modelId,
    promptId: params.promptId,
    app: params.app,
    orgId: params.orgId,
    inputSummary: params.inputSummary,
    outputSummary: params.outputSummary,
    confidence: params.confidence,
    requiresHumanReview,
    reviewStatus: requiresHumanReview ? 'pending' : undefined,
  }
  decisionLog.push(entry)
  return entry
}

export function getDecisionsPendingReview(): AIDecisionLogEntry[] {
  return decisionLog.filter(
    (d) => d.requiresHumanReview && d.reviewStatus === 'pending',
  )
}

export function reviewDecision(
  decisionId: string,
  params: { status: 'approved' | 'rejected'; reviewedBy: string },
): AIDecisionLogEntry | undefined {
  const entry = decisionLog.find((d) => d.id === decisionId)
  if (entry) {
    entry.reviewStatus = params.status
    entry.reviewedBy = params.reviewedBy
    entry.reviewedAt = new Date().toISOString()
  }
  return entry
}

export function getDecisionLog(filters?: {
  app?: string
  modelId?: string
}): AIDecisionLogEntry[] {
  let results = [...decisionLog]
  if (filters?.app) results = results.filter((d) => d.app === filters.app)
  if (filters?.modelId) results = results.filter((d) => d.modelId === filters.modelId)
  return results
}

export function clearDecisionLog(): void {
  decisionLog.length = 0
}
