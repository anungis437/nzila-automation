/**
 * @nzila/payments-stripe — Payment primitives
 *
 * Stripe SDK wrappers for customer creation, checkout sessions,
 * and refund execution. Used by the console API routes.
 */
import { getStripeClient } from './client'
import { getStripeEnv } from './env'
import type { NzilaStripeMetadata } from './types'
import type Stripe from 'stripe'

// ── Customer Creation ───────────────────────────────────────────────────────

export interface CreateCustomerInput {
  email: string
  name: string
  entityId: string
  ventureId?: string
  metadata?: Record<string, string>
}

export async function createCustomer(input: CreateCustomerInput): Promise<Stripe.Customer> {
  const stripe = getStripeClient()

  const metadata: NzilaStripeMetadata = {
    entity_id: input.entityId,
    ...(input.ventureId && { venture_id: input.ventureId }),
    ...input.metadata,
  }

  return stripe.customers.create({
    email: input.email,
    name: input.name,
    metadata: metadata as Stripe.MetadataParam,
  })
}

// ── Checkout Session Creation ───────────────────────────────────────────────

export interface CreateCheckoutSessionInput {
  entityId: string
  ventureId?: string
  customerId?: string
  lineItems: Array<{
    priceId?: string
    name?: string
    amountCents: number
    quantity: number
  }>
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient()
  const env = getStripeEnv()

  const metadata: NzilaStripeMetadata = {
    entity_id: input.entityId,
    ...(input.ventureId && { venture_id: input.ventureId }),
    ...input.metadata,
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = input.lineItems.map(
    (item) => {
      if (item.priceId) {
        return { price: item.priceId, quantity: item.quantity }
      }
      return {
        price_data: {
          currency: env.STRIPE_DEFAULT_CURRENCY.toLowerCase(),
          product_data: { name: item.name ?? 'Payment' },
          unit_amount: item.amountCents,
        },
        quantity: item.quantity,
      }
    },
  )

  return stripe.checkout.sessions.create({
    mode: 'payment',
    customer: input.customerId,
    line_items: lineItems,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: metadata as Stripe.MetadataParam,
  })
}

// ── Refund Execution ────────────────────────────────────────────────────────

export interface ExecuteRefundInput {
  paymentIntentId: string
  amountCents?: number
  reason?: Stripe.RefundCreateParams.Reason
}

/**
 * Execute a refund via Stripe API.
 * Only call this if the refund is BELOW the approval threshold,
 * or if it has been explicitly approved.
 */
export async function executeRefund(input: ExecuteRefundInput): Promise<Stripe.Refund> {
  const stripe = getStripeClient()

  return stripe.refunds.create({
    payment_intent: input.paymentIntentId,
    ...(input.amountCents !== undefined && { amount: input.amountCents }),
    ...(input.reason && { reason: input.reason }),
  })
}

/**
 * Check if a refund amount requires approval.
 */
export function requiresApproval(amountCents: number): boolean {
  const env = getStripeEnv()
  return amountCents >= env.STRIPE_REFUND_APPROVAL_THRESHOLD_CENTS
}
