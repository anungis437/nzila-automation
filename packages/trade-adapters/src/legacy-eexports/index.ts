/**
 * Legacy eExports Cars Adapter
 *
 * Maps legacy eExports Django models to NzilaOS Trade domain objects.
 * This adapter is used during migration to transform old data into the new schema.
 */

import type {
  VehicleCondition,
  VehicleTransmission,
  VehicleDrivetrain,
  VehicleFuelType,
  VehicleDocType,
} from '@nzila/trade-core/enums'
import type { TradeListingId } from '@nzila/trade-core/types'

// ── Adapter-local output types (avoids importing from trade-cars) ───────

export interface MappedVehicleListing {
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

export interface MappedVehicleDoc {
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

// ── Legacy Django types (from nzila_eexports-main) ──────────────────────────

export interface LegacyEExportsVehicle {
  id: number
  organisation_id: number
  vin: string
  make: string
  model: string
  year: number
  trim?: string
  mileage?: number
  condition?: string
  transmission?: string
  drivetrain?: string
  fuel_type?: string
  exterior_color?: string
  interior_color?: string
  engine_size?: string
  title: string
  description?: string
  asking_price?: string
  currency?: string
  status?: string
  created_at: string
  updated_at: string
  extra_data?: Record<string, unknown>
}

export interface LegacyEExportsDoc {
  id: number
  vehicle_id: number
  organisation_id: number
  doc_type: string
  title: string
  file_path: string
  checksum?: string
  uploaded_by?: string
  created_at: string
}

// ── Mapping functions ───────────────────────────────────────────────────────

const CONDITION_MAP: Record<string, VehicleCondition> = {
  new: 'new',
  used: 'used',
  cpo: 'certified_pre_owned',
  certified_pre_owned: 'certified_pre_owned',
  salvage: 'salvage',
}

const TRANSMISSION_MAP: Record<string, VehicleTransmission> = {
  automatic: 'automatic',
  auto: 'automatic',
  manual: 'manual',
  cvt: 'cvt',
}

const DRIVETRAIN_MAP: Record<string, VehicleDrivetrain> = {
  fwd: 'fwd',
  rwd: 'rwd',
  awd: 'awd',
  '4wd': '4wd',
  '4x4': '4wd',
}

const FUEL_MAP: Record<string, VehicleFuelType> = {
  gasoline: 'gasoline',
  petrol: 'gasoline',
  gas: 'gasoline',
  diesel: 'diesel',
  electric: 'electric',
  hybrid: 'hybrid',
  plugin_hybrid: 'plugin_hybrid',
  phev: 'plugin_hybrid',
}

const DOC_TYPE_MAP: Record<string, VehicleDocType> = {
  bill_of_sale: 'bill_of_sale',
  bos: 'bill_of_sale',
  export_certificate: 'export_certificate',
  export_cert: 'export_certificate',
  inspection: 'inspection_report',
  inspection_report: 'inspection_report',
  title: 'title',
  carfax: 'carfax',
  history: 'carfax',
  emissions: 'emissions_test',
  emissions_test: 'emissions_test',
  safety: 'safety_inspection',
  safety_inspection: 'safety_inspection',
  customs: 'customs_form',
  customs_form: 'customs_form',
}

export function mapLegacyVehicle(
  legacy: LegacyEExportsVehicle,
  entityId: string,
  listingId: TradeListingId,
): MappedVehicleListing {
  return {
    id: crypto.randomUUID(),
    entityId,
    listingId,
    vin: legacy.vin,
    make: legacy.make,
    model: legacy.model,
    year: legacy.year,
    trim: legacy.trim ?? null,
    mileage: legacy.mileage ?? 0,
    condition: CONDITION_MAP[legacy.condition?.toLowerCase() ?? ''] ?? 'used',
    transmission: TRANSMISSION_MAP[legacy.transmission?.toLowerCase() ?? ''] ?? 'automatic',
    drivetrain: DRIVETRAIN_MAP[legacy.drivetrain?.toLowerCase() ?? ''] ?? 'rwd',
    fuelType: FUEL_MAP[legacy.fuel_type?.toLowerCase() ?? ''] ?? 'gasoline',
    exteriorColor: legacy.exterior_color ?? null,
    interiorColor: legacy.interior_color ?? null,
    engineSize: legacy.engine_size ?? null,
    metadata: legacy.extra_data ?? {},
    createdAt: new Date(legacy.created_at),
    updatedAt: new Date(legacy.updated_at),
  }
}

export function mapLegacyDoc(
  legacy: LegacyEExportsDoc,
  entityId: string,
  listingId: TradeListingId,
): MappedVehicleDoc {
  return {
    id: crypto.randomUUID(),
    entityId,
    listingId,
    docType: DOC_TYPE_MAP[legacy.doc_type?.toLowerCase() ?? ''] ?? 'bill_of_sale',
    title: legacy.title,
    storageKey: legacy.file_path,
    contentHash: legacy.checksum ?? '',
    uploadedBy: legacy.uploaded_by ?? 'migration',
    createdAt: new Date(legacy.created_at),
  }
}
