// ---------------------------------------------------------------------------
// Payout simulation — deterministic V1
// ---------------------------------------------------------------------------

/** A payment distribution entry for simulation */
export interface PayoutEntry {
  producerId: string
  contributionKg: number
  qualityGrade: string
  pricePerKg: number
}

/** Result of a payout simulation */
export interface PayoutSimulationResult {
  entries: PayoutLineItem[]
  totalPayout: number
  totalKg: number
  averagePricePerKg: number
  currency: string
}

/** Individual line item in a payout simulation */
export interface PayoutLineItem {
  producerId: string
  contributionKg: number
  qualityGrade: string
  pricePerKg: number
  grossPayout: number
  qualityBonus: number
  netPayout: number
}

// ---------------------------------------------------------------------------
// Quality bonus schedule (V1 — configurable per org later)
// ---------------------------------------------------------------------------

const DEFAULT_QUALITY_BONUS: Record<string, number> = {
  A: 0.15,
  B: 0.05,
  C: 0,
  D: -0.05,
  F: -0.10,
}

// ---------------------------------------------------------------------------
// Pure computations
// ---------------------------------------------------------------------------

/**
 * Simulate payout distribution for a set of producer contributions.
 *
 * `grossPayout = contributionKg × pricePerKg`
 * `qualityBonus = grossPayout × bonusRate`
 * `netPayout = grossPayout + qualityBonus`
 */
export function simulatePayout(
  entries: PayoutEntry[],
  currency: string,
  bonusSchedule: Record<string, number> = DEFAULT_QUALITY_BONUS,
): PayoutSimulationResult {
  const lineItems: PayoutLineItem[] = entries.map((e) => {
    const grossPayout = e.contributionKg * e.pricePerKg
    const bonusRate = bonusSchedule[e.qualityGrade] ?? 0
    const qualityBonus = grossPayout * bonusRate
    const netPayout = grossPayout + qualityBonus
    return {
      producerId: e.producerId,
      contributionKg: e.contributionKg,
      qualityGrade: e.qualityGrade,
      pricePerKg: e.pricePerKg,
      grossPayout,
      qualityBonus,
      netPayout,
    }
  })

  const totalPayout = lineItems.reduce((s, l) => s + l.netPayout, 0)
  const totalKg = lineItems.reduce((s, l) => s + l.contributionKg, 0)

  return {
    entries: lineItems,
    totalPayout,
    totalKg,
    averagePricePerKg: totalKg > 0 ? totalPayout / totalKg : 0,
    currency,
  }
}

/**
 * Compute fair-share distribution: each producer gets (their contribution / total) × pool.
 */
export function computeFairShare(
  contributions: Array<{ producerId: string; kg: number }>,
  totalPool: number,
): Array<{ producerId: string; kg: number; share: number; payout: number }> {
  const totalKg = contributions.reduce((s, c) => s + c.kg, 0)
  return contributions.map((c) => {
    const share = totalKg > 0 ? c.kg / totalKg : 0
    return {
      producerId: c.producerId,
      kg: c.kg,
      share,
      payout: totalPool * share,
    }
  })
}
