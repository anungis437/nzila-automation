/**
 * @nzila/platform-commerce-org — Supplier policy utilities
 *
 * Supplier ranking and selection driven by org config.
 */
import type { OrgSupplierPolicy } from './types'

export interface SupplierScore {
  supplierId: string
  qualityScore: number
  leadTimeScore: number
  costScore: number
  totalScore: number
}

export function rankSuppliers(
  candidates: Array<{
    id: string
    qualityRating: number
    leadTimeDays: number
    unitCost: number
  }>,
  policy: OrgSupplierPolicy,
): SupplierScore[] {
  if (policy.supplierSelectionStrategy === 'MANUAL') {
    return candidates.map((c) => ({
      supplierId: c.id,
      qualityScore: c.qualityRating,
      leadTimeScore: 0,
      costScore: 0,
      totalScore: 0,
    }))
  }

  const maxLead = Math.max(...candidates.map((c) => c.leadTimeDays), 1)
  const maxCost = Math.max(...candidates.map((c) => c.unitCost), 1)

  const scored = candidates.map((c) => {
    const qualityScore = c.qualityRating / 5
    const leadTimeScore = 1 - c.leadTimeDays / maxLead
    const costScore = 1 - c.unitCost / maxCost

    let totalScore: number
    switch (policy.supplierSelectionStrategy) {
      case 'LOWEST_COST':
        totalScore = costScore
        break
      case 'FASTEST':
        totalScore = leadTimeScore
        break
      case 'BALANCED':
      default:
        totalScore =
          qualityScore * policy.qualityWeight +
          leadTimeScore * policy.leadTimeWeight +
          costScore * policy.costWeight
    }

    // Boost preferred suppliers
    const isPreferred = policy.preferredSupplierIds.includes(c.id)
    if (isPreferred) totalScore += 0.1

    return { supplierId: c.id, qualityScore, leadTimeScore, costScore, totalScore }
  })

  return scored.sort((a, b) => b.totalScore - a.totalScore)
}
