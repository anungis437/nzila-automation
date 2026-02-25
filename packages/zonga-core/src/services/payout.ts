/**
 * @nzila/zonga-core — Payout Preview Service
 *
 * Pure computation for payout previews. No I/O — caller provides data.
 *
 * @module @nzila/zonga-core/services
 */
import type { RevenueEvent, PayoutPreview, PayoutBreakdownItem } from '../types/index'
import type { RevenueType } from '../enums'

/**
 * Compute a payout preview from a list of revenue events.
 * Pure function - no DB, no side effects.
 */
export function computePayoutPreview(params: {
  creatorId: string
  entityId: string
  periodStart: string
  periodEnd: string
  revenueEvents: readonly RevenueEvent[]
  platformFeePercent: number
  currency: string
}): PayoutPreview {
  const { creatorId, entityId, periodStart, periodEnd, revenueEvents, platformFeePercent, currency } = params

  const totalRevenue = revenueEvents.reduce((sum, e) => sum + e.amount, 0)
  const platformFee = totalRevenue * (platformFeePercent / 100)
  const netPayout = totalRevenue - platformFee

  // Build breakdown by revenue type
  const byType = new Map<RevenueType, { eventCount: number; totalAmount: number }>()
  for (const event of revenueEvents) {
    const existing = byType.get(event.type)
    if (existing) {
      existing.eventCount += 1
      existing.totalAmount += event.amount
    } else {
      byType.set(event.type, { eventCount: 1, totalAmount: event.amount })
    }
  }

  const breakdown: PayoutBreakdownItem[] = Array.from(byType.entries()).map(
    ([revenueType, data]) => ({
      revenueType,
      eventCount: data.eventCount,
      totalAmount: data.totalAmount,
    }),
  )

  return {
    creatorId,
    entityId,
    periodStart,
    periodEnd,
    totalRevenue,
    platformFee,
    netPayout,
    currency,
    revenueEventCount: revenueEvents.length,
    breakdown,
  }
}
