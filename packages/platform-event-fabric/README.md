# @nzila/platform-event-fabric

Platform-wide event backbone for NzilaOS.

## Purpose

Every meaningful system action is representable as a strongly-typed event with schema validation, publish/subscribe, persistence, and replay.

## Usage

```ts
import {
  PlatformEventTypes,
  createPlatformEventBus,
  createInMemoryEventStore,
  buildPlatformEvent,
  registerEventType,
} from '@nzila/platform-event-fabric'

const store = createInMemoryEventStore()
const bus = createPlatformEventBus({ store })

// Subscribe
bus.subscribe(PlatformEventTypes.CASE_CREATED, async (event) => {
  console.log('Case created:', event.payload)
})

// Publish
await bus.publish(
  buildPlatformEvent({
    type: PlatformEventTypes.CASE_CREATED,
    payload: { caseId: '123' },
    tenantId: 'tenant-uuid',
    actorId: 'user-uuid',
    source: 'mobility-api',
  }),
)

// Replay
const events = await bus.replay(PlatformEventTypes.CASE_CREATED, '2026-01-01T00:00:00Z')
```
