/**
 * @nzila/pricing-engine — Types
 *
 * Pricing-specific types that extend the commerce-core domain.
 * Pure value objects — no DB, no side effects.
 *
 * @module @nzila/pricing-engine
 */
import type { PricingTier } from '@nzila/commerce-core/enums'

// ── Inputs ──────────────────────────────────────────────────────────────────

export interface PricingItem {
  readonly productId: string
  readonly quantity: number
  readonly unitCost: number
}

export interface PricingTemplate {
  /** Margin targets per tier (percentage, e.g. 38.0 = 38%) */
  readonly budgetMarginTarget: number
  readonly standardMarginTarget: number
  readonly premiumMarginTarget: number

  /** Floor margins — minimums requiring approval if breached */
  readonly budgetMarginFloor: number
  readonly standardMarginFloor: number
  readonly premiumMarginFloor: number

  /** Fixed cost components per box (CAD) */
  readonly packagingCostPerBox: number
  readonly laborCostPerBox: number
  readonly shippingCostPerBox: number

  /** Tax rates */
  readonly gstRate: number // 0.05
  readonly qstRate: number // 0.09975
}

export interface VolumeTier {
  readonly minQuantity: number
  readonly discountPercent: number
}

// ── Outputs ─────────────────────────────────────────────────────────────────

export interface MarginCalculation {
  readonly tier: PricingTier
  readonly componentsCost: number
  readonly packagingCost: number
  readonly laborCost: number
  readonly shippingCost: number
  readonly totalCogs: number
  readonly targetMargin: number
  readonly priceBeforeTax: number
  readonly gstAmount: number
  readonly qstAmount: number
  readonly totalTax: number
  readonly finalPrice: number
  readonly actualMargin: number
  readonly marginAmount: number
  readonly isAboveFloor: boolean
}

export interface AllTiersResult {
  readonly budget: MarginCalculation
  readonly standard: MarginCalculation
  readonly premium: MarginCalculation
}

export interface BreakEvenResult {
  readonly minimumPrice: number
  readonly zeroMarginPrice: number
  readonly recommendedPrice: number
  readonly analysis: string
}

export interface TargetOptimizationResult {
  readonly pricePerBox: number
  readonly margin: number
  readonly adjustmentNeeded: boolean
  readonly suggestion: string
}

export interface TaxBreakdown {
  readonly gst: number
  readonly qst: number
  readonly total: number
  readonly finalPrice: number
}

export interface VolumeAnalysisRow {
  readonly quantity: number
  readonly discountPercent: number
  readonly pricePerBox: number
  readonly totalPrice: number
  readonly margin: number
}

export interface MarginFloorValidation {
  readonly isValid: boolean
  readonly floorMargin: number
  readonly message: string
}

// ── Result sum type ─────────────────────────────────────────────────────────

export type PricingResult<T> =
  | { readonly success: true; readonly data: T; readonly message?: string }
  | { readonly success: false; readonly error: string }
