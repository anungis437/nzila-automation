# @nzila/integrations-hubspot

HubSpot CRM integration for the NzilaOS mobility platform. Syncs contacts, deals, and webhook events between HubSpot and the internal case management system.

## Domain context

HubSpot is the source of truth for lead generation. NzilaOS stores mobility profiles, family structures, case workflows, and compliance data. This adapter bridges the two systems with bidirectional stage mapping.

## Public API surface

### Contacts — `@nzila/integrations-hubspot/contacts`

| Export | Description |
|---|---|
| `syncHubspotContact(client, id, persist)` | Sync a single HubSpot contact into the mobility platform |
| `hubspotContactSchema` | Zod schema for HubSpot contact validation |
| `HubspotClient` | Interface for HubSpot contact API calls |

### Deals — `@nzila/integrations-hubspot/deals`

| Export | Description |
|---|---|
| `syncHubspotDeal(client, id, persist)` | Sync a single HubSpot deal into a mobility case |
| `hubspotDealSchema` | Zod schema for HubSpot deal validation |
| `HubspotDealsClient` | Interface for HubSpot deals API calls |

### Webhooks — `@nzila/integrations-hubspot/webhooks`

| Export | Description |
|---|---|
| `ingestHubspotWebhook(payload, handlers)` | Process a batch of HubSpot webhook events |
| `SUPPORTED_WEBHOOK_TYPES` | `contact.creation`, `contact.propertyChange`, `contact.deletion`, `deal.creation`, `deal.propertyChange`, `deal.deletion` |
| `WebhookHandlers` | Handler interface for each webhook event type |

### Stage Mapping

| Export | Description |
|---|---|
| `mapHubspotStageToCaseStatus(stage)` | HubSpot deal stage → `CaseStatus` |
| `mapCaseStatusToHubspotStage(status)` | `CaseStatus` → HubSpot deal stage |
| `HUBSPOT_STAGE_TO_CASE_STATUS` | Full mapping table |

## Dependencies

- `@nzila/mobility-core` — `CaseStatus` enum for stage mapping
- `zod` — Runtime schema validation

## Example usage

```ts
import { syncHubspotContact, ingestHubspotWebhook } from '@nzila/integrations-hubspot'

// Sync a contact
const result = await syncHubspotContact(hubspotClient, '12345', async (contact) => {
  return { clientId: 'client-uuid', action: 'created' }
})

// Process webhooks
const results = await ingestHubspotWebhook(rawPayload, {
  onContactCreated: async (id) => { /* ... */ },
  onDealUpdated: async (id, prop, val) => { /* ... */ },
})
```

## Related apps

- `apps/mobility` — Primary consumer for client intake
- `apps/partners` — Partner CRM sync

## Maturity

Pilot-grade — Typed contracts and Zod validation in place. No tests yet.
