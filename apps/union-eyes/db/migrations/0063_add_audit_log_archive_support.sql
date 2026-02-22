-- ============================================================================
-- Migration: Add Archive Support to Audit Logs (PR #11)
-- ============================================================================
-- Description: Adds archived column, archivedAt, and archivedPath to audit_logs,
--              enabling immutable audit trails by archiving instead of deleting.
--              Prevents irreversible data loss for compliance.
-- Date: 2026-02-09
-- ============================================================================

-- Step 1: Add archive columns to audit_logs table
ALTER TABLE audit_security.audit_logs 
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS archived_path TEXT;

-- Step 2: Create index for archived logs queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_archived ON audit_security.audit_logs(archived);
CREATE INDEX IF NOT EXISTS idx_audit_logs_archived_at ON audit_security.audit_logs(archived_at);

-- Step 3: Add comment to document immutability requirement
COMMENT ON COLUMN audit_security.audit_logs.archived IS 
  'PR #11: Marks audit log as archived. Logs must NEVER be deleted, only archived for defensibility.';

COMMENT ON COLUMN audit_security.audit_logs.archived_path IS 
  'Optional path to archived file (S3 bucket, filesystem, JSON export, etc.)';

-- Step 4: OPTIONAL - Create view for active (non-archived) logs
CREATE OR REPLACE VIEW audit_security.active_audit_logs AS
SELECT *
FROM audit_security.audit_logs
WHERE archived = false;

-- Step 5: OPTIONAL - Create function to safely export archived logs as JSON
-- This allows future S3/cold storage integration
CREATE OR REPLACE FUNCTION audit_security.export_archived_logs_json(
  org_id UUID,
  before_date TIMESTAMP WITH TIME ZONE
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  json_export TEXT;
  export_count INTEGER;
BEGIN
  -- Generate JSON export of archived logs
  SELECT 
    json_agg(
      json_build_object(
        'audit_id', audit_id,
        'organization_id', organization_id,
        'user_id', user_id,
        'action', action,
        'resource_type', resource_type,
        'resource_id', resource_id,
        'old_values', old_values,
        'new_values', new_values,
        'ip_address', ip_address,
        'created_at', created_at,
        'archived_at', archived_at
      )
    )::text,
    COUNT(*)
  INTO json_export, export_count
  FROM audit_security.audit_logs
  WHERE organization_id = org_id
    AND created_at < before_date
    AND archived = true;
  
  RAISE NOTICE 'Exported % archived audit logs for organization %', export_count, org_id;
  
  RETURN json_export;
END;
$$;

-- Step 6: Grant permissions (adjust as needed for your RBAC)
-- Note: These grants are optional - only execute if roles exist in your system
-- GRANT SELECT ON audit_security.active_audit_logs TO authenticated;
-- GRANT EXECUTE ON FUNCTION audit_security.export_archived_logs_json TO admin_role;

-- Step 7: Verification query (run manually to verify migration)
-- SELECT 
--   COUNT(*) FILTER (WHERE archived = false) as active_logs,
--   COUNT(*) FILTER (WHERE archived = true) as archived_logs,
--   COUNT(*) as total_logs
-- FROM audit_security.audit_logs;

