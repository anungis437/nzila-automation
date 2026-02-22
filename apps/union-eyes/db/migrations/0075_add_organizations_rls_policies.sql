-- Migration: 0075_add_organizations_rls_policies  
-- Purpose: Add Row Level Security policies for hierarchical organization access
-- Required for: Phase 1 - CLC Compliance, organization-based access control
-- Date: 2026-02-10

-- =====================================================================================
-- Enable RLS on organizations table
-- =====================================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- Policy: organizations_select_policy
-- Purpose: Users can SELECT organizations they have access to via hierarchy
-- =====================================================================================

CREATE POLICY organizations_select_policy ON organizations
  FOR SELECT
  USING (
    -- Allow if user can access this organization
    user_can_access_org(
      NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
      id
    )
    OR
    -- Allow if no user context set (for system operations)
    current_setting('app.current_user_id', TRUE) IS NULL
    OR
    current_setting('app.current_user_id', TRUE) = ''
  );

-- =====================================================================================
-- Policy: organizations_insert_policy
-- Purpose: Allow creation of child organizations under accessible orgs
-- =====================================================================================

CREATE POLICY organizations_insert_policy ON organizations
  FOR INSERT
  WITH CHECK (
    -- Allow if parent organization is accessible
    (
      parent_id IS NULL
      OR
      user_can_access_org(
        NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
        parent_id
      )
    )
    OR
    -- Allow if no user context set (for system operations)
    current_setting('app.current_user_id', TRUE) IS NULL
    OR
    current_setting('app.current_user_id', TRUE) = ''
  );

-- =====================================================================================
-- Policy: organizations_update_policy
-- Purpose: Allow updates to accessible organizations
-- =====================================================================================

CREATE POLICY organizations_update_policy ON organizations
  FOR UPDATE
  USING (
    user_can_access_org(
      NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
      id
    )
    OR
    current_setting('app.current_user_id', TRUE) IS NULL
    OR
    current_setting('app.current_user_id', TRUE) = ''
  )
  WITH CHECK (
    user_can_access_org(
      NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
      id
    )
    OR
    current_setting('app.current_user_id', TRUE) IS NULL
    OR
    current_setting('app.current_user_id', TRUE) = ''
  );

-- =====================================================================================
-- Policy: organizations_delete_policy
-- Purpose: Allow deletion of accessible organizations (admin only via app logic)
-- =====================================================================================

CREATE POLICY organizations_delete_policy ON organizations
  FOR DELETE
  USING (
    user_can_access_org(
      NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
      id
    )
    OR
    current_setting('app.current_user_id', TRUE) IS NULL
    OR
    current_setting('app.current_user_id', TRUE) = ''
  );

-- =====================================================================================
-- Comments
-- =====================================================================================

COMMENT ON POLICY organizations_select_policy ON organizations IS 'Allow users to view organizations in their hierarchy';
COMMENT ON POLICY organizations_insert_policy ON organizations IS 'Allow creation of child organizations under accessible parents';
COMMENT ON POLICY organizations_update_policy ON organizations IS 'Allow updates to accessible organizations';
COMMENT ON POLICY organizations_delete_policy ON organizations IS 'Allow deletion of accessible organizations';
