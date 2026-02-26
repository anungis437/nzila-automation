/**
 * Zonga domain services — Zonga app.
 *
 * Wires @nzila/zonga-core for creator management, content assets,
 * revenue tracking, payout previews, and audit trail generation.
 * Extended with African regional enums, types, schemas.
 */
import {
  computePayoutPreview,
  buildZongaAuditEvent,
  ZongaAuditAction,
  ZongaEntityType,
  type ZongaAuditEvent,
} from '@nzila/zonga-core/services'

import {
  CreateCreatorSchema,
  CreateContentAssetSchema,
  PublishAssetSchema,
  CreateReleaseSchema,
  RecordRevenueEventSchema,
  PayoutPreviewRequestSchema,
  ZongaOrgContextSchema,
  AudioUploadMetaSchema,
  RoyaltySplitSchema,
  type CreateCreatorInput,
  type CreateContentAssetInput,
  type RecordRevenueEventInput,
  type PayoutPreviewRequestInput,
  type AudioUploadMetaInput,
  type RoyaltySplitInput,
} from '@nzila/zonga-core/schemas'

import {
  CreatorStatus,
  AssetType,
  AssetStatus,
  ReleaseStatus,
  RevenueType,
  PayoutStatus,
  PayoutRail,
  LedgerEntryType,
  ZongaCurrency,
  AfricanGenre,
  AudioQuality,
  ZongaLanguage,
  AfricanCountry,
} from '@nzila/zonga-core/enums'

import type {
  Creator,
  CreatorRegion,
  ContentAsset,
  Release,
  RevenueEvent,
  Payout,
  PayoutPreview,
  ZongaOrgContext,
  RoyaltySplit,
  AudioUploadResult,
} from '@nzila/zonga-core/types'

// ── Services ──
export {
  computePayoutPreview,
  buildZongaAuditEvent,
  ZongaAuditAction,
  ZongaEntityType,
}
export type { ZongaAuditEvent }

// ── Schemas (Zod validation) ──
export {
  CreateCreatorSchema,
  CreateContentAssetSchema,
  PublishAssetSchema,
  CreateReleaseSchema,
  RecordRevenueEventSchema,
  PayoutPreviewRequestSchema,
  ZongaOrgContextSchema,
  AudioUploadMetaSchema,
  RoyaltySplitSchema,
}
export type {
  CreateCreatorInput,
  CreateContentAssetInput,
  RecordRevenueEventInput,
  PayoutPreviewRequestInput,
  AudioUploadMetaInput,
  RoyaltySplitInput,
}

// ── Enums ──
export {
  CreatorStatus,
  AssetType,
  AssetStatus,
  ReleaseStatus,
  RevenueType,
  PayoutStatus,
  PayoutRail,
  LedgerEntryType,
  ZongaCurrency,
  AfricanGenre,
  AudioQuality,
  ZongaLanguage,
  AfricanCountry,
}

// ── Domain types ──
export type {
  Creator,
  CreatorRegion,
  ContentAsset,
  Release,
  RevenueEvent,
  Payout,
  PayoutPreview,
  ZongaOrgContext,
  RoyaltySplit,
  AudioUploadResult,
}
