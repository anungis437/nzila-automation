-- CLC Chart of Accounts Seed Data
-- Canadian Labour Congress (CLC) standardized chart of accounts
-- Compatible with Statistics Canada Labour Organization Survey (LOS)
--
-- Usage: Run this seed to populate the clc_chart_of_accounts table
--
-- Table created by Drizzle migration 0002_true_selene.sql with columns:
--   account_code, account_name, account_type, parent_account_code,
--   is_active, description, financial_statement_line, statistics_canada_code

-- 4000 Series: Revenue Accounts
INSERT INTO clc_chart_of_accounts (account_code, account_name, account_type, financial_statement_line, statistics_canada_code, description, is_active, parent_account_code) VALUES
('4000', 'Revenue', 'revenue', 'dues_revenue', NULL, 'All revenue accounts', true, NULL),
('4100', 'Per-Capita Tax Revenue', 'revenue', 'per_capita_revenue', 'REV-PER-CAPITA', 'Monthly per-capita remittances from local unions', true, '4000'),
('4100-001', 'CLC Per-Capita Tax', 'revenue', 'per_capita_revenue', 'REV-PER-CAPITA-CLC', 'Per-capita tax remitted to CLC', true, '4100'),
('4100-002', 'Federation Per-Capita Tax', 'revenue', 'per_capita_revenue', 'REV-PER-CAPITA-FED', 'Per-capita tax remitted to federation', true, '4100'),
('4200', 'Membership Dues', 'revenue', 'dues_revenue', 'REV-DUES', 'Regular membership dues collected', true, '4000'),
('4200-001', 'Regular Membership Dues', 'revenue', 'dues_revenue', 'REV-DUES-REG', 'Monthly or bi-weekly dues from regular members', true, '4200'),
('4200-002', 'Initiation Fees', 'revenue', 'dues_revenue', 'REV-DUES-INIT', 'One-time initiation fees from new members', true, '4200'),
('4300', 'Grants and Donations', 'revenue', 'other_revenue', 'REV-GRANTS', 'Government grants, donations, and gifts', true, '4000'),
('4400', 'Investment Income', 'revenue', 'other_revenue', 'REV-INVEST', 'Interest, dividends, and investment returns', true, '4000')
ON CONFLICT (account_code) DO NOTHING;

-- 5000 Series: Operating Expenses
INSERT INTO clc_chart_of_accounts (account_code, account_name, account_type, financial_statement_line, statistics_canada_code, description, is_active, parent_account_code) VALUES
('5000', 'Operating Expenses', 'expense', 'administrative', NULL, 'All operating expense accounts', true, NULL),
('5100', 'Salaries and Wages', 'expense', 'salaries_wages', 'EXP-SALARIES', 'Staff salaries, wages, and related costs', true, '5000'),
('5100-001', 'Officer Salaries', 'expense', 'salaries_wages', 'EXP-SAL-OFFICERS', 'Salaries for elected union officers', true, '5100'),
('5100-002', 'Staff Salaries', 'expense', 'salaries_wages', 'EXP-SAL-STAFF', 'Salaries for administrative and support staff', true, '5100'),
('5100-003', 'Employee Benefits', 'expense', 'salaries_wages', 'EXP-SAL-BENEFITS', 'Health insurance, pensions, and other benefits', true, '5100'),
('5200', 'Legal and Professional Fees', 'expense', 'legal_professional', 'EXP-LEGAL', 'Legal counsel, arbitration, and professional services', true, '5000'),
('5200-001', 'Legal Counsel', 'expense', 'legal_professional', 'EXP-LEGAL-COUNSEL', 'Legal representation and advice', true, '5200'),
('5200-002', 'Arbitration Costs', 'expense', 'legal_professional', 'EXP-LEGAL-ARB', 'Grievance arbitration and mediation', true, '5200'),
('5200-003', 'Accounting and Audit', 'expense', 'legal_professional', 'EXP-LEGAL-ACCT', 'Accounting services and annual audit', true, '5200'),
('5300', 'Per-Capita Tax Expense', 'expense', 'administrative', 'EXP-PER-CAPITA', 'Per-capita remittances to parent organizations', true, '5000'),
('5400', 'Administrative Expenses', 'expense', 'administrative', 'EXP-ADMIN', 'Office supplies, utilities, rent, and general admin', true, '5000'),
('5500', 'Travel and Meetings', 'expense', 'administrative', 'EXP-TRAVEL', 'Travel, accommodations, and meeting costs', true, '5000')
ON CONFLICT (account_code) DO NOTHING;

