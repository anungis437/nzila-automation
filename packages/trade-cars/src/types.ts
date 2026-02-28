/**
 * @nzila/trade-cars — Vehicle domain types.
 *
 * These types extend the core trade listing for vehicles.
 * Imports ONLY from @nzila/trade-core (enums + types).
 * Does NOT import from @nzila/db or @nzila/trade-db.
 */

import type {
  VehicleCondition,
  VehicleTransmission,
  VehicleDrivetrain,
  VehicleFuelType,
  VehicleDocType,
} from '@nzila/trade-core/enums'
import type { TradeListingId } from '@nzila/trade-core/types'

// ── Vehicle Listing ─────────────────────────────────────────────────────────

export interface VehicleListing {
  readonly id: string
  readonly entityId: string
  readonly listingId: TradeListingId
  readonly vin: string
  readonly make: string
  readonly model: string
  readonly year: number
  readonly trim: string | null
  readonly mileage: number
  readonly condition: VehicleCondition
  readonly transmission: VehicleTransmission
  readonly drivetrain: VehicleDrivetrain
  readonly fuelType: VehicleFuelType
  readonly exteriorColor: string | null
  readonly interiorColor: string | null
  readonly engineSize: string | null
  readonly metadata: Record<string, unknown>
  readonly createdAt: Date
  readonly updatedAt: Date
}

// ── Vehicle Doc ─────────────────────────────────────────────────────────────

export interface VehicleDoc {
  readonly id: string
  readonly entityId: string
  readonly listingId: TradeListingId
  readonly docType: VehicleDocType
  readonly title: string
  readonly storageKey: string
  readonly contentHash: string
  readonly uploadedBy: string
  readonly createdAt: Date
}

// ── Form data types ─────────────────────────────────────────────────────────

export interface VehicleListingFormData {
  vin: string
  make: string
  model: string
  year: number
  trim?: string
  mileage: number
  condition: VehicleCondition
  transmission: VehicleTransmission
  drivetrain: VehicleDrivetrain
  fuelType: VehicleFuelType
  exteriorColor?: string
  interiorColor?: string
  engineSize?: string
}

export interface VehicleDocUploadData {
  docType: VehicleDocType
  title: string
  storageKey: string
  contentHash: string
}

// ── Helper types ────────────────────────────────────────────────────────────

export interface DutyEstimate {
  readonly originCountry: string
  readonly destinationCountry: string
  readonly vehicleValue: string
  readonly currency: string
  readonly dutyRate: number
  readonly dutyAmount: string
  readonly vatRate: number
  readonly vatAmount: string
  readonly totalLandedCost: string
}

export interface ShippingLaneEstimate {
  readonly originCountry: string
  readonly destinationCountry: string
  readonly lane: string
  readonly estimatedCostUsd: string
  readonly estimatedTransitDays: number
  readonly carriers: string[]
}
