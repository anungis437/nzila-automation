# Nzila Automation — Final GA Readiness Gate

**Version:** v1.0  
**Date:** 2026-02-20  
**Commit:** `main` @ `a505446` + sprint PRs pending  
**Scope:** Org-based multi-Org platform  
**Decision Authority:** CTO / Platform Owner  
**Terminology:** Org / Org isolation (no "tenant")

---

## How to Read This Document

Each gate item is mapped to internal evidence and a disposition:

| Symbol | Meaning |
|--------|---------|
| ✅ | Evidence confirmed — item passes |
| ⏳ | In sprint — addressed by active REM item, not yet merged |
| ❌ | Not yet addressed — blocks GA |
| 🟡 | Soft pass — risk accepted, no GA block |

**Decision rule:** Any ❌ in Section 1 → **NO-GO**.  
Section 2 ❌ items → **Controlled rollout only**.

---

# SECTION 1 — CRITICAL SECURITY GATES

## 1.1 Org Isolation Enforcement

| Item | Status | Evidence / Blocker |
|------|--------|--------------------|
| Cross-Org READ attempt returns 403/404 | ⏳ | `org-isolation.test.ts` static proof ✅; HTTP-level runtime test → **REM-02** (sprint Thu) |
| Cross-Org WRITE attempt returns 403 | ⏳ | As above — **REM-02** |
| Forged `org_id` in payload is ignored | ⏳ | Static: `org-isolation.test.ts` L88 ✅; runtime assertion → **REM-02** |
| Missing Org context rejected (401) | ⏳ | Middleware `clerkMiddleware` + `auth.protect()` ✅; HTTP-level test → **REM-02** |
| Enumeration protection (no object existence leakage) | ⏳ | Not explicitly tested → **REM-02** Test E |
| Automated cross-Org regression tests run in CI | 🟡 | `contract-tests` job runs `org-isolation.test.ts` (static, 5/5 ✅); runtime harness → **REM-02** |
| CI fails if any Org isolation test fails | ✅ | `ci.yml` `contract-tests` job — exit 1 on test failure; required check |

**Current verdict: ⏳ NO-GO — clears when REM-02 is merged**

---

## 1.2 Privilege Escalation Protection

| Item | Status | Evidence / Blocker |
|------|--------|--------------------|
| Org Admin cannot perform Platform Admin actions | ⏳ | `ROLE_HIERARCHY` centralized ✅; no regression test proving 403 → **REM-03** (sprint Fri) |
| Users cannot self-elevate roles | ⏳ | Static: body `entityId` not taken from request ✅; runtime test pending → **REM-03** |
| Role changes require proper permission | ✅ | `authorize()` in `@nzila/os-core/policy/authorize.ts`; `authorizeEntityAccess()` enforced |
| Escalation attempts generate audit events | ⏳ | `AUTHORIZATION_DENIED` action not yet in taxonomy → **REM-03** |
| Regression tests exist and run in CI | ⏳ | `authz-regression.test.ts` 7/7 ✅; privilege escalation-specific tests → **REM-03** |

**Current verdict: ⏳ NO-GO — clears when REM-03 is merged**

---

## 1.3 Audit Immutability & Coverage

| Item | Status | Evidence / Blocker |
|------|--------|--------------------|
| Audit table is append-only at DB level | ❌ | Application-layer hash chain ✅; PostgreSQL trigger/RLS preventing `UPDATE`/`DELETE` → **REM-11** (post-sprint) |
| UPDATE/DELETE on audit rows blocked by constraint or trigger | ❌ | Same — **REM-11** |
| Role changes audited (`MEMBER_ROLE_CHANGE`) | ✅ | `AUDIT_ACTIONS.MEMBER_ROLE_CHANGE: 'member.role_change'` in taxonomy; call-site test pending (REM-09, non-blocking) |
| Org settings changes audited (`ENTITY_UPDATE`) | ✅ | `AUDIT_ACTIONS.ENTITY_UPDATE: 'entity.update'` in taxonomy |
| Data export audited (`DATA_EXPORT`) | ⏳ | **Not in taxonomy** → **REM-04** (sprint Wed, GA-blocking) |
| Auth/security configuration audited | 🟡 | `AUTH_CONFIG_CHANGE` not yet in taxonomy → **REM-10** (post-launch, risk accepted) |
| Audit events include actor, org, timestamp, object, severity | ✅ | `audit_events` schema: `actorId`, `entityId`, `createdAt`, `objectType`, `severity` columns confirmed |
| Audit integrity tests exist and run in CI | ✅ | `audit-immutability.test.ts` — 7/7 pass; `ci.yml` `contract-tests` job |

