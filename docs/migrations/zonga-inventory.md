# Zonga (formerly CongoWave) — Legacy Inventory Report

> **Source**: `C:\APPS\legacy\zonga\congowave_app_v1-main` (read-only, DO NOT import)
> **Scanned**: 2026-02-24
> **Status**: Phase 0 — Inventory complete, no code copied

---

## 1. Framework & Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.1.4 + React 19 (App Router) |
| Backend | Django 5.0.1 + Django REST Framework |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Search | Elasticsearch 8.17 |
| Workers | Celery (async tasks) |
| Auth | JWT (access + refresh tokens) |
| Payments | Stripe (Connect, Subscriptions, Webhooks) |
| Storage | Azure Blob Storage (media) |
| Monitoring | Sentry |
| Email | Resend |
| IaC | Terraform (Azure deployment) |
| UI | Tailwind CSS + shadcn/ui |
| i18n | next-intl (en, fr) |
| Testing | Playwright (e2e), Vitest (unit) |

---

## 2. Auth Model

- JWT stored in `sessionStorage` (XSS risk)
- Auto-refresh via Axios interceptor
- Zustand auth store
- Role-based: `listener | artist | organizer | admin`
- Protected routes via `route-guards.ts`
- Email verification flow exists

---

## 3. Data Models (17 Django Apps)

| Domain | Entities |
|---|---|
| Users | `User`, `Profile` |
| Organizations | `Organization` (types: artist, venue, church, label) |
| Content | `Track`, `Release`, `Video`, `Playlist` |
| Events | `Event`, `TicketType`, `Order`, `Ticket`, `PromoCode` |
| Payments | `Payment`, `Refund`, `Tip`, `Payout`, `Wallet` |
| Subscriptions | `Plan`, `Subscription`, `Entitlement` |
| Rights | `RightsHolder`, `TrackRights`, `RoyaltyStatement` |
| Analytics | Various tracking models + ML models |

---

## 4. Background Jobs (Celery)

| Job | Schedule |
|---|---|
| Daily mix generation | Daily |
| Weekly discovery playlists | Weekly |
| Monthly royalty statements | Monthly |
| Audio transcoding | On upload |
| Order expiration | Periodic |
| ML profile updates | Daily |
| Daily recommendations | Daily |

---

## 5. Integrations

| Integration | Usage |
|---|---|
| Stripe | Payments, subscriptions, Connect payouts, webhooks |
| Azure Blob Storage | Media file storage |
| Elasticsearch | Full-text search |
| Sentry | Error tracking |
| Resend | Transactional email |
| PWA | Service worker with offline.html fallback |

---

## 6. Risky Patterns

| Risk | Severity |
|---|---|
| JWT tokens in `sessionStorage` — XSS vulnerability | **HIGH** |
| Inconsistent API URL patterns (some miss `/api/v1/` prefix) | **MEDIUM** |
| Duplicated `User` type across multiple files | **MEDIUM** |
| `print()` instead of logger in Celery tasks | **MEDIUM** |
| 300+ tolerated ESLint warnings | **MEDIUM** |
| 797 MB build size | **HIGH** |
| Direct `apiClient` calls bypassing typed API layer | **MEDIUM** |
| No org isolation — single-tenant architecture | **HIGH** |
| Wallet balance computed in memory, not ledger-based | **HIGH** |

---

## 7. Extraction Plan

### Extract (rebuild in NzilaOS)

| Asset | Target |
|---|---|
| Data models/schemas (Creator, ContentAsset, Release, RevenueEvent, Payout) | `packages/zonga-core` (Zod + TS interfaces) |
| Payments domain (Stripe pipeline) | `packages/zonga-core` service layer |
| Royalties & rights management | `packages/zonga-core` with ledger pattern |
| Ticketing domain (Event, TicketType, Order) | `packages/zonga-core` |
| Creator organization model | `packages/zonga-core` with org_id scoping |
| Upload flow logic | `packages/zonga-core` |
| API endpoint registry | `packages/zonga-core/src/types/` |
| Content analytics schema | `packages/zonga-core/src/types/` |

### Discard

| Asset | Reason |
|---|---|
| Django backend | Rewrite in TypeScript with NzilaOS patterns |
| Axios HTTP client | Replace with NzilaOS API patterns |
| react-player | Replace with standard video element |
| ML placeholder code | Not production-ready |
| Bloated build artifacts (797 MB) | Fresh build pipeline |
| 300+ ESLint warnings | Clean implementation |
| sessionStorage JWT | Use NzilaOS auth patterns |
| Single-tenant architecture | Rebuild with org_id scoping |
| In-memory wallet balance | Replace with ledger-style events |
