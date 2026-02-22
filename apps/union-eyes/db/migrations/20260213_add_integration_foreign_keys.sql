-- Add foreign key constraints to integration tables now that organizations table exists
-- Migration: 20260213_add_integration_foreign_keys.sql
-- Date: 2026-02-13

-- Integration framework tables
ALTER TABLE integration_configs
ADD CONSTRAINT integration_configs_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE integration_sync_log
ADD CONSTRAINT integration_sync_log_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE integration_sync_schedules
ADD CONSTRAINT integration_sync_schedules_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE webhook_events
ADD CONSTRAINT webhook_events_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- HRIS integration tables
ALTER TABLE external_employees
ADD CONSTRAINT external_employees_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE external_positions
ADD CONSTRAINT external_positions_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE external_departments
ADD CONSTRAINT external_departments_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Accounting integration tables
ALTER TABLE external_invoices
ADD CONSTRAINT external_invoices_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE external_payments
ADD CONSTRAINT external_payments_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE external_customers
ADD CONSTRAINT external_customers_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE external_accounts
ADD CONSTRAINT external_accounts_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- external_calendar_connections (if it has organization_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'external_calendar_connections' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE external_calendar_connections
        ADD CONSTRAINT external_calendar_connections_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- external_data_sync_log (if it has organization_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'external_data_sync_log' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE external_data_sync_log
        ADD CONSTRAINT external_data_sync_log_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;
