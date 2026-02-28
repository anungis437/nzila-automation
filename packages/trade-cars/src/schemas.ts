/**
 * @nzila/trade-cars — Zod schemas for vehicle data.
 */

import { z } from 'zod'
import {
  VehicleCondition,
  VehicleTransmission,
  VehicleDrivetrain,
  VehicleFuelType,
  VehicleDocType,
} from '@nzila/trade-core/enums'

export const vehicleListingSchema = z.object({
  vin: z
    .string()
    .min(11)
    .max(17)
    .regex(/^[A-HJ-NPR-Z0-9]+$/i, 'Invalid VIN characters'),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 2),
  trim: z.string().max(100).nullable().optional(),
  mileage: z.number().int().min(0),
  condition: z.enum([
    VehicleCondition.NEW,
    VehicleCondition.USED,
    VehicleCondition.CERTIFIED_PRE_OWNED,
    VehicleCondition.SALVAGE,
  ]),
  transmission: z.enum([
    VehicleTransmission.AUTOMATIC,
    VehicleTransmission.MANUAL,
    VehicleTransmission.CVT,
  ]),
  drivetrain: z.enum([
    VehicleDrivetrain.FWD,
    VehicleDrivetrain.RWD,
    VehicleDrivetrain.AWD,
    VehicleDrivetrain.FOUR_WD,
  ]),
  fuelType: z.enum([
    VehicleFuelType.GASOLINE,
    VehicleFuelType.DIESEL,
    VehicleFuelType.ELECTRIC,
    VehicleFuelType.HYBRID,
    VehicleFuelType.PLUGIN_HYBRID,
  ]),
  exteriorColor: z.string().max(50).nullable().optional(),
  interiorColor: z.string().max(50).nullable().optional(),
  engineSize: z.string().max(20).nullable().optional(),
})

export const vehicleDocUploadSchema = z.object({
  docType: z.enum([
    VehicleDocType.BILL_OF_SALE,
    VehicleDocType.EXPORT_CERTIFICATE,
    VehicleDocType.INSPECTION_REPORT,
    VehicleDocType.TITLE,
    VehicleDocType.CARFAX,
    VehicleDocType.EMISSIONS_TEST,
    VehicleDocType.SAFETY_INSPECTION,
    VehicleDocType.CUSTOMS_FORM,
  ]),
  title: z.string().min(1).max(300),
  storageKey: z.string().min(1),
  contentHash: z.string().min(1),
})

export type VehicleListingInput = z.infer<typeof vehicleListingSchema>
export type VehicleDocUploadInput = z.infer<typeof vehicleDocUploadSchema>
