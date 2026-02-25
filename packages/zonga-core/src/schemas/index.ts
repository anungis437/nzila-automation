/**
 * @nzila/zonga-core — Zod Validation Schemas
 *
 * API boundary validation for Zonga content platform entities.
 *
 * @module @nzila/zonga-core/schemas
 */
import { z } from 'zod'
import {
  CreatorStatus,
  AssetType,
  AssetStatus,
  ReleaseStatus,
  RevenueType,
  PayoutStatus,
  ZongaRole,
} from '../enums'

// ── Helpers ─────────────────────────────────────────────────────────────────

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [string, ...string[]]

// ── Creator ─────────────────────────────────────────────────────────────────

export const CreateCreatorSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().min(1).max(255),
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
  genre: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
})

export type CreateCreatorInput = z.infer<typeof CreateCreatorSchema>

// ── Content Asset ───────────────────────────────────────────────────────────

export const CreateContentAssetSchema = z.object({
  creatorId: z.string().uuid(),
  title: z.string().min(1).max(255),
  type: z.enum(enumValues(AssetType)),
  description: z.string().max(5000).optional(),
  genre: z.string().max(100).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type CreateContentAssetInput = z.infer<typeof CreateContentAssetSchema>

export const PublishAssetSchema = z.object({
  assetId: z.string().uuid(),
  storageUrl: z.string().url(),
  coverArtUrl: z.string().url().optional(),
})

export type PublishAssetInput = z.infer<typeof PublishAssetSchema>

// ── Release ─────────────────────────────────────────────────────────────────

export const CreateReleaseSchema = z.object({
  creatorId: z.string().uuid(),
  title: z.string().min(1).max(255),
  releaseDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type CreateReleaseInput = z.infer<typeof CreateReleaseSchema>

// ── Revenue Event ───────────────────────────────────────────────────────────

export const RecordRevenueEventSchema = z.object({
  creatorId: z.string().uuid(),
  assetId: z.string().uuid().optional(),
  type: z.enum(enumValues(RevenueType)),
  amount: z.number().min(0),
  currency: z.string().length(3).default('USD'),
  description: z.string().max(1000).optional(),
  externalRef: z.string().max(255).optional(),
  occurredAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type RecordRevenueEventInput = z.infer<typeof RecordRevenueEventSchema>

// ── Payout Preview ──────────────────────────────────────────────────────────

export const PayoutPreviewRequestSchema = z.object({
  creatorId: z.string().uuid(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  platformFeePercent: z.number().min(0).max(100).default(15),
})

export type PayoutPreviewRequestInput = z.infer<typeof PayoutPreviewRequestSchema>

// ── Org Context ─────────────────────────────────────────────────────────────

export const ZongaOrgContextSchema = z.object({
  entityId: z.string().uuid(),
  actorId: z.string().uuid(),
  role: z.enum(enumValues(ZongaRole)),
  permissions: z.array(z.string()),
  requestId: z.string().min(1),
})
