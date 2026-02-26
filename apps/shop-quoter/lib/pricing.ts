/**
 * Pricing utilities — Shop Quoter app.
 *
 * Delegates to @nzila/pricing-engine for all tax and pricing calculations.
 * Provides UI-specific display config on top.
 */
import {
  calculateQuebecTaxes as _calculateQuebecTaxes,
  formatCurrency as _formatCurrency,
} from '@nzila/pricing-engine'

// Re-export so existing consumers don't break
export const GST_RATE = 0.05
export const QST_RATE = 0.09975

/** Calculate Quebec taxes for a given subtotal (delegates to pricing-engine). */
export function calculateQuebecTaxes(subtotal: number) {
  return _calculateQuebecTaxes(subtotal)
}

/** Format a number as CAD currency (delegates to pricing-engine). */
export function formatCAD(n: number): string {
  return _formatCurrency(n, 'CAD')
}

/** Tier display labels. */
export const TIER_LABELS: Record<string, string> = {
  BUDGET: 'Budget',
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
}

/** Status display config. */
export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  DRAFT: { label: 'Draft', color: 'text-gray-700', bg: 'bg-gray-100' },
  PRICING: { label: 'Pricing', color: 'text-blue-700', bg: 'bg-blue-100' },
  READY: { label: 'Ready', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  SENT: { label: 'Sent', color: 'text-purple-700', bg: 'bg-purple-100' },
  REVIEWING: { label: 'Reviewing', color: 'text-amber-700', bg: 'bg-amber-100' },
  ACCEPTED: { label: 'Accepted', color: 'text-green-700', bg: 'bg-green-100' },
  DECLINED: { label: 'Declined', color: 'text-red-700', bg: 'bg-red-100' },
  EXPIRED: { label: 'Expired', color: 'text-gray-500', bg: 'bg-gray-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-500', bg: 'bg-gray-100' },
}
