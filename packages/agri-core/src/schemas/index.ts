import { z } from 'zod'
import {
  CropType, UnitOfMeasure, ProducerStatus, LotStatus, BatchStatus,
  ShipmentStatus, PaymentPlanStatus, PaymentStatus, PaymentMethod,
  CertificationType, WarehouseStatus, AgriOrgRole,
} from '../enums'

// ─── Shared ───

export const uuidSchema = z.string().uuid()
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})
export const seasonSchema = z.string().min(1).max(20)
export const geoPointSchema = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
export const locationSchema = geoPointSchema.extend({
  region: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
})

// ─── Producer ───

export const createProducerSchema = z.object({
  name: z.string().min(1).max(300),
  contactPhone: z.string().max(30).nullable().default(null),
  contactEmail: z.string().email().nullable().default(null),
  location: locationSchema.nullable().default(null),
  cooperativeId: uuidSchema.nullable().default(null),
  metadata: z.record(z.unknown()).default({}),
})
export type CreateProducerInput = z.infer<typeof createProducerSchema>

export const updateProducerSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(300).optional(),
  contactPhone: z.string().max(30).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  location: locationSchema.nullable().optional(),
  cooperativeId: uuidSchema.nullable().optional(),
  status: z.enum([ProducerStatus.ACTIVE, ProducerStatus.INACTIVE, ProducerStatus.SUSPENDED]).optional(),
  metadata: z.record(z.unknown()).optional(),
})
export type UpdateProducerInput = z.infer<typeof updateProducerSchema>

// ─── Crop ───

export const createCropSchema = z.object({
  name: z.string().min(1).max(200),
  cropType: z.enum([CropType.COFFEE, CropType.COCOA, CropType.CASHEW, CropType.COTTON, CropType.SESAME, CropType.SOY, CropType.PALM_OIL, CropType.SPICE, CropType.OTHER]),
  unitOfMeasure: z.enum([UnitOfMeasure.KG, UnitOfMeasure.LB, UnitOfMeasure.MT, UnitOfMeasure.BAG_60KG, UnitOfMeasure.BAG_69KG, UnitOfMeasure.LITER]),
  baselineYieldPerHectare: z.number().nonnegative().nullable().default(null),
  metadata: z.record(z.unknown()).default({}),
})
export type CreateCropInput = z.infer<typeof createCropSchema>

// ─── Harvest ───

export const recordHarvestSchema = z.object({
  producerId: uuidSchema,
  cropId: uuidSchema,
  season: seasonSchema,
  harvestDate: z.string().date(),
  quantity: z.number().positive(),
  geoPoint: geoPointSchema.nullable().default(null),
  notes: z.string().max(2000).nullable().default(null),
})
export type RecordHarvestInput = z.infer<typeof recordHarvestSchema>

// ─── Lot ───

export const createLotSchema = z.object({
  cropId: uuidSchema,
  season: seasonSchema,
  harvestIds: z.array(uuidSchema).min(1),
})
export type CreateLotInput = z.infer<typeof createLotSchema>

// ─── Quality Inspection ───

export const inspectLotSchema = z.object({
  lotId: uuidSchema,
  defects: z.record(z.unknown()).default({}),
  notes: z.string().max(2000).nullable().default(null),
})
export type InspectLotInput = z.infer<typeof inspectLotSchema>

export const gradeLotSchema = z.object({
  lotId: uuidSchema,
  inspectionId: uuidSchema,
  grade: z.string().min(1).max(50),
  score: z.number().min(0).max(100),
})
export type GradeLotInput = z.infer<typeof gradeLotSchema>

export const certifyLotSchema = z.object({
  lotId: uuidSchema,
  certificationType: z.enum([
    CertificationType.ORGANIC, CertificationType.FAIRTRADE,
    CertificationType.RAINFOREST_ALLIANCE, CertificationType.UTZ,
    CertificationType.INTERNAL_QUALITY, CertificationType.EXPORT_GRADE,
  ]),
  certificateRef: z.string().max(200).nullable().default(null),
  metadata: z.record(z.unknown()).default({}),
})
export type CertifyLotInput = z.infer<typeof certifyLotSchema>

export const rejectLotSchema = z.object({
  lotId: uuidSchema,
  reason: z.string().min(1).max(2000),
})
export type RejectLotInput = z.infer<typeof rejectLotSchema>

// ─── Warehouse ───

export const createWarehouseSchema = z.object({
  name: z.string().min(1).max(200),
  location: locationSchema.nullable().default(null),
  capacity: z.number().positive().nullable().default(null),
})
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>

// ─── Batch ───

export const createBatchSchema = z.object({
  warehouseId: uuidSchema,
  cropId: uuidSchema,
  lotIds: z.array(uuidSchema).min(1),
})
export type CreateBatchInput = z.infer<typeof createBatchSchema>

export const allocateBatchSchema = z.object({
  batchId: uuidSchema,
  shipmentId: uuidSchema,
  weight: z.number().positive(),
})
export type AllocateBatchInput = z.infer<typeof allocateBatchSchema>

// ─── Shipment ───

export const createShipmentSchema = z.object({
  batchId: uuidSchema,
  destination: z.object({
    port: z.string().optional(),
    country: z.string().min(2).max(100),
    buyer: z.string().optional(),
  }),
  allocatedWeight: z.number().positive(),
  plannedDeparture: z.string().date().nullable().default(null),
  plannedArrival: z.string().date().nullable().default(null),
})
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>

export const updateMilestoneSchema = z.object({
  shipmentId: uuidSchema,
  milestone: z.string().min(1).max(100),
  notes: z.string().max(2000).nullable().default(null),
})
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>

// ─── Payment ───

export const generatePaymentPlanSchema = z.object({
  lotId: uuidSchema,
  totalAmount: z.number().positive(),
  currency: z.string().min(3).max(3),
})
export type GeneratePaymentPlanInput = z.infer<typeof generatePaymentPlanSchema>

export const executePaymentSchema = z.object({
  planId: uuidSchema,
  producerId: uuidSchema,
  amount: z.number().positive(),
  method: z.enum([
    PaymentMethod.MOBILE_MONEY, PaymentMethod.BANK_TRANSFER,
    PaymentMethod.CASH, PaymentMethod.CHECK, PaymentMethod.STRIPE,
  ]),
  reference: z.string().max(200).nullable().default(null),
})
export type ExecutePaymentInput = z.infer<typeof executePaymentSchema>

// ─── Inferred type helpers ───

export type PaginationInput = z.infer<typeof paginationSchema>
