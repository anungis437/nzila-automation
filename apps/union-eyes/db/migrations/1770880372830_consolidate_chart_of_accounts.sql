-- ============================================================================
-- Chart of Accounts Schema Consolidation Migration
-- Generated: 2026-02-12T07:12:52.835Z
-- ============================================================================

-- Create enums
CREATE TYPE IF NOT EXISTS account_type AS ENUM (
  'revenue',
  'expense',
  'asset',
  'liability',
  'equity'
);

CREATE TYPE IF NOT EXISTS account_category AS ENUM (
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
  'equity'
);

-- Create unified chart_of_accounts table
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Account identification
  account_code VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Classification
  account_type account_type NOT NULL,
  account_category account_category,
  
  -- Hierarchy
  parent_account_code VARCHAR(50),
  level INTEGER DEFAULT 0,
  sort_order INTEGER,
  
  -- CLC/StatCan reporting
  is_clc_standard BOOLEAN DEFAULT FALSE,
  statistics_canada_code VARCHAR(50),
  financial_statement_line VARCHAR(100),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE,
  
  -- External ERP mapping
  external_system_id VARCHAR(255),
  external_provider VARCHAR(50),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  
  -- Constraints
  CONSTRAINT chart_accounts_org_code_unique UNIQUE (organization_id, account_code),
  CONSTRAINT chart_accounts_clc_code_unique UNIQUE (account_code, is_clc_standard)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS chart_accounts_org_code_idx ON chart_of_accounts(organization_id, account_code);
CREATE INDEX IF NOT EXISTS chart_accounts_code_idx ON chart_of_accounts(account_code);
CREATE INDEX IF NOT EXISTS chart_accounts_parent_idx ON chart_of_accounts(parent_account_code);
CREATE INDEX IF NOT EXISTS chart_accounts_type_idx ON chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS chart_accounts_category_idx ON chart_of_accounts(account_category);
CREATE INDEX IF NOT EXISTS chart_accounts_clc_idx ON chart_of_accounts(is_clc_standard);
CREATE INDEX IF NOT EXISTS chart_accounts_external_idx ON chart_of_accounts(external_provider, external_system_id);

-- Create account_mappings table for transaction templates
CREATE TABLE IF NOT EXISTS account_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  transaction_type VARCHAR(100) NOT NULL,
  transaction_category VARCHAR(100),
  debit_account_code VARCHAR(50) NOT NULL,
  credit_account_code VARCHAR(50) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS account_mappings_org_type_idx ON account_mappings(organization_id, transaction_type);
CREATE INDEX IF NOT EXISTS account_mappings_type_idx ON account_mappings(transaction_type);

