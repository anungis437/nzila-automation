# @nzila/platform-observability

Observability primitives for the NzilaOS platform. Provides W3C-compatible trace context, structured logging, in-memory metrics (counter/gauge/histogram), composable health checks, and correlation ID propagation.

## Domain context

All NzilaOS services require consistent observability: correlated request logging, distributed trace context, health endpoints, and metrics collection. This package provides the foundational building blocks that every app and service uses.

## Public API surface

### Correlation — `@nzila/platform-observability/correlation`

| Export | Description |
|---|---|
| `generateTraceId()` | 32-char hex trace ID |
| `generateSpanId()` | 16-char hex span ID |
| `generateRequestId()` | UUID request ID |
| `extractCorrelationContext(headers)` | Extract trace/span/request IDs from request headers |
| `buildCorrelationHeaders(ctx)` | Build outgoing correlation headers |
| `createChildContext(parent)` | Create child span context |
| `withCorrelation(fn)` / `withFreshCorrelation(fn)` | Execute with correlation context |

### Logger — `@nzila/platform-observability/logger`

| Export | Description |
|---|---|
| `createLogger(context?)` | Create a structured logger with optional correlation context |
| `StructuredLogger` | Logger with `debug`, `info`, `warn`, `error`, `critical` methods |
| `StructuredLogEntry` | Machine-parseable JSON: event, severity, request_id, correlation_id, org_id, timestamp |

### Metrics — `@nzila/platform-observability/metrics`

| Export | Description |
|---|---|
| `Counter` | Monotonically increasing counter |
| `Gauge` | Value that can go up and down |
| `Histogram` | Bucketed distribution (default: [5,10,25,50,100,250,500,1000,2500,5000,10000]) |
| `MetricsRegistry` | Central collection of named metrics |
| `globalRegistry` | Pre-instantiated singleton registry |

### Health — `@nzila/platform-observability/health`

| Export | Description |
|---|---|
| `HealthChecker` | Register checks, run all in parallel, compile health report |
| `HealthStatus` | `healthy`, `degraded`, `down` |
| `HealthReport` | Service name, overall status, individual check results |

### Span — `@nzila/platform-observability/span`

| Export | Description |
|---|---|
| `Span` | Operational span with start/end timestamps and attributes |
| `trace(name, fn)` | Execute function within a traced span |

### Types — `@nzila/platform-observability/types`

| Type | Description |
|---|---|
| `TraceContext` | W3C-compatible: traceId, spanId, parentSpanId, traceFlags |
| `SpanData` | Span details with timestamps, duration, status, events |
| `MetricDefinition` / `MetricSample` | Prometheus-compatible metric shapes |

## Dependencies

- `@nzila/os-core` — Core platform utilities
- `zod` — Schema validation for trace context and health results

## Example usage

```ts
import { createLogger } from '@nzila/platform-observability/logger'
import { HealthChecker } from '@nzila/platform-observability/health'
import { Counter, globalRegistry } from '@nzila/platform-observability/metrics'

const logger = createLogger({ org_id: 'org-1', request_id: 'req-abc' })
logger.info('case_created', { caseId: '42' })

const health = new HealthChecker('my-service')
health.addCheck('db', async () => { /* probe */ }, { critical: true })
const report = await health.run()

const counter = new Counter('requests_total', 'Total requests')
globalRegistry.register(counter)
counter.inc()
```

## Downstream consumers

All apps and platform packages depend on this for logging, health checks, and correlation.

## Maturity

Production-grade — Core observability primitives with tests. Used across all services.
