# @nzila/integrations-core

Shared types, Zod schemas, adapter registry, and audit event taxonomy for the NzilaOS integration control plane.

## Domain Context

This package is the **foundational layer** of the three-tier integration stack (`integrations-core` → `integrations-db` → `integrations-runtime`). It defines the canonical type system for multi-provider messaging (email, SMS, push, chatops, CRM, webhooks) and provides a registry for adapter lookup at runtime.

All integration packages depend on this package for type-safe interfaces.

## Public API

### Types (`types.ts`)

| Type / Interface         | Description                                                   |
|--------------------------|---------------------------------------------------------------|
| `IntegrationType`        | Union: `email \| sms \| push \| chatops \| crm \| webhooks`  |
| `IntegrationProvider`    | Union: `resend \| sendgrid \| mailgun \| twilio \| firebase \| slack \| teams \| hubspot` |
| `IntegrationStatus`      | Union: `active \| inactive \| suspended`                      |
| `DeliveryStatus`         | Union: `queued \| sent \| failed \| dlq \| blocked_by_circuit`|
| `HealthStatus`           | Union: `ok \| degraded \| down`                               |
| `CircuitState`           | Union: `closed \| open \| half_open`                          |
| `IntegrationConfig`      | Org-scoped provider configuration                             |
| `IntegrationAdapter`     | Port interface: `send()`, `healthCheck()`                     |
| `SendRequest`            | Channel-agnostic send request                                 |
| `SendResult`             | Adapter response with rate-limit info                         |
| `RateLimitInfo`          | Rate-limit metadata from provider responses                   |
| `IntegrationDelivery`    | Delivery tracking record                                      |
| `DlqEntry`               | Dead-letter queue record                                      |
| `HealthCheckResult`      | Per-provider health snapshot                                  |
| `WebhookSubscription`    | Webhook endpoint configuration                                |
| `WebhookDeliveryAttempt` | Webhook delivery attempt log                                  |

### Schemas (`schemas.ts`)

Zod validation schemas for write operations:

- `CreateIntegrationConfigSchema` / `UpdateIntegrationConfigSchema`
- `SendMessageSchema`
- `CreateWebhookSubscriptionSchema`
- Enum schemas for all domain unions

### Registry (`registry.ts`)

`IntegrationRegistry` — in-memory adapter registry keyed by `provider + channel`:

```ts
import { integrationRegistry } from "@nzila/integrations-core";

registry.register(resendAdapter);
const adapter = registry.getOrThrow("resend", "email");
```

### Events (`events.ts`)

`IntegrationEventTypes` — readonly constant map of audit event names covering config changes, delivery lifecycle, health transitions, circuit breaker state changes, rate limiting, chaos simulation, SLA breaches, and CRM sync events.

## Dependencies

- `zod` — Runtime schema validation

## Maturity

| Metric       | Value          |
|--------------|----------------|
| Status       | Stable         |
| Tests        | 7 (registry)   |
| Consumers    | `integrations-db`, `integrations-runtime`, adapter packages |

<!-- maturity:stable -->
