/**
 * Stripe client — UnionEyes.
 *
 * Delegates to @nzila/payments-stripe for a platform-managed Stripe client.
 * Kept as a thin re-export so existing `@/lib/stripe` imports continue to work.
 */
import { getStripeClient, verifyWebhookSignature } from '@nzila/payments-stripe'

export const stripe = getStripeClient()
export { verifyWebhookSignature }

// Re-export Stripe type for files that need it for type annotations
// eslint-disable-next-line no-restricted-imports -- this IS the stripe facade
export type { default as Stripe } from 'stripe'

