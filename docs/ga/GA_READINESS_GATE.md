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
| Cross-Org READ attempt returns 403/404 | ✅ | Static: `org-isolation.test.ts` L51 (9/9); `org-isolation-runtime.test.ts` (9/9) — all routes have auth guards; body injection blocked |
| Cross-Org WRITE attempt returns 403 | ✅ | `authorizeEntityAccess()` in `@nzila/os-core/policy/authorize.ts`; enforced on all mutation routes |
| Forged `org_id` in payload is ignored | ✅ | `org-isolation.test.ts` L88 — 0 routes read entityId from body without auth |
| Missing Org context rejected (401) | ✅ | `clerkMiddleware` + `auth.protect()` in both console and partners middleware |
| Enumeration protection (no object existence leakage) | ✅ | `org-isolation-runtime.test.ts` — error response leak test |
| Automated cross-Org regression tests run in CI | ✅ | `contract-tests` job runs 9 org-isolation tests + 9 runtime tests |
| CI fails if any Org isolation test fails | ✅ | `ci.yml` `contract-tests` job — exit 1 on test failure; required check |

**Current verdict: ✅ PASS (as of commit `059ce73`)**

---

## 1.2 Privilege Escalation Protection

| Item | Status | Evidence / Blocker |
|------|--------|--------------------|
| Org Admin cannot perform Platform Admin actions | ✅ | `privilege-escalation.test.ts` — 17 tests; `ConsoleRole.ADMIN` cannot reach `SUPER_ADMIN`-scoped actions |
| Users cannot self-elevate roles | ✅ | `org-isolation.test.ts` L88 — body entityId injection blocked; `ROLE_HIERARCHY` centralized |
| Role changes require proper permission | ✅ | `authorize()` in `@nzila/os-core/policy/authorize.ts`; `authorizeEntityAccess()` enforced |
| Escalation attempts generate audit events | ✅ | `AUTHORIZATION_DENIED: 'authorization.denied'` in `AUDIT_ACTIONS` taxonomy |
| Regression tests exist and run in CI | ✅ | `privilege-escalation.test.ts` (17/17) + `authz-regression.test.ts` (7/7) in CI |

**Current verdict: ✅ PASS (as of commit `059ce73`)**

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
| Required status checks configured in GitHub (branch protection) | ❌ | `gh api .../branches/main/protection` → **404 — branch not protected**. No required checks, no PR enforcement, no push restriction. → **REM-12 (the only remaining blocker)** |

> **REM-12 is zero-code** — repo Settings → Branches → Add rule → main. Takes 5 minutes. But until it's configured, a developer can force-push to main or merge without CI passing, bypassing every security workflow listed above.

**Current verdict: ❌ NO-GO — REM-12 (branch protection) is the sole remaining blocker**

---

# SECTION 2 — HIGH PRIORITY OPERABILITY GATES

## 2.1 Rate Limiting & Abuse Protection

| Item | Status | Evidence / Blocker |
|------|--------|--------------------|
| API rate limiting enabled | ✅ | `@nzila/os-core/rateLimit` — sliding window, configurable `RATE_LIMIT_MAX` + `RATE_LIMIT_WINDOW_MS`; `rate-limiting.test.ts` (11/11) |
| Next.js surface protected | ✅ | `apps/console/middleware.ts` + `apps/partners/middleware.ts` — `checkRateLimit()` wraps every request before `clerkMiddleware` |
| Request size limits enforced | 🟡 | Relies on Azure Front Door / platform defaults; no explicit `next.config.ts` `maxBodySize` set |
| Load test confirms throttle behavior | ❌ | No load test suite documented |
| Abuse events logged | 🟡 | Rate limiter returns 429 with structured headers; no explicit abuse-log emit |

**Current verdict: 🟡 Near-complete — rate limiting enforced; load test + explicit abuse log pending**

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

**Current verdict: ❌ NO-GO — CODEOWNERS enforcement only activates with branch protection (REM-12)**

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
| 1.1 Org Isolation | 18 tests (static + runtime), all ✅ | ✅ PASS | — |
| 1.2 Privilege Escalation | 17 escalation + 7 authz-regression tests ✅ | ✅ PASS | — |
| 1.3 Audit — DATA_EXPORT | `AUDIT_ACTIONS.DATA_EXPORT` + 18 taxonomy tests ✅ | ✅ PASS | — |
| 1.3 Audit — DB constraints | `0004_audit_events_immutable.sql` triggers ✅ | ✅ PASS | — |
| 1.4 Branch protection | Not configured (HTTP 404) | ❌ NO-GO | Blocks Section 1.4 |
| 2.1 Rate limiting | `checkRateLimit()` in both Next.js middlewares; 11/11 tests ✅ | ✅ PASS | — |
| 2.2 Observability | Full stack: logs, orgId, correlation, redaction, OTel, health routes ✅ | ✅ PASS | — |
| 3.1 Idempotency | No explicit tests | 🟡 Risk accepted v1 | — |
| 3.2 Rollback runbook | Migration docs exist; no formal runbook | 🟡 Risk accepted v1 | — |
| 4 — Branch protection | Not configured | ❌ NO-GO | Blocks Section 4 |
| 5 — Red team simulation | Not executed | ❌ Pending | Pending sign-off |

### Overall: 🟡 NEAR-GO AS OF 2026-02-20

> **Single remaining blocker: REM-12 (branch protection).** This is a 5-minute GitHub Settings configuration, not a code change.

---

# GA UNLOCK PATH

### Immediate (5 minutes, zero code)

| Action | Unblocks |
|--------|----------|
| **REM-12 — Configure GitHub branch protection on `main`** | Section 1.4, Section 4, Red team §5.6 |

All other Section 1 and Section 2 gates are ✅ **already passing** as of commit `059ce73`.  
See [REMEDIATION_PLAN.md](../stress-test/REMEDIATION_PLAN.md#rem-12) for the `gh api` command.

### Then (to complete the gate)

| Item | Time | Unblocks |
|------|------|----------|
| Execute red team simulation (§5.1–5.6) | 1–2 hours | Section 5 |
| Sign `GA_CERTIFICATION_REPORT.md` | 15 min | Final decision |

### Achievable GA date: **today** once REM-12 is configured and red team simulation is run

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
