-- ============================================================================
-- Chart of Accounts Schema Consolidation Migration (Fixed)
-- Generated: 2026-02-12
-- ============================================================================

-- Backup existing data if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chart_of_accounts_backup') THEN
    DROP TABLE chart_of_accounts_backup CASCADE;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chart_of_accounts') THEN
    CREATE TABLE chart_of_accounts_backup AS SELECT * FROM chart_of_accounts;
    RAISE NOTICE 'Backed up existing chart_of_accounts to chart_of_accounts_backup';
  END IF;
END $$;

-- Drop existing table to recreate with new schema
DROP TABLE IF EXISTS chart_of_accounts CASCADE;
DROP TABLE IF EXISTS account_mappings CASCADE;

-- Create enums (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
    CREATE TYPE account_type AS ENUM (
      'revenue',
      'expense',
      'asset',
      'liability',
      'equity'
    );
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_category') THEN
    CREATE TYPE account_category AS ENUM (
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
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create unified chart_of_accounts table
CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  
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
  updated_by VARCHAR(255)
);

-- Create indexes for performance
CREATE INDEX chart_accounts_org_code_idx ON chart_of_accounts(organization_id, account_code);
CREATE INDEX chart_accounts_code_idx ON chart_of_accounts(account_code);
CREATE INDEX chart_accounts_parent_idx ON chart_of_accounts(parent_account_code);
CREATE INDEX chart_accounts_type_idx ON chart_of_accounts(account_type);
CREATE INDEX chart_accounts_category_idx ON chart_of_accounts(account_category);
CREATE INDEX chart_accounts_clc_idx ON chart_of_accounts(is_clc_standard);
CREATE INDEX chart_accounts_external_idx ON chart_of_accounts(external_provider, external_system_id);

-- Create unique constraints
CREATE UNIQUE INDEX chart_accounts_org_code_unique ON chart_of_accounts(organization_id, account_code) WHERE organization_id IS NOT NULL;
CREATE UNIQUE INDEX chart_accounts_clc_code_unique ON chart_of_accounts(account_code) WHERE is_clc_standard = TRUE;

-- Create account_mappings table for transaction templates
CREATE TABLE account_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  transaction_type VARCHAR(100) NOT NULL,
  transaction_category VARCHAR(100),
  debit_account_code VARCHAR(50) NOT NULL,
  credit_account_code VARCHAR(50) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX account_mappings_org_type_idx ON account_mappings(organization_id, transaction_type);
CREATE INDEX account_mappings_type_idx ON account_mappings(transaction_type);

-- Seed CLC standard chart of accounts
-- Revenue Accounts
INSERT INTO chart_of_accounts (organization_id, account_code, account_name, description, account_type, account_category, parent_account_code, level, sort_order, is_clc_standard, statistics_canada_code, is_active, is_system) VALUES
(NULL, '4000', 'Revenue', 'All revenue accounts', 'revenue', 'dues_revenue', NULL, 0, 1000, TRUE, NULL, TRUE, TRUE),
(NULL, '4100', 'Per-Capita Tax Revenue', 'Monthly per-capita remittances from local unions', 'revenue', 'per_capita_revenue', '4000', 1, 1100, TRUE, 'REV-PER-CAPITA', TRUE, TRUE),
(NULL, '4100-001', 'CLC Per-Capita Tax', 'Per-capita tax remitted to CLC', 'revenue', 'per_capita_revenue', '4100', 1, 1101, TRUE, 'REV-PER-CAPITA-CLC', TRUE, TRUE),
(NULL, '4100-002', 'Federation Per-Capita Tax', 'Per-capita tax remitted to federation', 'revenue', 'per_capita_revenue', '4100', 1, 1102, TRUE, 'REV-PER-CAPITA-FED', TRUE, TRUE),
(NULL, '4200', 'Membership Dues', 'Regular membership dues collected', 'revenue', 'dues_revenue', '4000', 1, 1200, TRUE, 'REV-DUES', TRUE, TRUE),
(NULL, '4200-001', 'Regular Membership Dues', 'Monthly or bi-weekly dues from regular members', 'revenue', 'dues_revenue', '4200', 1, 1201, TRUE, 'REV-DUES-REG', TRUE, TRUE),
(NULL, '4200-002', 'Initiation Fees', 'One-time initiation fees from new members', 'revenue', 'dues_revenue', '4200', 1, 1202, TRUE, 'REV-DUES-INIT', TRUE, TRUE),
(NULL, '4300', 'Grants and Donations', 'Government grants, donations, and gifts', 'revenue', 'other_revenue', '4000', 1, 1300, TRUE, 'REV-GRANTS', TRUE, TRUE),
(NULL, '4400', 'Investment Income', 'Interest, dividends, and investment returns', 'revenue', 'other_revenue', '4000', 1, 1400, TRUE, 'REV-INVEST', TRUE, TRUE);

-- Operating Expenses
INSERT INTO chart_of_accounts (organization_id, account_code, account_name, description, account_type, account_category, parent_account_code, level, sort_order, is_clc_standard, statistics_canada_code, is_active, is_system) VALUES
(NULL, '5000', 'Operating Expenses', 'All operating expense accounts', 'expense', 'administrative', NULL, 0, 2000, TRUE, NULL, TRUE, TRUE),
(NULL, '5100', 'Salaries and Wages', 'Staff salaries, wages, and related costs', 'expense', 'salaries_wages', '5000', 1, 2100, TRUE, 'EXP-SALARIES', TRUE, TRUE),
(NULL, '5100-001', 'Officer Salaries', 'Salaries for elected union officers', 'expense', 'salaries_wages', '5100', 1, 2101, TRUE, 'EXP-SAL-OFFICERS', TRUE, TRUE),
(NULL, '5100-002', 'Staff Salaries', 'Salaries for administrative and support staff', 'expense', 'salaries_wages', '5100', 1, 2102, TRUE, 'EXP-SAL-STAFF', TRUE, TRUE),
(NULL, '5100-003', 'Employee Benefits', 'Health insurance, pensions, and other benefits', 'expense', 'salaries_wages', '5100', 1, 2103, TRUE, 'EXP-SAL-BENEFITS', TRUE, TRUE),
(NULL, '5200', 'Legal and Professional Fees', 'Legal counsel, arbitration, and professional services', 'expense', 'legal_professional', '5000', 1, 2200, TRUE, 'EXP-LEGAL', TRUE, TRUE),
(NULL, '5200-001', 'Legal Counsel', 'Legal representation and advice', 'expense', 'legal_professional', '5200', 1, 2201, TRUE, 'EXP-LEGAL-COUNSEL', TRUE, TRUE),
(NULL, '5200-002', 'Arbitration Costs', 'Grievance arbitration and mediation', 'expense', 'legal_professional', '5200', 1, 2202, TRUE, 'EXP-LEGAL-ARB', TRUE, TRUE),
(NULL, '5200-003', 'Accounting and Audit', 'Accounting services and annual audit', 'expense', 'legal_professional', '5200', 1, 2203, TRUE, 'EXP-LEGAL-ACCT', TRUE, TRUE),
(NULL, '5300', 'Per-Capita Tax Expense', 'Per-capita remittances to parent organizations', 'expense', 'administrative', '5000', 1, 2300, TRUE, 'EXP-PER-CAPITA', TRUE, TRUE),
(NULL, '5400', 'Administrative Expenses', 'Office supplies, utilities, rent, and general admin', 'expense', 'administrative', '5000', 1, 2400, TRUE, 'EXP-ADMIN', TRUE, TRUE),
(NULL, '5500', 'Travel and Meetings', 'Travel, accommodations, and meeting costs', 'expense', 'administrative', '5000', 1, 2500, TRUE, 'EXP-TRAVEL', TRUE, TRUE);

-- Special Expenses
INSERT INTO chart_of_accounts (organization_id, account_code, account_name, description, account_type, account_category, parent_account_code, level, sort_order, is_clc_standard, statistics_canada_code, is_active, is_system) VALUES
(NULL, '6000', 'Special Expenses', 'Strike fund, education, organizing, and special projects', 'expense', 'strike_fund', NULL, 0, 3000, TRUE, NULL, TRUE, TRUE),
(NULL, '6100', 'Strike Fund Disbursements', 'Strike pay and related support costs', 'expense', 'strike_fund', '6000', 1, 3100, TRUE, 'EXP-STRIKE', TRUE, TRUE),
(NULL, '6200', 'Education and Training', 'Member education, steward training, conferences', 'expense', 'education_training', '6000', 1, 3200, TRUE, 'EXP-EDUCATION', TRUE, TRUE),
(NULL, '6300', 'Organizing Campaigns', 'New member organizing and recruitment', 'expense', 'organizing', '6000', 1, 3300, TRUE, 'EXP-ORGANIZING', TRUE, TRUE),
(NULL, '6400', 'Political Action', 'Political advocacy and lobbying activities', 'expense', 'political_action', '6000', 1, 3400, TRUE, 'EXP-POLITICAL', TRUE, TRUE);

-- Assets
INSERT INTO chart_of_accounts (organization_id, account_code, account_name, description, account_type, account_category, parent_account_code, level, sort_order, is_clc_standard, statistics_canada_code, is_active, is_system) VALUES
(NULL, '7000', 'Assets', 'Cash, investments, and capital assets', 'asset', 'assets', NULL, 0, 4000, TRUE, NULL, TRUE, TRUE),
(NULL, '7100', 'Cash and Bank Accounts', 'Operating accounts and petty cash', 'asset', 'assets', '7000', 1, 4100, TRUE, 'ASSET-CASH', TRUE, TRUE),
(NULL, '7200', 'Investments', 'Securities, GICs, and investment funds', 'asset', 'assets', '7000', 1, 4200, TRUE, 'ASSET-INVEST', TRUE, TRUE),
(NULL, '7300', 'Capital Assets', 'Buildings, equipment, and vehicles', 'asset', 'assets', '7000', 1, 4300, TRUE, 'ASSET-CAPITAL', TRUE, TRUE);

-- Add table comments
COMMENT ON TABLE chart_of_accounts IS 'Unified chart of accounts - consolidates CLC standard accounts and organization-specific accounts';
COMMENT ON COLUMN chart_of_accounts.is_clc_standard IS 'TRUE for CLC standard accounts (4000-7000 series), FALSE for custom org accounts';
COMMENT ON COLUMN chart_of_accounts.is_system IS 'TRUE for system accounts that cannot be modified by users';

-- Success message
DO $$
DECLARE
  account_count INT;
BEGIN
  SELECT COUNT(*) INTO account_count FROM chart_of_accounts WHERE is_clc_standard = TRUE;
  RAISE NOTICE '✅ Migration complete! Seeded % CLC standard accounts', account_count;
END $$;
