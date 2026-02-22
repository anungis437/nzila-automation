-- Migration: Add Accounting Integration Tables
-- Created: 2026-02-13
-- Description: Creates tables for external accounting system data (QuickBooks, Xero)

-- ============================================================================
-- External Invoices
-- ============================================================================

CREATE TABLE IF NOT EXISTS external_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- External system fields
  external_id VARCHAR(255) NOT NULL,
  external_provider VARCHAR(50) NOT NULL,
  
  -- Invoice data
  invoice_number VARCHAR(255) NOT NULL,
  customer_id VARCHAR(255) NOT NULL,
  customer_name VARCHAR(500) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  total_amount NUMERIC(12, 2) NOT NULL,
  balance_amount NUMERIC(12, 2),
  status VARCHAR(50) NOT NULL,
  
  -- Sync metadata
  last_synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_external_invoice UNIQUE (organization_id, external_provider, external_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS external_invoices_org_provider_idx ON external_invoices(organization_id, external_provider);
CREATE INDEX IF NOT EXISTS external_invoices_external_id_idx ON external_invoices(external_id);
CREATE INDEX IF NOT EXISTS external_invoices_invoice_number_idx ON external_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS external_invoices_customer_idx ON external_invoices(customer_id);
CREATE INDEX IF NOT EXISTS external_invoices_status_idx ON external_invoices(status);
CREATE INDEX IF NOT EXISTS external_invoices_date_idx ON external_invoices(invoice_date);

-- RLS policies
ALTER TABLE external_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY external_invoices_org_isolation ON external_invoices
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- ============================================================================
-- External Payments
-- ============================================================================

CREATE TABLE IF NOT EXISTS external_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- External system fields
  external_id VARCHAR(255) NOT NULL,
  external_provider VARCHAR(50) NOT NULL,
  
  -- Payment data
  customer_id VARCHAR(255) NOT NULL,
  customer_name VARCHAR(500) NOT NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  
  -- Sync metadata
  last_synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_external_payment UNIQUE (organization_id, external_provider, external_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS external_payments_org_provider_idx ON external_payments(organization_id, external_provider);
CREATE INDEX IF NOT EXISTS external_payments_external_id_idx ON external_payments(external_id);
CREATE INDEX IF NOT EXISTS external_payments_customer_idx ON external_payments(customer_id);
CREATE INDEX IF NOT EXISTS external_payments_date_idx ON external_payments(payment_date);

-- RLS policies
ALTER TABLE external_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY external_payments_org_isolation ON external_payments
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- ============================================================================
-- External Customers
-- ============================================================================

CREATE TABLE IF NOT EXISTS external_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- External system fields
  external_id VARCHAR(255) NOT NULL,
  external_provider VARCHAR(50) NOT NULL,
  
  -- Customer data
  name VARCHAR(500) NOT NULL,
  company_name VARCHAR(500),
  email VARCHAR(255),
  phone VARCHAR(50),
  balance NUMERIC(12, 2),
  
  -- Sync metadata
  last_synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_external_customer UNIQUE (organization_id, external_provider, external_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS external_customers_org_provider_idx ON external_customers(organization_id, external_provider);
CREATE INDEX IF NOT EXISTS external_customers_external_id_idx ON external_customers(external_id);
CREATE INDEX IF NOT EXISTS external_customers_name_idx ON external_customers(name);
CREATE INDEX IF NOT EXISTS external_customers_email_idx ON external_customers(email);

-- RLS policies
ALTER TABLE external_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY external_customers_org_isolation ON external_customers
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- ============================================================================
-- External Accounts (Chart of Accounts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS external_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- External system fields
  external_id VARCHAR(255) NOT NULL,
  external_provider VARCHAR(50) NOT NULL,
  
  -- Account data
  account_name VARCHAR(500) NOT NULL,
  account_type VARCHAR(100) NOT NULL,
  account_sub_type VARCHAR(100),
  classification VARCHAR(100),
  current_balance NUMERIC(15, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Sync metadata
  last_synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_external_account UNIQUE (organization_id, external_provider, external_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS external_accounts_org_provider_idx ON external_accounts(organization_id, external_provider);
CREATE INDEX IF NOT EXISTS external_accounts_external_id_idx ON external_accounts(external_id);
CREATE INDEX IF NOT EXISTS external_accounts_type_idx ON external_accounts(account_type);
CREATE INDEX IF NOT EXISTS external_accounts_classification_idx ON external_accounts(classification);
CREATE INDEX IF NOT EXISTS external_accounts_active_idx ON external_accounts(is_active);

-- RLS policies
ALTER TABLE external_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY external_accounts_org_isolation ON external_accounts
  USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE external_invoices IS 'Stores invoices synced from external accounting systems (QuickBooks, Xero)';
COMMENT ON TABLE external_payments IS 'Stores payments synced from external accounting systems';
COMMENT ON TABLE external_customers IS 'Stores customers/contacts synced from external accounting systems';
COMMENT ON TABLE external_accounts IS 'Stores chart of accounts synced from external accounting systems';

COMMENT ON COLUMN external_invoices.external_provider IS 'Provider identifier: QUICKBOOKS, XERO';
COMMENT ON COLUMN external_payments.external_provider IS 'Provider identifier: QUICKBOOKS, XERO';
COMMENT ON COLUMN external_customers.external_provider IS 'Provider identifier: QUICKBOOKS, XERO';
COMMENT ON COLUMN external_accounts.external_provider IS 'Provider identifier: QUICKBOOKS, XERO';
