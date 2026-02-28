/**
 * Nzila OS — Tax governance tables
 *
 * Corporate tax (Federal T2 + Provincial CO-17) and indirect tax
 * (GST/HST + QST) governance tracking. We do NOT calculate tax.
 * We enforce controls, deadlines, approvals, and evidence integrity.
 *
 * All scoped by entity_id for multi-entity from day one.
 */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  varchar,
  date,
  boolean,
  numeric,
} from 'drizzle-orm/pg-core'
import { entities } from './entities'

// ── Enums ───────────────────────────────────────────────────────────────────

export const taxYearStatusEnum = pgEnum('tax_year_status', [
  'open',
  'filed',
  'assessed',
  'closed',
])

export const taxFilingTypeEnum = pgEnum('tax_filing_type', [
  'T2',
  'CO-17',
  'Schedule50',
  'T5',
  'RL-3',
  'Other',
  'T1',
  'T3',
  'T4',
  'T4A',
  'T5013',
  'PayrollRemittance',
])

export const taxInstallmentStatusEnum = pgEnum('tax_installment_status', [
  'due',
  'paid',
  'late',
])

export const taxNoticeAuthorityEnum = pgEnum('tax_notice_authority', [
  'CRA',
  'Revenu Quebec',
])

export const taxNoticeTypeEnum = pgEnum('tax_notice_type', [
  'NOA',
  'Reassessment',
  'InstallmentReminder',
])

export const indirectTaxTypeEnum = pgEnum('indirect_tax_type', [
  'GST',
  'HST',
  'QST',
])

export const indirectTaxFilingFrequencyEnum = pgEnum('indirect_tax_filing_frequency', [
  'monthly',
  'quarterly',
  'annual',
])

export const indirectTaxPeriodStatusEnum = pgEnum('indirect_tax_period_status', [
  'open',
  'filed',
  'paid',
  'closed',
])

// ── 1) tax_profiles ─────────────────────────────────────────────────────────

export const taxProfiles = pgTable('tax_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  federalBn: varchar('federal_bn', { length: 15 }), // BN (Business Number)
  provinceOfRegistration: varchar('province_of_registration', { length: 5 }), // ON | QC | etc
  fiscalYearEnd: varchar('fiscal_year_end', { length: 5 }), // MM-DD
  accountantName: text('accountant_name'),
  accountantEmail: text('accountant_email'),
  craProgramAccounts: jsonb('cra_program_accounts').default({}), // { RC: "...", RP: "...", RT: "..." }
  rqProgramAccounts: jsonb('rq_program_accounts').default({}), // for QC entities
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 2) tax_years ────────────────────────────────────────────────────────────

export const taxYears = pgTable('tax_years', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  fiscalYearLabel: varchar('fiscal_year_label', { length: 10 }).notNull(), // FY2026
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  federalFilingDeadline: date('federal_filing_deadline').notNull(),
  federalPaymentDeadline: date('federal_payment_deadline').notNull(),
  provincialFilingDeadline: date('provincial_filing_deadline'),
  provincialPaymentDeadline: date('provincial_payment_deadline'),
  status: taxYearStatusEnum('status').notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 3) tax_filings ──────────────────────────────────────────────────────────

export const taxFilings = pgTable('tax_filings', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  taxYearId: uuid('tax_year_id')
    .notNull()
    .references(() => taxYears.id),
  filingType: taxFilingTypeEnum('filing_type').notNull(),
  filedDate: date('filed_date'),
  preparedBy: text('prepared_by').notNull(), // clerk_user_id
  reviewedBy: text('reviewed_by'), // clerk_user_id — must differ from preparedBy (SoD)
  documentId: uuid('document_id'), // FK to documents (Blob)
  sha256: text('sha256'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 4) tax_installments ─────────────────────────────────────────────────────

export const taxInstallments = pgTable('tax_installments', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  taxYearId: uuid('tax_year_id')
    .notNull()
    .references(() => taxYears.id),
  dueDate: date('due_date').notNull(),
  requiredAmount: numeric('required_amount', { precision: 14, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 14, scale: 2 }),
  paymentDocumentId: uuid('payment_document_id'), // FK to documents (Blob)
  status: taxInstallmentStatusEnum('status').notNull().default('due'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 5) tax_notices ──────────────────────────────────────────────────────────

export const taxNotices = pgTable('tax_notices', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  taxYearId: uuid('tax_year_id')
    .notNull()
    .references(() => taxYears.id),
  authority: taxNoticeAuthorityEnum('authority').notNull(),
  noticeType: taxNoticeTypeEnum('notice_type').notNull(),
  receivedDate: date('received_date').notNull(),
  documentId: uuid('document_id'), // FK to documents (Blob)
  sha256: text('sha256'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 6) indirect_tax_accounts ────────────────────────────────────────────────

export const indirectTaxAccounts = pgTable('indirect_tax_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  taxType: indirectTaxTypeEnum('tax_type').notNull(),
  filingFrequency: indirectTaxFilingFrequencyEnum('filing_frequency').notNull(),
  programAccountNumber: varchar('program_account_number', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 7) indirect_tax_periods ─────────────────────────────────────────────────

export const indirectTaxPeriods = pgTable('indirect_tax_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entities.id),
  accountId: uuid('account_id')
    .notNull()
    .references(() => indirectTaxAccounts.id),
  taxType: indirectTaxTypeEnum('tax_type').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  filingDue: date('filing_due').notNull(),
  paymentDue: date('payment_due').notNull(),
  status: indirectTaxPeriodStatusEnum('status').notNull().default('open'),
  documentId: uuid('document_id'), // Filing evidence stored in Blob
  sha256: text('sha256'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── 8) indirect_tax_summary ─────────────────────────────────────────────────

export const indirectTaxSummary = pgTable('indirect_tax_summary', {
  id: uuid('id').primaryKey().defaultRandom(),
  periodId: uuid('period_id')
    .notNull()
    .references(() => indirectTaxPeriods.id),
  totalSales: numeric('total_sales', { precision: 14, scale: 2 }),
  taxCollected: numeric('tax_collected', { precision: 14, scale: 2 }),
  itcs: numeric('itcs', { precision: 14, scale: 2 }), // Input Tax Credits
  netPayable: numeric('net_payable', { precision: 14, scale: 2 }),
  reconciled: boolean('reconciled').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
