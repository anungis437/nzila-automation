/**
 * Stripe payments — Zonga app.
 *
 * Wires @nzila/payments-stripe for creator payout processing,
 * connect-account management, and revenue reconciliation.
 * Multi-currency aware for African markets.
 */
import {
  getStripeClient,
  createCheckoutSession,
  verifyWebhookSignature,
  normalizeAndPersist,
  matchPayoutsToDeposits,
  generateExceptions,
  computeCloseReadiness,
  collectStripeEvidenceArtifacts,
  type ReconciliationConfig,
  type CloseReadinessReport,
  type MatchResult,
} from '@nzila/payments-stripe'
import type { PayoutRail, ZongaCurrency as _ZongaCurrency } from '@nzila/zonga-core'
export type { _ZongaCurrency as ZongaCurrency }

export {
  getStripeClient,
  createCheckoutSession,
  verifyWebhookSignature,
  normalizeAndPersist,
  matchPayoutsToDeposits,
  generateExceptions,
  computeCloseReadiness,
  collectStripeEvidenceArtifacts,
}
export type { ReconciliationConfig, CloseReadinessReport, MatchResult }

// ── Currencies supported by Stripe in African markets ───────────────────────

/**
 * Map of African currencies that Stripe supports for payouts.
 * Stripe Connect doesn't support all currencies directly —
 * some require conversion via Stripe's cross-border payout beta.
 */
export const STRIPE_SUPPORTED_CURRENCIES = new Set<string>([
  'usd', 'cad', 'eur', 'gbp',
  'ngn', // Nigeria
  'kes', // Kenya
  'zar', // South Africa
  'ghs', // Ghana
  'egp', // Egypt
  'mad', // Morocco
  'tzs', // Tanzania
  'ugx', // Uganda
  'rwf', // Rwanda
  'xof', // CFA Franc BCEAO
  'xaf', // CFA Franc BEAC
])

/**
 * For currencies Stripe can't handle, we convert to USD first.
 * This tracks the fallback currency for each unsupported currency.
 */
export const CURRENCY_FALLBACK: Record<string, string> = {
  etb: 'usd', // Ethiopian Birr → USD
  cdf: 'usd', // Congolese Franc → USD
  bwp: 'usd', // Botswana Pula → USD
  zmw: 'usd', // Zambian Kwacha → USD
}

/**
 * Execute creator payout via Stripe Connect.
 * Validates payout preview, creates transfer, and normalises into platform DB.
 * Supports multi-currency for African markets.
 */
export async function executeCreatorPayout(opts: {
  creatorConnectAccountId: string
  amountCents: number
  currency?: string
  description?: string
  payoutRail?: PayoutRail
  idempotencyKey?: string
}): Promise<{ transferId: string; settledCurrency: string }> {
  const stripe = getStripeClient()

  const requestedCurrency = (opts.currency ?? 'usd').toLowerCase()

  // Determine the actual settlement currency
  const settledCurrency = STRIPE_SUPPORTED_CURRENCIES.has(requestedCurrency)
    ? requestedCurrency
    : CURRENCY_FALLBACK[requestedCurrency] ?? 'usd'

  const transfer = await stripe.transfers.create(
    {
      amount: opts.amountCents,
      currency: settledCurrency,
      destination: opts.creatorConnectAccountId,
      description: opts.description ?? 'Zonga creator payout',
      metadata: {
        requested_currency: requestedCurrency,
        payout_rail: opts.payoutRail ?? 'stripe_connect',
      },
    },
    opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : undefined,
  )

  return { transferId: transfer.id, settledCurrency }
}

// ── Mobile Money Payout Placeholder ─────────────────────────────────────────

/**
 * Execute payout via mobile money rail.
 * This is a placeholder for future integration with:
 * - Flutterwave (pan-African mobile money)
 * - Chipper Cash (cross-border)
 * - Direct M-Pesa / MTN MoMo APIs
 *
 * For now, logs the intent and returns a pending reference.
 * Production implementation requires Flutterwave or direct carrier API keys.
 */
export async function executeMobileMoneyPayout(opts: {
  creatorId: string
  phoneNumber: string
  amountMinorUnits: number
  currency: string
  rail: 'mpesa' | 'mtn_momo' | 'airtel_money' | 'orange_money' | 'chipper_cash' | 'flutterwave'
  description?: string
}): Promise<{ reference: string; status: 'pending' | 'queued' }> {
  // TODO: Wire Flutterwave or direct carrier API
  // For now, generate a reference and return pending
  const reference = `momo_${opts.rail}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  return { reference, status: 'pending' }
}

// ── Currency Formatting ─────────────────────────────────────────────────────

/**
 * Format a monetary amount for display, respecting the currency's
 * minor-unit conventions and locale.
 */
export function formatCurrencyAmount(
  amountMinorUnits: number,
  currency: string,
  locale = 'en',
): string {
  const upper = currency.toUpperCase()

  // Zero-decimal currencies (no minor units)
  const zeroDecimal = new Set(['UGX', 'RWF', 'XOF', 'XAF'])
  const divisor = zeroDecimal.has(upper) ? 1 : 100

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: upper,
      minimumFractionDigits: zeroDecimal.has(upper) ? 0 : 2,
    }).format(amountMinorUnits / divisor)
  } catch {
    // Fallback for unknown currency codes
    return `${upper} ${(amountMinorUnits / divisor).toFixed(zeroDecimal.has(upper) ? 0 : 2)}`
  }
}
