/**
 * Payments helper — Partners app.
 *
 * Wraps @nzila/payments-stripe to provide partner-specific payment operations
 * such as commission payouts, partner billing, and payment verification.
 */
import {
  getStripeClient,
  createCheckoutSession,
  verifyWebhookSignature,
} from '@nzila/payments-stripe'

export { getStripeClient, createCheckoutSession, verifyWebhookSignature }

/**
 * Create a commission payout session for a partner.
 */
export async function createPartnerPayoutSession(opts: {
  partnerId: string
  amount: number
  currency?: string
  description: string
  successUrl: string
  cancelUrl: string
}) {
  const currency = opts.currency ?? 'usd'
  return createCheckoutSession({
    orgId: opts.partnerId,
    lineItems: [
      {
        name: opts.description,
        amountCents: Math.round(opts.amount * 100),
        quantity: 1,
      },
    ],
    successUrl: opts.successUrl,
    cancelUrl: opts.cancelUrl,
    metadata: {
      partnerId: opts.partnerId,
      type: 'commission_payout',
    },
  })
}
