/**
 * @nzila/platform-event-fabric — Barrel Export
 */

// Types
export type {
  PlatformEventType,
  PlatformEventMetadata,
  PlatformEvent,
  PlatformEventHandler,
  PlatformEventBus,
  PlatformEventStore,
  EventSchemaDefinition,
  Unsubscribe,
} from './types'

export {
  PlatformEventTypes,
  PlatformEventMetadataSchema,
  PlatformEventSchema,
} from './types'

// Bus
export {
  createPlatformEventBus,
  createInMemoryEventStore,
  type CreateEventBusOptions,
} from './bus'

// Registry
export {
  registerEventType,
  getEventSchema,
  validateEventPayload,
  listEventSchemas,
  resetEventSchemaRegistry,
} from './registry'

// Builders
export { buildPlatformEvent, type BuildEventInput } from './builders'

// Schema (Drizzle)
export { platformEvents, eventSubscriptions } from './schema'
