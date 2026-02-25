/**
 * @nzila/pricing-engine — Core Calculations
 *
 * Pure-function pricing calculations with Quebec tax compliance.
 * Zero DB access. Deterministic inputs → deterministic outputs.
 *
 * Extracted from legacy shop_quoter_tool_v1-main/src/lib/margin-solver.ts
 * and promoted to a first-class NzilaOS package.
 *
 * Key formula:
 *   COGS = Σ(item.unitCost × item.quantity) + (packaging + labor + shipping) × boxCount
 *   PriceBeforeTax = COGS ÷ (1 − targetMargin%)
 *   GST = PriceBeforeTax × gstRate
 *   QST = (PriceBeforeTax + GST) × qstRate   ← Quebec Revenue Agency rule
 *   FinalPrice = PriceBeforeTax + GST + QST
 *
 * @module @nzila/pricing-engine
 */
import { PricingTier } from '@nzila/commerce-core/enums'
import type {
  PricingItem,
  PricingTemplate,
  MarginCalculation,
  AllTiersResult,
  BreakEvenResult,
  TargetOptimizationResult,
  TaxBreakdown,
  VolumeTier,
  VolumeAnalysisRow,
  MarginFloorValidation,
  PricingResult,
} from './types'

// ── Internal helpers ────────────────────────────────────────────────────────

function getTargetMargin(tier: PricingTier, t: PricingTemplate): number {
  switch (tier) {
    case PricingTier.BUDGET:
      return t.budgetMarginTarget
    case PricingTier.STANDARD:
      return t.standardMarginTarget
    case PricingTier.PREMIUM:
      return t.premiumMarginTarget
    default:
      return t.standardMarginTarget
  }
}

function getFloorMargin(tier: PricingTier, t: PricingTemplate): number {
  switch (tier) {
    case PricingTier.BUDGET:
      return t.budgetMarginFloor
    case PricingTier.STANDARD:
      return t.standardMarginFloor
    case PricingTier.PREMIUM:
      return t.premiumMarginFloor
    default:
      return t.standardMarginFloor
  }
}

