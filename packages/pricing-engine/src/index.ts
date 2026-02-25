/**
 * @nzila/pricing-engine — Barrel Export
 *
 * @module @nzila/pricing-engine
 */
export {
  calculateTierPricing,
  calculateAllTiers,
  validateMarginFloor,
  calculateBreakEven,
  optimizeForTargetTotal,
  calculateQuebecTaxes,
  reverseCalculateBasePrice,
  calculateVolumeAnalysis,
  formatCurrency,
  formatPercentage,
} from './pricing-engine'

export type {
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
