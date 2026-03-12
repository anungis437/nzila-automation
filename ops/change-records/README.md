# Change Records

This directory contains version-controlled change records for the Nzila OS platform.

Each file represents a single change record in JSON format, named by its change ID
(e.g., `CHG-2026-0001.json`).

## Change Lifecycle

1. **PROPOSED** — Change is drafted
2. **UNDER_REVIEW** — Approvals in progress
3. **APPROVED** — All required approvals obtained
4. **SCHEDULED** — Window confirmed
5. **IMPLEMENTING** — Deployment in progress
6. **COMPLETED / FAILED / ROLLED_BACK** — Terminal state
7. **CLOSED** — PIR completed (if required)

## Creating a Change Record

Use the seed script for demo records:

```bash
pnpm change:seed-demo
```

## Validation

CI/CD pipelines validate change records before deployment:

```bash
pnpm change:validate --env=STAGING --service=web
```
