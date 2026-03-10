# @nzila/payments-stripe

Stripe payment integration for NzilaOS. Handles checkout sessions, webhooks, payment normalization, reconciliation with QuickBooks Online, and evidence collection for procurement packs.

## Domain context

NzilaOS processes payments for immigration advisory services, programme investments, and platform subscriptions. This adapter wraps Stripe's API with org-scoped metadata, event normalization, reconciliation against QBO deposits, and evidence artifact collection.

## Public API surface

### Client — `@nzila/payments-stripe/client`

| Export | Description |
|---|---|
| `getStripeClient()` | Singleton Stripe SDK instance (API version 2026-02-25, 3 retries) |

### Webhooks — `@nzila/payments-stripe/webhooks`

| Export | Description |
|---|---|
| `verifyWebhookSignature(payload, sig, secret)` | Verify Stripe webhook signature |
| `extractEntityIdFromEvent(event)` | Extract entity ID from webhook event |
| `WebhookSignatureError` | Custom error for invalid signatures |

### Normalization — `@nzila/payments-stripe/normalize`

| Export | Description |
|---|---|
| `normalizeAndPersist(event, orgId)` | Normalize Stripe event and persist to DB |
| `markEventFailed(eventId, reason)` | Mark event processing as failed |

Supported events: `checkout.session.completed`, `payment_intent.succeeded/failed`, `charge.refunded`, `charge.dispute.created`, `payout.paid`, `invoice.paid`.

### Primitives — `@nzila/payments-stripe/primitives`

| Export | Description |
|---|---|
| `createCustomer(orgId, email, name)` | Create Stripe customer with org metadata |
| `createCheckoutSession(...)` | Create checkout session |
| `executeRefund(paymentIntentId, amount?)` | Process refund |

### Reconciliation — `@nzila/payments-stripe/reconciliation`

| Export | Description |
|---|---|
| `matchPayoutsToDeposits(payouts, deposits, config?)` | Match Stripe payouts to QBO deposits |
| `generateExceptions(matchResult)` | Generate reconciliation exceptions |
| `computeCloseReadiness(exceptions)` | Compute close readiness score (0–100) |
| `DEFAULT_RECON_CONFIG` | Tolerance: $1, max unreconciled: 7 days, min score: 95 |

### Reports — `@nzila/payments-stripe/reports`

| Export | Description |
|---|---|
| `generateStripeReports(orgId, period)` | Generate revenue, payout, refund, dispute reports |
| `buildReportBlobPath(orgId, type, period)` | Construct blob storage path |

### Evidence — `@nzila/payments-stripe/evidence`

| Export | Description |
|---|---|
| `collectStripeEvidenceArtifacts(orgId)` | Collect evidence for procurement pack |

## Dependencies

- `@nzila/blob` — Blob storage for reports
- `@nzila/db` — Drizzle ORM for persistence
- `@nzila/os-core` — Core platform utilities
- `stripe` — Official Stripe SDK
- `zod` — Schema validation

## Example usage

```ts
import { verifyWebhookSignature, normalizeAndPersist } from '@nzila/payments-stripe'
import { matchPayoutsToDeposits, computeCloseReadiness } from '@nzila/payments-stripe/reconciliation'

// Webhook handler
verifyWebhookSignature(body, sig, secret)
await normalizeAndPersist(event, orgId)

// Month-end reconciliation
const match = matchPayoutsToDeposits(stripePayouts, qboDeposits)
const exceptions = generateExceptions(match)
const readiness = computeCloseReadiness(exceptions)
```

## Related apps

- `apps/zonga` — Payment processing and revenue events
- `apps/console` — Financial reporting

## Maturity

Production-grade — Full payment lifecycle with webhook verification, reconciliation engine, and evidence collection. Has tests.
