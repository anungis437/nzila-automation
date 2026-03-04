/**
 * Platform Event Schema — Unit Tests
 *
 * Validates Zod schemas for event envelopes.
 */
import { describe, it, expect } from 'vitest'
import { validateEvent, safeValidateEvent, platformEventSchema } from '../schema'

// ── Helpers ─────────────────────────────────────────────────────────────────

function validEventPayload() {
  return {
    id: crypto.randomUUID(),
    type: 'test.event',
    schemaVersion: '1.0',
    payload: { foo: 'bar' },
    metadata: {
      orgId: crypto.randomUUID(),
      actorId: 'user_test',
      correlationId: crypto.randomUUID(),
      causationId: null,
      source: 'test',
      traceId: null,
      spanId: null,
    },
    createdAt: new Date().toISOString(),
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('platformEventSchema', () => {
  it('accepts a valid event', () => {
    const result = platformEventSchema.safeParse(validEventPayload())
    expect(result.success).toBe(true)
  })

  it('rejects missing id', () => {
    const event = validEventPayload()
    delete (event as Record<string, unknown>).id
    const result = platformEventSchema.safeParse(event)
    expect(result.success).toBe(false)
  })

  it('rejects invalid event type format', () => {
    const event = validEventPayload()
    event.type = 'Invalid-Type'
    const result = platformEventSchema.safeParse(event)
    expect(result.success).toBe(false)
  })

  it('rejects invalid schema version format', () => {
    const event = validEventPayload()
    event.schemaVersion = 'bad'
    const result = platformEventSchema.safeParse(event)
    expect(result.success).toBe(false)
  })

  it('rejects missing orgId in metadata', () => {
    const event = validEventPayload()
    delete (event.metadata as Record<string, unknown>).orgId
    const result = platformEventSchema.safeParse(event)
    expect(result.success).toBe(false)
  })

  it('accepts null causationId, traceId, spanId', () => {
    const event = validEventPayload()
    event.metadata.causationId = null
    event.metadata.traceId = null
    event.metadata.spanId = null
    const result = platformEventSchema.safeParse(event)
    expect(result.success).toBe(true)
  })
})

describe('validateEvent', () => {
  it('returns validated event for valid input', () => {
    const input = validEventPayload()
    const validated = validateEvent(input)
    expect(validated.id).toBe(input.id)
  })

  it('throws ZodError for invalid input', () => {
    expect(() => validateEvent({})).toThrow()
  })
})

describe('safeValidateEvent', () => {
  it('returns success for valid input', () => {
    const result = safeValidateEvent(validEventPayload())
    expect(result.success).toBe(true)
  })

  it('returns error for invalid input', () => {
    const result = safeValidateEvent({ bad: true })
    expect(result.success).toBe(false)
  })
})
