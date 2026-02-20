# Security Policy

## Reporting Vulnerabilities

**Do not file a public GitHub issue for security vulnerabilities.**

Report security issues by emailing: security@nzila.app

We will acknowledge within 24 hours and provide a fix timeline within 72 hours.  
For critical vulnerabilities, use our PGP key: available at `https://nzila.app/.well-known/security.txt`.

## Supply Chain Security

### Dependency Scanning
- **Workflow**: `.github/workflows/dependency-audit.yml` runs `pnpm audit --audit-level=high` on every PR
- **Automated Updates**: Dependabot monitors npm, GitHub Actions, and pip dependencies weekly — see `.github/dependabot.yml`
- **Waiver Process**: High/critical CVEs that cannot be immediately patched require a waiver artifact stored in Azure Blob (`evidence` container) with expiry date
- **SBOM**: Generated on every release tag via `.github/workflows/sbom.yml` (CycloneDX format)

### Container Security
- **Trivy**: Container image scanning runs on every Dockerfile change and weekly via `.github/workflows/trivy.yml`
- Base images pinned to a specific version tag (`node:22.13.1-alpine3.21`) in `Dockerfile` and `apps/orchestrator-api/Dockerfile`
- SARIF results uploaded to GitHub Security tab for dashboard visibility

### Secret Scanning  
- **Workflow**: `.github/workflows/secret-scan.yml` (TruffleHog + Gitleaks) runs on every PR
- **Pre-commit**: Lefthook runs Gitleaks staged-file scan on every `git commit` — see `lefthook.yml`
- **Custom rules**: `.gitleaks.toml` has Nzila-specific patterns (Clerk, Stripe, Azure KV, DB URLs)

### Static Analysis
- **Workflow**: `.github/workflows/codeql.yml` — CodeQL analysis for TypeScript and Python (weekly + on PRs)

## Security Headers

All production apps enforce:

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | App-specific; blocks inline eval where possible |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` (authenticated apps) / `SAMEORIGIN` (public web) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Blocks camera, mic, geolocation |

Implementation: `headers()` in each app's `next.config.ts`; `@fastify/helmet` in the orchestrator API.

## Rate Limiting

The Orchestrator API uses `@fastify/rate-limit` with a default of 200 req/min per IP. This limit is configurable via the `RATE_LIMIT_MAX` environment variable.

## Access Control
- Production secrets stored in Azure Key Vault (never in `.env` files or repo)
- Clerk authentication on all apps
- RBAC via `@nzila/os-core/policy` — `authorize()` required on every API route
- Partner access gated by `partner_entities` table
- Entity isolation enforced at application layer via `authorize()` + entity-scoped DB queries
- Key Rotation runbook: `ops/runbooks/security/key-rotation.md`

## Audit Trail
- All material actions produce hash-chained `audit_events` rows
- Evidence packs stored in Azure Blob with immutable access tier
- Audit chain verified by `verifyChain()` from `@nzila/os-core/hash`
- Audit log immutability contract tests: `tooling/contract-tests/audit-immutability.test.ts`

## Incident Response
- Playbooks at `ops/incident-response/`
- Data breach runbook: `ops/runbooks/security/data-breach.md`
- Key rotation runbook: `ops/runbooks/security/key-rotation.md`
- Primary contact: `ops@nzila.app`

## Compliance
- SOC 2 Type I controls mapped at `ops/compliance/`
- Control test schedule at `ops/compliance/Control-Test-Plan.md`
- Security in AI actions: policy enforcement + attestation + evidence packs at `packages/ai-core/src/actions/`
