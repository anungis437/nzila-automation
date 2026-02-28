import type { AgriDomainEvent, AgriEventHandler, AgriEventBus, Unsubscribe } from './types'
import type { AgriEventType } from './event-types'

const WILDCARD = '*' as AgriEventType

export function createAgriEventBus(): AgriEventBus {
  const handlers = new Map<AgriEventType, AgriEventHandler[]>()

  function on<TPayload>(eventType: AgriEventType, handler: AgriEventHandler<TPayload>): Unsubscribe {
    const existing = handlers.get(eventType) ?? []
    handlers.set(eventType, [...existing, handler as AgriEventHandler])
    return () => {
      handlers.set(eventType, (handlers.get(eventType) ?? []).filter((h) => h !== handler))
    }
  }

  function onAny(handler: AgriEventHandler): Unsubscribe {
    return on(WILDCARD, handler)
  }

  function emit(event: AgriDomainEvent): void {
    const eventHandlers = handlers.get(event.type) ?? []
    const wildcardHandlers = handlers.get(WILDCARD) ?? []
    for (const h of [...eventHandlers, ...wildcardHandlers]) {
      void h(event)
    }
  }

  async function emitAndWait(event: AgriDomainEvent): Promise<void> {
    const eventHandlers = handlers.get(event.type) ?? []
    const wildcardHandlers = handlers.get(WILDCARD) ?? []
    await Promise.allSettled([...eventHandlers, ...wildcardHandlers].map((h) => h(event)))
  }

  function clear(): void {
    handlers.clear()
  }

  return { on, onAny, emit, emitAndWait, clear }
}

export function createAgriEvent<TPayload extends Record<string, unknown>>(
  type: AgriEventType,
  payload: TPayload,
  metadata: { orgId: string; actorId: string; correlationId: string; causationId?: string },
): AgriDomainEvent<TPayload> {
  return {
    id: crypto.randomUUID(),
    type,
    payload,
    metadata: { ...metadata, causationId: metadata.causationId ?? null, source: '@nzila/agri' },
    createdAt: new Date().toISOString(),
  }
}

export function createIntegrationHandler(dispatcher: {
  dispatch(request: {
    orgId: string
    channel: string
    recipientRef: string
    payload: Record<string, unknown>
    correlationId: string
    templateId?: string
  }): Promise<{ id: string; status: string }>
}): AgriEventHandler {
  return async (event) => {
    const { orgId, correlationId } = event.metadata
    const routing = getEventRouting(event.type)
    if (!routing) return
    for (const route of routing) {
      await dispatcher.dispatch({
        orgId,
        channel: route.channel,
        recipientRef: route.recipientRef ?? orgId,
        payload: { eventType: event.type, eventId: event.id, ...event.payload },
        correlationId,
        templateId: route.templateId,
      })
    }
  }
}

function getEventRouting(
  eventType: AgriEventType,
): { channel: string; recipientRef?: string; templateId?: string }[] | null {
  switch (eventType) {
    case 'agri.lot.certified':
      return [
        { channel: 'email', templateId: 'agri-lot-certified' },
        { channel: 'sms', templateId: 'agri-lot-certified-sms' },
        { channel: 'webhook', templateId: 'agri.lot.certified' },
      ]
    case 'agri.shipment.milestone':
      return [
        { channel: 'slack', templateId: 'agri-shipment-update' },
        { channel: 'teams', templateId: 'agri-shipment-update' },
      ]
    case 'agri.shipment.closed':
      return [
        { channel: 'webhook', templateId: 'agri.shipment.closed' },
        { channel: 'email', templateId: 'agri-shipment-closed' },
      ]
    case 'agri.payment.executed':
      return [
        { channel: 'email', templateId: 'agri-payment-receipt' },
        { channel: 'sms', templateId: 'agri-payment-receipt-sms' },
      ]
    case 'agri.payment.plan.created':
      return [{ channel: 'webhook', templateId: 'agri.payment.plan.created' }]
    case 'agri.batch.created':
      return [{ channel: 'webhook', templateId: 'agri.batch.created' }]
    case 'agri.shipment.planned':
      return [
        { channel: 'webhook', templateId: 'agri.shipment.planned' },
        { channel: 'hubspot', templateId: 'agri-shipment-deal' },
      ]
    default:
      return [{ channel: 'webhook' }]
  }
}
