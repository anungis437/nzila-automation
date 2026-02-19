import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock getStripeClient and getStripeEnv before importing
vi.mock('../client', () => ({
  getStripeClient: vi.fn(() => ({
    webhooks: {
      constructEvent: vi.fn(),
    },
  })),
}))

vi.mock('../env', () => ({
  getStripeEnv: vi.fn(() => ({
    STRIPE_SECRET_KEY: 'sk_test_abc',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
    STRIPE_ENVIRONMENT: 'test',
    STRIPE_DEFAULT_CURRENCY: 'CAD',
    STRIPE_REFUND_APPROVAL_THRESHOLD_CENTS: 50000,
  })),
}))

import { verifyWebhookSignature, WebhookSignatureError, extractEntityIdFromEvent } from '../webhooks'
import { getStripeClient } from '../client'
import type Stripe from 'stripe'

describe('verifyWebhookSignature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns parsed event on valid signature', () => {
    const mockEvent = {
      id: 'evt_123',
      type: 'payment_intent.succeeded',
      data: { object: {} },
      created: 1700000000,
    } as unknown as Stripe.Event

    const mockStripe = getStripeClient() as unknown as {
      webhooks: { constructEvent: ReturnType<typeof vi.fn> }
    }
    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

    const result = verifyWebhookSignature(Buffer.from('body'), 'sig_header')
    expect(result.signatureValid).toBe(true)
    expect(result.event.id).toBe('evt_123')
  })

  it('throws WebhookSignatureError on invalid signature', () => {
    const mockStripe = getStripeClient() as unknown as {
      webhooks: { constructEvent: ReturnType<typeof vi.fn> }
    }
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    expect(() => verifyWebhookSignature(Buffer.from('body'), 'bad_sig')).toThrow(
      WebhookSignatureError,
    )
  })

  it('WebhookSignatureError has correct name', () => {
    const err = new WebhookSignatureError('bad')
    expect(err.name).toBe('WebhookSignatureError')
    expect(err.message).toBe('bad')
    expect(err).toBeInstanceOf(Error)
  })
})

describe('extractEntityIdFromEvent', () => {
  it('extracts entity_id from top-level metadata', () => {
    const event = {
      data: {
        object: {
          metadata: { entity_id: 'ent_123' },
        },
      },
    } as unknown as Stripe.Event

    expect(extractEntityIdFromEvent(event)).toBe('ent_123')
  })

  it('extracts entity_id from payment_intent metadata', () => {
    const event = {
      data: {
        object: {
          metadata: {},
          payment_intent: {
            metadata: { entity_id: 'ent_456' },
          },
        },
      },
    } as unknown as Stripe.Event

    expect(extractEntityIdFromEvent(event)).toBe('ent_456')
  })

  it('returns null when no metadata entity_id exists', () => {
    const event = {
      data: {
        object: {
          metadata: { other: 'value' },
        },
      },
    } as unknown as Stripe.Event

    expect(extractEntityIdFromEvent(event)).toBeNull()
  })

  it('returns null when no metadata at all', () => {
    const event = {
      data: {
        object: {},
      },
    } as unknown as Stripe.Event

    expect(extractEntityIdFromEvent(event)).toBeNull()
  })

  it('prefers top-level metadata over nested', () => {
    const event = {
      data: {
        object: {
          metadata: { entity_id: 'top_level' },
          payment_intent: {
            metadata: { entity_id: 'nested' },
          },
        },
      },
    } as unknown as Stripe.Event

    expect(extractEntityIdFromEvent(event)).toBe('top_level')
  })
})
