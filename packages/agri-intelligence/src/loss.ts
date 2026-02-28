// ---------------------------------------------------------------------------
// Loss rate intelligence — deterministic V1
// ---------------------------------------------------------------------------

/** Loss rate result for a set of batches between harvest and delivery */
export interface LossRateResult {
  totalHarvestedKg: number
  totalDeliveredKg: number
  lossKg: number
  lossPercent: number
  batchCount: number
}

/** Batch weight pair for loss computation */
export interface BatchWeightPair {
  harvestedKg: number
  deliveredKg: number
}

// ---------------------------------------------------------------------------
// Pure computations
// ---------------------------------------------------------------------------

/**
 * Compute aggregate loss rate across a set of batch weight pairs.
 * Loss % = ((harvested - delivered) / harvested) × 100
 */
export function computeLossRate(pairs: BatchWeightPair[]): LossRateResult {
  const totalHarvestedKg = pairs.reduce((s, p) => s + p.harvestedKg, 0)
  const totalDeliveredKg = pairs.reduce((s, p) => s + p.deliveredKg, 0)
  const lossKg = totalHarvestedKg - totalDeliveredKg
  return {
    totalHarvestedKg,
    totalDeliveredKg,
    lossKg,
    lossPercent: totalHarvestedKg > 0 ? (lossKg / totalHarvestedKg) * 100 : 0,
    batchCount: pairs.length,
  }
}

/**
 * Compute loss rate per crop from tagged batch pairs.
 */
export function computeLossRateByCrop(
  pairs: Array<BatchWeightPair & { cropId: string }>,
): Map<string, LossRateResult> {
  const grouped = new Map<string, Array<BatchWeightPair & { cropId: string }>>()
  for (const p of pairs) {
    const arr = grouped.get(p.cropId) ?? []
    arr.push(p)
    grouped.set(p.cropId, arr)
  }
  const results = new Map<string, LossRateResult>()
  for (const [cropId, group] of grouped) {
    results.set(cropId, computeLossRate(group))
  }
  return results
}
