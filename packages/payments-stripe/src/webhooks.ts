/**
 * @nzila/payments-stripe — Webhook signature verification + raw body parsing
 *
 * IMPORTANT: The webhook route must pass the RAW request body (Buffer)
 * for signature verification to work. Next.js body parsing must be
 * disabled for the webhook route.
 */
import type Stripe from 'stripe'
import { getStripeClient } from './client'
import { getStripeEnv } from './env'
import type { WebhookVerifyResult } from './types'

/**
 * Verify a Stripe webhook signature and parse the event.
 *
 * @param rawBody The raw request body as a Buffer or string
 * @param signature The `stripe-signature` header value
 * @returns Parsed event + validity flag, or throws on invalid signature
 */
export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signature: string,
): WebhookVerifyResult {
  const env = getStripeEnv()
  const stripe = getStripeClient()

  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    )
    return { event, signatureValid: true }
  } catch (err) {
    // Re-throw to let the caller handle it (return 400)
    throw new WebhookSignatureError(
      err instanceof Error ? err.message : 'Invalid webhook signature',
    )
  }
}

export class WebhookSignatureError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebhookSignatureError'
  }
}

/**
 * Extract entity ID from Stripe event metadata.
 * Falls back to a default entity ID if not present.
 */
export function extractEntityIdFromEvent(event: Stripe.Event): string | null {
  const obj = event.data.object as unknown as Record<string, unknown>

  // Check metadata on the object itself
  if (obj.metadata && typeof obj.metadata === 'object') {
    const meta = obj.metadata as Record<string, string>
    if (meta.org_id) return meta.org_id
  }

  // For charges, check the payment_intent metadata
  if ('payment_intent' in obj && typeof obj.payment_intent === 'object' && obj.payment_intent) {
    const pi = obj.payment_intent as Record<string, unknown>
    if (pi.metadata && typeof pi.metadata === 'object') {
      const meta = pi.metadata as Record<string, string>
      if (meta.org_id) return meta.org_id
    }
  }

  return null
}
