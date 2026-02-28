/**
 * @nzila/trade-cars — Duty calculator helper.
 *
 * Estimates import duties and VAT for vehicle shipments.
 * Uses static rate tables — for real production, swap for a
 * live tariff API adapter via integrations-runtime.
 */

import type { DutyEstimate } from '../types'

// ── Static rate tables (simplified) ─────────────────────────────────────────

interface DutyRate {
  readonly dutyPercent: number
  readonly vatPercent: number
}

const DUTY_RATES: Record<string, DutyRate> = {
  // Destination country → default rates
  ZAF: { dutyPercent: 25, vatPercent: 15 },
  KEN: { dutyPercent: 25, vatPercent: 16 },
  NGA: { dutyPercent: 35, vatPercent: 7.5 },
  GHA: { dutyPercent: 20, vatPercent: 12.5 },
  TZA: { dutyPercent: 25, vatPercent: 18 },
  COD: { dutyPercent: 20, vatPercent: 16 },
  AGO: { dutyPercent: 10, vatPercent: 14 },
  MOZ: { dutyPercent: 20, vatPercent: 17 },
  USA: { dutyPercent: 2.5, vatPercent: 0 },
  GBR: { dutyPercent: 6.5, vatPercent: 20 },
  ARE: { dutyPercent: 5, vatPercent: 5 },
  JPN: { dutyPercent: 0, vatPercent: 10 },
}

const DEFAULT_RATE: DutyRate = { dutyPercent: 20, vatPercent: 15 }

// ── Calculator ──────────────────────────────────────────────────────────────

export function estimateDuty(
  originCountry: string,
  destinationCountry: string,
  vehicleValue: string,
  currency: string,
): DutyEstimate {
  const rate = DUTY_RATES[destinationCountry.toUpperCase()] ?? DEFAULT_RATE
  const value = parseFloat(vehicleValue)

  if (isNaN(value) || value < 0) {
    throw new Error('Invalid vehicle value')
  }

  const dutyAmount = value * (rate.dutyPercent / 100)
  const vatAmount = (value + dutyAmount) * (rate.vatPercent / 100)
  const totalLandedCost = value + dutyAmount + vatAmount

  return {
    originCountry: originCountry.toUpperCase(),
    destinationCountry: destinationCountry.toUpperCase(),
    vehicleValue,
    currency: currency.toUpperCase(),
    dutyRate: rate.dutyPercent,
    dutyAmount: dutyAmount.toFixed(2),
    vatRate: rate.vatPercent,
    vatAmount: vatAmount.toFixed(2),
    totalLandedCost: totalLandedCost.toFixed(2),
  }
}
