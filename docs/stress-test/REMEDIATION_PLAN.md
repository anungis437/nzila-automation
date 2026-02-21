# Remediation Plan — Enterprise Stress Test

**Date:** 2026-02-20  
**Branch:** `main` @ `a505446`  
**Terminology:** Org / Org isolation (no "tenant")

---

## Priority Matrix

| PR # | Title | Severity | Blocks GA? |
|------|-------|---------|-----------|
| REM-01 | Rate limiting for Next.js apps | ❌ HIGH FAIL | Yes |
| REM-02 | Runtime Org isolation HTTP test harness | 🟡 Critical SOFT PASS | Yes |
| REM-03 | Privilege escalation regression tests | 🟡 Critical SOFT PASS | Yes |
| REM-04 | `DATA_EXPORT` audit action + route wiring | 🟡 Critical SOFT PASS | Yes |
| REM-05 | Health/readiness routes in Next.js apps | 🟡 HIGH SOFT PASS | No (pre-GA) |

PRs 6–10 (post-launch hardening) follow below.

---

## REM-01 — Rate Limiting for Next.js Apps

**Severity:** ❌ FAIL (HIGH)  
**Closes:** `E08-c`, Phase 5 gap  
**Evidence it fixes:** `grep` for `rateLimit|arcjet|upstash` in `apps/console/`, `apps/partners/`, `apps/web/` returns 0 results.

### Scope

All API routes in:
- `apps/console/app/api/**`
- `apps/partners/app/api/**`
- `apps/web/app/api/**` (if any)

### Implementation

