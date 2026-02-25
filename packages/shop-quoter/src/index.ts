/**
 * @nzila/shop-quoter — Barrel Export
 *
 * Adapter package that bridges legacy ShopMoiÇa (Shop Quoter Tool V1)
 * into the NzilaOS commerce engine with full audit trail and org scoping.
 *
 * @module @nzila/shop-quoter
 */
export {
  createShopQuoterAdapter,
  type CustomerRepository,
} from './adapter'

export {
  mapLegacyTier,
  mapLegacyStatus,
  mapLegacyClient,
  mapZohoLead,
  mapProposalItems,
  mapRequestToQuoteInput,
  buildMigrationContext,
} from './mapper'

export {
  type LegacyRequest,
  type LegacyProposal,
  type LegacyProposalItem,
  type LegacyClient,
  type LegacyZohoLead,
  type ShopQuoterAdapterConfig,
  type AdapterResult,
  type BatchImportSummary,
  DEFAULT_ADAPTER_CONFIG,
  legacyRequestSchema,
  legacyProposalSchema,
  legacyProposalItemSchema,
  legacyClientSchema,
} from './types'