-- 6000 Series: Special Expenses
INSERT INTO clc_chart_of_accounts (account_code, account_name, account_type, financial_statement_line, statistics_canada_code, description, is_active, parent_account_code) VALUES
('6000', 'Special Expenses', 'expense', 'strike_fund', NULL, 'Strike fund, education, organizing, and special projects', true, NULL),
('6100', 'Strike Fund Disbursements', 'expense', 'strike_fund', 'EXP-STRIKE', 'Strike pay and related support costs', true, '6000'),
('6200', 'Education and Training', 'expense', 'education_training', 'EXP-EDUCATION', 'Member education, steward training, conferences', true, '6000'),
('6300', 'Organizing Campaigns', 'expense', 'organizing', 'EXP-ORGANIZING', 'New member organizing and recruitment', true, '6000'),
('6400', 'Political Action', 'expense', 'political_action', 'EXP-POLITICAL', 'Political advocacy and lobbying activities', true, '6000')
ON CONFLICT (account_code) DO NOTHING;

-- 7000 Series: Assets
INSERT INTO clc_chart_of_accounts (account_code, account_name, account_type, financial_statement_line, statistics_canada_code, description, is_active, parent_account_code) VALUES
('7000', 'Assets', 'asset', 'assets', NULL, 'Cash, investments, and capital assets', true, NULL),
('7100', 'Cash and Bank Accounts', 'asset', 'assets', 'ASSET-CASH', 'Operating accounts and petty cash', true, '7000'),
('7200', 'Investments', 'asset', 'assets', 'ASSET-INVEST', 'Securities, GICs, and investment funds', true, '7000'),
('7300', 'Capital Assets', 'asset', 'assets', 'ASSET-CAPITAL', 'Buildings, equipment, and vehicles', true, '7000')
ON CONFLICT (account_code) DO NOTHING;

-- Create account mappings table (optional - for transaction automation)
CREATE TABLE IF NOT EXISTS clc_account_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type VARCHAR(100) NOT NULL UNIQUE,
  debit_account VARCHAR(50) NOT NULL,
  credit_account VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (debit_account) REFERENCES clc_chart_of_accounts(account_code),
  FOREIGN KEY (credit_account) REFERENCES clc_chart_of_accounts(account_code)
);

-- Seed account mappings
INSERT INTO clc_account_mappings (transaction_type, debit_account, credit_account, description) VALUES
('per_capita_remittance', '5300', '7100', 'Record per-capita tax payment to parent organization'),
('per_capita_received', '7100', '4100-001', 'Record per-capita tax received from local union'),
('dues_collection', '7100', '4200-001', 'Record membership dues received'),
('initiation_fee', '7100', '4200-002', 'Record new member initiation fee'),
('legal_expense', '5200-001', '7100', 'Record legal counsel payment'),
('salary_payment', '5100', '7100', 'Record salary and wages payment'),
('strike_payment', '6100', '7100', 'Record strike pay disbursement');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_clc_chart_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clc_chart_updated_at
BEFORE UPDATE ON clc_chart_of_accounts
FOR EACH ROW
EXECUTE FUNCTION update_clc_chart_updated_at();

CREATE TRIGGER trigger_clc_mappings_updated_at
BEFORE UPDATE ON clc_account_mappings
FOR EACH ROW
EXECUTE FUNCTION update_clc_chart_updated_at();

-- Verification queries
-- SELECT account_code, account_name, account_type, financial_statement_line FROM clc_chart_of_accounts ORDER BY account_code;
-- SELECT * FROM clc_account_mappings ORDER BY transaction_type;
