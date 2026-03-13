/**
 * @nzila/platform-commerce-org — Barrel export
 *
 * Org-native commerce configuration: schemas, types, defaults,
 * domain utilities, and the canonical service layer.
 */

// Types
export type {
  OrgCommerceSettings,
  OrgQuotePolicy,
  OrgPaymentPolicy,
  OrgSupplierPolicy,
  OrgCatalogPolicy,
  OrgBrandingConfig,
  OrgCommunicationTemplates,
  OrgTaxConfig,
  SupplierSelectionStrategy,
  MarkupStrategy,
  OrgCommerceConfig,
  OrgConfigChangeEvent,
} from './types'

// Zod schemas
export {
  OrgCommerceSettingsSchema,
  OrgQuotePolicySchema,
  OrgPaymentPolicySchema,
  OrgSupplierPolicySchema,
  OrgCatalogPolicySchema,
  OrgBrandingConfigSchema,
  OrgCommunicationTemplatesSchema,
  OrgTaxConfigSchema,
} from './schemas'

// Defaults
export {
  SHOPMOICA_ORG_ID,
  PROMONORTH_ORG_ID,
  SHOPMOICA_CONFIG,
  PROMONORTH_CONFIG,
  SHOPMOICA_SETTINGS,
  SHOPMOICA_QUOTE_POLICY,
  SHOPMOICA_PAYMENT_POLICY,
  SHOPMOICA_SUPPLIER_POLICY,
  SHOPMOICA_CATALOG_POLICY,
  SHOPMOICA_BRANDING,
  SHOPMOICA_COMMUNICATION_TEMPLATES,
  PROMONORTH_SETTINGS,
  PROMONORTH_QUOTE_POLICY,
  PROMONORTH_PAYMENT_POLICY,
  PROMONORTH_SUPPLIER_POLICY,
  PROMONORTH_CATALOG_POLICY,
  PROMONORTH_BRANDING,
  PROMONORTH_COMMUNICATION_TEMPLATES,
} from './defaults'

// Service
export {
  getOrgSettings,
  upsertOrgSettings,
  getOrgQuotePolicy,
  upsertOrgQuotePolicy,
  getOrgPaymentPolicy,
  upsertOrgPaymentPolicy,
  getOrgSupplierPolicy,
  upsertOrgSupplierPolicy,
  getOrgCatalogPolicy,
  upsertOrgCatalogPolicy,
  getOrgBranding,
  upsertOrgBranding,
  getOrgCommunicationTemplates,
  upsertOrgCommunicationTemplates,
  getOrgCommerceConfig,
} from './service'

// Domain utilities
export { resolveLogoInitials, resolveCopyrightNotice, resolveFooterText } from './branding'
export { calculateTaxes, getCombinedTaxRate, formatCurrency, evaluateMargin } from './pricing'
export { calculateDepositAmount, calculateDueDate, isProductionGated } from './payments'
export { rankSuppliers } from './suppliers'
export { applyMarkup, resolveCategory } from './catalog'
export {
  generateQuoteRef,
  generateInvoiceRef,
  generatePoRef,
  calculateExpiryDate,
  isQuoteExpired,
  requiresApproval,
} from './workflows'
export { buildConfigChangeEvent, getEventType, getSensitiveFields } from './audit'
export { renderTemplate, diffConfig } from './utils'
