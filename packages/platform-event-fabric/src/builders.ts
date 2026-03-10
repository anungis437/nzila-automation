/**
 * @nzila/platform-event-fabric — Event Builder Helpers
 */
import type { PlatformEvent, PlatformEventMetadata, PlatformEventType } from './types'

let idCounter = 0

function generateId(): string {
  // In production, use crypto.randomUUID().
  // This fallback is safe for environments where crypto is available.
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  idCounter++
  return `00000000-0000-0000-0000-${String(idCounter).padStart(12, '0')}`
}

export interface BuildEventInput<TPayload = Record<string, unknown>> {
  type: PlatformEventType | string
  payload: TPayload
  tenantId: string
  actorId: string
  source: string
  orgId?: string
  correlationId?: string
  causationId?: string
  version?: number
}

/**
 * Build a platform event with proper metadata.
 */
export function buildPlatformEvent<TPayload = Record<string, unknown>>(
  input: BuildEventInput<TPayload>,
): PlatformEvent<TPayload> {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    type: input.type,
    payload: input.payload,
    metadata: {
      tenantId: input.tenantId,
      orgId: input.orgId,
      actorId: input.actorId,
      correlationId: input.correlationId ?? generateId(),
      causationId: input.causationId,
      source: input.source,
      version: input.version ?? 1,
    },
    createdAt: now,
  }
}
