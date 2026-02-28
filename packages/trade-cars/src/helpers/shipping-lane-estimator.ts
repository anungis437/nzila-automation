/**
 * @nzila/trade-cars — Shipping lane estimator.
 *
 * Estimates transit time and cost for vehicle transport routes.
 * Uses static lane data — for real production, swap for a
 * live logistics API adapter via integrations-runtime.
 */

import type { ShippingLaneEstimate } from '../types'

// ── Static lane data ────────────────────────────────────────────────────────

interface LaneData {
  readonly lane: string
  readonly estimatedUsd: number
  readonly transitDays: number
  readonly carriers: string[]
}

const LANES: Record<string, LaneData> = {
  // key: "ORIGIN-DEST"
  'USA-ZAF': {
    lane: 'Trans-Atlantic via Cape Town',
    estimatedUsd: 3500,
    transitDays: 28,
    carriers: ['Grimaldi', 'MSC', 'Sallaum Lines'],
  },
  'USA-NGA': {
    lane: 'Trans-Atlantic via Lagos',
    estimatedUsd: 2800,
    transitDays: 21,
    carriers: ['Grimaldi', 'Sallaum Lines'],
  },
  'USA-KEN': {
    lane: 'Trans-Atlantic via Mombasa',
    estimatedUsd: 4200,
    transitDays: 35,
    carriers: ['MSC', 'Maersk'],
  },
  'JPN-ZAF': {
    lane: 'Indian Ocean via Durban',
    estimatedUsd: 2200,
    transitDays: 21,
    carriers: ['NYK Line', 'MOL', 'K Line'],
  },
  'JPN-KEN': {
    lane: 'Indian Ocean via Mombasa',
    estimatedUsd: 1800,
    transitDays: 18,
    carriers: ['NYK Line', 'MOL'],
  },
  'JPN-TZA': {
    lane: 'Indian Ocean via Dar es Salaam',
    estimatedUsd: 1900,
    transitDays: 20,
    carriers: ['NYK Line', 'MOL'],
  },
  'GBR-NGA': {
    lane: 'West Africa via Lagos',
    estimatedUsd: 2200,
    transitDays: 14,
    carriers: ['Grimaldi', 'CMA CGM'],
  },
  'GBR-GHA': {
    lane: 'West Africa via Tema',
    estimatedUsd: 2000,
    transitDays: 12,
    carriers: ['Grimaldi', 'MSC'],
  },
  'ARE-KEN': {
    lane: 'Dubai to Mombasa',
    estimatedUsd: 1200,
    transitDays: 10,
    carriers: ['MSC', 'Maersk', 'CMA CGM'],
  },
  'ARE-TZA': {
    lane: 'Dubai to Dar es Salaam',
    estimatedUsd: 1300,
    transitDays: 12,
    carriers: ['MSC', 'Maersk'],
  },
}

// ── Estimator ───────────────────────────────────────────────────────────────

export function estimateShippingLane(
  originCountry: string,
  destinationCountry: string,
): ShippingLaneEstimate {
  const key = `${originCountry.toUpperCase()}-${destinationCountry.toUpperCase()}`
  const lane = LANES[key]

  if (lane) {
    return {
      originCountry: originCountry.toUpperCase(),
      destinationCountry: destinationCountry.toUpperCase(),
      lane: lane.lane,
      estimatedCostUsd: lane.estimatedUsd.toFixed(2),
      estimatedTransitDays: lane.transitDays,
      carriers: lane.carriers,
    }
  }

  // Fallback for unknown lanes
  return {
    originCountry: originCountry.toUpperCase(),
    destinationCountry: destinationCountry.toUpperCase(),
    lane: 'Custom route — contact logistics team',
    estimatedCostUsd: '0.00',
    estimatedTransitDays: 0,
    carriers: [],
  }
}
