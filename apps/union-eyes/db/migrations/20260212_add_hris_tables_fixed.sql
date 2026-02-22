-- Migration: HRIS Integration Tables (FIXED)
-- Date: February 12, 2026
-- Description: Creates tables for storing employee, position, and department data from external HRIS systems

BEGIN;

-- ============================================================================
-- Enums
-- ============================================================================

-- Employment status enum (with IF NOT EXISTS check)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employment_status') THEN
    CREATE TYPE employment_status AS ENUM (
      'active',
      'inactive',
      'on_leave',
      'terminated',
      'suspended'
    );
  END IF;
END $$;

-- External HRIS provider enum (with IF NOT EXISTS check)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'external_hris_provider') THEN
    CREATE TYPE external_hris_provider AS ENUM (
      'WORKDAY',
      'BAMBOOHR',
      'ADP',
      'CERIDIAN',
      'UKG'
    );
  END IF;
END $$;

-- ============================================================================
-- External Employees Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS external_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL, -- Foreign key removed: organizations table doesn't exist yet
  
  -- External system tracking
  external_id VARCHAR(255) NOT NULL,
  external_provider external_hris_provider NOT NULL,
  
  -- Employee identification
  employee_id VARCHAR(100),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  
  -- Work information
  position VARCHAR(255),
  department VARCHAR(255),
  location VARCHAR(255),
  hire_date TIMESTAMP WITH TIME ZONE,
  
  -- Employment details
  employment_status employment_status,
  work_schedule VARCHAR(100),
  supervisor_id VARCHAR(255),
  supervisor_name VARCHAR(255),
  
  -- Sync tracking
  last_synced_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  raw_data TEXT,  -- JSON of full external record
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Unique constraint: one employee per organization per provider
CREATE UNIQUE INDEX IF NOT EXISTS external_employees_org_provider_external_id_idx 
  ON external_employees (organization_id, external_provider, external_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS external_employees_org_id_idx ON external_employees (organization_id);
CREATE INDEX IF NOT EXISTS external_employees_provider_idx ON external_employees (external_provider);
CREATE INDEX IF NOT EXISTS external_employees_email_idx ON external_employees (email);
CREATE INDEX IF NOT EXISTS external_employees_status_idx ON external_employees (employment_status);
CREATE INDEX IF NOT EXISTS external_employees_synced_at_idx ON external_employees (last_synced_at);

COMMENT ON TABLE external_employees IS 'Employee data synced from external HRIS systems (Workday, BambooHR, ADP, etc.)';
COMMENT ON COLUMN external_employees.external_id IS 'Unique identifier from the external HRIS system';
COMMENT ON COLUMN external_employees.raw_data IS 'Full JSON payload from external system for debugging and data recovery';

-- ============================================================================
-- External Positions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS external_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL, -- Foreign key removed: organizations table doesn't exist yet
  
  -- External system tracking
  external_id VARCHAR(255) NOT NULL,
  external_provider external_hris_provider NOT NULL,
  
  -- Position details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  department VARCHAR(255),
  job_profile VARCHAR(255),
  effective_date TIMESTAMP WITH TIME ZONE,
  
  -- Sync tracking
  last_synced_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  raw_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS external_positions_org_provider_external_id_idx 
  ON external_positions (organization_id, external_provider, external_id);

-- Indexes
CREATE INDEX IF NOT EXISTS external_positions_org_id_idx ON external_positions (organization_id);
CREATE INDEX IF NOT EXISTS external_positions_provider_idx ON external_positions (external_provider);
CREATE INDEX IF NOT EXISTS external_positions_title_idx ON external_positions (title);

COMMENT ON TABLE external_positions IS 'Position/job profile data from external HRIS systems';

-- ============================================================================
-- External Departments Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS external_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL, -- Foreign key removed: organizations table doesn't exist yet
  
  -- External system tracking
  external_id VARCHAR(255) NOT NULL,
  external_provider external_hris_provider NOT NULL,
  
  -- Department details
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100),
  manager_id VARCHAR(255),
  manager_name VARCHAR(255),
  parent_department_id VARCHAR(255),
  
  -- Sync tracking
  last_synced_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  raw_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS external_departments_org_provider_external_id_idx 
  ON external_departments (organization_id, external_provider, external_id);

-- Indexes
CREATE INDEX IF NOT EXISTS external_departments_org_id_idx ON external_departments (organization_id);
CREATE INDEX IF NOT EXISTS external_departments_provider_idx ON external_departments (external_provider);
CREATE INDEX IF NOT EXISTS external_departments_name_idx ON external_departments (name);
CREATE INDEX IF NOT EXISTS external_departments_parent_idx ON external_departments (parent_department_id);

COMMENT ON TABLE external_departments IS 'Department/organization structure from external HRIS systems';

-- ============================================================================
-- Update Trigger for Timestamps
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all three tables
DROP TRIGGER IF EXISTS update_external_employees_updated_at ON external_employees;
CREATE TRIGGER update_external_employees_updated_at
  BEFORE UPDATE ON external_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_external_positions_updated_at ON external_positions;
CREATE TRIGGER update_external_positions_updated_at
  BEFORE UPDATE ON external_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_external_departments_updated_at ON external_departments;
CREATE TRIGGER update_external_departments_updated_at
  BEFORE UPDATE ON external_departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (if enabled)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE external_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_departments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS external_employees_org_isolation ON external_employees;
DROP POLICY IF EXISTS external_positions_org_isolation ON external_positions;
DROP POLICY IF EXISTS external_departments_org_isolation ON external_departments;

-- Policy: Users can only see data from their organization
CREATE POLICY external_employees_org_isolation ON external_employees
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', TRUE)::UUID);

CREATE POLICY external_positions_org_isolation ON external_positions
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', TRUE)::UUID);

CREATE POLICY external_departments_org_isolation ON external_departments
  FOR ALL
  USING (organization_id = current_setting('app.current_organization_id', TRUE)::UUID);

COMMIT;
