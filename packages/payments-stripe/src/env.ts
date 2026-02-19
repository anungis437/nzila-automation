/**
 * @nzila/payments-stripe — Environment validation (Zod)
 *
 * Validates required Stripe env vars at server bootstrap.
 * Call `validateStripeEnv()` once during app initialization.
 */
import { z } from 'zod'

export const stripeEnvSchema = z.object({
  STRIPE_SECRET_KEY: z
    .string()
    .min(1, 'STRIPE_SECRET_KEY is required')
    .startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_'),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, 'STRIPE_WEBHOOK_SECRET is required')
    .startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_'),
  STRIPE_ENVIRONMENT: z.enum(['test', 'live']).default('test'),
  STRIPE_DEFAULT_CURRENCY: z.string().length(3).default('CAD'),
  STRIPE_REFUND_APPROVAL_THRESHOLD_CENTS: z.coerce.number().int().min(0).default(50000),
})

export type StripeEnv = z.infer<typeof stripeEnvSchema>

let _cachedEnv: StripeEnv | null = null

/**
 * Validate and return Stripe env vars.
 * Throws on first call if env is invalid. Caches result.
 */
export function getStripeEnv(): StripeEnv {
  if (_cachedEnv) return _cachedEnv

  const result = stripeEnvSchema.safeParse({
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_ENVIRONMENT: process.env.STRIPE_ENVIRONMENT,
    STRIPE_DEFAULT_CURRENCY: process.env.STRIPE_DEFAULT_CURRENCY,
    STRIPE_REFUND_APPROVAL_THRESHOLD_CENTS: process.env.STRIPE_REFUND_APPROVAL_THRESHOLD_CENTS,
  })

  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Stripe env validation failed:\n${formatted}`)
  }

  _cachedEnv = result.data
  return _cachedEnv
}

/**
 * Validate Stripe env eagerly. Call during server bootstrap.
 */
export function validateStripeEnv(): void {
  getStripeEnv()
}
