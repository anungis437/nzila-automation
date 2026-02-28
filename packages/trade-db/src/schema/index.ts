/**
 * @nzila/trade-db — Schema re-export
 *
 * Re-exports the Drizzle trade schema tables from the canonical @nzila/db package.
 * This gives trade-db consumers a single import path for both repo interfaces and schema.
 *
 * Usage:
 *   import { tradeDeals, tradeParties } from '@nzila/trade-db/schema'
 */
export {
  // Core trade tables
  tradeParties,
  tradeListings,
  tradeListingMedia,
  tradeDeals,
  tradeQuotes,
  tradeFinancingTerms,
  tradeShipments,
  tradeDocuments,
  tradeCommissions,
  tradeEvidenceArtifacts,

  // Cars vertical tables
  tradeVehicleListings,
  tradeVehicleDocs,

  // Enums (pg enums)
  tradePartyRoleEnum,
  tradePartyStatusEnum,
  tradeListingTypeEnum,
  tradeListingStatusEnum,
  tradeMediaTypeEnum,
  tradeDealStageEnum,
  tradeQuoteStatusEnum,
  tradeFinancingStatusEnum,
  tradeShipmentStatusEnum,
  tradeDocTypeEnum,
  tradeCommissionStatusEnum,
  tradeEvidenceTypeEnum,
  vehicleConditionEnum,
  vehicleTransmissionEnum,
  vehicleDrivetrainEnum,
  vehicleFuelTypeEnum,
  vehicleDocTypeEnum,
} from '@nzila/db/schema'
