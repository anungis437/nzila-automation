/**
 * @nzila/platform-commerce-org — Pricing utilities
 *
 * Tax calculation and margin evaluation functions driven by org config.
 */
import type { OrgCommerceSettings, OrgQuotePolicy } from './types'

export interface TaxBreakdown {
  code: string
  label: string
  rate: number
  amount: string
}

export interface TaxResult {
  taxes: TaxBreakdown[]
  totalTax: string
  totalWithTax: string
}

export function calculateTaxes(subtotal: number, settings: OrgCommerceSettings): TaxResult {
  const taxes: TaxBreakdown[] = []
  let base = subtotal
  let totalTax = 0

  for (const tax of settings.taxConfig.taxes) {
    const taxableBase = tax.compounding ? base + totalTax : base
    const amount = Math.round(taxableBase * tax.rate * 100) / 100
    totalTax += amount
    taxes.push({
      code: tax.code,
      label: tax.label,
      rate: tax.rate,
      amount: amount.toFixed(2),
    })
  }

  return {
    taxes,
    totalTax: totalTax.toFixed(2),
    totalWithTax: (subtotal + totalTax).toFixed(2),
  }
}

export function getCombinedTaxRate(settings: OrgCommerceSettings): number {
  let combinedRate = 0
  let accumulated = 0
  for (const tax of settings.taxConfig.taxes) {
    if (tax.compounding) {
      combinedRate += (1 + accumulated) * tax.rate
    } else {
      combinedRate += tax.rate
    }
    accumulated += tax.rate
  }
  return combinedRate
}

export function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
}

export function evaluateMargin(
  costPrice: number,
  sellPrice: number,
  policy: OrgQuotePolicy,
): { marginPercent: number; meetsFloor: boolean; requiresApproval: boolean } {
  const marginPercent = sellPrice > 0 ? ((sellPrice - costPrice) / sellPrice) * 100 : 0
  const meetsFloor = marginPercent >= policy.minMarginPercent
  const requiresApproval = !meetsFloor && policy.approvalRequiredBelowMargin

  return { marginPercent, meetsFloor, requiresApproval }
}
