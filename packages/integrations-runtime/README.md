# @nzila/integrations-runtime

Resilient message dispatch engine with circuit breakers, retry, DLQ, metrics, SLO computation, rate-limit parsing, chaos simulation, and policy-driven configuration.

## Domain Context

Top tier of the integration stack (`integrations-core` → `integrations-db` → **`integrations-runtime`**). This package orchestrates all outbound provider communication with production-grade resilience patterns. Every message flows through: **policy lookup → circuit check → dispatch → retry → DLQ fallback → metrics → SLO evaluation**.

## Public API

### Dispatcher (`dispatcher.ts`)

`IntegrationDispatcher` — routes messages through the adapter registry with retry and DLQ fallback.

```ts
const dispatcher = new IntegrationDispatcher(ports, options);
const result = await dispatcher.dispatch(sendRequest);
```

Ports: `getAdapter`, `getCredentials`, `resolveConfig`, `recordDelivery`, `updateDeliveryStatus`, `enqueueDlq`, `emitAudit`.

### Resilient Dispatcher (`resilientAdapter.ts`)

`ResilientDispatcher` — wraps `IntegrationDispatcher` with circuit breaker gating. Checks circuit state before dispatch, records outcomes to the breaker, and supports admin overrides.

```ts
const resilient = new ResilientDispatcher(ports, options);
const result = await resilient.dispatch(request);
resilient.forceOpen(orgId, "resend");   // admin override
resilient.forceReset(orgId, "resend");  // admin reset
```

### Circuit Breaker (`circuitBreaker.ts`)

`CircuitBreaker` — state machine (CLOSED → OPEN → HALF_OPEN → CLOSED) with configurable failure thresholds, rate-based detection, cooldown timers, and half-open probe limits. Emits audit events on state transitions.

### Retry (`retry.ts`)

Exponential backoff with jitter:

- `withRetry(fn, options)` — execute with configurable retry
- `computeDelay(attempt, options)` — calculate backoff delay
- Defaults: 3 attempts, 1s base, 30s max, jitter enabled

### Health (`health.ts`)

`checkAllIntegrations(ports)` — runs health checks across all registered adapters, returns aggregate status (`ok | degraded | down`) and per-adapter results.

### Metrics (`metrics.ts`)

`MetricsCollector` — buffers delivery metrics into 5-minute and 1-hour rolling windows, flushes to the metrics repository, and updates provider health snapshots.

### SLO (`slo.ts`)

`SloComputer` — computes SLO compliance per org + provider against configured targets. Emits breach audit events when availability or latency targets are missed.

```ts
const computer = new SloComputer(ports);
const result = await computer.compute(orgId, "resend", "email");
const report = await computer.exportReport(orgId);
```

### Rate-Limit Parser (`rateLimitParser.ts`)

`parseRateLimitInfo(provider, statusCode, headers, body)` — unified parsing of rate-limit headers across providers (Slack, HubSpot, Teams, generic 429 + `Retry-After`).

### Chaos Simulation (`chaos.ts`)

`ChaosSimulator` — outage drill tool with hard production guard. Simulates `provider_down`, `slow`, `rate_limited`, and `partial_fail` scenarios. **Refuses to activate in production environments** (checks `NODE_ENV`, `VERCEL_ENV`, `AZURE_FUNCTIONS_ENVIRONMENT`).

### Policy (`policy.ts`)

`loadIntegrationPolicy(rootDir)` — loads circuit breaker, retry, and SLA configuration from `ops/integration-policy.yml`. Supports per-provider overrides merged with platform defaults. Cached after first load.

## Dependencies

- `@nzila/integrations-core` — Domain types, adapter interface, event taxonomy
- `@nzila/integrations-db` — Repository port interfaces
- `zod` — Runtime validation

## Maturity

| Metric       | Value                                                |
|--------------|------------------------------------------------------|
| Status       | Stable                                               |
| Tests        | 8+ test files (dispatcher, retry, circuit breaker, chaos, metrics, rate-limit parser, SLO) |
| Consumers    | Application wiring, orchestrator-api                 |

<!-- maturity:stable -->