> **Note on REM-11 vs GA-blocking:** The application-layer hash chain (`computeEntryHash`, `verifyEntityAuditChain`) provides strong integrity guarantees for external audit verification. DB-level trigger enforcement is an additional defense-in-depth layer. However, enterprise compliance reviewers (SOC 2 Type II, ISO 27001) will specifically ask whether a DBA can silently delete audit rows. Until REM-11 is merged, the honest answer is **yes** — which makes this a hard blocker for regulated enterprise customers.

**Current verdict: ❌ NO-GO — REM-04 (DATA_EXPORT) and REM-11 (DB constraints) must close**

---

## 1.4 CI Security Enforcement

| Item | Status | Evidence / Blocker |
|------|--------|--------------------|
| Secret scanning (Gitleaks + TruffleHog) blocks PR | ✅ | `.github/workflows/secret-scan.yml` — Gitleaks `gitleaks-action@v2` + TruffleHog `--only-verified`; PR-triggered |
| Dependency audit blocks on CRITICAL | ✅ | `dependency-audit.yml` L49: `if [ "$CRITICAL" -gt "0" ]; then exit 1; fi` |
| Trivy blocks on CRITICAL | ✅ | `trivy.yml` — `exit-code: 1`, `severity: CRITICAL`, SARIF to Security tab |
| SBOM generated in CI | ✅ | `sbom.yml` — CycloneDX, attached to releases, 365-day retention |
| Frozen lockfile enforced | ✅ | Every CI `pnpm install` uses `--frozen-lockfile` (ci.yml, release-train.yml, all workflows) |
| Required status checks configured in GitHub (branch protection) | ❌ | `gh api .../branches/main/protection` → **404 — branch not protected**. No required checks, no PR enforcement, no push restriction. → **REM-12** |

> **REM-12 is zero-code** — repo Settings → Branches → Add rule → main. Takes 5 minutes. But until it's configured, a developer can force-push to main or merge without CI passing, bypassing every security workflow listed above.

**Current verdict: ❌ NO-GO — REM-12 (branch protection) must be configured**

---

# SECTION 2 — HIGH PRIORITY OPERABILITY GATES

## 2.1 Rate Limiting & Abuse Protection

| Item | Status | Evidence / Blocker |
|------|--------|--------------------|
| API rate limiting enabled | ⏳ | `apps/orchestrator-api` ✅ (`@fastify/rate-limit`); Next.js apps (console, partners, web) ❌ → **REM-01** (sprint Mon) |
| Next.js surface protected | ⏳ | **REM-01** |
| Request size limits enforced | 🟡 | Relies on Azure Front Door / platform defaults; no explicit `next.config.ts` `maxBodySize` set |
| Load test confirms throttle behavior | ❌ | No load test suite documented; see `docs/stress-test/` for plans |
| Abuse events logged | 🟡 | Arcjet (part of REM-01) emits deny events; structured logger active — but no explicit abuse log assertion |

**Current verdict: ⏳ Partial — controlled rollout only until REM-01 merged**

---

## 2.2 Observability Readiness

