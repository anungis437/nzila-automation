/**
 * @nzila/trade-core — Enums
 *
 * All trade domain enums as const objects with extracted union types.
 * Values are lowercase snake_case strings.
 */

// ── Party Role ──────────────────────────────────────────────────────────────

export const TradePartyRole = {
  SELLER: 'seller',
  BUYER: 'buyer',
  BROKER: 'broker',
  AGENT: 'agent',
} as const
export type TradePartyRole = (typeof TradePartyRole)[keyof typeof TradePartyRole]

// ── Party Status ────────────────────────────────────────────────────────────

export const TradePartyStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  ARCHIVED: 'archived',
} as const
export type TradePartyStatus = (typeof TradePartyStatus)[keyof typeof TradePartyStatus]

// ── Listing Type ────────────────────────────────────────────────────────────

export const TradeListingType = {
  GENERIC: 'generic',
  VEHICLE: 'vehicle',
} as const
export type TradeListingType = (typeof TradeListingType)[keyof typeof TradeListingType]

// ── Listing Status ──────────────────────────────────────────────────────────

export const TradeListingStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  RESERVED: 'reserved',
  SOLD: 'sold',
  ARCHIVED: 'archived',
} as const
export type TradeListingStatus = (typeof TradeListingStatus)[keyof typeof TradeListingStatus]

// ── Listing Media Type ──────────────────────────────────────────────────────

export const TradeMediaType = {
  IMAGE: 'image',
  VIDEO: 'video',
  DOCUMENT: 'document',
} as const
export type TradeMediaType = (typeof TradeMediaType)[keyof typeof TradeMediaType]

// ── Deal Stage (FSM-managed) ────────────────────────────────────────────────

export const TradeDealStage = {
  LEAD: 'lead',
  QUALIFIED: 'qualified',
  QUOTED: 'quoted',
  ACCEPTED: 'accepted',
  FUNDED: 'funded',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const
export type TradeDealStage = (typeof TradeDealStage)[keyof typeof TradeDealStage]

// ── Quote Status ────────────────────────────────────────────────────────────

export const TradeQuoteStatus = {
  DRAFT: 'draft',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
  REVISED: 'revised',
} as const
export type TradeQuoteStatus = (typeof TradeQuoteStatus)[keyof typeof TradeQuoteStatus]

// ── Financing Status ────────────────────────────────────────────────────────

export const TradeFinancingStatus = {
  PROPOSED: 'proposed',
  ACCEPTED: 'accepted',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const
export type TradeFinancingStatus = (typeof TradeFinancingStatus)[keyof typeof TradeFinancingStatus]

// ── Shipment Status ─────────────────────────────────────────────────────────

export const TradeShipmentStatus = {
  PENDING: 'pending',
  BOOKED: 'booked',
  IN_TRANSIT: 'in_transit',
  CUSTOMS: 'customs',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const
export type TradeShipmentStatus = (typeof TradeShipmentStatus)[keyof typeof TradeShipmentStatus]

// ── Document Type ───────────────────────────────────────────────────────────

export const TradeDocType = {
  BILL_OF_SALE: 'bill_of_sale',
  INVOICE: 'invoice',
  PACKING_LIST: 'packing_list',
  CERTIFICATE_OF_ORIGIN: 'certificate_of_origin',
  CUSTOMS_DECLARATION: 'customs_declaration',
  INSPECTION_REPORT: 'inspection_report',
  EXPORT_CERTIFICATE: 'export_certificate',
  INSURANCE: 'insurance',
  OTHER: 'other',
} as const
export type TradeDocType = (typeof TradeDocType)[keyof typeof TradeDocType]

// ── Commission Status ───────────────────────────────────────────────────────

export const TradeCommissionStatus = {
  PENDING: 'pending',
  PREVIEWED: 'previewed',
  FINALIZED: 'finalized',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const
export type TradeCommissionStatus = (typeof TradeCommissionStatus)[keyof typeof TradeCommissionStatus]

// ── Org Role (trade-specific roles within an org) ───────────────────────────

export const TradeOrgRole = {
  ADMIN: 'admin',
  SELLER: 'seller',
  BUYER: 'buyer',
  BROKER: 'broker',
  VIEWER: 'viewer',
} as const
export type TradeOrgRole = (typeof TradeOrgRole)[keyof typeof TradeOrgRole]

// ── Evidence Type ───────────────────────────────────────────────────────────

export const TradeEvidenceType = {
  QUOTE_ACCEPTANCE: 'quote_acceptance',
  SHIPMENT_DOCS: 'shipment_docs',
  COMMISSION_SETTLEMENT: 'commission_settlement',
  DEAL_CLOSURE: 'deal_closure',
} as const
export type TradeEvidenceType = (typeof TradeEvidenceType)[keyof typeof TradeEvidenceType]

// ── Vehicle Condition (cars vertical — type exported for trade-cars) ────────

export const VehicleCondition = {
  NEW: 'new',
  USED: 'used',
  CERTIFIED_PRE_OWNED: 'certified_pre_owned',
  SALVAGE: 'salvage',
} as const
export type VehicleCondition = (typeof VehicleCondition)[keyof typeof VehicleCondition]

// ── Vehicle Transmission ────────────────────────────────────────────────────

export const VehicleTransmission = {
  AUTOMATIC: 'automatic',
  MANUAL: 'manual',
  CVT: 'cvt',
} as const
export type VehicleTransmission = (typeof VehicleTransmission)[keyof typeof VehicleTransmission]

// ── Vehicle Drivetrain ──────────────────────────────────────────────────────

export const VehicleDrivetrain = {
  FWD: 'fwd',
  RWD: 'rwd',
  AWD: 'awd',
  FOUR_WD: '4wd',
} as const
export type VehicleDrivetrain = (typeof VehicleDrivetrain)[keyof typeof VehicleDrivetrain]

// ── Vehicle Fuel Type ───────────────────────────────────────────────────────

export const VehicleFuelType = {
  GASOLINE: 'gasoline',
  DIESEL: 'diesel',
  ELECTRIC: 'electric',
  HYBRID: 'hybrid',
  PLUGIN_HYBRID: 'plugin_hybrid',
} as const
export type VehicleFuelType = (typeof VehicleFuelType)[keyof typeof VehicleFuelType]

// ── Vehicle Doc Type ────────────────────────────────────────────────────────

export const VehicleDocType = {
  BILL_OF_SALE: 'bill_of_sale',
  EXPORT_CERTIFICATE: 'export_certificate',
  INSPECTION_REPORT: 'inspection_report',
  TITLE: 'title',
  CARFAX: 'carfax',
  EMISSIONS_TEST: 'emissions_test',
  SAFETY_INSPECTION: 'safety_inspection',
  CUSTOMS_FORM: 'customs_form',
} as const
export type VehicleDocType = (typeof VehicleDocType)[keyof typeof VehicleDocType]
