import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createInstrumentedEventBus } from '../src/instrumented-bus'
import { createInMemoryEventStore } from '../src/bus'
import { buildPlatformEvent } from '../src/builders'

describe('createInstrumentedEventBus', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  function buildTestEvent(type = 'workflow.created' as const) {
    return buildPlatformEvent({
      type,
      payload: { name: 'test-workflow' },
      actor: 'test-user',
      source: 'test',
    })
  }

  it('publishes events through the inner bus', async () => {
    const store = createInMemoryEventStore()
    const bus = createInstrumentedEventBus({ store })

    const received: unknown[] = []
    bus.subscribe('workflow.created', async (e) => {
      received.push(e)
    })

    const event = buildTestEvent()
    await bus.publish(event)

    expect(received).toHaveLength(1)
    expect(received[0]).toMatchObject({ type: 'workflow.created' })
  })

  it('persists events to the store', async () => {
    const store = createInMemoryEventStore()
    const bus = createInstrumentedEventBus({ store })

    const event = buildTestEvent()
    await bus.publish(event)

    const replayed = await bus.replay('workflow.created', '2000-01-01')
    expect(replayed).toHaveLength(1)
  })

  it('captures handler errors without throwing', async () => {
    const errors: unknown[] = []
    const bus = createInstrumentedEventBus({
      onError(error) {
        errors.push(error)
      },
    })

    bus.subscribe('workflow.created', async () => {
      throw new Error('handler-boom')
    })

    const event = buildTestEvent()
    await bus.publish(event) // should not throw

    expect(errors).toHaveLength(1)
    expect((errors[0] as Error).message).toBe('handler-boom')
  })

  it('tracks subscriptions and unsubscriptions', () => {
    const bus = createInstrumentedEventBus()

    const unsub1 = bus.subscribe('workflow.created', async () => {})
    const unsub2 = bus.subscribeAll(async () => {})

    // Unsubscribe
    unsub1()
    unsub2()

    // No error — just verifying cleanup completes
    expect(true).toBe(true)
  })

  it('supports subscribeAll', async () => {
    const bus = createInstrumentedEventBus()

    const received: string[] = []
    bus.subscribeAll(async (e) => {
      received.push(e.type)
    })

    await bus.publish(buildTestEvent('workflow.created'))
    await bus.publish(buildTestEvent('workflow.completed'))

    expect(received).toEqual(['workflow.created', 'workflow.completed'])
  })

  it('replays events from store', async () => {
    const store = createInMemoryEventStore()
    const bus = createInstrumentedEventBus({ store })

    await bus.publish(buildTestEvent())
    await bus.publish(buildTestEvent())

    const events = await bus.replay('workflow.created', '2000-01-01')
    expect(events).toHaveLength(2)
  })

  it('replay returns empty when no store', async () => {
    const bus = createInstrumentedEventBus()
    const events = await bus.replay('workflow.created', '2000-01-01')
    expect(events).toEqual([])
  })

  it('clear empties all handlers', async () => {
    const bus = createInstrumentedEventBus()
    const received: unknown[] = []
    bus.subscribe('workflow.created', async (e) => received.push(e))

    bus.clear()
    await bus.publish(buildTestEvent())

    expect(received).toHaveLength(0)
  })
})
