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
  PayoutRail,
  ZongaRole,
  ZongaCurrency,
  ZongaLanguage,
  AfricanGenre,
  AudioQuality,
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
  language: z.enum(enumValues(ZongaLanguage)).optional(),
  region: z.enum(['west', 'east', 'central', 'southern', 'north', 'diaspora']).optional(),
  payoutRail: z.enum(enumValues(PayoutRail)).optional(),
  payoutAccountRef: z.string().max(255).optional(),
  payoutCurrency: z.enum(enumValues(ZongaCurrency)).optional(),
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
  language: z.enum(enumValues(ZongaLanguage)).optional(),
  collaborators: z.array(z.string().max(255)).max(20).optional(),
  isrc: z.string().max(15).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type CreateContentAssetInput = z.infer<typeof CreateContentAssetSchema>

export const PublishAssetSchema = z.object({
  assetId: z.string().uuid(),
  storageUrl: z.string().url(),
  coverArtUrl: z.string().url().optional(),
  audioFingerprint: z.string().optional(),
  qualityTiers: z.array(z.enum(enumValues(AudioQuality))).optional(),
})

export type PublishAssetInput = z.infer<typeof PublishAssetSchema>

// ── Release ─────────────────────────────────────────────────────────────────

/** Royalty split for a collaborator on a release. */
export const RoyaltySplitSchema = z.object({
  creatorId: z.string().uuid(),
  displayName: z.string().min(1).max(255),
  role: z.enum(['primary', 'featured', 'producer', 'songwriter']),
  sharePercent: z.number().min(0).max(100),
})

export type RoyaltySplitInput = z.infer<typeof RoyaltySplitSchema>

export const CreateReleaseSchema = z.object({
  creatorId: z.string().uuid(),
  title: z.string().min(1).max(255),
  releaseDate: z.string().datetime().optional(),
  royaltySplits: z.array(RoyaltySplitSchema).max(20).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type CreateReleaseInput = z.infer<typeof CreateReleaseSchema>

// ── Revenue Event ───────────────────────────────────────────────────────────

export const RecordRevenueEventSchema = z.object({
  creatorId: z.string().uuid(),
  assetId: z.string().uuid().optional(),
  type: z.enum(enumValues(RevenueType)),
  amount: z.number().min(0),
  currency: z.enum(enumValues(ZongaCurrency)).default('USD'),
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
  payoutRail: z.enum(enumValues(PayoutRail)).optional(),
  payoutCurrency: z.enum(enumValues(ZongaCurrency)).optional(),
})

export type PayoutPreviewRequestInput = z.infer<typeof PayoutPreviewRequestSchema>

// ── Audio Upload ────────────────────────────────────────────────────────────

/** Validates caller-supplied metadata for an audio file upload. */
export const AudioUploadMetaSchema = z.object({
  creatorId: z.string().uuid(),
  assetId: z.string().uuid(),
  fileName: z.string().min(1).max(500),
  contentType: z.enum([
    'audio/mpeg',
    'audio/mp4',
    'audio/aac',
    'audio/wav',
    'audio/flac',
    'audio/ogg',
    'audio/webm',
  ]),
  fileSizeBytes: z.number().int().min(1).max(500_000_000), // 500 MB limit
})

export type AudioUploadMetaInput = z.infer<typeof AudioUploadMetaSchema>

// ── Org Context ─────────────────────────────────────────────────────────────

export const ZongaOrgContextSchema = z.object({
  entityId: z.string().uuid(),
  actorId: z.string().uuid(),
  role: z.enum(enumValues(ZongaRole)),
  permissions: z.array(z.string()),
  requestId: z.string().min(1),
})
