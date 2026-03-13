# Runbook: Platform Observability Degradation

**Scope:** Failures in `platform-observability`, `platform-metrics`, and `platform-rum`  
**Severity:** P2 (partial telemetry loss) / P1 (complete observability blackout)  
**On-call:** Platform Engineering

## Detection

Observability degradation surfaces through:

1. **Missing metrics** — gaps in dashboards, SLO calculations return `null`
2. **Trace drops** — distributed traces incomplete or missing spans
3. **Health digest failures** — `computeOpsScore()` cannot calculate scores
4. **Alert silence** — expected alerts stop firing (the "dog that didn't bark")

## Triage

### Step 1: Verify telemetry pipeline

Check whether the issue is in collection, processing, or storage:

| Stage | Check | Tool |
|-------|-------|------|
| Collection | Are apps emitting telemetry? | App logs for OpenTelemetry export errors |
| Processing | Is the metrics pipeline healthy? | Platform Health dashboard |
| Storage | Can we query recent data? | Log Analytics / metrics store |

### Step 2: Scope the blast radius

- Single app or all apps?
- Metrics, traces, or both?
- Started after a deployment?

## Response

### Collection failure (apps not emitting)

1. Check `instrumentation.ts` in affected apps — verify env vars are set
2. Confirm OpenTelemetry SDK initialisation in app startup logs
3. Restart affected app if SDK init failed

### Processing failure (pipeline down)

1. Check platform-observability health endpoint
2. Verify network connectivity to telemetry backend
3. Check for resource exhaustion (CPU, memory) on collector

### Partial data loss

1. Identify time range of missing data
2. Check if apps were healthy during the gap (use health endpoints)
3. Document the observability gap in incident timeline

## Verification

- Dashboards show continuous data (no gaps)
- SLO calculations return valid scores
- Distributed traces show complete call chains

## References

- Observability package: `packages/platform-observability/`
- Metrics package: `packages/platform-metrics/`
- RUM package: `packages/platform-rum/`
- SLO definitions: `ops/slo-policy.yml`