Use [Arcjet](https://arcjet.com/) or `@upstash/ratelimit` + Upstash Redis for edge-compatible rate limiting in Next.js middleware.

**Recommended approach — Arcjet (zero Redis dependency, works on Vercel/Azure):**

```ts
// apps/console/lib/arcjet.ts
import arcjet, { tokenBucket } from '@arcjet/next'

export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    tokenBucket({ mode: 'LIVE', refillRate: 60, interval: 60, capacity: 100 }),
  ],
})
```

```ts
// In middleware.ts (wraps clerkMiddleware)
import { aj } from '@/lib/arcjet'
const decision = await aj.protect(request)
if (decision.isDenied()) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
```

### Files to Change

| File | Change |
|------|--------|
| `apps/console/package.json` | Add `@arcjet/next` |
| `apps/partners/package.json` | Add `@arcjet/next` |
| `apps/console/lib/arcjet.ts` | New — rate limit config |
| `apps/partners/lib/arcjet.ts` | New — rate limit config |
| `apps/console/middleware.ts` | Wrap `clerkMiddleware` with Arcjet check |
| `apps/partners/middleware.ts` | Wrap `clerkMiddleware` with Arcjet check |

### Tests to Add

```ts
// tooling/contract-tests/rate-limiting.test.ts
describe('Rate limiting — Next.js apps', () => {
  it('console middleware.ts imports and invokes rate limiter', () => {
    const content = readContent('apps/console/middleware.ts')
    expect(content.includes('@arcjet/next') || content.includes('rateLimit')).toBe(true)
  })
  it('partners middleware.ts imports and invokes rate limiter', () => { ... })
})
```

Integration: add Arcjet test mode for CI (`ARCJET_ENV=test` → always allow, but import verified).

---

## REM-02 — Runtime Org Isolation HTTP Test Harness

**Severity:** 🟡 SOFT PASS (Critical)  
**Closes:** `E04-h`, Phase 1 gaps F–J  
**Evidence it fixes:** `org-isolation.test.ts` only does static analysis; no HTTP-level cross-org breach proofs.

### Scope

New test file: `tooling/contract-tests/org-isolation-runtime.test.ts`  
OR integration test suite in `apps/console/app/api/__tests__/`

### Tests to Add (Mandatory)

```ts
describe('Org isolation — runtime HTTP proofs', () => {
  let orgAHeaders: Headers  // session claims entityId = ORG_A_ID
  let orgBHeaders: Headers  // session claims entityId = ORG_B_ID
  let orgAResourceId: string  // resource seeded under ORG_A

  beforeAll(async () => {
    // seed ORG_A resource
  })

  it('A. Cross-org READ blocked — OrgB cannot GET OrgA resource', async () => {
    const res = await fetch(`/api/entities/${ORG_A_RESOURCE_ID}`, { headers: orgBHeaders })
    expect(res.status).toBe(403)
  })

  it('B. Cross-org WRITE blocked — OrgB cannot POST to OrgA entity', async () => {
    const res = await fetch(`/api/entities/${ORG_A_ID}/actions`, {
      method: 'POST', headers: orgBHeaders, body: JSON.stringify({ type: 'test' })
    })
    expect(res.status).toBe(403)
  })

  it('C. Missing org context blocked — unauthenticated request returns 401', async () => {
    const res = await fetch(`/api/entities/${ORG_A_ID}/actions`, { method: 'GET' })
    expect(res.status).toBe(401)
  })

  it('D. Forged entityId in body is ignored — auth entityId from session wins', async () => {
    const res = await fetch(`/api/some-mutation`, {
      method: 'POST', headers: orgBHeaders,
      body: JSON.stringify({ entityId: ORG_A_ID })  // forged
    })
    // Should only operate on OrgB's context or 403
    expect([200, 403]).toContain(res.status)
    // If 200, response must NOT contain OrgA data
  })

  it('E. Error messages do not leak org existence', async () => {
    const res = await fetch(`/api/entities/${ORG_A_ID}/actions`, { headers: orgBHeaders })
    const body = await res.json()
    expect(body.error).not.toContain(ORG_A_ID)  // no leak of org ID in error
  })
})
```

### Files to Change / Create

| File | Change |
|------|--------|
| `tooling/contract-tests/org-isolation-runtime.test.ts` | New — 5 runtime tests |
| `tooling/contract-tests/fixtures/orgs.ts` | New — seeded OrgA + OrgB fixtures |
| `apps/console/app/api/` route handlers | Verify `authorize()` call exists; add `authorizeEntityAccess()` where missing |
| `packages/os-core/src/policy/authorize.ts` | Ensure `authorizeEntityAccess()` is called from console routes for entity-level access |

### CI Integration

Add to `ci.yml` `contract-tests` job or a new `org-isolation-integration` job with a seeded test DB.

---

## REM-03 — Privilege Escalation Regression Tests

**Severity:** 🟡 SOFT PASS (Critical)  
**Closes:** Phase 2.3 gaps  
**Evidence it fixes:** `E05-f` — no test covering org admin → super_admin route escalation.

### Scope

New tests in `tooling/contract-tests/authz-regression.test.ts` (extend existing file) or new `privilege-escalation.test.ts`.

### Tests to Add

```ts
describe('Privilege escalation regression', () => {
  it('console:admin cannot call a console:super_admin-only action', () => {
    // Static: find route that requires ConsoleRole.SUPER_ADMIN
    // Verify that roleIncludes(ConsoleRole.ADMIN, ConsoleRole.SUPER_ADMIN) === false
    expect(roleIncludes(ConsoleRole.ADMIN, ConsoleRole.SUPER_ADMIN)).toBe(false)
  })

  it('partner:channel_sales cannot perform partner:channel_admin actions', () => {
    expect(roleIncludes(PartnerRole.CHANNEL_SALES, PartnerRole.CHANNEL_ADMIN)).toBe(false)
  })

  it('no role can self-elevate via Scope.ADMIN_USER_MANAGEMENT except SUPER_ADMIN + ADMIN', () => {
    const privilegedScopes = [Scope.ADMIN_USER_MANAGEMENT, Scope.ADMIN_SYSTEM]
    const allowedRoles = [ConsoleRole.SUPER_ADMIN, ConsoleRole.ADMIN]
    for (const role of Object.values({ ...ConsoleRole, ...PartnerRole, ...UERole })) {
      if (allowedRoles.includes(role as ConsoleRole)) continue
      const scopes = ROLE_DEFAULT_SCOPES[role]
      for (const ps of privilegedScopes) {
        expect(scopes).not.toContain(ps)
      }
    }
  })

  it('attempted escalation audit event is emitted (integration)', async () => {
    // Call a route with insufficient role → 403 → audit event emitted with action='authorization.denied'
    // Requires AUDIT_ACTIONS.AUTHORIZATION_DENIED to be added to taxonomy
  })
})
```

### Files to Change / Create

| File | Change |
|------|--------|
| `tooling/contract-tests/privilege-escalation.test.ts` | New — 4+ tests |
| `apps/console/lib/audit-db.ts` | Add `AUTHORIZATION_DENIED: 'authorization.denied'` to `AUDIT_ACTIONS` |
| `packages/os-core/src/policy/authorize.ts` | Optionally emit audit event on `AuthorizationError` throw |

---

## REM-04 — `DATA_EXPORT` Audit Action + Route Wiring

**Severity:** 🟡 SOFT PASS + ❌ (Critical audit gap)  
**Closes:** `E06-i`, Phase 3.2 `DATA_EXPORT` gap  
**Evidence it fixes:** `AUDIT_ACTIONS` in `audit-db.ts` has no `DATA_EXPORT` or `DATA_EXPORT_REQUEST` action.

### Scope

- `apps/console/lib/audit-db.ts` — add to `AUDIT_ACTIONS`
- Any route that generates exports (year-end, document exports, cap table exports) — wire `recordAuditEvent`
- Add contract test asserting export routes call `recordAuditEvent`

### Files to Change

| File | Change |
|------|--------|
| `apps/console/lib/audit-db.ts` | Add `DATA_EXPORT: 'data.export'`, `DATA_EXPORT_REQUEST: 'data.export_request'`, `AUTH_CONFIG_CHANGE: 'auth.config_change'` to `AUDIT_ACTIONS` |
| `apps/console/app/api/**/route.ts` (year-end, export routes) | Call `recordAuditEvent({ action: AUDIT_ACTIONS.DATA_EXPORT, ... })` |
| `tooling/contract-tests/audit-taxonomy.test.ts` | New — asserts `DATA_EXPORT` exists in taxonomy + export routes wire it |

### Tests to Add

```ts
describe('Audit taxonomy completeness', () => {
  it('AUDIT_ACTIONS includes DATA_EXPORT', () => {
    expect(AUDIT_ACTIONS.DATA_EXPORT).toBeDefined()
  })
  it('export route handlers call recordAuditEvent with DATA_EXPORT action', () => {
    const exportRoutes = findRouteFiles('console').filter(f => f.includes('export'))
    for (const route of exportRoutes) {
      const content = readContent(route)
      if (!content.includes('export')) continue
      expect(content.includes('recordAuditEvent') || content.includes('auditLog')).toBe(true)
    }
  })
})
```

---

## REM-05 — Health/Readiness Routes in Next.js Apps

**Severity:** 🟡 SOFT PASS (HIGH)  
**Closes:** `E09-g`, Phase 6.2 gap  
**Evidence it fixes:** No `app/api/health/route.ts` found in console or partners.

### Scope

Add lightweight health + readiness endpoints to console and partners apps.

### Implementation

```ts
// apps/console/app/api/health/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ status: 'ok', app: 'console', timestamp: new Date().toISOString() })
}

// apps/console/app/api/ready/route.ts
import { NextResponse } from 'next/server'
import { db } from '@nzila/db'
import { sql } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`)
    return NextResponse.json({ status: 'ready', db: 'ok' })
  } catch {
    return NextResponse.json({ status: 'not ready', db: 'unreachable' }, { status: 503 })
  }
}
```

Both routes are `isPublicRoute` in middleware (already pattern `/api/health/` is allowlisted in `org-isolation.test.ts`).

### Files to Change / Create

| File | Change |
|------|--------|
| `apps/console/app/api/health/route.ts` | New |
| `apps/console/app/api/ready/route.ts` | New — DB ping |
| `apps/partners/app/api/health/route.ts` | New |
| `apps/partners/app/api/ready/route.ts` | New |
| `apps/console/middleware.ts` | Confirm `/api/health` in `isPublicRoute` allowlist |
| `tooling/contract-tests/health-routes.test.ts` | New — asserts health routes exist in both apps |

### Tests to Add

```ts
describe('Health routes', () => {
  for (const app of ['console', 'partners']) {
    it(`${app}: /api/health/route.ts exists`, () => {
      expect(existsSync(resolve(ROOT, `apps/${app}/app/api/health/route.ts`))).toBe(true)
    })
    it(`${app}: /api/ready/route.ts exists`, () => {
      expect(existsSync(resolve(ROOT, `apps/${app}/app/api/ready/route.ts`))).toBe(true)
    })
  }
})
```

---

## REM-06 — CSP Nonce Hardening (Post-Launch)

**Severity:** 🟡 SOFT PASS  
**Current state:** `unsafe-inline` + `unsafe-eval` in all Next.js CSP headers (required by RSC hydration).  
**Target:** Nonce-based CSP to eliminate `unsafe-inline` where possible.  

**Files:** `apps/*/next.config.ts`, `apps/*/middleware.ts`  
**Approach:** Next.js 15 [nonce support](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)

---

## REM-07 — Audit Chain Verification API Endpoint (Post-Launch)

**Severity:** 🟡 SOFT PASS  
**Current state:** `verifyEntityAuditChain()` exists as library function only.  
**Target:** `GET /api/audit/verify-chain?entityId=xxx` route in console.  

**Files:** `apps/console/app/api/audit/verify-chain/route.ts` (new)  
**Auth:** Requires `ConsoleRole.COMPLIANCE_OFFICER` or `SUPER_ADMIN`  
**Audit:** Should itself emit `AUDIT_ACTIONS.EVIDENCE_PACK_VERIFY` event

---

## REM-08 — `pnpm run secret-scan` Script (Post-Launch)

**Severity:** Minor gap  
**Current state:** No `secret-scan` script in `package.json`.  
**Fix:** `"secret-scan": "npx gitleaks@latest detect --source . --config .gitleaks.toml --no-banner --verbose"` in root `package.json`.

---

## REM-09 — Call-Site Audit Coverage Tests (Post-Launch)

**Severity:** 🟡 SOFT PASS  
**Current state:** `MEMBER_ROLE_CHANGE`, `MEMBER_ADD`, `MEMBER_REMOVE` exist in taxonomy but no test that role-change routes call `recordAuditEvent`.  
**Fix:** Extend `audit-taxonomy.test.ts` to static-check that member management routes import and call `recordAuditEvent`.

---

## REM-10 — `AUTH_CONFIG_CHANGE` Audit Action (Post-Launch)

**Severity:** 🟡 SOFT PASS  
**Fix:** Add `AUTH_CONFIG_CHANGE: 'auth.config_change'` to `AUDIT_ACTIONS`. Wire to any routes that change MFA preferences, SSO config, or Clerk org settings.
