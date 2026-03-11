# @nzila/platform-validation

Automated validation suite for the NzilaOS platform. Scans code, docs,
architecture, and operational readiness for consistency, produces graded
scorecards.

## Audits

| Function | Purpose |
|----------|---------|
| `runPackageAudit(root)` | Package maturity — deps, tests, structure, circular deps |
| `runArchitectureAudit(root)` | Architecture consistency — middleware, env validation, correlation IDs |
| `runClaimVerification(root)` | Claim integrity — verify procurement/architecture claims against code |
| `runDocConsistency(root)` | Documentation quality — stale refs, broken links, naming consistency |
| `runOpsReadinessAudit(root)` | Operational readiness — logging, health, metrics, telemetry, error classification |

## Usage

```bash
# Run all audits with unified scorecard (5 dimensions)
pnpm audit:all

# Individual audits
pnpm audit:packages
pnpm audit:architecture
pnpm audit:claims
pnpm audit:docs
pnpm audit:ops-readiness
```

## Ops Readiness Audit

Scans all platform packages (`platform-*`, `integrations-*`, `ai-*`, `ml-*`) for operational maturity markers:

| Check | Severity | What it detects |
|-------|----------|-----------------|
| `no-bare-console` | Error | `console.*` without StructuredLogger in same file |
| `needs-structured-logging` | Warning | Package has no StructuredLogger usage |
| `needs-health-check` | Warning | Package exports no health check |
| `needs-metrics` | Warning | Package has no MetricsRegistry usage |
| `needs-error-classification` | Info | Package has no `classifyFailure` usage |

Outputs a **maturity score** (0–100%) based on 4 key markers per
package: structured logging, health check, metrics, audit emission.

## Grading

The scorecard grades each dimension using an error/warning count:

| Grade | Criteria |
|-------|----------|
| A+ | 0 errors, 0 warnings |
| A | 0 errors, ≤3 warnings |
| A- | 0 errors, ≤10 warnings |
| B+ | 0 errors, ≤25 warnings |
| B | 0 errors, >25 warnings |
| C+ | ≤3 errors |
| C | ≤10 errors |
| D | ≤20 errors |
| F | >20 errors |

Reports are written to `reports/` as JSON and Markdown.