-- Seed CLC standard chart of accounts
-- NOTE: These are global (organization_id = NULL) and marked as is_clc_standard = TRUE

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '4000',
  'Revenue',
  'All revenue accounts',
  'revenue'::account_type,
  'dues_revenue'::account_category,
  NULL,
  0,
  1000,
  TRUE,
  NULL,
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '4100',
  'Per-Capita Tax Revenue',
  'Monthly per-capita remittances from local unions',
  'revenue'::account_type,
  'per_capita_revenue'::account_category,
  '4000',
  1,
  1100,
  TRUE,
  'REV-PER-CAPITA',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '4100-001',
  'CLC Per-Capita Tax',
  'Per-capita tax remitted to CLC',
  'revenue'::account_type,
  'per_capita_revenue'::account_category,
  '4100',
  1,
  1101,
  TRUE,
  'REV-PER-CAPITA-CLC',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '4100-002',
  'Federation Per-Capita Tax',
  'Per-capita tax remitted to federation',
  'revenue'::account_type,
  'per_capita_revenue'::account_category,
  '4100',
  1,
  1102,
  TRUE,
  'REV-PER-CAPITA-FED',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '4200',
  'Membership Dues',
  'Regular membership dues collected',
  'revenue'::account_type,
  'dues_revenue'::account_category,
  '4000',
  1,
  1200,
  TRUE,
  'REV-DUES',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '4200-001',
  'Regular Membership Dues',
  'Monthly or bi-weekly dues from regular members',
  'revenue'::account_type,
  'dues_revenue'::account_category,
  '4200',
  1,
  1201,
  TRUE,
  'REV-DUES-REG',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '4200-002',
  'Initiation Fees',
  'One-time initiation fees from new members',
  'revenue'::account_type,
  'dues_revenue'::account_category,
  '4200',
  1,
  1202,
  TRUE,
  'REV-DUES-INIT',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '4300',
  'Grants and Donations',
  'Government grants, donations, and gifts',
  'revenue'::account_type,
  'other_revenue'::account_category,
  '4000',
  1,
  1300,
  TRUE,
  'REV-GRANTS',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '4400',
  'Investment Income',
  'Interest, dividends, and investment returns',
  'revenue'::account_type,
  'other_revenue'::account_category,
  '4000',
  1,
  1400,
  TRUE,
  'REV-INVEST',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '5000',
  'Operating Expenses',
  'All operating expense accounts',
  'expense'::account_type,
  'administrative'::account_category,
  NULL,
  0,
  2000,
  TRUE,
  NULL,
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '5100',
  'Salaries and Wages',
  'Staff salaries, wages, and related costs',
  'expense'::account_type,
  'salaries_wages'::account_category,
  '5000',
  1,
  2100,
  TRUE,
  'EXP-SALARIES',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '5100-001',
  'Officer Salaries',
  'Salaries for elected union officers',
  'expense'::account_type,
  'salaries_wages'::account_category,
  '5100',
  1,
  2101,
  TRUE,
  'EXP-SAL-OFFICERS',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '5100-002',
  'Staff Salaries',
  'Salaries for administrative and support staff',
  'expense'::account_type,
  'salaries_wages'::account_category,
  '5100',
  1,
  2102,
  TRUE,
  'EXP-SAL-STAFF',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '5100-003',
  'Employee Benefits',
  'Health insurance, pensions, and other benefits',
  'expense'::account_type,
  'salaries_wages'::account_category,
  '5100',
  1,
  2103,
  TRUE,
  'EXP-SAL-BENEFITS',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '5200',
  'Legal and Professional Fees',
  'Legal counsel, arbitration, and professional services',
  'expense'::account_type,
  'legal_professional'::account_category,
  '5000',
  1,
  2200,
  TRUE,
  'EXP-LEGAL',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '5200-001',
  'Legal Counsel',
  'Legal representation and advice',
  'expense'::account_type,
  'legal_professional'::account_category,
  '5200',
  1,
  2201,
  TRUE,
  'EXP-LEGAL-COUNSEL',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '5200-002',
  'Arbitration Costs',
  'Grievance arbitration and mediation',
  'expense'::account_type,
  'legal_professional'::account_category,
  '5200',
  1,
  2202,
  TRUE,
  'EXP-LEGAL-ARB',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '5200-003',
  'Accounting and Audit',
  'Accounting services and annual audit',
  'expense'::account_type,
  'legal_professional'::account_category,
  '5200',
  1,
  2203,
  TRUE,
  'EXP-LEGAL-ACCT',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '5300',
  'Per-Capita Tax Expense',
  'Per-capita remittances to parent organizations',
  'expense'::account_type,
  'administrative'::account_category,
  '5000',
  1,
  2300,
  TRUE,
  'EXP-PER-CAPITA',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '5400',
  'Administrative Expenses',
  'Office supplies, utilities, rent, and general admin',
  'expense'::account_type,
  'administrative'::account_category,
  '5000',
  1,
  2400,
  TRUE,
  'EXP-ADMIN',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '5500',
  'Travel and Meetings',
  'Travel, accommodations, and meeting costs',
  'expense'::account_type,
  'administrative'::account_category,
  '5000',
  1,
  2500,
  TRUE,
  'EXP-TRAVEL',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '6000',
  'Special Expenses',
  'Strike fund, education, organizing, and special projects',
  'expense'::account_type,
  'strike_fund'::account_category,
  NULL,
  0,
  3000,
  TRUE,
  NULL,
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '6100',
  'Strike Fund Disbursements',
  'Strike pay and related support costs',
  'expense'::account_type,
  'strike_fund'::account_category,
  '6000',
  1,
  3100,
  TRUE,
  'EXP-STRIKE',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '6200',
  'Education and Training',
  'Member education, steward training, conferences',
  'expense'::account_type,
  'education_training'::account_category,
  '6000',
  1,
  3200,
  TRUE,
  'EXP-EDUCATION',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '6300',
  'Organizing Campaigns',
  'New member organizing and recruitment',
  'expense'::account_type,
  'organizing'::account_category,
  '6000',
  1,
  3300,
  TRUE,
  'EXP-ORGANIZING',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '6400',
  'Political Action',
  'Political advocacy and lobbying activities',
  'expense'::account_type,
  'political_action'::account_category,
  '6000',
  1,
  3400,
  TRUE,
  'EXP-POLITICAL',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '7000',
  'Assets',
  'Cash, investments, and capital assets',
  'asset'::account_type,
  'assets'::account_category,
  NULL,
  0,
  4000,
  TRUE,
  NULL,
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '7100',
  'Cash and Bank Accounts',
  'Operating accounts and petty cash',
  'asset'::account_type,
  'assets'::account_category,
  '7000',
  1,
  4100,
  TRUE,
  'ASSET-CASH',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '7200',
  'Investments',
  'Securities, GICs, and investment funds',
  'asset'::account_type,
  'assets'::account_category,
  '7000',
  1,
  4200,
  TRUE,
  'ASSET-INVEST',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  level,
  sort_order,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  is_system
) VALUES (
  NULL,
  '7300',
  'Capital Assets',
  'Buildings, equipment, and vehicles',
  'asset'::account_type,
  'assets'::account_category,
  '7000',
  1,
  4300,
  TRUE,
  'ASSET-CAPITAL',
  NULL,
  TRUE,
  TRUE
) ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

