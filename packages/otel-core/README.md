# @nzila/otel-core

OpenTelemetry instrumentation layer for the NzilaOS platform. Extends standard OpenTelemetry with evidence correlation, SLO monitoring, and cost attribution.

## Exports

| Export | Purpose |
|--------|---------|
| `createNzilaSpan(name, opts)` | Create a span with NzilaOS-specific attributes |
| `withNzilaSpan(name, fn)` | Execute a function within a traced span |
| `addNzilaAttributes(span, attrs)` | Add platform-specific attributes to a span |
| `attributeCost(span, cost)` | Attach cost metadata to a span |
| `EvidenceSpanProcessor` | Span processor that links traces to evidence packs |
| `verifyEvidenceTrace(traceId)` | Verify evidence chain for a given trace |
| `injectTraceContext(headers)` | Inject W3C trace context into outgoing request headers |
| `SLOMonitor` | SLO burn-rate evaluator |
| `evaluateBurnRate(slo, window)` | Calculate error budget burn rate |

## Usage

```ts
import { withNzilaSpan, attributeCost } from '@nzila/otel-core'

const result = await withNzilaSpan('process-order', async (span) => {
  attributeCost(span, { tokens: 500, usdCents: 2 })
  return processOrder(orderId)
})
```

## Dependencies

- `@opentelemetry/*` — OpenTelemetry SDK (optional peer)
- `@nzila/os-core`, `@nzila/platform-observability`
- `zod` — schema validation
