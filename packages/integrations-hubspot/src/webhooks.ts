/* ── HubSpot Webhook Ingestion ─────────────────────────────
 *
 * Receives and validates HubSpot webhook payloads.
 * Webhook signature verification should be handled at
 * the API route level before calling these functions.
 */

import { z } from 'zod'

/* ── Webhook Payload Schemas ──────────────────────────────── */

export const hubspotWebhookEventSchema = z.object({
  subscriptionType: z.string(),
  objectId: z.number(),
  propertyName: z.string().optional(),
  propertyValue: z.string().optional(),
  changeSource: z.string().optional(),
  occurredAt: z.number(),
  eventId: z.number(),
  subscriptionId: z.number(),
  portalId: z.number(),
  appId: z.number(),
  attemptNumber: z.number(),
})

export type HubspotWebhookEvent = z.infer<typeof hubspotWebhookEventSchema>

export const hubspotWebhookPayloadSchema = z.array(hubspotWebhookEventSchema)

/* ── Webhook Types ────────────────────────────────────────── */

export const SUPPORTED_WEBHOOK_TYPES = [
  'contact.creation',
  'contact.propertyChange',
  'contact.deletion',
  'deal.creation',
  'deal.propertyChange',
  'deal.deletion',
] as const

export type SupportedWebhookType = (typeof SUPPORTED_WEBHOOK_TYPES)[number]

export interface WebhookProcessResult {
  eventId: number
  subscriptionType: string
  processed: boolean
  details: string
}

/* ── Webhook Handler ──────────────────────────────────────── */

export interface WebhookHandlers {
  onContactCreated?: (objectId: number) => Promise<void>
  onContactUpdated?: (objectId: number, propertyName: string, propertyValue: string) => Promise<void>
  onContactDeleted?: (objectId: number) => Promise<void>
  onDealCreated?: (objectId: number) => Promise<void>
  onDealUpdated?: (objectId: number, propertyName: string, propertyValue: string) => Promise<void>
  onDealDeleted?: (objectId: number) => Promise<void>
}

/**
 * Process a batch of HubSpot webhook events.
 * Routes each event to the appropriate handler.
 */
export async function ingestHubspotWebhook(
  rawPayload: unknown,
  handlers: WebhookHandlers,
): Promise<WebhookProcessResult[]> {
  const events = hubspotWebhookPayloadSchema.parse(rawPayload)
  const results: WebhookProcessResult[] = []

  for (const event of events) {
    const result = await processEvent(event, handlers)
    results.push(result)
  }

  return results
}

async function processEvent(
  event: HubspotWebhookEvent,
  handlers: WebhookHandlers,
): Promise<WebhookProcessResult> {
  const base = {
    eventId: event.eventId,
    subscriptionType: event.subscriptionType,
  }

  switch (event.subscriptionType) {
    case 'contact.creation':
      if (handlers.onContactCreated) {
        await handlers.onContactCreated(event.objectId)
        return { ...base, processed: true, details: 'Contact created' }
      }
      break
    case 'contact.propertyChange':
      if (handlers.onContactUpdated && event.propertyName) {
        await handlers.onContactUpdated(event.objectId, event.propertyName, event.propertyValue ?? '')
        return { ...base, processed: true, details: `Contact property ${event.propertyName} updated` }
      }
      break
    case 'contact.deletion':
      if (handlers.onContactDeleted) {
        await handlers.onContactDeleted(event.objectId)
        return { ...base, processed: true, details: 'Contact deleted' }
      }
      break
    case 'deal.creation':
      if (handlers.onDealCreated) {
        await handlers.onDealCreated(event.objectId)
        return { ...base, processed: true, details: 'Deal created' }
      }
      break
    case 'deal.propertyChange':
      if (handlers.onDealUpdated && event.propertyName) {
        await handlers.onDealUpdated(event.objectId, event.propertyName, event.propertyValue ?? '')
        return { ...base, processed: true, details: `Deal property ${event.propertyName} updated` }
      }
      break
    case 'deal.deletion':
      if (handlers.onDealDeleted) {
        await handlers.onDealDeleted(event.objectId)
        return { ...base, processed: true, details: 'Deal deleted' }
      }
      break
  }

  return { ...base, processed: false, details: `No handler for ${event.subscriptionType}` }
}
