/**
 * QuickBooks Online integration — CFO app.
 *
 * Wires @nzila/qbo for OAuth flow, account management, journal entry sync,
 * and expense categorization from real QBO data.
 */
import {
  createQboClient,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getValidToken,
  listActiveAccounts,
  listExpenseAccounts,
  listRevenueAccounts,
  listRdAccounts,
  getAccountSummary,
  getQboEnv,
  validateQboEnv,
  QBO_SCOPES,
  type QboClient,
  type AccountSummary,
  type QboTokenSet,
} from '@nzila/qbo'

export {
  createQboClient,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getValidToken,
  listActiveAccounts,
  listExpenseAccounts,
  listRevenueAccounts,
  listRdAccounts,
  getAccountSummary,
  getQboEnv,
  validateQboEnv,
  QBO_SCOPES,
}
export type { QboClient, AccountSummary, QboTokenSet }

/**
 * Build a financial summary from QBO accounts:
 * revenue accounts, expense accounts, and R&D accounts.
 */
export async function buildFinancialSummary(client?: QboClient | null) {
  if (!client) return { revenue: [], expenses: [], rd: [] }
  const [revenue, expenses, rd] = await Promise.all([
    listRevenueAccounts(client),
    listExpenseAccounts(client),
    listRdAccounts(client),
  ])
  return { revenue, expenses, rd }
}
