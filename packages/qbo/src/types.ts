/**
 * @nzila/qbo — Intuit QuickBooks Online types
 *
 * Covers the QBO v3 REST API shapes used across this package.
 * All shapes are partial — QBO returns many more optional fields;
 * index signatures allow callers to access extra fields safely.
 */

// ── OAuth ────────────────────────────────────────────────────────────────────

export interface QboTokenResponse {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
  expires_in: number                      // seconds, typically 3600
  x_refresh_token_expires_in: number      // seconds, typically 8726400 (101 days)
  id_token?: string
}

/** Persisted token record (as stored in DB / session). */
export interface QboTokenSet extends QboTokenResponse {
  realmId: string                         // QBO company ID
  obtainedAt: number                      // Unix ms timestamp
}

// ── QBO v3 REST envelope ─────────────────────────────────────────────────────

export interface QboFault {
  Error: Array<{
    Message: string
    Detail?: string
    code: string
    element?: string
  }>
  type: string
}

export interface QboQueryResponse<T> {
  QueryResponse: {
    [Key: string]: T[] | number | undefined
    startPosition?: number
    maxResults?: number
    totalCount?: number
  }
  time: string
}

// ── Account (Chart of Accounts) ──────────────────────────────────────────────

export type AccountClassification =
  | 'Asset'
  | 'Equity'
  | 'Expense'
  | 'Liability'
  | 'Revenue'

export type AccountType =
  | 'Bank'
  | 'Other Current Asset'
  | 'Fixed Asset'
  | 'Other Asset'
  | 'Accounts Receivable'
  | 'Equity'
  | 'Expense'
  | 'Other Expense'
  | 'Cost of Goods Sold'
  | 'Accounts Payable'
  | 'Credit Card'
  | 'Long Term Liability'
  | 'Other Current Liability'
  | 'Income'
  | 'Other Income'

export interface QboRef {
  value: string
  name?: string
}

export interface QboAccount {
  Id: string
  Name: string
  FullyQualifiedName: string
  Classification: AccountClassification
  AccountType: AccountType
  AccountSubType?: string
  Active: boolean
  CurrentBalance?: number
  CurrentBalanceWithSubAccounts?: number
  SubAccount?: boolean
  ParentRef?: QboRef
  CurrencyRef?: QboRef
  Description?: string
  [key: string]: unknown
}

// ── Vendor ───────────────────────────────────────────────────────────────────

export interface QboVendor {
  Id: string
  DisplayName: string
  Active: boolean
  Balance?: number
  BillAddr?: {
    Line1?: string
    City?: string
    CountrySubDivisionCode?: string
    PostalCode?: string
    Country?: string
  }
  PrimaryEmailAddr?: { Address: string }
  PrimaryPhone?: { FreeFormNumber: string }
  [key: string]: unknown
}

// ── Bill (AP Invoice) ────────────────────────────────────────────────────────

export interface QboBillLine {
  Id?: string
  LineNum?: number
  Description?: string
  Amount: number
  DetailType: 'AccountBasedExpenseLineDetail' | 'ItemBasedExpenseLineDetail'
  AccountBasedExpenseLineDetail?: {
    AccountRef: QboRef
    BillableStatus?: 'Billable' | 'NotBillable' | 'HasBeenBilled'
    CustomerRef?: QboRef
    ClassRef?: QboRef
  }
  [key: string]: unknown
}

export interface QboBill {
  Id: string
  VendorRef: QboRef
  TxnDate?: string
  DueDate?: string
  TotalAmt: number
  Balance: number
  CurrencyRef?: QboRef
  Line: QboBillLine[]
  [key: string]: unknown
}

// ── Journal Entry ────────────────────────────────────────────────────────────

export interface QboJournalLine {
  Id?: string
  Description?: string
  Amount: number
  DetailType: 'JournalEntryLineDetail'
  JournalEntryLineDetail: {
    PostingType: 'Debit' | 'Credit'
    AccountRef: QboRef
    ClassRef?: QboRef
    DepartmentRef?: QboRef
    Entity?: { Type: 'Customer' | 'Vendor' | 'Employee'; EntityRef: QboRef }
  }
  [key: string]: unknown
}

export interface QboJournalEntry {
  Id?: string
  TxnDate?: string
  PrivateNote?: string
  CurrencyRef?: QboRef
  Line: QboJournalLine[]
  [key: string]: unknown
}

// ── Profit & Loss report ─────────────────────────────────────────────────────

export interface QboReportColumn {
  ColType: string
  ColTitle: string
}

export interface QboReportRow {
  type: string
  ColData?: Array<{ value: string; id?: string }>
  Rows?: { Row: QboReportRow[] }
  Summary?: { ColData: Array<{ value: string }> }
}

export interface QboReport {
  Header: {
    ReportName: string
    DateMacro?: string
    StartPeriod?: string
    EndPeriod?: string
    Currency: string
  }
  Columns: { Column: QboReportColumn[] }
  Rows: { Row: QboReportRow[] }
}