-- Migrate existing organization-specific accounts from clc_chart_of_accounts
INSERT INTO chart_of_accounts (
  organization_id,
  account_code,
  account_name,
  description,
  account_type,
  account_category,
  parent_account_code,
  is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  is_active,
  created_at,
  updated_at
)
SELECT
  NULL as organization_id, -- Old schema had no org_id
  account_code,
  account_name,
  description,
  account_type::account_type,
  NULL::account_category, -- Map manually if needed
  parent_account_code,
  TRUE as is_clc_standard,
  statistics_canada_code,
  financial_statement_line,
  COALESCE(is_active, TRUE),
  created_at,
  updated_at
FROM clc_chart_of_accounts
WHERE NOT EXISTS (
  SELECT 1 FROM chart_of_accounts coa
  WHERE coa.account_code = clc_chart_of_accounts.account_code
  AND coa.is_clc_standard = TRUE
)
ON CONFLICT (account_code, is_clc_standard) DO NOTHING;

-- Add table comments
COMMENT ON TABLE chart_of_accounts IS 'Unified chart of accounts - consolidates CLC standard accounts and organization-specific accounts';
COMMENT ON COLUMN chart_of_accounts.is_clc_standard IS 'TRUE for CLC standard accounts (4000-7000 series), FALSE for custom org accounts';
COMMENT ON COLUMN chart_of_accounts.is_system IS 'TRUE for system accounts that cannot be modified by users';

-- ============================================================================
-- DEPRECATION NOTICE
-- ============================================================================
-- The following tables are now deprecated and should be removed after migration:
-- 1. clc_chart_of_accounts (db/schema/clc-per-capita-schema.ts)
-- 2. financial_service.clc_chart_of_accounts (services/financial-service/drizzle/schema.ts)
--
-- DO NOT DROP YET - Validate data migration first!
-- After validation:
--   DROP TABLE IF EXISTS clc_chart_of_accounts CASCADE;
