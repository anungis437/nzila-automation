-- Migration: Add Row-Level Security Policies for Reports Tables
-- Date: February 6, 2026
-- Priority: HIGH - Financial data exposure risk
-- Severity: 🟡 HIGH DATA EXPOSURE

-- ============================================================================
-- 1. REPORTS TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS on reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT reports in their organization
CREATE POLICY "reports_org_access" ON reports
FOR SELECT
TO public
USING (
  organization_id IN (
    SELECT DISTINCT organization_id 
    FROM organization_members 
    WHERE user_id = current_setting('app.current_user_id', true) 
      AND status = 'active'
  )
  OR is_public = true -- Allow public reports
);

-- Policy 2: Only organization admins can INSERT reports
CREATE POLICY "reports_create_org_admin" ON reports
FOR INSERT
TO public
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = current_setting('app.current_user_id', true) 
      AND role IN ('admin', 'officer', 'treasurer')
      AND status = 'active'
  )
);

-- Policy 3: Only organization admins or report creator can UPDATE reports
CREATE POLICY "reports_update_admin_or_creator" ON reports
FOR UPDATE
TO public
USING (
  created_by = current_setting('app.current_user_id', true)
  OR organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = current_setting('app.current_user_id', true) 
      AND role IN ('admin', 'officer')
      AND status = 'active'
  )
);

-- Policy 4: Only organization admins can DELETE reports
CREATE POLICY "reports_delete_org_admin" ON reports
FOR DELETE
TO public
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = current_setting('app.current_user_id', true) 
      AND role IN ('admin', 'officer')
      AND status = 'active'
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_organization_id ON reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_is_public ON reports(is_public) WHERE is_public = true;

-- ============================================================================
-- 2. REPORT_TEMPLATES TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS on report_templates table
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT templates in their organization or system templates
CREATE POLICY "report_templates_org_or_system" ON report_templates
FOR SELECT
TO public
USING (
  organization_id IS NULL -- System templates
  OR organization_id IN (
    SELECT DISTINCT organization_id 
    FROM organization_members 
    WHERE user_id = current_setting('app.current_user_id', true) 
      AND status = 'active'
  )
);

-- Policy 2: Only org admins can INSERT templates
CREATE POLICY "report_templates_create_org_admin" ON report_templates
FOR INSERT
TO public
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = current_setting('app.current_user_id', true) 
      AND role IN ('admin', 'officer')
      AND status = 'active'
  )
);

-- Policy 3: Only org admins or creator can UPDATE templates
CREATE POLICY "report_templates_update_admin_or_creator" ON report_templates
FOR UPDATE
TO public
USING (
  created_by = current_setting('app.current_user_id', true)
  OR organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = current_setting('app.current_user_id', true) 
      AND role IN ('admin', 'officer')
      AND status = 'active'
  )
);

-- Policy 4: Only org admins can DELETE templates
CREATE POLICY "report_templates_delete_org_admin" ON report_templates
FOR DELETE
TO public
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = current_setting('app.current_user_id', true) 
      AND role IN ('admin', 'officer')
      AND status = 'active'
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_templates_organization_id ON report_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_created_at ON report_templates(created_at DESC);

-- ============================================================================
-- 3. REPORT_EXECUTIONS TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS on report_executions table
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT executions for reports in their organization
CREATE POLICY "report_executions_org_access" ON report_executions
FOR SELECT
TO public
USING (
  report_id IN (
    SELECT id FROM reports r
    WHERE r.organization_id IN (
      SELECT DISTINCT organization_id 
      FROM organization_members 
      WHERE user_id = current_setting('app.current_user_id', true) 
        AND status = 'active'
    )
  )
);

-- Policy 2: Only org admins can INSERT executions
CREATE POLICY "report_executions_create_org_admin" ON report_executions
FOR INSERT
TO public
WITH CHECK (
  report_id IN (
    SELECT r.id FROM reports r
    WHERE r.organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = current_setting('app.current_user_id', true) 
        AND role IN ('admin', 'officer', 'treasurer')
        AND status = 'active'
    )
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_executions_report_id ON report_executions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_executed_at ON report_executions(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(execution_status);

-- ============================================================================
-- 4. REPORT_SHARES TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS on report_shares table
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT shares they're part of or created
CREATE POLICY "report_shares_participant_access" ON report_shares
FOR SELECT
TO public
USING (
  shared_with_user_id = current_setting('app.current_user_id', true)
  OR shared_by_user_id = current_setting('app.current_user_id', true)
  OR shared_with_organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = current_setting('app.current_user_id', true)
  )
);

-- Policy 2: Only report owner or org admins can CREATE shares
CREATE POLICY "report_shares_create_owner_or_admin" ON report_shares
FOR INSERT
TO public
WITH CHECK (
  report_id IN (
    SELECT r.id FROM reports r
    WHERE r.created_by = current_setting('app.current_user_id', true)
      OR r.organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = current_setting('app.current_user_id', true) 
          AND role IN ('admin', 'officer')
          AND status = 'active'
      )
  )
);

