/**
 * @nzila/qbo — QuickBooks Online integration
 *
 * OAuth 2.0 flow + QBO v3 REST API client (no Intuit SDK dependency).
 *
 * Quick start:
 *   1. Redirect user to `buildAuthorizationUrl(state)` to connect their QBO company
 *   2. In the callback route, call `exchangeCodeForTokens(code, realmId)` and persist the result
 *   3. Before each API call, refresh via `getValidToken(tokenSet, persist)`
 *   4. Create a client with `createQboClient(tokenSet)` and call methods
 *
 * @example
 *   import { buildAuthorizationUrl, exchangeCodeForTokens, getValidToken, createQboClient } from '@nzila/qbo'
 *
 *   // Step 1 — redirect
 *   const authUrl = buildAuthorizationUrl(csrfState)
 *   redirect(authUrl)
 *
 *   // Step 2 — callback
 *   const tokenSet = await exchangeCodeForTokens(code, realmId)
 *   await db.saveQboToken(orgId, tokenSet)
 *
 *   // Step 3+4 — use
 *   const fresh = await getValidToken(tokenSet, (t) => db.saveQboToken(orgId, t))
 *   const qbo = createQboClient(fresh)
 *   const rdAccounts = await listRdAccounts(qbo)
 */

// Env
export { getQboEnv, validateQboEnv } from './env'
export type { QboEnv } from './env'

// OAuth
export {
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeToken,
  getValidToken,
  isAccessTokenExpired,
  isRefreshTokenExpired,
  QBO_SCOPES,
} from './oauth'

// Client
export {
  createQboClient,
  qboAccounts,
  qboVendors,
  qboBills,
  qboJournalEntries,
} from './client'
export type { QboClient } from './client'

// Accounts
export {
  listActiveAccounts,
  listExpenseAccounts,
  listRevenueAccounts,
  listRdAccounts,
  getAccountSummary,
  isRdAccount,
} from './accounts'
export type { AccountSummary } from './accounts'

// Types
export type {
  QboTokenResponse,
  QboTokenSet,
  QboFault,
  QboQueryResponse,
  QboReport,
  QboAccount,
  QboVendor,
  QboBill,
  QboBillLine,
  QboJournalEntry,
  QboJournalLine,
  AccountClassification,
  AccountType,
  QboRef,
} from './types'
