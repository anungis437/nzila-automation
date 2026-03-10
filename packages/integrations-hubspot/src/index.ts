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

// Stage Mapping
export {
  mapHubspotStageToCaseStatus,
  mapCaseStatusToHubspotStage,
  HUBSPOT_STAGE_TO_CASE_STATUS,
  CASE_STATUS_TO_HUBSPOT_STAGE,
} from './stage-mapping'
export type { SyncLogEntry } from './stage-mapping'
