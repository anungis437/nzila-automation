import { randomUUID } from 'node:crypto'
import type { HumanReviewFlag } from './types'

const reviewFlags: HumanReviewFlag[] = []

export function flagForReview(params: {
  decisionId: string
  reason: string
  flaggedBy: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}): HumanReviewFlag {
  const flag: HumanReviewFlag = {
    id: randomUUID(),
    ...params,
    flaggedAt: new Date().toISOString(),
    resolved: false,
  }
  reviewFlags.push(flag)
  return flag
}

export function resolveReviewFlag(
  flagId: string,
  resolution: string,
): HumanReviewFlag | undefined {
  const flag = reviewFlags.find((f) => f.id === flagId)
  if (flag) {
    flag.resolved = true
    flag.resolution = resolution
  }
  return flag
}

export function getPendingReviewFlags(): HumanReviewFlag[] {
  return reviewFlags.filter((f) => !f.resolved)
}

export function clearReviewFlags(): void {
  reviewFlags.length = 0
}
