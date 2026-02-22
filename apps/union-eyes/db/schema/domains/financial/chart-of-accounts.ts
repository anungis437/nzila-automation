/**
 * Unified Chart of Accounts Schema
 * 
 * CONSOLIDATED SCHEMA - Single source of truth for all chart of accounts
 * 
 * Replaces:
 * - db/schema/clc-per-capita-schema.ts (clcChartOfAccounts)
 * - services/financial-service/drizzle/schema.ts (clcChartOfAccounts duplicate)
 * - db/schema/domains/finance/accounting.ts (chartOfAccounts)
 * 
 * Related:
 * - db/schema/domains/data/accounting.ts (externalAccounts - ERP integration)
 * 
 * Generated: 2026-02-12T07:12:52.833Z
 */

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from '../../../schema-organizations';

// ============================================================================
// ENUMS
// ============================================================================

export const accountTypeEnum = pgEnum('account_type', [
  'revenue',
  'expense',
  'asset',
  'liability',
  'equity',
]);

export const accountCategoryEnum = pgEnum('account_category', [
  'dues_revenue',
  'per_capita_revenue',
  'other_revenue',
  'salaries_wages',
  'administrative',
  'legal_professional',
  'strike_fund',
  'education_training',
  'organizing',
  'political_action',
  'assets',
  'liabilities',
  'equity',
]);

// ============================================================================
// UNIFIED CHART OF ACCOUNTS TABLE
// ============================================================================

/**
 * Unified Chart of Accounts
 * 
 * Supports:
 * - CLC standardized accounts (4000-7000 series)
 * - Custom organization accounts
 * - Multi-level hierarchy
 * - Integration with external ERP systems
 */
export const chartOfAccounts = pgTable(
  'chart_of_accounts',
  {
    // Identity
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' }),
    
    // Account identification
    accountCode: varchar('account_code', { length: 50 }).notNull(),
    accountName: varchar('account_name', { length: 255 }).notNull(),
    description: text('description'),
    
    // Classification
    accountType: accountTypeEnum('account_type').notNull(),
    accountCategory: accountCategoryEnum('account_category'),
    
    // Hierarchy
    parentAccountCode: varchar('parent_account_code', { length: 50 }),
    level: integer('level').default(0), // 0 = root, 1 = sub-account, etc.
    sortOrder: integer('sort_order'),
    
    // CLC/StatCan reporting
    isCLCStandard: boolean('is_clc_standard').default(false),
    statisticsCanadaCode: varchar('statistics_canada_code', { length: 50 }),
    financialStatementLine: varchar('financial_statement_line', { length: 100 }),
    
    // Status
    isActive: boolean('is_active').default(true),
    isSystem: boolean('is_system').default(false), // Cannot be edited by users
    
    // External ERP mapping
    externalSystemId: varchar('external_system_id', { length: 255 }), // QuickBooks, Xero ID
    externalProvider: varchar('external_provider', { length: 50 }), // QUICKBOOKS, XERO
    lastSyncedAt: timestamp('last_synced_at'),
    
    // Audit
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdBy: varchar('created_by', { length: 255 }),
    updatedBy: varchar('updated_by', { length: 255 }),
  },
  (table) => ({
    // Indexes for performance
    orgAccountCodeIdx: index('chart_accounts_org_code_idx').on(
      table.organizationId,
      table.accountCode
    ),
    accountCodeIdx: index('chart_accounts_code_idx').on(table.accountCode),
    parentCodeIdx: index('chart_accounts_parent_idx').on(table.parentAccountCode),
    typeIdx: index('chart_accounts_type_idx').on(table.accountType),
    categoryIdx: index('chart_accounts_category_idx').on(table.accountCategory),
    clcIdx: index('chart_accounts_clc_idx').on(table.isCLCStandard),
    externalIdx: index('chart_accounts_external_idx').on(
      table.externalProvider,
      table.externalSystemId
    ),
    
    // Unique constraints
    uniqueOrgAccountCode: unique('chart_accounts_org_code_unique').on(
      table.organizationId,
      table.accountCode
    ),
    // CLC standard accounts are global (null organizationId)
    uniqueCLCAccountCode: unique('chart_accounts_clc_code_unique').on(
      table.accountCode,
      table.isCLCStandard
    ),
  })
);

export const chartOfAccountsRelations = relations(
  chartOfAccounts,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [chartOfAccounts.organizationId],
      references: [organizations.id],
    }),
  })
);

// ============================================================================
// ACCOUNT MAPPINGS (for transaction templates)
// ============================================================================

export const accountMappings = pgTable(
  'account_mappings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' }),
    
    // Transaction type
    transactionType: varchar('transaction_type', { length: 100 }).notNull(),
    transactionCategory: varchar('transaction_category', { length: 100 }),
    
    // Double-entry mapping
    debitAccountCode: varchar('debit_account_code', { length: 50 }).notNull(),
    creditAccountCode: varchar('credit_account_code', { length: 50 }).notNull(),
    
    // Metadata
    description: text('description'),
    isActive: boolean('is_active').default(true),
    
    // Audit
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    orgTypeIdx: index('account_mappings_org_type_idx').on(
      table.organizationId,
      table.transactionType
    ),
    transactionTypeIdx: index('account_mappings_type_idx').on(table.transactionType),
  })
);

// ============================================================================
// TYPES
// ============================================================================

export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type NewChartOfAccount = typeof chartOfAccounts.$inferInsert;
export type AccountMapping = typeof accountMappings.$inferSelect;
export type NewAccountMapping = typeof accountMappings.$inferInsert;
