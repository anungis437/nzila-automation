# App Gold Standard

> The definitive reference for what a production-ready Nzila OS application looks like.

## Overview

Every app in the Nzila OS monorepo must meet these standards before being considered production-ready. The reference implementation is **Union-Eyes**.

## Directory Structure

```
apps/<app-name>/
├── app/
│   ├── api/
│   │   ├── health/route.ts        # Health endpoint (required)
│   │   ├── metrics/route.ts       # Metrics endpoint (required)
│   │   └── evidence/export/route.ts # Evidence pack export (required)
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── policy-enforcement.ts      # Platform policy engine integration
│   ├── demoSeed.ts                # Demo seed data
│   └── *.test.ts                  # Co-located unit tests
├── tests/
│   └── *.test.ts                  # Domain-specific unit tests
├── e2e/
│   └── <app>.spec.ts              # Playwright E2E specs
├── docs/
│   ├── pilot-playbook.md          # Pilot deployment guide
│   └── demo-flow.md               # Demo walkthrough
├── vitest.config.ts               # Vitest configuration
├── package.json                   # Scripts: dev, build, test, demo:seed
├── tsconfig.json
└── next.config.ts
```

## Required Endpoints

### GET /api/health
Returns service health status with service name.
```json
{ "status": "healthy", "service": "<app-name>" }
```

### GET /api/metrics
Returns operational metrics: `request_count`, `error_rate`, `latency_ms`.

### GET /api/evidence/export
Returns evidence pack: app metadata, git commit, SBOM, policy check results.

## Required Integrations

### Policy Engine
Every app must integrate `@nzila/platform-policy-engine` via a `lib/policy-enforcement.ts` module:
- Define app-specific policies
- Enforce threshold-based approvals
- Log all policy evaluations

### Evidence Pack
Export endpoint must return:
- App name and version
- Git commit hash
- Build timestamp
- SBOM reference
- Policy check results

## Testing Requirements

| Category | Minimum | Target |
|----------|---------|--------|
| Unit tests | 3 files | 5+ files |
| E2E specs | 1 spec | 3+ specs |
| Test script | `vitest run` (no `--passWithNoTests`) | — |

## Scripts (package.json)

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev --port <port>` | Development server |
| `build` | `next build` | Production build |
| `test` | `vitest run` | Unit tests |
| `demo:seed` | `tsx lib/demoSeed.ts` | Seed demo data |
| `typecheck` | `tsc --noEmit` | Type checking |
| `lint` | `eslint` | Linting |

## Validation

Run `pnpm governance:check` to validate all apps against this standard.

## Compliance Levels

- **Full**: All checks pass (6/6)
- **Partial**: ≥50% checks pass (3+/6)
- **Non-compliant**: <50% checks pass

## Reference: Union-Eyes

Union-Eyes is the gold standard with:
- 150+ library files
- 19+ test files
- 3 E2E playwright specs
- Full Drizzle migrations and seeds
- Complete policy engine integration
- Evidence pack generation
- Comprehensive documentation
