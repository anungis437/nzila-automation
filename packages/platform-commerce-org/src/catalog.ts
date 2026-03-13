/**
 * @nzila/platform-commerce-org — Catalog policy utilities
 *
 * SKU mapping, markup calculation, and category resolution driven by org config.
 */
import type { OrgCatalogPolicy } from './types'

export function applyMarkup(
  cost: number,
  policy: OrgCatalogPolicy,
  tier?: 'budget' | 'standard' | 'premium',
): number {
  switch (policy.defaultMarkupStrategy) {
    case 'FIXED_PERCENT':
      return Math.round(cost * (1 + policy.defaultFixedMarkupPercent / 100) * 100) / 100
    case 'TIERED': {
      const multiplier = tier === 'premium' ? 2.0 : tier === 'budget' ? 1.25 : 1.5
      return Math.round(cost * multiplier * 100) / 100
    }
    case 'MANUAL':
      return cost
  }
}

export function resolveCategory(
  externalCategory: string,
  policy: OrgCatalogPolicy,
): string {
  return policy.categoryMappings[externalCategory] ?? externalCategory
}
