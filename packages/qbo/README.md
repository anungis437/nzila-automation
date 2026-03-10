# @nzila/qbo

QuickBooks Online integration for NzilaOS. Pure REST API client (no Intuit SDK) with OAuth 2.0, chart of accounts mapping, journal entry writing, and bidirectional sync engine.

## Domain context

NzilaOS organizations sync financial data with QuickBooks Online for accounting, invoicing, and reconciliation. This package implements the full QBO integration without the Intuit SDK — using direct REST API calls with OAuth 2.0 Authorization Code flow.

## Public API surface

### OAuth — `@nzila/qbo/oauth`

| Export | Description |
|---|---|
| `buildAuthorizationUrl(state, scopes?)` | Build Intuit OAuth consent URL |
| `exchangeCodeForTokens(code, realmId)` | Exchange auth code for token set |
| `refreshAccessToken()` | Refresh expired access token |
| `revokeToken()` | Revoke OAuth tokens |
| `getValidToken()` | Get valid token, refreshing if needed |
| `isAccessTokenExpired()` / `isRefreshTokenExpired()` | Token expiry checks |

### Client — `@nzila/qbo/client`

| Export | Description |
|---|---|
| QBO REST API client for CRUD operations on accounts, vendors, bills, journal entries |

### Accounts — `@nzila/qbo/accounts`

| Export | Description |
|---|---|
| Account CRUD and query operations |

### COA Mapping — `@nzila/qbo/coa-mapping`

| Export | Description |
|---|---|
| Chart of accounts mapping between NzilaOS and QBO account structures |

### Journal Writing — `@nzila/qbo/journal-write`

| Export | Description |
|---|---|
| Create and post journal entries to QBO |

### Sync — `@nzila/qbo/sync`

| Export | Description |
|---|---|
| `createSyncState(entityType, direction)` | Initialize sync state for an entity type |
| `updateSyncState(state, result)` | Update state after sync run |
| `isSyncOverdue(state)` | Check if sync is overdue |
| `detectFieldConflicts(nzilaEntity, qboEntity, fields)` | Detect field-level conflicts |
| `autoResolveConflicts(conflicts, rules)` | Auto-resolve conflicts per rules |
| `generateSyncHealthReport(states)` | Compile sync health across all entity types |
| `DEFAULT_SYNC_SCHEDULES` | Accounts (daily), journals (hourly), vendors (daily), bills (6h), customers (disabled) |

### Types — `@nzila/qbo/types`

| Type | Description |
|---|---|
| `QboTokenSet` | OAuth token set with realm ID |
| `QboAccount` | QBO account with classification, type, balance |
| `QboJournalEntry` / `QboJournalLine` | Journal entry structure |
| `QboVendor`, `QboBill` | Vendor and bill types |
| `SyncState`, `SyncConflict`, `SyncResult` | Sync engine types |
| `SyncDirection` | `nzila-to-qbo`, `qbo-to-nzila`, `bidirectional` |

## Dependencies

- `@nzila/db` — Drizzle ORM for token and sync state persistence
- `zod` — Schema validation

## Example usage

```ts
import { buildAuthorizationUrl, exchangeCodeForTokens } from '@nzila/qbo/oauth'
import { createSyncState, generateSyncHealthReport } from '@nzila/qbo/sync'

// OAuth flow
const authUrl = buildAuthorizationUrl('csrf-token')
const tokens = await exchangeCodeForTokens(code, realmId)

// Sync health
const states = await getAllSyncStates()
const report = generateSyncHealthReport(states)
```

## Related apps

- `apps/zonga` — Revenue event sync and reconciliation
- `apps/console` — QBO connection management

## Maturity

Pilot-grade — Full OAuth 2.0 flow and sync engine implemented. COA mapping and journal writing in place. No tests yet.
