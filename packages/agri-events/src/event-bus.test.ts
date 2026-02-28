import { describe, it, expect } from 'vitest'
import { createAgriEventBus, createAgriEvent } from './event-bus'
import { AgriEventTypes } from './event-types'

describe('AgriEventBus', () => {
  it('delivers events to typed handlers', async () => {
    const bus = createAgriEventBus()
    const received: string[] = []

    bus.on(AgriEventTypes.LOT_CREATED, async (event) => {
      received.push(event.type)
    })

    const event = createAgriEvent(
      AgriEventTypes.LOT_CREATED,
      { lotId: 'lot-1', cropId: 'crop-1' },
      { orgId: 'org-1', actorId: 'actor-1', correlationId: 'corr-1' },
    )

    await bus.emitAndWait(event)
    expect(received).toEqual(['agri.lot.created'])
  })

  it('delivers to wildcard handlers', async () => {
    const bus = createAgriEventBus()
    const received: string[] = []

    bus.onAny(async (event) => {
      received.push(event.type)
    })

    const event = createAgriEvent(
      AgriEventTypes.BATCH_CREATED,
      { batchId: 'batch-1' },
      { orgId: 'org-1', actorId: 'actor-1', correlationId: 'corr-1' },
    )

    await bus.emitAndWait(event)
    expect(received).toEqual(['agri.batch.created'])
  })

  it('unsubscribe removes handler', async () => {
    const bus = createAgriEventBus()
    const received: string[] = []

    const unsub = bus.on(AgriEventTypes.LOT_CERTIFIED, async (event) => {
      received.push(event.type)
    })

    unsub()

    const event = createAgriEvent(
      AgriEventTypes.LOT_CERTIFIED,
      { lotId: 'lot-1' },
      { orgId: 'org-1', actorId: 'actor-1', correlationId: 'corr-1' },
    )

    await bus.emitAndWait(event)
    expect(received).toEqual([])
  })

  it('clear removes all handlers', async () => {
    const bus = createAgriEventBus()
    const received: string[] = []

    bus.on(AgriEventTypes.PAYMENT_EXECUTED, async (event) => {
      received.push(event.type)
    })

    bus.clear()

    const event = createAgriEvent(
      AgriEventTypes.PAYMENT_EXECUTED,
      { paymentId: 'pay-1' },
      { orgId: 'org-1', actorId: 'actor-1', correlationId: 'corr-1' },
    )

    await bus.emitAndWait(event)
    expect(received).toEqual([])
  })
})
