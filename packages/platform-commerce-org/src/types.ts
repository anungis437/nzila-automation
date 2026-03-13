/**
 * @nzila/platform-commerce-org — Type definitions
 *
 * Canonical types for all org-scoped commerce configuration.
 * Inferred from Zod schemas in schemas.ts.
 */
import { z } from 'zod'
import type {
  OrgCommerceSettingsSchema,
  OrgQuotePolicySchema,
  OrgPaymentPolicySchema,
  OrgSupplierPolicySchema,
  OrgCatalogPolicySchema,
  OrgBrandingConfigSchema,
  OrgCommunicationTemplatesSchema,
  OrgTaxConfigSchema,
} from './schemas'

// ── Inferred types ──────────────────────────────────────────────────────────

export type OrgCommerceSettings = z.infer<typeof OrgCommerceSettingsSchema>
export type OrgQuotePolicy = z.infer<typeof OrgQuotePolicySchema>
export type OrgPaymentPolicy = z.infer<typeof OrgPaymentPolicySchema>
export type OrgSupplierPolicy = z.infer<typeof OrgSupplierPolicySchema>
export type OrgCatalogPolicy = z.infer<typeof OrgCatalogPolicySchema>
export type OrgBrandingConfig = z.infer<typeof OrgBrandingConfigSchema>
export type OrgCommunicationTemplates = z.infer<typeof OrgCommunicationTemplatesSchema>
export type OrgTaxConfig = z.infer<typeof OrgTaxConfigSchema>

// ── Supplier selection strategies ───────────────────────────────────────────

export type SupplierSelectionStrategy = 'LOWEST_COST' | 'FASTEST' | 'BALANCED' | 'MANUAL'

// ── Markup strategies ───────────────────────────────────────────────────────

export type MarkupStrategy = 'FIXED_PERCENT' | 'TIERED' | 'MANUAL'

// ── Full org config (composite) ─────────────────────────────────────────────

export interface OrgCommerceConfig {
  settings: OrgCommerceSettings
  quotePolicy: OrgQuotePolicy
  paymentPolicy: OrgPaymentPolicy
  supplierPolicy: OrgSupplierPolicy
  catalogPolicy: OrgCatalogPolicy
  branding: OrgBrandingConfig
  communicationTemplates: OrgCommunicationTemplates
}

// ── Config change event ─────────────────────────────────────────────────────

export interface OrgConfigChangeEvent {
  orgId: string
  configType: keyof OrgCommerceConfig
  actorId: string
  timestamp: Date
  previousValue: unknown
  newValue: unknown
}
