import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock getStripeClient and getStripeEnv
vi.mock('../client', () => ({
  getStripeClient: vi.fn(() => ({
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
    refunds: { create: vi.fn() },
  })),
}))

vi.mock('../env', () => ({
  getStripeEnv: vi.fn(() => ({
    STRIPE_SECRET_KEY: 'sk_test_abc',
    STRIPE_WEBHOOK_SECRET: 'whsec_secret',
    STRIPE_ENVIRONMENT: 'test',
    STRIPE_DEFAULT_CURRENCY: 'CAD',
    STRIPE_REFUND_APPROVAL_THRESHOLD_CENTS: 50000,
  })),
}))

import {
  createCustomer,
  createCheckoutSession,
  executeRefund,
  requiresApproval,
} from '../primitives'
import { getStripeClient } from '../client'

describe('requiresApproval', () => {
  it('returns true when amount >= threshold', () => {
    expect(requiresApproval(50000)).toBe(true)
    expect(requiresApproval(75000)).toBe(true)
  })

  it('returns false when amount < threshold', () => {
    expect(requiresApproval(49999)).toBe(false)
    expect(requiresApproval(0)).toBe(false)
  })
})

describe('createCustomer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls stripe.customers.create with correct params', async () => {
    const mockStripe = getStripeClient() as unknown as {
      customers: { create: ReturnType<typeof vi.fn> }
    }
    mockStripe.customers.create.mockResolvedValue({ id: 'cus_test' })

    const result = await createCustomer({
      email: 'test@example.com',
      name: 'Test User',
      entityId: 'entity_123',
    })

    expect(mockStripe.customers.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      name: 'Test User',
      metadata: { entity_id: 'entity_123' },
    })
    expect(result.id).toBe('cus_test')
  })

  it('includes venture_id in metadata when provided', async () => {
    const mockStripe = getStripeClient() as unknown as {
      customers: { create: ReturnType<typeof vi.fn> }
    }
    mockStripe.customers.create.mockResolvedValue({ id: 'cus_test2' })

    await createCustomer({
      email: 'a@b.com',
      name: 'Name',
      entityId: 'e1',
      ventureId: 'v1',
    })

    expect(mockStripe.customers.create).toHaveBeenCalledWith({
      email: 'a@b.com',
      name: 'Name',
      metadata: { entity_id: 'e1', venture_id: 'v1' },
    })
  })
})

describe('createCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates session with price_data for ad-hoc items', async () => {
    const mockStripe = getStripeClient() as unknown as {
      checkout: { sessions: { create: ReturnType<typeof vi.fn> } }
    }
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_test',
      url: 'https://checkout.stripe.com/session',
    })

    const result = await createCheckoutSession({
      entityId: 'ent1',
      lineItems: [{ name: 'Product', amountCents: 1000, quantity: 2 }],
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    })

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        metadata: { entity_id: 'ent1' },
        line_items: [
          {
            price_data: {
              currency: 'cad',
              product_data: { name: 'Product' },
              unit_amount: 1000,
            },
            quantity: 2,
          },
        ],
      }),
    )
    expect(result.url).toBe('https://checkout.stripe.com/session')
  })

  it('uses priceId when provided', async () => {
    const mockStripe = getStripeClient() as unknown as {
      checkout: { sessions: { create: ReturnType<typeof vi.fn> } }
    }
    mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_x' })

    await createCheckoutSession({
      entityId: 'ent1',
      lineItems: [{ priceId: 'price_abc', amountCents: 0, quantity: 1 }],
      successUrl: 'https://x.com/ok',
      cancelUrl: 'https://x.com/no',
    })

    const call = mockStripe.checkout.sessions.create.mock.calls[0][0]
    expect(call.line_items[0]).toEqual({ price: 'price_abc', quantity: 1 })
  })
})

describe('executeRefund', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls stripe.refunds.create with payment_intent', async () => {
    const mockStripe = getStripeClient() as unknown as {
      refunds: { create: ReturnType<typeof vi.fn> }
    }
    mockStripe.refunds.create.mockResolvedValue({ id: 're_test' })

    const result = await executeRefund({ paymentIntentId: 'pi_abc' })

    expect(mockStripe.refunds.create).toHaveBeenCalledWith({
      payment_intent: 'pi_abc',
    })
    expect(result.id).toBe('re_test')
  })

  it('includes optional amount and reason', async () => {
    const mockStripe = getStripeClient() as unknown as {
      refunds: { create: ReturnType<typeof vi.fn> }
    }
    mockStripe.refunds.create.mockResolvedValue({ id: 're_test2' })

    await executeRefund({
      paymentIntentId: 'pi_xyz',
      amountCents: 500,
      reason: 'requested_by_customer',
    })

    expect(mockStripe.refunds.create).toHaveBeenCalledWith({
      payment_intent: 'pi_xyz',
      amount: 500,
      reason: 'requested_by_customer',
    })
  })
})
