/**
 * @nzila/zonga-core — Domain Types
 *
 * All Zonga content platform domain types. No DB, no framework — pure TypeScript.
 * Nzila convention: org scoping uses "orgId" (the Nzila org_id column).
 *
 * @module @nzila/zonga-core/types
 */
import type {
  CreatorStatus,
  CreatorOnboardingStatus,
  AssetType,
  AssetStatus,
  ReleaseStatus,
  ReleaseType,
  RevenueType,
  PayoutStatus,
  PayoutRail,
  LedgerEntryType,
  ZongaRole,
  ZongaCurrency,
  ZongaLanguage,
  AfricanGenre,
  AudioQuality,
  EventStatus,
  TicketPurchaseStatus,
  PlaylistVisibility,
  PlaylistOwnerType,
  ListenerActivityType,
  FavoriteEntityType,
  ModerationCaseStatus,
  ModerationCaseType,
  PayoutPreviewStatus,
  NotificationType,
} from '../enums'

// ── Branded Types ───────────────────────────────────────────────────────────

/** Unique creator reference. */
export type CreatorRef = string & { readonly __brand: 'CreatorRef' }

/** Unique content asset reference. */
export type AssetRef = string & { readonly __brand: 'AssetRef' }

// ── Context ─────────────────────────────────────────────────────────────────

/**
 * Zonga org context carried through every request.
 *
 * `orgId` is the canonical field (aligns with @nzila/org).
 *
 * @see {@link @nzila/org OrgContext} for the canonical base type.
 */
export interface ZongaOrgContext {
  /** Organisation UUID — canonical field. */
  readonly orgId: string
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
  /** @deprecated Use ZongaOrgContext.orgId — entity-level orgId will be removed. */
  readonly orgId: string
  readonly userId: string
  readonly displayName: string
  readonly bio: string | null
  readonly avatarUrl: string | null
  readonly status: CreatorStatus
  readonly genre: string | null
  readonly country: string | null
  readonly verified: boolean
  /** Preferred UI / metadata language. */
  readonly language: ZongaLanguage | null
  /** African region code (e.g. 'west', 'east', 'southern'). */
  readonly region: CreatorRegion | null
  /** How the creator receives payouts. */
  readonly payoutRail: PayoutRail | null
  /** Mobile money phone number or payout account ref. */
  readonly payoutAccountRef: string | null
  /** Preferred payout currency. */
  readonly payoutCurrency: ZongaCurrency | null
  readonly createdAt: string
  readonly updatedAt: string
}

/** Broad geographic region within Africa for filtering and analytics. */
export type CreatorRegion = 'west' | 'east' | 'central' | 'southern' | 'north' | 'diaspora'

// ── Content Asset ───────────────────────────────────────────────────────────

