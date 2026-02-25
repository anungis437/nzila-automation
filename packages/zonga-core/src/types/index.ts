/**
 * @nzila/zonga-core — Domain Types
 *
 * All Zonga content platform domain types. No DB, no framework — pure TypeScript.
 * Nzila convention: org scoping uses "entityId" (the Nzila entity_id column).
 *
 * @module @nzila/zonga-core/types
 */
import type {
  CreatorStatus,
  AssetType,
  AssetStatus,
  ReleaseStatus,
  RevenueType,
  PayoutStatus,
  LedgerEntryType,
  ZongaRole,
} from '../enums'

// ── Branded Types ───────────────────────────────────────────────────────────

/** Unique creator reference. */
export type CreatorRef = string & { readonly __brand: 'CreatorRef' }

/** Unique content asset reference. */
export type AssetRef = string & { readonly __brand: 'AssetRef' }

// ── Context ─────────────────────────────────────────────────────────────────

/**
 * Zonga org context carried through every request.
 * entityId is the Nzila convention for org identity.
 */
export interface ZongaOrgContext {
  /** The org UUID (maps to entity_id in DB). */
  readonly entityId: string
  /** Authenticated user performing the action. */
  readonly actorId: string
  /** User's role within this org. */
  readonly role: ZongaRole
  /** Granular permission keys. */
  readonly permissions: readonly string[]
  /** Request-level correlation ID for tracing. */
  readonly requestId: string
}

// ── Creator ─────────────────────────────────────────────────────────────────

export interface Creator {
  readonly id: string
  readonly entityId: string
  readonly userId: string
  readonly displayName: string
  readonly bio: string | null
  readonly avatarUrl: string | null
  readonly status: CreatorStatus
  readonly genre: string | null
  readonly country: string | null
  readonly verified: boolean
  readonly createdAt: string
  readonly updatedAt: string
}

// ── Content Asset ───────────────────────────────────────────────────────────

export interface ContentAsset {
  readonly id: string
  readonly entityId: string
  readonly creatorId: string
  readonly title: string
  readonly type: AssetType
  readonly status: AssetStatus
  readonly description: string | null
  readonly storageUrl: string | null
  readonly coverArtUrl: string | null
  readonly durationSeconds: number | null
  readonly genre: string | null
  readonly metadata: Readonly<Record<string, unknown>>
  readonly publishedAt: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

// ── Release ─────────────────────────────────────────────────────────────────

export interface Release {
  readonly id: string
  readonly entityId: string
  readonly creatorId: string
  readonly title: string
  readonly status: ReleaseStatus
  readonly releaseDate: string | null
  readonly metadata: Readonly<Record<string, unknown>>
  readonly createdAt: string
  readonly updatedAt: string
}

// ── Revenue Event (append-only ledger entry) ────────────────────────────────

export interface RevenueEvent {
  readonly id: string
  readonly entityId: string
  readonly creatorId: string
  readonly assetId: string | null
  readonly type: RevenueType
  readonly amount: number
  readonly currency: string
  readonly description: string | null
  readonly externalRef: string | null
  readonly metadata: Readonly<Record<string, unknown>>
  readonly occurredAt: string
  readonly createdAt: string
}

// ── Wallet Ledger Entry ─────────────────────────────────────────────────────

export interface WalletLedgerEntry {
  readonly id: string
  readonly entityId: string
  readonly creatorId: string
  readonly entryType: LedgerEntryType
  readonly amount: number
  readonly currency: string
  readonly description: string | null
  readonly revenueEventId: string | null
  readonly payoutId: string | null
  readonly balanceAfter: number
  readonly createdAt: string
}

// ── Payout ──────────────────────────────────────────────────────────────────

export interface Payout {
  readonly id: string
  readonly entityId: string
  readonly creatorId: string
  readonly amount: number
  readonly currency: string
  readonly status: PayoutStatus
  readonly periodStart: string
  readonly periodEnd: string
  readonly revenueEventCount: number
  readonly metadata: Readonly<Record<string, unknown>>
  readonly previewedAt: string | null
  readonly approvedAt: string | null
  readonly completedAt: string | null
  readonly failedReason: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

// ── Payout Preview (computed, not persisted) ────────────────────────────────

export interface PayoutPreview {
  readonly creatorId: string
  readonly entityId: string
  readonly periodStart: string
  readonly periodEnd: string
  readonly totalRevenue: number
  readonly platformFee: number
  readonly netPayout: number
  readonly currency: string
  readonly revenueEventCount: number
  readonly breakdown: readonly PayoutBreakdownItem[]
}

export interface PayoutBreakdownItem {
  readonly revenueType: RevenueType
  readonly eventCount: number
  readonly totalAmount: number
}
