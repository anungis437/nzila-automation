/**
 * @nzila/zonga-core — Enums & Status Codes
 *
 * Content platform domain enumerations.
 * No DB, no framework — pure TypeScript.
 *
 * @module @nzila/zonga-core/enums
 */

// ── Creator ─────────────────────────────────────────────────────────────────

export const CreatorStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated',
} as const
export type CreatorStatus = (typeof CreatorStatus)[keyof typeof CreatorStatus]

// ── Content Asset ───────────────────────────────────────────────────────────

export const AssetType = {
  TRACK: 'track',
  ALBUM: 'album',
  VIDEO: 'video',
  PODCAST: 'podcast',
} as const
export type AssetType = (typeof AssetType)[keyof typeof AssetType]

export const AssetStatus = {
  DRAFT: 'draft',
  PROCESSING: 'processing',
  REVIEW: 'review',
  PUBLISHED: 'published',
  TAKEN_DOWN: 'taken_down',
  ARCHIVED: 'archived',
} as const
export type AssetStatus = (typeof AssetStatus)[keyof typeof AssetStatus]

// ── Release ─────────────────────────────────────────────────────────────────

export const ReleaseStatus = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  RELEASED: 'released',
  WITHDRAWN: 'withdrawn',
} as const
export type ReleaseStatus = (typeof ReleaseStatus)[keyof typeof ReleaseStatus]

// ── Revenue ─────────────────────────────────────────────────────────────────

export const RevenueType = {
  STREAM: 'stream',
  DOWNLOAD: 'download',
  TIP: 'tip',
  SUBSCRIPTION_SHARE: 'subscription_share',
  TICKET_SALE: 'ticket_sale',
  MERCHANDISE: 'merchandise',
  SYNC_LICENSE: 'sync_license',
} as const
export type RevenueType = (typeof RevenueType)[keyof typeof RevenueType]

// ── Payout ──────────────────────────────────────────────────────────────────

export const PayoutStatus = {
  PENDING: 'pending',
  PREVIEWED: 'previewed',
  APPROVED: 'approved',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus]

// ── Ledger ──────────────────────────────────────────────────────────────────

export const LedgerEntryType = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  HOLD: 'hold',
  RELEASE: 'release',
} as const
export type LedgerEntryType = (typeof LedgerEntryType)[keyof typeof LedgerEntryType]

// ── Zonga Role (org-scoped) ─────────────────────────────────────────────────

export const ZongaRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CREATOR: 'creator',
  VIEWER: 'viewer',
} as const
export type ZongaRole = (typeof ZongaRole)[keyof typeof ZongaRole]