export interface ContentAsset {
  readonly id: string
  readonly orgId: string
  readonly creatorId: string
  readonly title: string
  readonly type: AssetType
  readonly status: AssetStatus
  readonly description: string | null
  readonly storageUrl: string | null
  readonly coverArtUrl: string | null
  readonly durationSeconds: number | null
  readonly genre: string | null
  /** Content / lyrics language. */
  readonly language: ZongaLanguage | null
  /** Featured / collaborating artists. */
  readonly collaborators: readonly string[]
  /** ISRC code for distribution tracking. */
  readonly isrc: string | null
  /** SHA-256 fingerprint of the original uploaded file. */
  readonly audioFingerprint: string | null
  /** Available quality tiers for the encoded file. */
  readonly qualityTiers: readonly AudioQuality[]
  readonly metadata: Readonly<Record<string, unknown>>
  readonly publishedAt: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

// ── Release ─────────────────────────────────────────────────────────────────

export interface Release {
  readonly id: string
  readonly orgId: string
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
  readonly orgId: string
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
  readonly orgId: string
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
  readonly orgId: string
  readonly creatorId: string
  readonly amount: number
  readonly currency: string
  readonly status: PayoutStatus
  /** Rail used for this payout (M-Pesa, Stripe, bank, etc.). */
  readonly payoutRail: PayoutRail | null
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

// ── Collaborative Release Split ─────────────────────────────────────────────

/**
 * Defines how revenue from a release is split among collaborators.
 * Stored in release metadata, enforced at payout preview time.
 */
export interface RoyaltySplit {
  readonly creatorId: string
  readonly displayName: string
  readonly role: 'primary' | 'featured' | 'producer' | 'songwriter'
  /** Percentage of net revenue (must sum to 100 across all splits). */
  readonly sharePercent: number
}

// ── Upload Result ───────────────────────────────────────────────────────────

/** Result of uploading an audio file to blob storage. */
export interface AudioUploadResult {
  readonly blobPath: string
  readonly sha256: string
  readonly sizeBytes: number
  readonly durationSeconds: number | null
  readonly contentType: string
}

// ── Payout Preview (computed, not persisted) ────────────────────────────────

export interface PayoutPreview {
  readonly creatorId: string
  readonly orgId: string
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

// ── Creator Account ────────────────────────────────────────────────────────

export interface CreatorAccount {
  readonly id: string
  readonly orgId: string
  readonly creatorId: string
  readonly email: string
  readonly phone: string | null
  readonly onboardingStatus: CreatorOnboardingStatus
  readonly kycStatus: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

// ── Listener / Fan ─────────────────────────────────────────────────────────

export interface Listener {
  readonly id: string
  readonly orgId: string
  readonly displayName: string
  readonly email: string | null
  readonly city: string | null
  readonly country: string | null
  readonly preferencesJson: Readonly<Record<string, unknown>>
  readonly createdAt: string
  readonly updatedAt: string
}

export interface ListenerFollow {
  readonly id: string
  readonly orgId: string
  readonly listenerId: string
  readonly creatorId: string
  readonly createdAt: string
}

export interface ListenerFavorite {
  readonly id: string
  readonly orgId: string
  readonly listenerId: string
  readonly entityType: FavoriteEntityType
  readonly entityId: string
  readonly createdAt: string
}

export interface ListenerActivity {
  readonly id: string
  readonly orgId: string
  readonly listenerId: string
  readonly activityType: ListenerActivityType
  readonly entityType: string | null
  readonly entityId: string | null
  readonly metadataJson: Readonly<Record<string, unknown>>
  readonly createdAt: string
}

// ── Playlist ────────────────────────────────────────────────────────────────

export interface Playlist {
  readonly id: string
  readonly orgId: string
  readonly ownerType: PlaylistOwnerType
  readonly ownerId: string
  readonly title: string
  readonly description: string | null
  readonly visibility: PlaylistVisibility
  readonly createdAt: string
  readonly updatedAt: string
}

export interface PlaylistItem {
  readonly id: string
  readonly playlistId: string
  readonly entityType: string
  readonly entityId: string
  readonly position: number
  readonly createdAt: string
}

// ── Event / Ticketing ──────────────────────────────────────────────────────

export interface ZongaEvent {
  readonly id: string
  readonly orgId: string
  readonly creatorId: string | null
  readonly title: string
  readonly description: string | null
  readonly venue: string | null
  readonly city: string | null
  readonly country: string | null
  readonly startsAt: string
  readonly endsAt: string | null
  readonly status: EventStatus
  readonly ticketingStatus: string | null
  readonly imageUrl: string | null
  readonly metadata: Readonly<Record<string, unknown>>
  readonly createdAt: string
  readonly updatedAt: string
}

export interface TicketType {
  readonly id: string
  readonly orgId: string
  readonly eventId: string
  readonly ticketType: string
  readonly price: number
  readonly currency: string
  readonly quantityAvailable: number
  readonly createdAt: string
}

export interface TicketPurchase {
  readonly id: string
  readonly orgId: string
  readonly eventId: string
  readonly ticketTypeId: string
  readonly listenerId: string | null
  readonly stripeCheckoutSessionId: string | null
  readonly status: TicketPurchaseStatus
  readonly amount: number
  readonly currency: string
  readonly createdAt: string
  readonly confirmedAt: string | null
}

// ── Moderation / Integrity ─────────────────────────────────────────────────

export interface ModerationCase {
  readonly id: string
  readonly orgId: string
  readonly entityType: string
  readonly entityId: string
  readonly caseType: ModerationCaseType
  readonly status: ModerationCaseStatus
  readonly severity: string
  readonly notes: string | null
  readonly assignedTo: string | null
  readonly resolvedAt: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export interface IntegritySignal {
  readonly id: string
  readonly orgId: string
  readonly entityType: string
  readonly entityId: string
  readonly signalType: string
  readonly severity: string
  readonly explanation: string | null
  readonly metadataJson: Readonly<Record<string, unknown>>
  readonly createdAt: string
}

// ── Notification ────────────────────────────────────────────────────────────

export interface ZongaNotification {
  readonly id: string
  readonly orgId: string
  readonly userId: string
  readonly type: NotificationType
  readonly title: string
  readonly body: string | null
  readonly link: string | null
  readonly read: boolean
  readonly createdAt: string
}

// ── Release Track ───────────────────────────────────────────────────────────

export interface ReleaseTrack {
  readonly id: string
  readonly releaseId: string
  readonly assetId: string
  readonly trackNumber: number
  readonly titleOverride: string | null
  readonly createdAt: string
}

// ── Payout Preview (persisted) ─────────────────────────────────────────────

export interface PayoutPreviewRecord {
  readonly id: string
  readonly orgId: string
  readonly creatorId: string
  readonly periodStart: string
  readonly periodEnd: string
  readonly totalAmount: number
  readonly currency: string
  readonly status: PayoutPreviewStatus
  readonly createdAt: string
  readonly updatedAt: string
}
