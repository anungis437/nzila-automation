-- Migration: 0074_add_hierarchical_rls_functions
-- Purpose: Add hierarchical organization access control functions for multi-level RLS
-- Required for: Phase 1 - CLC Compliance, hierarchical organization management
-- Date: 2026-02-10

-- =====================================================================================
-- Function: get_descendant_org_ids
-- Purpose: Get all descendant organization IDs in hierarchy (including self)
-- Usage: Used by RLS policies to determine accessible organizations
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_descendant_org_ids(org_id UUID)
RETURNS SETOF UUID AS $$
DECLARE
  org_slug TEXT;
BEGIN
  -- Get the slug for the given organization ID
  SELECT slug INTO org_slug
  FROM organizations
  WHERE id = org_id;
  
  -- If organization not found, return empty
  IF org_slug IS NULL THEN
    RETURN;
  END IF;
  
  -- Return all organizations where the org slug appears in their hierarchy_path
  RETURN QUERY
  SELECT id
  FROM organizations
  WHERE org_slug = ANY(hierarchy_path)
  ORDER BY hierarchy_level, name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_descendant_org_ids(UUID) IS 'Returns all descendant organization IDs in hierarchy (including self)';

-- =====================================================================================
-- Function: get_ancestor_org_ids
-- Purpose: Get all ancestor organization IDs in hierarchy (including self)
-- Usage: Used to trace organization lineage up to root
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_ancestor_org_ids(org_id UUID)
RETURNS SETOF UUID AS $$
DECLARE
  org_path TEXT[];
  ancestor_slug TEXT;
BEGIN
  -- Get the hierarchy_path for the given organization
  SELECT hierarchy_path INTO org_path
  FROM organizations
  WHERE id = org_id;
  
  -- If organization not found, return empty
  IF org_path IS NULL THEN
    RETURN;
  END IF;
  
  -- Return UUID for each slug in the hierarchy path
  FOREACH ancestor_slug IN ARRAY org_path
  LOOP
    RETURN QUERY
    SELECT id
    FROM organizations
    WHERE slug = ancestor_slug
    LIMIT 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_ancestor_org_ids(UUID) IS 'Returns all ancestor organization IDs in hierarchy (including self)';

-- =====================================================================================
-- Function: user_can_access_org
-- Purpose: Check if user can access a specific organization based on their membership
-- Usage: Used by RLS policies and application code for access control
-- =====================================================================================

CREATE OR REPLACE FUNCTION user_can_access_org(check_user_id UUID, check_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_org_id UUID;
  can_access BOOLEAN;
BEGIN
  -- Get the user's organization from organization_members
  SELECT organization_id INTO user_org_id
  FROM organization_members
  WHERE user_id = check_user_id::VARCHAR
  LIMIT 1;
  
  -- If user has no organization, deny access
  IF user_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if check_org_id is in the descendants of user's organization
  -- This allows users to access their org and all child organizations
  SELECT EXISTS(
    SELECT 1
    FROM get_descendant_org_ids(user_org_id) AS descendant_id
    WHERE descendant_id = check_org_id
  ) INTO can_access;
  
  RETURN can_access;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION user_can_access_org(UUID, UUID) IS 'Check if user can access organization based on hierarchy';

-- =====================================================================================
-- Function: get_current_user_visible_orgs
-- Purpose: Get all organization IDs visible to current session user
-- Usage: Used for filtering queries in application layer
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_current_user_visible_orgs()
RETURNS SETOF UUID AS $$
DECLARE
  current_user_id UUID;
  user_org_id UUID;
BEGIN
  -- Get current user from session context
  BEGIN
    current_user_id := current_setting('app.current_user_id', TRUE)::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN; -- No user set, return empty
  END;
  
  -- Get user's organization
  SELECT organization_id INTO user_org_id
  FROM organization_members
  WHERE user_id = current_user_id::VARCHAR
  LIMIT 1;
  
  -- If user has no org, return empty
  IF user_org_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Return all descendants of user's organization
  RETURN QUERY
  SELECT * FROM get_descendant_org_ids(user_org_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_current_user_visible_orgs() IS 'Returns all organization IDs visible to current session user';

-- =====================================================================================
-- Performance Indexes
-- =====================================================================================

-- Ensure hierarchy_path index exists for fast lookups
CREATE INDEX IF NOT EXISTS idx_organizations_hierarchy_path 
ON organizations USING GIN (hierarchy_path);

-- Index on organization_members for user lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_user_lookup 
ON organization_members (user_id, organization_id);

-- =====================================================================================
-- Grant permissions
-- =====================================================================================

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_descendant_org_ids(UUID) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_ancestor_org_ids(UUID) TO PUBLIC;
GRANT EXECUTE ON FUNCTION user_can_access_org(UUID, UUID) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_current_user_visible_orgs() TO PUBLIC;
