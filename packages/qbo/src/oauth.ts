/**
 * @nzila/qbo — Intuit OAuth 2.0 helpers
 *
 * Implements the Authorization Code flow required by QuickBooks Online.
 *
 * Flow:
 *   1. Redirect user to `buildAuthorizationUrl()` to log in to Intuit
 *   2. Intuit redirects back to INTUIT_REDIRECT_URI with ?code=&realmId=&state=
 *   3. Exchange code for tokens via `exchangeCodeForTokens()`
 *   4. Persist `QboTokenSet` (includes realmId) — store per-org in DB
 *   5. Before each API call, call `getValidToken()` to refresh if needed
 *
 * Docs: https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0
 */
import { getQboEnv } from './env'
import type { QboTokenResponse, QboTokenSet } from './types'

// ── Intuit OAuth 2.0 endpoints ───────────────────────────────────────────────

const AUTH_ENDPOINT = 'https://appcenter.intuit.com/connect/oauth2'
const TOKEN_ENDPOINT = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
const REVOKE_ENDPOINT = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke'

// QBO accounting scope — add `openid profile email phone address` for OpenID
export const QBO_SCOPES = ['com.intuit.quickbooks.accounting'] as const

// ── Authorization URL ────────────────────────────────────────────────────────

/**
 * Build the Intuit OAuth 2.0 authorization URL.
 *
 * @param state  CSRF token generated per request — verify on callback
 * @param scopes Override default scopes if needed
 */
export function buildAuthorizationUrl(
  state: string,
  scopes: string[] = [...QBO_SCOPES],
): string {
  const env = getQboEnv()

  const params = new URLSearchParams({
    client_id: env.INTUIT_CLIENT_ID,
    redirect_uri: env.INTUIT_REDIRECT_URI,
    response_type: 'code',
    scope: scopes.join(' '),
    state,
  })

  return `${AUTH_ENDPOINT}?${params.toString()}`
}

// ── Token exchange ───────────────────────────────────────────────────────────

/**
 * Exchange the authorization code (from OAuth callback) for access + refresh tokens.
 *
 * @param code     `code` query param from Intuit callback
 * @param realmId  `realmId` query param from Intuit callback — the QBO company ID
 */
export async function exchangeCodeForTokens(
  code: string,
  realmId: string,
): Promise<QboTokenSet> {
  const env = getQboEnv()

  const credentials = Buffer.from(
    `${env.INTUIT_CLIENT_ID}:${env.INTUIT_CLIENT_SECRET}`,
  ).toString('base64')

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.INTUIT_REDIRECT_URI,
    }).toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`QBO token exchange failed ${res.status}: ${text}`)
  }

  const data = (await res.json()) as QboTokenResponse

  return {
    ...data,
    realmId,
    obtainedAt: Date.now(),
  }
}

// ── Token refresh ────────────────────────────────────────────────────────────

/**
 * Refresh an expired access token using the refresh token.
 * Intuit access tokens expire after 1 hour; refresh tokens after ~101 days.
 */
export async function refreshAccessToken(tokenSet: QboTokenSet): Promise<QboTokenSet> {
  const env = getQboEnv()

  const credentials = Buffer.from(
    `${env.INTUIT_CLIENT_ID}:${env.INTUIT_CLIENT_SECRET}`,
  ).toString('base64')

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenSet.refresh_token,
    }).toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`QBO token refresh failed ${res.status}: ${text}`)
  }

  const data = (await res.json()) as QboTokenResponse

  return {
    ...data,
    realmId: tokenSet.realmId,
    obtainedAt: Date.now(),
  }
}

// ── Token revocation ─────────────────────────────────────────────────────────

/**
 * Revoke a token (access or refresh). Use when disconnecting a QBO company.
 */
export async function revokeToken(token: string): Promise<void> {
  const env = getQboEnv()

  const credentials = Buffer.from(
    `${env.INTUIT_CLIENT_ID}:${env.INTUIT_CLIENT_SECRET}`,
  ).toString('base64')

  const res = await fetch(REVOKE_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ token }).toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`QBO token revocation failed ${res.status}: ${text}`)
  }
}

// ── Token validity helpers ───────────────────────────────────────────────────

const ACCESS_TOKEN_BUFFER_MS = 5 * 60 * 1000  // refresh 5 min before expiry
const REFRESH_TOKEN_BUFFER_MS = 24 * 60 * 60 * 1000  // warn 24h before expiry

/** Returns true if the access token is expired (or about to expire). */
export function isAccessTokenExpired(tokenSet: QboTokenSet): boolean {
  const expiresAt = tokenSet.obtainedAt + tokenSet.expires_in * 1000
  return Date.now() >= expiresAt - ACCESS_TOKEN_BUFFER_MS
}

/** Returns true if the refresh token has expired — user must re-authorise. */
export function isRefreshTokenExpired(tokenSet: QboTokenSet): boolean {
  const expiresAt =
    tokenSet.obtainedAt + tokenSet.x_refresh_token_expires_in * 1000
  return Date.now() >= expiresAt - REFRESH_TOKEN_BUFFER_MS
}

/**
 * Return a valid (non-expired) token set, refreshing automatically if needed.
 *
 * @param tokenSet   Current token set (from DB / session)
 * @param persist    Callback to persist the refreshed token set
 */
export async function getValidToken(
  tokenSet: QboTokenSet,
  persist: (refreshed: QboTokenSet) => Promise<void>,
): Promise<QboTokenSet> {
  if (isRefreshTokenExpired(tokenSet)) {
    throw new Error(
      `QBO refresh token expired for realmId ${tokenSet.realmId}. User must re-authorize.`,
    )
  }

  if (!isAccessTokenExpired(tokenSet)) {
    return tokenSet
  }

  const refreshed = await refreshAccessToken(tokenSet)
  await persist(refreshed)
  return refreshed
}
