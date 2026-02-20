/**
 * @nzila/qbo — Chart of Accounts helpers
 *
 * Higher-level queries that map QBO accounts to Nzila business logic:
 * - R&D expense account detection (required for CRA SR&ED / government funding compliance)
 * - Grant-related account tagging
 * - Revenue / expense summaries for budget dashboards
 */
import type { QboClient } from './client'
import type { AccountClassification, QboAccount } from './types'

// ── R&D account detection ─────────────────────────────────────────────────────

/**
 * Keyword patterns used to identify R&D accounts.
 * Matches against FullyQualifiedName and Description (case-insensitive).
 *
 * Government funding compliance (CRA SR&ED, NRC IRAP, Digital Supercluster)
 * requires identifiable R&D accounting codes per governance/corporate/finance docs.
 */
const RD_KEYWORDS = [
  'research',
  'r&d',
  'r & d',
  'development',
  'innovation',
  'sred',
  'sr&ed',
  'irap',
  'experimental',
] as const

/** Return true if an account looks like an R&D account. */
export function isRdAccount(account: QboAccount): boolean {
  const haystack =
    `${account.FullyQualifiedName} ${account.Description ?? ''}`.toLowerCase()
  return RD_KEYWORDS.some((kw) => haystack.includes(kw))
}

// ── Account queries ───────────────────────────────────────────────────────────

/** List all active accounts grouped by classification. */
export async function listActiveAccounts(
  qbo: QboClient,
): Promise<Record<AccountClassification, QboAccount[]>> {
  const accounts = await qbo.query<QboAccount>('Account', 'WHERE Active = true ORDER BY Name')

  const grouped: Record<AccountClassification, QboAccount[]> = {
    Asset: [],
    Equity: [],
    Expense: [],
    Liability: [],
    Revenue: [],
  }

  for (const account of accounts) {
    const bucket = grouped[account.Classification]
    if (bucket) bucket.push(account)
  }

  return grouped
}

/** List just the expense accounts (includes COGS). */
export async function listExpenseAccounts(qbo: QboClient): Promise<QboAccount[]> {
  return qbo.query<QboAccount>(
    'Account',
    "WHERE Active = true AND (AccountType = 'Expense' OR AccountType = 'Cost of Goods Sold') ORDER BY Name",
  )
}

/** List just the revenue / income accounts. */
export async function listRevenueAccounts(qbo: QboClient): Promise<QboAccount[]> {
  return qbo.query<QboAccount>(
    'Account',
    "WHERE Active = true AND (AccountType = 'Income' OR AccountType = 'Other Income') ORDER BY Name",
  )
}

/**
 * List accounts flagged as R&D-related.
 * Used to verify correct expense categorisation for government funding
 * compliance (CRA SR&ED filings, NRC IRAP, Digital Supercluster grants).
 */
export async function listRdAccounts(qbo: QboClient): Promise<QboAccount[]> {
  const expenses = await listExpenseAccounts(qbo)
  return expenses.filter(isRdAccount)
}

// ── Balance summary ───────────────────────────────────────────────────────────

export interface AccountSummary {
  id: string
  name: string
  fullyQualifiedName: string
  classification: AccountClassification
  balance: number
  isRd: boolean
}

/** Return a flat balance summary for all active accounts. */
export async function getAccountSummary(qbo: QboClient): Promise<AccountSummary[]> {
  const accounts = await qbo.query<QboAccount>('Account', 'WHERE Active = true ORDER BY Name')

  return accounts.map((a) => ({
    id: a.Id,
    name: a.Name,
    fullyQualifiedName: a.FullyQualifiedName,
    classification: a.Classification,
    balance: a.CurrentBalanceWithSubAccounts ?? a.CurrentBalance ?? 0,
    isRd: isRdAccount(a),
  }))
}
