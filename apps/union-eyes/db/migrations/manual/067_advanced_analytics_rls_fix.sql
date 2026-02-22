-- Fix RLS Policies for Advanced Analytics Q1 2025
-- Uses correct user_id column from organization_members table

-- Drop any policies that may have been partially created
DROP POLICY IF EXISTS "Users can view KPIs for their organization" ON kpi_configurations;
DROP POLICY IF EXISTS "Admins and managers can create KPIs" ON kpi_configurations;
DROP POLICY IF EXISTS "Admins and managers can update KPIs" ON kpi_configurations;
DROP POLICY IF EXISTS "Admins can delete KPIs" ON kpi_configurations;
DROP POLICY IF EXISTS "Users can view insights for their organization" ON insight_recommendations;
DROP POLICY IF EXISTS "System can insert insights" ON insight_recommendations;
DROP POLICY IF EXISTS "Users can update insights" ON insight_recommendations;
DROP POLICY IF EXISTS "Users can view comparative analyses for their organization" ON comparative_analyses;
DROP POLICY IF EXISTS "Admins and managers can create comparative analyses" ON comparative_analyses;
DROP POLICY IF EXISTS "Creators can update their comparative analyses" ON comparative_analyses;
DROP POLICY IF EXISTS "Admins can delete comparative analyses" ON comparative_analyses;

-- KPI Configurations RLS Policies
CREATE POLICY "Users can view KPIs for their organization"
  ON kpi_configurations FOR SELECT
  USING (
    organization_id::text IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = current_setting('app.current_user_id', TRUE)
      AND status = 'active'
    )
  );

CREATE POLICY "Admins and officers can create KPIs"
  ON kpi_configurations FOR INSERT
  WITH CHECK (
    organization_id::text IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = current_setting('app.current_user_id', TRUE)
      AND om.status = 'active'
      AND om.role IN ('admin', 'officer')
    )
  );

CREATE POLICY "Admins and officers can update KPIs"
  ON kpi_configurations FOR UPDATE
  USING (
    organization_id::text IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = current_setting('app.current_user_id', TRUE)
      AND om.status = 'active'
      AND om.role IN ('admin', 'officer')
    )
  );

CREATE POLICY "Admins can delete KPIs"
  ON kpi_configurations FOR DELETE
  USING (
    organization_id::text IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = current_setting('app.current_user_id', TRUE)
      AND om.status = 'active'
      AND om.role = 'admin'
    )
  );

-- Insight Recommendations RLS Policies
CREATE POLICY "Users can view insights for their organization"
  ON insight_recommendations FOR SELECT
  USING (
    organization_id::text IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = current_setting('app.current_user_id', TRUE)
      AND status = 'active'
    )
  );

CREATE POLICY "System can insert insights"
  ON insight_recommendations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update insights"
  ON insight_recommendations FOR UPDATE
  USING (
    organization_id::text IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = current_setting('app.current_user_id', TRUE)
      AND status = 'active'
    )
  );

-- Comparative Analyses RLS Policies
CREATE POLICY "Users can view comparative analyses for their organization"
  ON comparative_analyses FOR SELECT
  USING (
    organization_id::text IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = current_setting('app.current_user_id', TRUE)
      AND status = 'active'
    )
    OR is_public = TRUE
  );

CREATE POLICY "Admins and officers can create comparative analyses"
  ON comparative_analyses FOR INSERT
  WITH CHECK (
    organization_id::text IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = current_setting('app.current_user_id', TRUE)
      AND om.status = 'active'
      AND om.role IN ('admin', 'officer')
    )
  );

CREATE POLICY "Creators can update their comparative analyses"
  ON comparative_analyses FOR UPDATE
  USING (
    created_by = current_setting('app.current_user_id', TRUE)
    OR organization_id::text IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = current_setting('app.current_user_id', TRUE)
      AND om.status = 'active'
      AND om.role IN ('admin', 'officer')
    )
  );

CREATE POLICY "Admins can delete comparative analyses"
  ON comparative_analyses FOR DELETE
  USING (
    organization_id::text IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = current_setting('app.current_user_id', TRUE)
      AND om.status = 'active'
      AND om.role = 'admin'
    )
  );

COMMENT ON SCHEMA public IS 'Advanced Analytics Q1 2025 - RLS Policies Fixed';
