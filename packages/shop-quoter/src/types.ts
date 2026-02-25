/**
 * @nzila/shop-quoter — Legacy Adapter Types
 *
 * Type definitions for bridging legacy ShopMoiÇa (Shop Quoter Tool V1)
 * data structures into the NzilaOS commerce engine.
 *
 * These types represent the *external* shapes from the legacy system.
 * The adapter maps them into @nzila/commerce-core canonical types.
 *
 * Legacy system: TypeScript/React/Supabase app with Zoho CRM integration.
 * Jurisdiction: Quebec, Canada (GST 5% + QST 9.975%)
 *
 * @module @nzila/shop-quoter/types
 */
import { z } from 'zod'

// ── Legacy Input Shapes ─────────────────────────────────────────────────────

/**
 * Legacy request record from `requests` table.
 * Maps to a NzilaOS Quote with status DRAFT.
 */
export interface LegacyRequest {
  /** Supabase UUID */
  readonly id: string
  /** Client ID (FK to `clients` table) */
  readonly client_id: string
  /** Request title / description */
  readonly title: string
  /** Number of gift boxes requested */
  readonly box_count: number
  /** Client-stated budget range */
  readonly budget_range: string | null
  /** Theme (e.g. "holiday", "corporate", "wellness") */
  readonly theme: string | null
  /** Free-form notes */
  readonly notes: string | null
  /** Request status string (legacy uses ad-hoc strings) */
  readonly status: string
  /** Created by user ID */
  readonly created_by: string
  /** ISO-8601 timestamp */
  readonly created_at: string
  /** ISO-8601 timestamp */
  readonly updated_at: string
}

/**
 * Legacy proposal from `proposals` table.
 * Maps to a NzilaOS QuoteVersion.
 */
export interface LegacyProposal {
  readonly id: string
  readonly request_id: string
  /** Tier: "Budget", "Standard", "Premium" */
  readonly tier: string
  /** Version number within this request */
  readonly version: number
  /** Line items */
  readonly items: readonly LegacyProposalItem[]
  /** Subtotal before tax */
  readonly subtotal: number
  /** GST amount */
  readonly gst_amount: number
  /** QST amount */
  readonly qst_amount: number
  /** Grand total */
  readonly total: number
  /** Margin percentage */
  readonly margin_percent: number
  /** Whether AI-assisted pricing was used */
  readonly ai_assisted: boolean
  /** Created timestamp */
  readonly created_at: string
}

/**
 * Legacy proposal item from `proposal_items` table.
 * Maps to a NzilaOS QuoteLine.
 */
export interface LegacyProposalItem {
  readonly id: string
  readonly proposal_id: string
  readonly product_id: string
  readonly product_name: string
  /** Optional SKU */
  readonly sku: string | null
  readonly quantity: number
  /** Cost per unit */
  readonly unit_cost: number
  /** Price per unit (after margin) */
  readonly unit_price: number
  /** Line total */
  readonly total_cost: number
  /** Display order */
  readonly display_order: number
  /** Whether this is a featured item */
  readonly is_featured: boolean
  /** Choice group (for interchangeable items) */
  readonly choice_group_id: string | null
}

/**
 * Legacy client from `clients` table.
 * Maps to NzilaOS Customer.
 */
export interface LegacyClient {
  readonly id: string
  readonly company_name: string
  readonly contact_name: string
  readonly email: string | null
  readonly phone: string | null
  /** Free-text address (not structured) */
  readonly address: string | null
  readonly notes: string | null
  readonly created_by: string
  readonly created_at: string
}

/**
 * Legacy Zoho CRM lead record.
 * Used for CRM-originated quote requests.
 */
export interface LegacyZohoLead {
  readonly zoho_id: string
  readonly company: string
  readonly contact_name: string
  readonly email: string
  readonly phone: string | null
  readonly source: string
  readonly status: string
  readonly estimated_value: number | null
}

// ── Adapter Configuration ───────────────────────────────────────────────────

/**
 * Configuration for the shop-quoter adapter.
 * Controls mapping behaviour and defaults.
 */
export interface ShopQuoterAdapterConfig {
  /** Default org entity ID when legacy data lacks one */
  readonly defaultEntityId: string
  /** Default actor ID for migrated data */
  readonly migrationActorId: string
  /** Whether to preserve legacy IDs as external refs */
  readonly preserveLegacyIds: boolean
  /** Default validity period in days for imported quotes */
  readonly defaultValidityDays: number
  /** Whether to flag AI-assisted proposals for review */
  readonly flagAiAssistedForReview: boolean
}

export const DEFAULT_ADAPTER_CONFIG: ShopQuoterAdapterConfig = {
  defaultEntityId: '',
  migrationActorId: 'system:migration',
  preserveLegacyIds: true,
  defaultValidityDays: 30,
  flagAiAssistedForReview: false,
} as const

// ── Adapter Result Types ────────────────────────────────────────────────────

/**
 * Result of a single record adaptation.
 */
export type AdapterResult<T> =
  | { readonly ok: true; readonly data: T; readonly warnings: readonly string[] }
  | { readonly ok: false; readonly error: string; readonly legacyId: string }

/**
 * Batch import summary.
 */
export interface BatchImportSummary {
  readonly totalRecords: number
  readonly successCount: number
  readonly failureCount: number
  readonly warningCount: number
  readonly failures: readonly { legacyId: string; error: string }[]
  readonly warnings: readonly { legacyId: string; message: string }[]
  readonly durationMs: number
}

// ── Zod Validation Schemas ──────────────────────────────────────────────────

/**
 * Validates incoming legacy request shape before transformation.
 */
export const legacyRequestSchema = z.object({
  id: z.string().min(1),
  client_id: z.string().min(1),
  title: z.string().min(1),
  box_count: z.number().int().min(1),
  budget_range: z.string().nullable().default(null),
  theme: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  status: z.string().min(1),
  created_by: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

/**
 * Validates incoming legacy proposal item shape.
 */
export const legacyProposalItemSchema = z.object({
  id: z.string().min(1),
  proposal_id: z.string().min(1),
  product_id: z.string().min(1),
  product_name: z.string().min(1),
  sku: z.string().nullable().default(null),
  quantity: z.number().int().min(1),
  unit_cost: z.number().nonnegative(),
  unit_price: z.number().nonnegative(),
  total_cost: z.number().nonnegative(),
  display_order: z.number().int().min(0),
  is_featured: z.boolean(),
  choice_group_id: z.string().nullable().default(null),
})

/**
 * Validates incoming legacy proposal shape.
 */
export const legacyProposalSchema = z.object({
  id: z.string().min(1),
  request_id: z.string().min(1),
  tier: z.string().min(1),
  version: z.number().int().min(1),
  items: z.array(legacyProposalItemSchema),
  subtotal: z.number().nonnegative(),
  gst_amount: z.number().nonnegative(),
  qst_amount: z.number().nonnegative(),
  total: z.number().nonnegative(),
  margin_percent: z.number(),
  ai_assisted: z.boolean(),
  created_at: z.string().datetime(),
})

/**
 * Validates incoming legacy client shape.
 */
export const legacyClientSchema = z.object({
  id: z.string().min(1),
  company_name: z.string().min(1),
  contact_name: z.string().min(1),
  email: z.string().email().nullable().default(null),
  phone: z.string().nullable().default(null),
  address: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  created_by: z.string().min(1),
  created_at: z.string().datetime(),
})
