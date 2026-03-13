# Architecture Governance Index

> Master index of all anti-entropy architecture hardening documents, scripts, and enforcement tools.

---

## Governance Documents

| Document | Purpose |
|---|---|
| [PACKAGE_OWNERSHIP.md](PACKAGE_OWNERSHIP.md) | Package registry: owner, category, stability, allowed dependents |
| [DOMAIN_VS_AUDIT_MODEL.md](DOMAIN_VS_AUDIT_MODEL.md) | Rules separating domain state from audit/evidence stores |
| [AI_PLATFORM_CONTRACT.md](AI_PLATFORM_CONTRACT.md) | Canonical AI output schemas and prohibited patterns |
| [CONTROL_PLANE_PRINCIPLES.md](CONTROL_PLANE_PRINCIPLES.md) | Control Plane route buckets (HEALTH/ATTENTION/ACTION) |
| [ARCHITECTURAL_BOUNDARIES.md](ARCHITECTURAL_BOUNDARIES.md) | Dependency direction rules and vertical isolation |
| [PACKAGE_LIFECYCLE_POLICY.md](PACKAGE_LIFECYCLE_POLICY.md) | Create, graduate, deprecate, and remove packages |
| [APP_GOLD_STANDARD.md](APP_GOLD_STANDARD.md) | Structural requirements for production-ready apps |

## App Domain Models

| App | Document |
|---|---|
| union-eyes | [apps/union-eyes/docs/DOMAIN_MODEL.md](../apps/union-eyes/docs/DOMAIN_MODEL.md) |
| shop-quoter | [apps/shop-quoter/docs/DOMAIN_MODEL.md](../apps/shop-quoter/docs/DOMAIN_MODEL.md) |
| zonga | [apps/zonga/docs/DOMAIN_MODEL.md](../apps/zonga/docs/DOMAIN_MODEL.md) |

## Control Plane Governance

| Document | Purpose |
|---|---|
| [Route Governance](../apps/control-plane/docs/ROUTE_GOVERNANCE.md) | Per-route bucket assignment and justification |
| [route.meta.json](../apps/control-plane/route.meta.json) | Machine-readable route manifest |

## Enforcement Scripts

| Script | Command | Purpose |
|---|---|---|
| `scripts/package-ownership-check.ts` | `pnpm package:ownership:check` | Validate `package.meta.json` schema across all packages |
| `scripts/dependency-boundary-check.ts` | `pnpm deps:check` | Detect circular deps, cross-vertical deps, deprecated usage |
| `scripts/ai-contract-check.ts` | `pnpm ai:contract:check` | Scan apps for prohibited AI patterns |
| `scripts/control-plane-check.ts` | `pnpm control-plane:check` | Validate control plane routes against `route.meta.json` |
| `scripts/app-gold-standard-check.ts` | `pnpm app:gold-standard:check` | Check app compliance with gold standard |
| `scripts/package-deprecation-check.ts` | `pnpm package:deprecation:check` | Validate deprecation metadata consistency |
| `scripts/governance-check.ts` | `pnpm governance:check` | Existing: SBOM, evidence, policy engine validation |

## Contract Tests

| Test | Location |
|---|---|
| Domain vs Audit guardrails | `tooling/contract-tests/domain-vs-audit.test.ts` |
| Domain/audit allowlist | `tooling/contract-tests/domain-audit-allowlist.json` |

## Packages Created

| Package | Purpose |
|---|---|
| `@nzila/platform-ai-contract` | Canonical AI output types and validation schemas |

## Dashboard

| Route | Bucket | Purpose |
|---|---|---|
| `/architecture` | HEALTH | Package ownership, app compliance, dependency health summary |

## Seed / Demo

| Script | Command | Purpose |
|---|---|---|
| `scripts/seed-architecture-demo.ts` | `pnpm arch:seed` | Generate static architecture snapshot to `demo-output/` |