-- Policy 3: Only share creator can UPDATE or DELETE
CREATE POLICY "report_shares_modify_creator" ON report_shares
FOR UPDATE
TO public
USING (shared_by_user_id = current_setting('app.current_user_id', true));

CREATE POLICY "report_shares_delete_creator" ON report_shares
FOR DELETE
TO public
USING (shared_by_user_id = current_setting('app.current_user_id', true));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_shares_report_id ON report_shares(report_id);
CREATE INDEX IF NOT EXISTS idx_report_shares_shared_with_user_id ON report_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_report_shares_shared_by_user_id ON report_shares(shared_by_user_id);

-- ============================================================================
-- 5. SCHEDULED_REPORTS TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS on scheduled_reports table
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT schedules for reports in their organization
CREATE POLICY "scheduled_reports_org_access" ON scheduled_reports
FOR SELECT
TO public
USING (
  report_id IN (
    SELECT id FROM reports r
    WHERE r.organization_id IN (
      SELECT DISTINCT organization_id 
      FROM organization_members 
      WHERE user_id = current_setting('app.current_user_id', true) 
        AND status = 'active'
    )
  )
);

-- Policy 2: Only org admins/treasurers can CREATE schedules
CREATE POLICY "scheduled_reports_create_org_admin" ON scheduled_reports
FOR INSERT
TO public
WITH CHECK (
  report_id IN (
    SELECT r.id FROM reports r
    WHERE r.organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = current_setting('app.current_user_id', true) 
        AND role IN ('admin', 'officer', 'treasurer')
        AND status = 'active'
    )
  )
);

-- Policy 3: Only org admins can UPDATE schedules
CREATE POLICY "scheduled_reports_update_org_admin" ON scheduled_reports
FOR UPDATE
TO public
USING (
  report_id IN (
    SELECT r.id FROM reports r
    WHERE r.organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = current_setting('app.current_user_id', true) 
        AND role IN ('admin', 'officer')
        AND status = 'active'
    )
  )
);

-- Policy 4: Only org admins can DELETE schedules
CREATE POLICY "scheduled_reports_delete_org_admin" ON scheduled_reports
FOR DELETE
TO public
USING (
  report_id IN (
    SELECT r.id FROM reports r
    WHERE r.organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = current_setting('app.current_user_id', true) 
        AND role IN ('admin', 'officer')
        AND status = 'active'
    )
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_report_id ON scheduled_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run_at ON scheduled_reports(next_run_at) WHERE is_active = true;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is enabled on all report tables
DO $$ 
DECLARE
  v_table TEXT;
  v_count INTEGER := 0;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['reports', 'report_templates', 'report_executions', 'report_shares', 'scheduled_reports']
  LOOP
    IF (SELECT relrowsecurity FROM pg_class WHERE relname = v_table) THEN
      RAISE NOTICE 'RLS enabled: %', v_table;
      v_count := v_count + 1;
    ELSE
      RAISE WARNING 'RLS NOT enabled: %', v_table;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Report tables RLS enforcement complete: % of 5 tables protected', v_count;
END $$;

-- ============================================================================
-- AUDIT LOG ENTRY
-- ============================================================================
-- DISABLED: 
INSERT INTO audit_security.security_events (
  organization_id,
  event_category,
  event_type,
  severity,
  description,
  affected_table,
  risk_score,
  remediation_status
) VALUES (
  NULL, -- System-wide change
  'configuration',
  'rls_policies_added',
  'medium',
  'Applied Row-Level Security policies to reporting tables (reports, report_templates, report_executions, report_shares, scheduled_reports)',
  'reports,report_templates,report_executions,report_shares,scheduled_reports',
  0, -- Remediation of vulnerability
  'resolved'
);