function getVolumeDiscount(boxCount: number): number {
  if (boxCount >= 500) return 15
  if (boxCount >= 250) return 10
  return 0
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Calculate exact tier pricing with Quebec tax compliance.
 */
export function calculateTierPricing(
  items: readonly PricingItem[],
  boxCount: number,
  tier: PricingTier,
  template: PricingTemplate,
): PricingResult<MarginCalculation> {
  // Input validation
  if (!items || items.length === 0) {
    return { success: false, error: 'Invalid input: items list cannot be empty' }
  }
  if (boxCount <= 0) {
    return { success: false, error: 'Invalid input: boxCount must be positive' }
  }
  for (const item of items) {
    if (item.unitCost < 0) {
      return { success: false, error: 'Invalid input: negative costs not allowed' }
    }
    if (item.quantity <= 0) {
      return { success: false, error: 'Invalid input: item quantity must be positive' }
    }
  }
  if (
    template.packagingCostPerBox < 0 ||
    template.laborCostPerBox < 0 ||
    template.shippingCostPerBox < 0 ||
    template.gstRate < 0 ||
    template.qstRate < 0
  ) {
    return { success: false, error: 'Invalid pricing template: negative costs or tax rates not allowed' }
  }

  // 1. Components cost
  const componentsCost = items.reduce((sum, i) => sum + i.unitCost * i.quantity, 0)

  // 2. Fixed costs per box × box count
  const packagingCost = template.packagingCostPerBox * boxCount
  const laborCost = template.laborCostPerBox * boxCount
  const shippingCost = template.shippingCostPerBox * boxCount
  const totalCogs = componentsCost + packagingCost + laborCost + shippingCost

  // 3. Target + floor margins
  const targetMargin = getTargetMargin(tier, template)
  const floorMargin = getFloorMargin(tier, template)

  // 4. Price before tax (margin-up from COGS)
  const priceBeforeTax = totalCogs / (1 - targetMargin / 100)

  // 5. Quebec taxes: QST is on (base + GST) per Quebec Revenue Agency
  const gstAmount = priceBeforeTax * template.gstRate
  const qstAmount = (priceBeforeTax + gstAmount) * template.qstRate
  const totalTax = gstAmount + qstAmount
  let finalPrice = priceBeforeTax + totalTax

  // 6. Volume discounts
  const volumeDiscount = getVolumeDiscount(boxCount)
  if (volumeDiscount > 0) {
    finalPrice = finalPrice * (1 - volumeDiscount / 100)
  }

  // 7. Actual margin verification
  const actualMargin = ((priceBeforeTax - totalCogs) / priceBeforeTax) * 100
  const marginAmount = priceBeforeTax - totalCogs
  const isAboveFloor = actualMargin >= floorMargin

  return {
    success: true,
    data: {
      tier,
      componentsCost,
      packagingCost,
      laborCost,
      shippingCost,
      totalCogs,
      targetMargin,
      priceBeforeTax,
      gstAmount,
      qstAmount,
      totalTax,
      finalPrice,
      actualMargin,
      marginAmount,
      isAboveFloor,
    },
    message: isAboveFloor ? 'Margin calculation successful' : 'Warning: Below floor margin',
  }
}

/**
 * Calculate pricing for all three tiers in one call.
 */
export function calculateAllTiers(
  items: readonly PricingItem[],
  boxCount: number,
  template: PricingTemplate,
): PricingResult<AllTiersResult> {
  const budget = calculateTierPricing(items, boxCount, PricingTier.BUDGET, template)
  const standard = calculateTierPricing(items, boxCount, PricingTier.STANDARD, template)
  const premium = calculateTierPricing(items, boxCount, PricingTier.PREMIUM, template)

  if (!budget.success) return { success: false, error: `Budget tier failed: ${budget.error}` }
  if (!standard.success) return { success: false, error: `Standard tier failed: ${standard.error}` }
  if (!premium.success) return { success: false, error: `Premium tier failed: ${premium.error}` }

  return {
    success: true,
    data: { budget: budget.data, standard: standard.data, premium: premium.data },
  }
}

/**
 * Validate a margin against the configured floor for a tier.
 */
export function validateMarginFloor(
  actualMargin: number,
  tier: PricingTier,
  template: PricingTemplate,
): MarginFloorValidation {
  const floorMargin = getFloorMargin(tier, template)
  const isValid = actualMargin >= floorMargin
  return {
    isValid,
    floorMargin,
    message: isValid
      ? `Margin ${actualMargin.toFixed(2)}% exceeds floor of ${floorMargin}%`
      : `Margin ${actualMargin.toFixed(2)}% below floor of ${floorMargin}% — requires approval`,
  }
}

/**
 * Break-even analysis: what price yields zero margin, and what is recommended?
 */
export function calculateBreakEven(
  items: readonly PricingItem[],
  template: PricingTemplate,
): PricingResult<BreakEvenResult> {
  const componentsCost = items.reduce((sum, i) => sum + i.unitCost * i.quantity, 0)
  const fixedCosts =
    template.packagingCostPerBox + template.laborCostPerBox + template.shippingCostPerBox
  const totalCogs = componentsCost + fixedCosts

  const taxMultiplier = 1 + template.gstRate + template.qstRate + template.gstRate * template.qstRate

  const minimumPrice = totalCogs * taxMultiplier
  const standardMargin = template.standardMarginTarget
  const recommendedPrice = (totalCogs / (1 - standardMargin / 100)) * taxMultiplier

  return {
    success: true,
    data: {
      minimumPrice,
      zeroMarginPrice: totalCogs,
      recommendedPrice,
      analysis: [
        `Components: $${componentsCost.toFixed(2)}`,
        `Fixed Costs: $${fixedCosts.toFixed(2)}`,
        `Total COGS: $${totalCogs.toFixed(2)}`,
        `Break-even (with tax): $${minimumPrice.toFixed(2)}`,
        `Recommended (${standardMargin}% margin): $${recommendedPrice.toFixed(2)}`,
      ].join('\n'),
    },
  }
}

/**
 * Given a target total, calculate required per-box price and resulting margin.
 */
export function optimizeForTargetTotal(
  targetTotal: number,
  boxCount: number,
  items: readonly PricingItem[],
  template: PricingTemplate,
): PricingResult<TargetOptimizationResult> {
  const componentsCost = items.reduce((sum, i) => sum + i.unitCost * i.quantity, 0)
  const fixedCosts =
    template.packagingCostPerBox + template.laborCostPerBox + template.shippingCostPerBox
  const totalCogs = componentsCost + fixedCosts

  const pricePerBox = targetTotal / boxCount
  const taxMultiplier = 1 + template.gstRate + template.qstRate + template.gstRate * template.qstRate
  const basePricePerBox = pricePerBox / taxMultiplier
  const margin = ((basePricePerBox - totalCogs) / basePricePerBox) * 100

  const adjustmentNeeded = margin < template.budgetMarginFloor

  let suggestion: string
  if (adjustmentNeeded) {
    const recommendedPrice =
      (totalCogs / (1 - template.standardMarginTarget / 100)) * taxMultiplier
    suggestion = `Target too low. Recommended: $${recommendedPrice.toFixed(2)} per box for ${template.standardMarginTarget}% margin`
  } else if (margin > 50) {
    suggestion = 'Price may be too high for market acceptance'
  } else {
    suggestion = 'Target price achievable with good margin'
  }

  return {
    success: true,
    data: { pricePerBox: basePricePerBox, margin, adjustmentNeeded, suggestion },
  }
}

/**
 * Quebec tax calculation (standalone).
 * QST is calculated on (basePrice + GST) per Quebec Revenue Agency rules.
 */
export function calculateQuebecTaxes(
  basePrice: number,
  gstRate: number = 0.05,
  qstRate: number = 0.09975,
): TaxBreakdown {
  const gst = basePrice * gstRate
  const qst = (basePrice + gst) * qstRate
  return { gst, qst, total: gst + qst, finalPrice: basePrice + gst + qst }
}

/**
 * Reverse-calculate base price from a tax-inclusive final price.
 */
export function reverseCalculateBasePrice(
  finalPrice: number,
  gstRate: number = 0.05,
  qstRate: number = 0.09975,
): number {
  const taxMultiplier = 1 + gstRate + qstRate + gstRate * qstRate
  return finalPrice / taxMultiplier
}

/**
 * Compute volume discount analysis for multiple quantity tiers.
 */
export function calculateVolumeAnalysis(
  baseMargin: MarginCalculation,
  volumeTiers: readonly VolumeTier[],
): VolumeAnalysisRow[] {
  return volumeTiers.map((tier) => {
    const discountedPrice = baseMargin.finalPrice * (1 - tier.discountPercent / 100)
    const basePriceAfterDiscount =
      discountedPrice /
      (1 +
        baseMargin.gstAmount / baseMargin.priceBeforeTax +
        baseMargin.qstAmount / (baseMargin.priceBeforeTax + baseMargin.gstAmount))
    const newMargin =
      ((basePriceAfterDiscount - baseMargin.totalCogs) / basePriceAfterDiscount) * 100

    return {
      quantity: tier.minQuantity,
      discountPercent: tier.discountPercent,
      pricePerBox: discountedPrice,
      totalPrice: discountedPrice * tier.minQuantity,
      margin: newMargin,
    }
  })
}

/**
 * Format currency for display (CAD, fr-CA locale).
 */
export function formatCurrency(amount: number, currency: string = 'CAD'): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format percentage for display.
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}
