/**
 * DutyEstimateCard — displays import duty estimate for a vehicle.
 *
 * Pure presentational component. Receives a DutyEstimate and renders it.
 */

import type { DutyEstimate } from '../types'

interface DutyEstimateCardProps {
  estimate: DutyEstimate
}

export function DutyEstimateCard({ estimate }: DutyEstimateCardProps) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <h4 className="font-semibold">Import Duty Estimate</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <span className="text-gray-500">Route</span>
        <span>
          {estimate.originCountry} → {estimate.destinationCountry}
        </span>
        <span className="text-gray-500">Vehicle Value</span>
        <span>
          {estimate.currency} {estimate.vehicleValue}
        </span>
        <span className="text-gray-500">Duty ({estimate.dutyRate}%)</span>
        <span>
          {estimate.currency} {estimate.dutyAmount}
        </span>
        <span className="text-gray-500">VAT ({estimate.vatRate}%)</span>
        <span>
          {estimate.currency} {estimate.vatAmount}
        </span>
        <span className="font-semibold">Total Landed Cost</span>
        <span className="font-semibold">
          {estimate.currency} {estimate.totalLandedCost}
        </span>
      </div>
    </div>
  )
}