| Item | Status | Evidence / Blocker |
|------|--------|--------------------|
| Structured JSON logging everywhere | ✅ | `packages/os-core/src/telemetry/logger.ts` — `JSON.stringify(entry)` per log entry |
| Correlation ID attached to every request | ✅ | `requestContext.ts` — `AsyncLocalStorage<RequestContext>`, `requestId: randomUUID()` or `x-request-id` header |
| Org ID included in log context | ❌ | `RequestContext` interface has `userId`, `requestId`, `traceId` but **no `orgId` / `entityId` field**. Org context is not automatically injected into every log entry. |
| Redaction rules active (no token/PII leakage) | ✅ | `logger.ts` `REDACT_KEYS` Set: password, token, secret, accessToken, refreshToken, idToken, email, bearerToken |
| OTel baseline active | ✅ | `packages/os-core/src/telemetry/otel.ts` — `initOtel()`, NodeSDK + OTLP exporter (OTLP_ENDPOINT env-gated) |
| `/health` endpoint present | ⏳ | `apps/orchestrator-api` ✅; console + partners ❌ → **REM-05** (sprint Tue) |
| `/ready` endpoint checks dependencies | ⏳ | `apps/orchestrator-api` ✅; console + partners ❌ → **REM-05** |

> **Org ID in logs gap:** When debugging a cross-org incident, every log line must identify which Org the request belongs to. Without `orgId` in `RequestContext`, engineers must cross-reference audit records manually. This is a `3AM incident` waiting to happen. Remediate by adding `orgId?: string` to `RequestContext` and populating it from `AuthContext` after `authorize()` resolves.
>
> Tracking: added as **REM-13** in [REMEDIATION_PLAN.md](../stress-test/REMEDIATION_PLAN.md).

**Current verdict: ❌ Org ID log gap — limited rollout only until REM-05 + REM-13 closed**

---

# SECTION 3 — DATA & CONSISTENCY GATES

## 3.1 Concurrency & Idempotency

| Item | Status | Evidence / Blocker |
|------|--------|--------------------|
| Critical write operations are idempotent | 🟡 | No explicit idempotency keys or double-submit guards found in `apps/console/app/api/`. Financial/legal wires (`payments-stripe`, `qbo`) rely on Stripe idempotency keys at the SDK level — not confirmed wired in every route. |
| Double-submit tests exist | ❌ | No test asserting duplicate mutations are rejected or de-duplicated |
| No duplicate provisioning under race condition | 🟡 | Drizzle ORM uses `returning()` — idempotency depends on unique constraints in schema; not tested explicitly |

**Current verdict: 🟡 Risk accepted for v1 GA — must be addressed in next hardening sprint**

---

## 3.2 Migration & Rollback Safety

| Item | Status | Evidence / Blocker |
|------|--------|--------------------|
| Migrations reviewed before merge | ✅ | `CODEOWNERS`: `/packages/db/src/schema/**` and `/packages/db/drizzle/**` require `@nzila/platform` review |
| Rollback strategy documented | ❌ | `docs/migration/` exists (`app-alignment`, `3cuo.md`, `abr.md`, etc.) but no `ROLLBACK_STRATEGY.md` or rollback runbook found |
| No destructive unreviewed schema changes | ✅ | `audit-immutability.test.ts` asserts 0 migrations `DROP`/`TRUNCATE`/`CASCADE DELETE` on `audit_events`; CODEOWNERS gates all schema changes |

**Current verdict: 🟡 Rollback runbook missing — must be created before GA**

---

# SECTION 4 — RELEASE DISCIPLINE

| Item | Status | Evidence / Blocker |
|------|--------|--------------------|
| CODEOWNERS — Auth (`/packages/os-core/src/policy/**`) | ✅ | `CODEOWNERS` L17: `@nzila/security @nzila/platform` |
| CODEOWNERS — Org boundary (`/packages/os-core/**`) | ✅ | `CODEOWNERS` L8: `@nzila/eng @nzila/platform` |
| CODEOWNERS — Audit (`/apps/console/lib/audit*.ts`) | ✅ | `CODEOWNERS` L27: `@nzila/security @nzila/platform` |
| CODEOWNERS — CI workflows (`/.github/**`) | ✅ | `CODEOWNERS` L34: `@nzila/platform @nzila/security` |
| No direct pushes to main | ❌ | **Branch protection not configured** (HTTP 404). CODEOWNERS exists but is not enforced without branch protection rules. → **REM-12** |
| Changesets / release workflow operational | ✅ | `.changeset/config.json` + `release-train.yml` + `changeset version` and `changeset publish` scripts |
| Build reproducibility verified in CI | ✅ | `--frozen-lockfile` on every install; Node pinned at v22; Drizzle major/minor updates blocked via Dependabot ignore rules |

