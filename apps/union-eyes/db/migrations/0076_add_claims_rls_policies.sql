-- Migration: 0076_add_claims_rls_policies
-- Purpose: Add RLS policies for claims table using hierarchical access control
-- Date: 2026-02-10

-- =====================================================================================
-- Claims Table RLS Policies
-- =====================================================================================

-- Enable RLS on claims and claim_deadlines tables
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_deadlines ENABLE ROW LEVEL SECURITY;

-- FORCE RLS even for table owners (critical for testing and application code)
ALTER TABLE claims FORCE ROW LEVEL SECURITY;
ALTER TABLE claim_deadlines FORCE ROW LEVEL SECURITY;

-- DROP existing policies if any
DROP POLICY IF EXISTS claims_select_policy ON claims;
DROP POLICY IF EXISTS claims_insert_policy ON claims;
DROP POLICY IF EXISTS claims_update_policy ON claims;
DROP POLICY IF EXISTS claims_delete_policy ON claims;

-- SELECT: Users can view claims from organizations they have access to
CREATE POLICY claims_select_policy ON claims
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM get_descendant_org_ids(
        (SELECT organization_id FROM organization_members 
         WHERE user_id = current_setting('app.current_user_id', TRUE)::VARCHAR 
         LIMIT 1)
      ) AS descendant_id
      WHERE descendant_id = claims.organization_id
    )
  );

-- INSERT: Users can create claims in their organization
CREATE POLICY claims_insert_policy ON claims
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = current_setting('app.current_user_id', TRUE)::VARCHAR
    )
    OR organization_id = COALESCE(
      NULLIF(current_setting('app.current_organization_id', TRUE), '')::UUID,
      organization_id
    )
  );

-- UPDATE: Users can update claims in organizations they have access to
CREATE POLICY claims_update_policy ON claims
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM get_descendant_org_ids(
        (SELECT organization_id FROM organization_members 
         WHERE user_id = current_setting('app.current_user_id', TRUE)::VARCHAR 
         LIMIT 1)
      ) AS descendant_id
      WHERE descendant_id = claims.organization_id
    )
  );

-- DELETE: Only admins can delete claims in their organization's hierarchy
CREATE POLICY claims_delete_policy ON claims
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members om
      INNER JOIN get_descendant_org_ids(om.organization_id) AS descendant_id
        ON descendant_id = claims.organization_id
      WHERE om.user_id = current_setting('app.current_user_id', TRUE)::VARCHAR
        AND om.role = 'admin'
        AND om.status = 'active'
    )
  );

-- =====================================================================================
-- Claim Deadlines Table RLS Policies
-- =====================================================================================

DROP POLICY IF EXISTS claim_deadlines_select_policy ON claim_deadlines;
DROP POLICY IF EXISTS claim_deadlines_insert_policy ON claim_deadlines;
DROP POLICY IF EXISTS claim_deadlines_update_policy ON claim_deadlines;
DROP POLICY IF EXISTS claim_deadlines_delete_policy ON claim_deadlines;

-- SELECT: Users can view deadlines for organizations they have access to
CREATE POLICY claim_deadlines_select_policy ON claim_deadlines
  FOR SELECT
  USING (
    organization_id IN (
      SELECT * FROM get_descendant_org_ids(
        (SELECT organization_id FROM organization_members 
         WHERE user_id = current_setting('app.current_user_id', TRUE)::VARCHAR 
         LIMIT 1)
      )
    )
  );

-- INSERT: Users can create deadlines in their organization
CREATE POLICY claim_deadlines_insert_policy ON claim_deadlines
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = current_setting('app.current_user_id', TRUE)::VARCHAR
    )
  );

-- UPDATE: Users can update deadlines in organizations they have access to
CREATE POLICY claim_deadlines_update_policy ON claim_deadlines
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT * FROM get_descendant_org_ids(
        (SELECT organization_id FROM organization_members 
         WHERE user_id = current_setting('app.current_user_id', TRUE)::VARCHAR 
         LIMIT 1)
      )
    )
  );

-- DELETE: Only admins can delete deadlines
CREATE POLICY claim_deadlines_delete_policy ON claim_deadlines
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members om
      WHERE om.user_id = current_setting('app.current_user_id', TRUE)::VARCHAR
        AND om.organization_id = claim_deadlines.organization_id
        AND om.role = 'admin'
        AND om.status = 'active'
    )
  );

COMMENT ON POLICY claims_select_policy ON claims IS 'Allow users to view claims in their organizational hierarchy';
COMMENT ON POLICY claims_insert_policy ON claims IS 'Allow users to create claims in their organization';
COMMENT ON POLICY claims_update_policy ON claims IS 'Allow users to update claims in their organizational hierarchy';
COMMENT ON POLICY claims_delete_policy ON claims IS 'Allow only admins to delete claims in their organizational hierarchy';

COMMENT ON POLICY claim_deadlines_select_policy ON claim_deadlines IS 'Allow users to view deadlines in their organizational hierarchy';
COMMENT ON POLICY claim_deadlines_insert_policy ON claim_deadlines IS 'Allow users to create deadlines in their organization';
COMMENT ON POLICY claim_deadlines_update_policy ON claim_deadlines IS 'Allow users to update deadlines in their organizational hierarchy';
COMMENT ON POLICY claim_deadlines_delete_policy ON claim_deadlines IS 'Allow only admins to delete deadlines';
