/**
 * @nzila/qbo — QuickBooks Online v3 REST API client
 *
 * Raw fetch-based client. No Intuit SDK dependency — keeps the package
 * lean and avoids version-lock on the Intuit Node SDK.
 *
 * Usage:
 *   const qbo = createQboClient(tokenSet)
 *   const accounts = await qbo.query<QboAccount>('Account', 'WHERE Active = true')
 *   const report = await qbo.report('ProfitAndLoss', { start_date: '2025-01-01', end_date: '2025-12-31' })
 */
import { getQboEnv } from './env'
import type {
  QboAccount,
  QboBill,
  QboFault,
  QboJournalEntry,
  QboQueryResponse,
  QboReport,
  QboTokenSet,
  QboVendor,
} from './types'

// ── Base URLs ────────────────────────────────────────────────────────────────

const BASE_URLS = {
  sandbox: 'https://sandbox-quickbooks.api.intuit.com/v3/company',
  production: 'https://quickbooks.api.intuit.com/v3/company',
} as const

// ── QBO client ───────────────────────────────────────────────────────────────

export interface QboClient {
  /**
   * Run a QBO SQL-like query against a resource.
   *
   * @example
   *   query<QboAccount>('Account', 'WHERE Active = true ORDER BY Name')
   */
  query<T>(entity: string, whereClause?: string): Promise<T[]>

  /** Fetch a single entity by ID. */
  get<T>(entity: string, id: string): Promise<T>

  /** Create an entity. Returns the created object. */
  create<T>(entity: string, body: unknown): Promise<T>

  /** Full-update an entity (sparse_update not supported on all entities). */
  update<T>(entity: string, body: object & { Id: string; SyncToken: string }): Promise<T>

  /** Fetch a financial report (ProfitAndLoss, BalanceSheet, CashFlow, etc.). */
  report(reportName: string, params?: Record<string, string>): Promise<QboReport>

  /** The realmId (QBO company ID) this client is scoped to. */
  readonly realmId: string
}

async function throwIfFault(res: Response): Promise<void> {
  if (res.ok) return
  let body: unknown
  try { body = await res.json() } catch { body = await res.text() }
  const fault = (body as { Fault?: QboFault }).Fault
  if (fault) {
    const msgs = fault.Error.map((e) => `[${e.code}] ${e.Message}: ${e.Detail ?? ''}`).join('; ')
    throw new Error(`QBO API error ${res.status}: ${msgs}`)
  }
  throw new Error(`QBO API error ${res.status}: ${JSON.stringify(body)}`)
}

/**
 * Create a QBO v3 REST client bound to a specific company (realmId).
 *
 * @param tokenSet  Valid token set (use `getValidToken()` from oauth.ts first)
 */
export function createQboClient(tokenSet: QboTokenSet): QboClient {
  const env = getQboEnv()
  const base = `${BASE_URLS[env.INTUIT_ENVIRONMENT]}/${tokenSet.realmId}`

  const headers = {
    Authorization: `Bearer ${tokenSet.access_token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }

  return {
    realmId: tokenSet.realmId,

    async query<T>(entity: string, whereClause = ''): Promise<T[]> {
      const sql = `SELECT * FROM ${entity}${whereClause ? ` ${whereClause}` : ''} MAXRESULTS 1000`
      const url = `${base}/query?query=${encodeURIComponent(sql)}&minorversion=73`

      const res = await fetch(url, { headers })
      await throwIfFault(res)

      const json = (await res.json()) as QboQueryResponse<T>
      return (json.QueryResponse[entity] as T[] | undefined) ?? []
    },

    async get<T>(entity: string, id: string): Promise<T> {
      const res = await fetch(`${base}/${entity.toLowerCase()}/${id}?minorversion=73`, { headers })
      await throwIfFault(res)
      const json = (await res.json()) as Record<string, T>
      return json[entity]
    },

    async create<T>(entity: string, body: unknown): Promise<T> {
      const res = await fetch(`${base}/${entity.toLowerCase()}?minorversion=73`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      await throwIfFault(res)
      const json = (await res.json()) as Record<string, T>
      return json[entity]
    },

    async update<T>(entity: string, body: object & { Id: string; SyncToken: string }): Promise<T> {
      const res = await fetch(`${base}/${entity.toLowerCase()}?operation=update&minorversion=73`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      await throwIfFault(res)
      const json = (await res.json()) as Record<string, T>
      return json[entity]
    },

    async report(reportName: string, params: Record<string, string> = {}): Promise<QboReport> {
      const qs = new URLSearchParams({ minorversion: '73', ...params }).toString()
      const res = await fetch(`${base}/reports/${reportName}?${qs}`, { headers })
      await throwIfFault(res)
      return (await res.json()) as QboReport
    },
  }
}

// ── Typed convenience wrappers ────────────────────────────────────────────────

export const qboAccounts = {
  list: (qbo: QboClient, where = '') =>
    qbo.query<QboAccount>('Account', where),
  get: (qbo: QboClient, id: string) =>
    qbo.get<QboAccount>('Account', id),
}

export const qboVendors = {
  list: (qbo: QboClient, where = '') =>
    qbo.query<QboVendor>('Vendor', where),
  get: (qbo: QboClient, id: string) =>
    qbo.get<QboVendor>('Vendor', id),
}

export const qboBills = {
  list: (qbo: QboClient, where = '') =>
    qbo.query<QboBill>('Bill', where),
  get: (qbo: QboClient, id: string) =>
    qbo.get<QboBill>('Bill', id),
  create: (qbo: QboClient, bill: Omit<QboBill, 'Id'>) =>
    qbo.create<QboBill>('Bill', bill),
}

export const qboJournalEntries = {
  list: (qbo: QboClient, where = '') =>
    qbo.query<QboJournalEntry>('JournalEntry', where),
  create: (qbo: QboClient, entry: QboJournalEntry) =>
    qbo.create<QboJournalEntry>('JournalEntry', entry),
}
