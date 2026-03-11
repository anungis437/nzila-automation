import type { EvidenceReference } from './types'

export function createEvidenceRef(params: {
  source: string
  type: 'event' | 'metric' | 'policy' | 'audit'
  id: string
  summary: string
}): EvidenceReference {
  return { ...params }
}

export function validateEvidenceBacking(
  refs: EvidenceReference[],
): { valid: boolean; coverage: number } {
  if (refs.length === 0) return { valid: false, coverage: 0 }

  const types = new Set(refs.map((r) => r.type))
  const requiredTypes = ['event', 'metric', 'policy', 'audit'] as const
  const covered = requiredTypes.filter((t) => types.has(t)).length
  const coverage = covered / requiredTypes.length

  return { valid: coverage >= 0.5, coverage }
}
