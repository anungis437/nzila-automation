/**
 * @nzila/platform-event-fabric — Event Schema Registry
 *
 * Central registry for event type schemas and versioning.
 */
import { z as _z } from 'zod'
import type { EventSchemaDefinition, PlatformEventType } from './types'

const schemaRegistry = new Map<string, EventSchemaDefinition>()

/**
 * Register an event type with its payload schema.
 */
export function registerEventType(definition: EventSchemaDefinition): void {
  const key = `${definition.eventType}@v${definition.version}`
  schemaRegistry.set(key, definition)
  // Also set as latest
  schemaRegistry.set(definition.eventType, definition)
}

/**
 * Get the schema definition for an event type.
 * If version is not specified, returns the latest registered version.
 */
export function getEventSchema(
  eventType: PlatformEventType | string,
  version?: number,
): EventSchemaDefinition | undefined {
  if (version !== undefined) {
    return schemaRegistry.get(`${eventType}@v${version}`)
  }
  return schemaRegistry.get(eventType)
}

/**
 * Validate an event payload against its registered schema.
 */
export function validateEventPayload(
  eventType: PlatformEventType | string,
  payload: unknown,
  version?: number,
): { success: boolean; error?: string } {
  const schema = getEventSchema(eventType, version)
  if (!schema) {
    return { success: false, error: `No schema registered for ${eventType}` }
  }
  const result = schema.payloadSchema.safeParse(payload)
  if (!result.success) {
    return { success: false, error: result.error.message }
  }
  return { success: true }
}

/**
 * List all registered event schemas.
 */
export function listEventSchemas(): readonly EventSchemaDefinition[] {
  const seen = new Set<string>()
  const result: EventSchemaDefinition[] = []
  for (const [key, def] of schemaRegistry) {
    if (!key.includes('@') && !seen.has(def.eventType)) {
      seen.add(def.eventType)
      result.push(def)
    }
  }
  return result
}

/**
 * Reset the registry (for testing).
 */
export function resetEventSchemaRegistry(): void {
  schemaRegistry.clear()
}
