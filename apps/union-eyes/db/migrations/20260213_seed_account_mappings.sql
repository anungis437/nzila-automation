-- Seed Account Mappings for Transaction Types
-- Migration: 20260213_seed_account_mappings.sql
-- Date: 2026-02-13
-- Purpose: Populate account_mappings table with standard CLC transaction posting rules

-- Clear existing mappings if any
TRUNCATE TABLE account_mappings;

-- CLC Standard Transaction Type Mappings
-- Format: (transaction_type, debit_account_code, credit_account_code, description)

-- Per-Capita Remittances
INSERT INTO account_mappings (transaction_type, debit_account_code, credit_account_code, description)
VALUES 
  ('per_capita_remittance', '5300', '7100', 'Record per-capita tax payment to parent organization'),
  ('per_capita_received', '7100', '4100', 'Record per-capita tax received from local union'),
  
  -- Membership Dues
  ('dues_collection', '7100', '4200', 'Record membership dues received'),
  ('initiation_fee', '7100', '4200', 'Record new member initiation fee'),
  
  -- Operating Expenses
  ('legal_expense', '5200', '7100', 'Record legal counsel payment'),
  ('salary_payment', '5100', '7100', 'Record salary and wages payment'),
  
  -- Strike Fund
  ('strike_payment', '6100', '7100', 'Record strike pay disbursement'),
  
  -- Additional Standard Mappings
  ('office_expense', '5200', '7100', 'Office and administrative expenses'),
  ('education_expense', '6200', '7100', 'Education and training program costs'),
  ('organizing_expense', '6300', '7100', 'Organizing campaign expenditures'),
  ('political_expense', '6400', '7100', 'Political action and advocacy costs'),
  ('grant_revenue', '7100', '4300', 'Grant revenue received'),
  ('investment_income', '7100', '4400', 'Investment and interest income'),
  ('asset_purchase', '7100', '7300', 'Purchase of capital assets'),
  ('asset_disposal', '7100', '7100', 'Sale or disposal of capital assets');

-- Verify seeding
DO $$
DECLARE
  mapping_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mapping_count FROM account_mappings;
  RAISE NOTICE '✅ Seeded % transaction type mappings', mapping_count;
END $$;
