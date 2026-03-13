# Architecture Governance Index

> Master index of all anti-entropy architecture hardening documents, scripts, and enforcement tools.

---

## Governance Documents

| Document | Purpose |
|---|---|
| [ARCHITECTURAL_LAYERS.md](architecture/ARCHITECTURAL_LAYERS.md) | Four-layer dependency model: Apps → Platform Services → Shared Packages → Infrastructure |
| [APP_LIFECYCLE_MATRIX.md](governance/APP_LIFECYCLE_MATRIX.md) | App maturity tiering: PRODUCTION / PILOT / INCUBATING / EXPERIMENTAL |
| [PLATFORM_SURFACE_RESPONSIBILITIES.md](governance/PLATFORM_SURFACE_RESPONSIBILITIES.md) | Control Plane vs Console vs Platform Admin vs App Admin boundaries |
| [PLATFORM_VS_APP_DECISION_RULE.md](governance/PLATFORM_VS_APP_DECISION_RULE.md) | Decision framework: when a capability belongs in platform vs app |
| [PACKAGE_OWNERSHIP.md](governance/PACKAGE_OWNERSHIP.md) | Package registry: owner, category, stability, allowed dependents |
| [PACKAGE_LIFECYCLE_POLICY.md](governance/PACKAGE_LIFECYCLE_POLICY.md) | Create, graduate, deprecate, and remove packages |
| [DOMAIN_VS_AUDIT_MODEL.md](architecture/DOMAIN_VS_AUDIT_MODEL.md) | Rules separating domain state from audit/evidence stores |
| [AI_PLATFORM_CONTRACT.md](architecture/AI_PLATFORM_CONTRACT.md) | Canonical AI output schemas and prohibited patterns |
| [CONTROL_PLANE_PRINCIPLES.md](architecture/CONTROL_PLANE_PRINCIPLES.md) | Control Plane route buckets (HEALTH/ATTENTION/ACTION) |
| [ARCHITECTURAL_BOUNDARIES.md](architecture/ARCHITECTURAL_BOUNDARIES.md) | Dependency direction rules and vertical isolation |
| [APP_GOLD_STANDARD.md](governance/APP_GOLD_STANDARD.md) | Structural requirements for production-ready apps |

## Platform Registry (Machine-Readable)

| File | Purpose |
|---|---|
| [platform/registry/layers.json](../platform/registry/layers.json) | Layer map with paths, dependency rules, and allowed overrides |
| [platform/registry/apps.json](../platform/registry/apps.json) | App registry: tier, owner, domain, capability flags |
| [platform/registry/platform-registry.json](../platform/registry/platform-registry.json) | Canonical registry: apps, platform services, shared packages, governance surfaces |

## Templates

| Template | Purpose |
|---|---|
| [templates/architecture-decision-record.md](../templates/architecture-decision-record.md) | ADR template for platform-vs-app placement decisions |

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
| `scripts/architecture-layer-check.ts` | `pnpm architecture:layers:check` | Validate dependency directions across architectural layers |
| `scripts/app-lifecycle-check.ts` | `pnpm app:lifecycle:check` | Validate app registration and tier-specific requirements |
| `scripts/platform-registry-check.ts` | `pnpm registry:check` | Validate platform-registry.json shape and path existence |
| `scripts/control-plane-surface-check.ts` | `pnpm control-plane:surface:check` | Validate control-plane routes against surface responsibilities |
| `scripts/platform-vs-app-check.ts` | `pnpm platform:vs-app:check` | Validate platform vs app classification and registry coverage |
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
| `/architecture` | HEALTH | Lifecycle tiers, registry completeness, package ownership, app compliance, platform service health |

## Seed / Demo

| Script | Command | Purpose |
|---|---|---|
| `scripts/seed-architecture-demo.ts` | `pnpm arch:seed` | Generate static architecture snapshot to `demo-output/` |

---

## How These Documents Fit Together

```
┌─────────────────────────────────────────────┐
│         ARCHITECTURAL_LAYERS.md             │  ← Layer model (what depends on what)
│  layers.json                                │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         APP_LIFECYCLE_MATRIX.md             │  ← Which apps are mature enough
│  apps.json                                  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  platform-registry.json                     │  ← Canonical source of truth
│  PACKAGE_OWNERSHIP.md                       │
│  PACKAGE_LIFECYCLE_POLICY.md                │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  PLATFORM_SURFACE_RESPONSIBILITIES.md       │  ← Where things appear in UI
│  PLATFORM_VS_APP_DECISION_RULE.md           │
│  architecture-decision-record.md (template) │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Enforcement Scripts                        │  ← CI checks validate everything
│  Control Plane /architecture                │  ← Dashboard visualises it
└─────────────────────────────────────────────┘
```
