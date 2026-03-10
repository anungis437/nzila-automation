# @nzila/integrations-whatsapp

WhatsApp messaging integration for the NzilaOS mobility platform. Supports Twilio, WhatsApp Business API (Cloud API), and OpenClaw providers with automatic communication logging.

## Domain context

Mobility advisory firms communicate with clients via WhatsApp for case status updates, document requests, and renewal reminders. This adapter provides a provider-agnostic messaging layer so the platform can switch providers without changing application code.

## Public API surface

### Providers — `@nzila/integrations-whatsapp/providers`

| Export | Description |
|---|---|
| `createTwilioProvider(config)` | Twilio WhatsApp provider |
| `createWhatsAppBusinessProvider(config)` | Meta Cloud API provider |
| `createOpenClawProvider(config)` | OpenClaw runtime provider |
| `WhatsAppProvider` | Interface: `sendMessage(to, body)`, `sendTemplate(to, name, params)` |

### Messaging — `@nzila/integrations-whatsapp/messaging`

| Export | Description |
|---|---|
| `sendNotification(provider, message, orgId, logger)` | Send a notification with automatic logging |
| `sendCaseStatusUpdate(...)` | Notify client of case status change |
| `sendDocumentRequest(...)` | Request documents with numbered list |
| `sendRenewalReminder(...)` | Send renewal/expiry reminder |
| `CommunicationLogger` | Interface for audit logging |

## Dependencies

- `@nzila/mobility-core` — `MessageType` enum
- `zod` — Runtime validation

## Example usage

```ts
import { createTwilioProvider, sendCaseStatusUpdate } from '@nzila/integrations-whatsapp'

const provider = createTwilioProvider({
  accountSid: process.env.TWILIO_SID!,
  authToken: process.env.TWILIO_TOKEN!,
  fromNumber: process.env.TWILIO_FROM!,
})

await sendCaseStatusUpdate(
  provider, 'client-1', 'case-42', '+1234567890',
  'Your application has been submitted.', 'org-1', logger,
)
```

## Related apps

- `apps/mobility` — Client notifications
- `apps/partners` — Partner communication

## Maturity

Pilot-grade — Provider abstraction with typed contracts. Twilio/WABA/OpenClaw stubs implemented; real HTTP calls pending. No tests yet.