**Current verdict: ❌ NO-GO — branch protection (REM-12) blocks this section**

---

# SECTION 5 — FINAL RED TEAM SIMULATION

**Status: NOT YET EXECUTED**

This simulation must be run before the GA Certification Report (`docs/ga/GA_CERTIFICATION_REPORT.md`) can be signed.

| Simulation | Target file for results |
|-----------|------------------------|
| 1. Attempt cross-Org data read | `GA_CERTIFICATION_REPORT.md` §5.1 |
| 2. Attempt privilege escalation | `GA_CERTIFICATION_REPORT.md` §5.2 |
| 3. Attempt audit tampering | `GA_CERTIFICATION_REPORT.md` §5.3 |
| 4. Trigger rate limit (429 response) | `GA_CERTIFICATION_REPORT.md` §5.4 |
| 5. Trigger dependency vulnerability (dummy branch) | `GA_CERTIFICATION_REPORT.md` §5.5 |
| 6. Confirm CI blocks on failures | `GA_CERTIFICATION_REPORT.md` §5.6 |

**Prerequisite:** All REM-01 through REM-05 and REM-11, REM-12, REM-13 must be merged before simulation is meaningful.

---

# CURRENT DECISION MATRIX

| Section | Gate | Status | Effect |
|---------|------|--------|--------|
| 1.1 Org Isolation | REM-02 pending | ⏳ | NO-GO |
| 1.2 Privilege Escalation | REM-03 pending | ⏳ | NO-GO |
| 1.3 Audit — DATA_EXPORT | REM-04 pending | ⏳ | NO-GO |
| 1.3 Audit — DB constraints | REM-11 pending | ❌ | NO-GO |
| 1.4 Branch protection | REM-12 not yet started | ❌ | NO-GO |
| 2.1 Rate limiting | REM-01 pending | ⏳ | Controlled rollout only |
| 2.2 Org ID in logs | REM-13 not yet started | ❌ | Controlled rollout only |
| 2.2 Health/ready routes | REM-05 pending | ⏳ | Controlled rollout only |
| 3.1 Idempotency | No REM item | 🟡 | Risk accepted v1 |
| 3.2 Rollback runbook | No REM item | 🟡 | Risk accepted v1 |
| 4 — Branch protection | REM-12 | ❌ | NO-GO |
| 5 — Red team simulation | Not executed | ❌ | NO-GO |

### Overall: 🔴 NO-GO AS OF 2026-02-20

---

# GA UNLOCK PATH

### Sprint (2026-02-23 → 2026-02-27)

Closing these **unblocks Section 1**:

| Day | Item | Unblocks |
|-----|------|----------|
| Mon | REM-01 — Rate limiting | Section 2.1 |
| Tue | REM-05 — Health routes | Section 2.2 partial |
| Wed | REM-04 — DATA_EXPORT audit | Section 1.3 partial |
| Thu | REM-02 — Org isolation runtime | Section 1.1, 1.2 partial |
| Fri | REM-03 — Escalation tests | Section 1.2 |
| Any | **REM-12 — Branch protection (30 min, zero code)** | Section 1.4, Section 4 |

### Post-Sprint (2026-03-02 → 2026-03-06)

| Item | Unblocks |
|------|----------|
| REM-11 — Audit DB constraints | Section 1.3 fully |
| REM-13 — Org ID in logs | Section 2.2 fully |
| Migration rollback runbook | Section 3.2 |
| Red team simulation → sign `GA_CERTIFICATION_REPORT.md` | Section 5 |

### Achievable GA date: **2026-03-06** (two weeks from today)

---

# EXECUTIVE SUMMARY TEMPLATE

> Complete this section at sign-off.

```
GA Decision Date:    _______________
Version Tag:         _______________
CI Run ID:           _______________
Stress Test Run ID:  _______________

Critical Gates (Section 1):     PASS / FAIL
High Priority Gates (Section 2): PASS / PARTIAL
Red Team Simulation (Section 5): PASS / FAIL

Final Decision:
  ☐ GO
  ☐ NO-GO

Signed: ___________________________
        CTO / Platform Owner
```
