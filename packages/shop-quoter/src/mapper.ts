/**
 * @nzila/shop-quoter — Data Mapper
 *
 * Pure functions that transform legacy ShopMoiÇa data structures into
 * NzilaOS commerce-core canonical types.
 *
 * Design rules:
 *  - Pure functions: no I/O, no DB, no side effects
 *  - Zod validation at the boundary (caller validates before calling mapper)
 *  - All legacy IDs preserved in `externalIds` / `metadata` for traceability
 *  - Deterministic: same input → same output (no randomness)
 *
 * Legacy source: shop_quoter_tool_v1-main (Supabase/React/Zoho)
 * Target: @nzila/commerce-core domain types
 *
 * @module @nzila/shop-quoter/mapper
 */
import { PricingTier, QuoteStatus, OrgRole } from '@nzila/commerce-core/enums'
import type { OrgContext, Customer } from '@nzila/commerce-core/types'
import type {
  CreateQuoteInput,
  QuoteLineInput,
} from '@nzila/commerce-services/quote'
import type {
  LegacyRequest,
  LegacyProposal,
  LegacyProposalItem,
  LegacyClient,
  LegacyZohoLead,
  ShopQuoterAdapterConfig,
  AdapterResult,
} from './types'

// ── Tier Mapping ────────────────────────────────────────────────────────────

const LEGACY_TIER_MAP: Record<string, PricingTier> = {
  budget: PricingTier.BUDGET,
  Budget: PricingTier.BUDGET,
  BUDGET: PricingTier.BUDGET,
  standard: PricingTier.STANDARD,
  Standard: PricingTier.STANDARD,
  STANDARD: PricingTier.STANDARD,
  premium: PricingTier.PREMIUM,
  Premium: PricingTier.PREMIUM,
  PREMIUM: PricingTier.PREMIUM,
} as const

/**
 * Map a legacy tier string to a PricingTier enum value.
 * Falls back to STANDARD if the tier string is unrecognised.
 */
export function mapLegacyTier(legacyTier: string): PricingTier {
  return LEGACY_TIER_MAP[legacyTier] ?? PricingTier.STANDARD
}

// ── Status Mapping ──────────────────────────────────────────────────────────

const LEGACY_STATUS_MAP: Record<string, QuoteStatus> = {
  new: QuoteStatus.DRAFT,
  draft: QuoteStatus.DRAFT,
  pending: QuoteStatus.DRAFT,
  in_progress: QuoteStatus.PRICING,
  pricing: QuoteStatus.PRICING,
  quoted: QuoteStatus.READY,
  ready: QuoteStatus.READY,
  sent: QuoteStatus.SENT,
  reviewing: QuoteStatus.REVIEWING,
  accepted: QuoteStatus.ACCEPTED,
  approved: QuoteStatus.ACCEPTED,
  won: QuoteStatus.ACCEPTED,
  declined: QuoteStatus.DECLINED,
  rejected: QuoteStatus.DECLINED,
  lost: QuoteStatus.DECLINED,
  expired: QuoteStatus.EXPIRED,
  cancelled: QuoteStatus.CANCELLED,
  canceled: QuoteStatus.CANCELLED,
} as const

/**
 * Map a legacy request/proposal status to a QuoteStatus enum value.
 * Falls back to DRAFT for unrecognised statuses.
 */
export function mapLegacyStatus(legacyStatus: string): QuoteStatus {
  const normalised = legacyStatus.toLowerCase().replace(/[\s-]/g, '_')
  return LEGACY_STATUS_MAP[normalised] ?? QuoteStatus.DRAFT
}

// ── Client → Customer Mapping ───────────────────────────────────────────────

/**
 * Map a legacy client record to a NzilaOS Customer shape.
 *
 * Key transformations:
 *  - `company_name` → `name`
 *  - Free-text `address` → structured `CustomerAddress` (best-effort parse)
 *  - Legacy `id` preserved in `externalIds.legacyClientId`
 */
export function mapLegacyClient(
  client: LegacyClient,
  orgId: string,
): AdapterResult<Omit<Customer, 'id' | 'updatedAt'>> {
  const warnings: string[] = []

  // Best-effort address parsing (legacy stores as single string)
  let address: Customer['address'] = null
  if (client.address) {
    const parts = client.address.split(',').map((s) => s.trim())
    if (parts.length >= 3) {
      address = {
        line1: parts[0] ?? '',
        city: parts[1] ?? '',
        province: parts[2] ?? 'QC',
        postalCode: parts[3] ?? '',
        country: 'CA',
      }
    } else {
      warnings.push(`Could not parse address for client ${client.id}: "${client.address}"`)
      address = {
        line1: client.address,
        city: '',
        province: 'QC',
        postalCode: '',
        country: 'CA',
      }
    }
  }

  return {
    ok: true,
    data: {
      orgId,
      name: client.company_name || client.contact_name,
      email: client.email,
      phone: client.phone,
      address,
      externalIds: {
        legacyClientId: client.id,
        legacyCreatedBy: client.created_by,
      },
      createdAt: client.created_at,
    },
    warnings,
  }
}

