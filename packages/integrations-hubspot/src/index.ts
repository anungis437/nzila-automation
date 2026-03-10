/* ── @nzila/integrations-hubspot ───────────────────────── */

// Contacts
export { syncHubspotContact, hubspotContactSchema } from './contacts'
export type { HubspotContact, ContactSyncResult, HubspotClient } from './contacts'

// Deals
export { syncHubspotDeal, hubspotDealSchema } from './deals'
export type { HubspotDeal, DealSyncResult, HubspotDealsClient } from './deals'

// Webhooks
export { ingestHubspotWebhook, hubspotWebhookPayloadSchema, SUPPORTED_WEBHOOK_TYPES } from './webhooks'
export type { HubspotWebhookEvent, WebhookProcessResult, WebhookHandlers } from './webhooks'
