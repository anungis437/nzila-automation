/**
 * @nzila/platform-commerce-org — Workflow policy utilities
 *
 * Quote ref generation, validity checks, and expiry logic driven by org config.
 */
import type { OrgCommerceSettings, OrgQuotePolicy } from './types'

export function generateQuoteRef(
  settings: OrgCommerceSettings,
  sequenceNumber: number,
  year?: number,
): string {
  const y = year ?? new Date().getFullYear()
  const seq = String(sequenceNumber).padStart(3, '0')
  return `${settings.quotePrefix}-${y}-${seq}`
}

export function generateInvoiceRef(
  settings: OrgCommerceSettings,
  sequenceNumber: number,
  year?: number,
): string {
  const y = year ?? new Date().getFullYear()
  const seq = String(sequenceNumber).padStart(3, '0')
  return `${settings.invoicePrefix}-${y}-${seq}`
}

export function generatePoRef(
  settings: OrgCommerceSettings,
  sequenceNumber: number,
  year?: number,
): string {
  const y = year ?? new Date().getFullYear()
  const seq = String(sequenceNumber).padStart(3, '0')
  return `${settings.poPrefix}-${y}-${seq}`
}

export function calculateExpiryDate(
  createdAt: Date,
  settings: OrgCommerceSettings,
): Date {
  const expiry = new Date(createdAt)
  expiry.setDate(expiry.getDate() + settings.quoteValidityDays)
  return expiry
}

export function isQuoteExpired(createdAt: Date, settings: OrgCommerceSettings): boolean {
  return new Date() > calculateExpiryDate(createdAt, settings)
}

export function requiresApproval(
  total: number,
  marginPercent: number,
  discountPercent: number,
  policy: OrgQuotePolicy,
): boolean {
  if (total >= policy.approvalThreshold) return true
  if (marginPercent < policy.minMarginPercent && policy.approvalRequiredBelowMargin) return true
  if (discountPercent > policy.maxDiscountWithoutApproval) return true
  return false
}