// ── Zoho Lead → Customer Mapping ────────────────────────────────────────────

/**
 * Map a Zoho CRM lead to a NzilaOS Customer shape.
 */
export function mapZohoLead(
  lead: LegacyZohoLead,
  orgId: string,
): AdapterResult<Omit<Customer, 'id' | 'updatedAt'>> {
  return {
    ok: true,
    data: {
      orgId,
      name: lead.company || lead.contact_name,
      email: lead.email,
      phone: lead.phone,
      address: null,
      externalIds: {
        zohoLeadId: lead.zoho_id,
        zohoSource: lead.source,
      },
      createdAt: new Date().toISOString(),
    },
    warnings: [],
  }
}

// ── Proposal Items → Quote Lines ────────────────────────────────────────────

/**
 * Map legacy proposal items to NzilaOS QuoteLineInput shapes.
 *
 * Key decisions:
 *  - `product_name` → `description` (NzilaOS uses descriptive lines)
 *  - `unit_cost` from legacy used directly (snapshot at quote time)
 *  - Featured items noted in metadata, not a top-level field
 */
export function mapProposalItems(
  items: readonly LegacyProposalItem[],
): QuoteLineInput[] {
  return items
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((item) => ({
      description: item.product_name,
      sku: item.sku ?? undefined,
      quantity: item.quantity,
      unitCost: item.unit_cost,
    }))
}

// ── Request + Proposal → CreateQuoteInput ───────────────────────────────────

/**
 * Map a legacy request + its best proposal into a CreateQuoteInput.
 *
 * If multiple proposals exist, pass the one desired (typically the
 * client-selected tier). This function handles a single proposal.
 */
export function mapRequestToQuoteInput(
  request: LegacyRequest,
  proposal: LegacyProposal | null,
  config: ShopQuoterAdapterConfig,
): AdapterResult<CreateQuoteInput> {
  const warnings: string[] = []

  // Determine tier from proposal or infer from budget range
  let tier: PricingTier = PricingTier.STANDARD
  if (proposal) {
    tier = mapLegacyTier(proposal.tier)
  } else if (request.budget_range) {
    const budget = request.budget_range.toLowerCase()
    if (budget.includes('budget') || budget.includes('low')) tier = PricingTier.BUDGET
    else if (budget.includes('premium') || budget.includes('high')) tier = PricingTier.PREMIUM
  }

  // Map lines
  const lines: QuoteLineInput[] = proposal
    ? mapProposalItems(proposal.items)
    : [{ description: request.title, quantity: request.box_count, unitCost: 0 }]

  if (!proposal) {
    warnings.push(`No proposal found for request ${request.id} — created placeholder line`)
  }

  if (proposal?.ai_assisted && config.flagAiAssistedForReview) {
    warnings.push(`Proposal ${proposal.id} was AI-assisted — flagged for review`)
  }

  const metadata: Record<string, unknown> = {
    legacyRequestId: request.id,
    legacyTheme: request.theme,
    legacyBudgetRange: request.budget_range,
    source: 'shop-quoter-migration',
  }

  if (proposal && config.preserveLegacyIds) {
    metadata.legacyProposalId = proposal.id
    metadata.legacyProposalVersion = proposal.version
    metadata.legacyAiAssisted = proposal.ai_assisted
  }

  const input: CreateQuoteInput = {
    customerId: request.client_id,
    pricingTier: tier,
    lines,
    notes: request.notes ?? undefined,
    validDays: config.defaultValidityDays,
    metadata,
  }

  return { ok: true, data: input, warnings }
}

// ── OrgContext Builder ──────────────────────────────────────────────────────

/**
 * Build an OrgContext for migration operations.
 */
export function buildMigrationContext(
  config: ShopQuoterAdapterConfig,
  requestId: string,
): OrgContext {
  return {
    orgId: config.defaultEntityId,
    actorId: config.migrationActorId,
    role: OrgRole.ADMIN,
    permissions: ['commerce:quote:create', 'commerce:quote:price', 'commerce:quote:transition'],
    requestId,
  }
}
