/**
 * @nzila/platform-event-fabric — Unit Tests
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { z } from 'zod'
import {
  PlatformEventTypes,
  createPlatformEventBus,
  createInMemoryEventStore,
  registerEventType,
  getEventSchema,
  validateEventPayload,
  listEventSchemas,
  resetEventSchemaRegistry,
  buildPlatformEvent,
  _PlatformEventSchema,
} from './index'
import type { PlatformEvent } from './types'

const TENANT = '550e8400-e29b-41d4-a716-446655440000'

describe('platform-event-fabric', () => {
  beforeEach(() => {
    resetEventSchemaRegistry()
  })

  describe('event bus', () => {
    it('publishes and receives typed events', async () => {
      const bus = createPlatformEventBus()
      const received: PlatformEvent[] = []

      bus.subscribe(PlatformEventTypes.CASE_CREATED, (evt) => {
        received.push(evt)
      })

      const event = buildPlatformEvent({
        type: PlatformEventTypes.CASE_CREATED,
        payload: { caseId: '123', title: 'Test case' },
        tenantId: TENANT,
        actorId: 'user-1',
        source: 'test',
      })

      await bus.publish(event)

      expect(received).toHaveLength(1)
      expect(received[0].type).toBe('case.created')
    })

    it('supports global subscribers', async () => {
      const bus = createPlatformEventBus()
      const all: PlatformEvent[] = []

      bus.subscribeAll((evt) => {
        all.push(evt)
      })

      await bus.publish(
        buildPlatformEvent({
          type: PlatformEventTypes.LEAD_CREATED,
          payload: {},
          tenantId: TENANT,
          actorId: 'user-1',
          source: 'test',
        }),
      )

      await bus.publish(
        buildPlatformEvent({
          type: PlatformEventTypes.DOCUMENT_UPLOADED,
          payload: {},
          tenantId: TENANT,
          actorId: 'user-1',
          source: 'test',
        }),
      )

      expect(all).toHaveLength(2)
    })

    it('supports unsubscribe', async () => {
      const bus = createPlatformEventBus()
      const received: PlatformEvent[] = []

      const unsub = bus.subscribe(PlatformEventTypes.PAYMENT_RECEIVED, (evt) => {
        received.push(evt)
      })

      await bus.publish(
        buildPlatformEvent({
          type: PlatformEventTypes.PAYMENT_RECEIVED,
          payload: {},
          tenantId: TENANT,
          actorId: 'user-1',
          source: 'test',
        }),
      )

      unsub()

      await bus.publish(
        buildPlatformEvent({
          type: PlatformEventTypes.PAYMENT_RECEIVED,
          payload: {},
          tenantId: TENANT,
          actorId: 'user-1',
          source: 'test',
        }),
      )

      expect(received).toHaveLength(1)
    })

    it('replays events from store', async () => {
      const store = createInMemoryEventStore()
      const bus = createPlatformEventBus({ store })

      const t0 = new Date('2026-01-01').toISOString()

      await bus.publish(
        buildPlatformEvent({
          type: PlatformEventTypes.CASE_CREATED,
          payload: { caseId: 'c1' },
          tenantId: TENANT,
          actorId: 'user-1',
          source: 'test',
        }),
      )

      const events = await bus.replay(PlatformEventTypes.CASE_CREATED, t0)
      expect(events).toHaveLength(1)
    })
  })

  describe('event schema registry', () => {
    it('registers and retrieves schemas', () => {
      registerEventType({
        eventType: PlatformEventTypes.LEAD_CREATED,
        version: 1,
        description: 'A new lead was created',
        payloadSchema: z.object({ leadId: z.string(), source: z.string() }),
      })

      const schema = getEventSchema(PlatformEventTypes.LEAD_CREATED)
      expect(schema).toBeDefined()
      expect(schema!.version).toBe(1)
    })

    it('validates event payload against schema', () => {
      registerEventType({
        eventType: PlatformEventTypes.PAYMENT_RECEIVED,
        version: 1,
        description: 'Payment received',
        payloadSchema: z.object({ amount: z.number(), currency: z.string() }),
      })

      expect(
        validateEventPayload(PlatformEventTypes.PAYMENT_RECEIVED, {
          amount: 100,
          currency: 'USD',
        }).success,
      ).toBe(true)

      expect(
        validateEventPayload(PlatformEventTypes.PAYMENT_RECEIVED, {
          amount: 'not-a-number',
        }).success,
      ).toBe(false)
    })

    it('lists all registered schemas', () => {
      registerEventType({
        eventType: PlatformEventTypes.LEAD_CREATED,
        version: 1,
        description: 'Lead created',
        payloadSchema: z.object({}),
      })
      registerEventType({
        eventType: PlatformEventTypes.CASE_CREATED,
        version: 1,
        description: 'Case created',
        payloadSchema: z.object({}),
      })

      const schemas = listEventSchemas()
      expect(schemas).toHaveLength(2)
    })
  })

  describe('buildPlatformEvent', () => {
    it('builds a valid event', () => {
      const event = buildPlatformEvent({
        type: PlatformEventTypes.DOCUMENT_UPLOADED,
        payload: { documentId: 'doc-1' },
        tenantId: TENANT,
        actorId: 'user-1',
        source: 'upload-service',
      })

      expect(event.type).toBe('document.uploaded')
      expect(event.metadata.tenantId).toBe(TENANT)
      expect(event.metadata.source).toBe('upload-service')
      expect(event.createdAt).toBeDefined()
    })
  })
})
