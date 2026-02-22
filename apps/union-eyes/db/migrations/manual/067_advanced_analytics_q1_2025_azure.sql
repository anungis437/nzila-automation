-- Migration: 067_advanced_analytics_q1_2025_azure
-- Description: Advanced Analytics System (Azure PostgreSQL + Clerk Auth)
-- Created: 2024-12-15
-- Phase: Q1 2025 - Advanced Analytics

-- ============================================
-- KPI Configurations Table (Azure/Clerk Compatible)
-- User-defined KPIs with thresholds, alerts, visualization settings
-- ============================================
CREATE TABLE IF NOT EXISTS kpi_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL, -- Clerk user ID
  name TEXT NOT NULL,
  description TEXT,
  metric_type TEXT NOT NULL, -- Links to analyticsMetrics.metricType
  data_source TEXT NOT NULL, -- 'claims', 'members', 'financial', 'custom_query'
  calculation JSONB NOT NULL, -- Formula, aggregation method, filters
  visualization_type TEXT NOT NULL, -- 'line', 'bar', 'pie', 'gauge', 'number'
  target_value NUMERIC, -- Goal/target for this KPI
  warning_threshold NUMERIC,
  critical_threshold NUMERIC,
  alert_enabled BOOLEAN DEFAULT FALSE,
  alert_recipients JSONB, -- Array of user IDs or emails
  refresh_interval INTEGER DEFAULT 3600, -- Seconds
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER,
  dashboard_layout JSONB, -- Position, size in grid
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS kpi_configurations_org_idx ON kpi_configurations(organization_id);
CREATE INDEX IF NOT EXISTS kpi_configurations_active_idx ON kpi_configurations(is_active);
CREATE INDEX IF NOT EXISTS kpi_configurations_created_by_idx ON kpi_configurations(created_by);

COMMENT ON TABLE kpi_configurations IS 'User-defined KPIs with thresholds, alerts, and visualization settings';
COMMENT ON COLUMN kpi_configurations.data_source IS 'Data source: claims, members, financial, custom_query';
COMMENT ON COLUMN kpi_configurations.visualization_type IS 'Chart type: line, bar, pie, gauge, number';
COMMENT ON COLUMN kpi_configurations.refresh_interval IS 'Auto-refresh interval in seconds';
COMMENT ON COLUMN kpi_configurations.created_by IS 'Clerk user ID of creator';

-- ============================================
-- Insight Recommendations Table (Azure/Clerk Compatible)
-- AI-generated insights and recommendations based on analytics
-- ============================================
CREATE TABLE IF NOT EXISTS insight_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'opportunity', 'risk', 'optimization', 'alert', 'information'
  category TEXT NOT NULL, -- 'claims', 'members', 'financial', 'operations', 'compliance'
  priority TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data_source JSONB, -- What data this insight is based on
  metrics JSONB, -- Related metrics and values
  trend TEXT, -- Associated trend
  impact TEXT, -- Expected impact (high, medium, low)
  recommendations JSONB, -- Array of actionable recommendations
  action_required BOOLEAN DEFAULT FALSE,
  action_deadline TIMESTAMP,
  estimated_benefit TEXT,
  confidence_score NUMERIC, -- 0-1, AI confidence in this insight
  related_entities JSONB, -- Links to specific claims, members, etc.
  status TEXT DEFAULT 'new', -- 'new', 'acknowledged', 'in_progress', 'completed', 'dismissed'
  acknowledged_by TEXT, -- Clerk user ID
  acknowledged_at TIMESTAMP,
  dismissed_by TEXT, -- Clerk user ID
  dismissed_at TIMESTAMP,
  dismissal_reason TEXT,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS insight_recommendations_org_idx ON insight_recommendations(organization_id);
CREATE INDEX IF NOT EXISTS insight_recommendations_status_idx ON insight_recommendations(status);
CREATE INDEX IF NOT EXISTS insight_recommendations_priority_idx ON insight_recommendations(priority);
CREATE INDEX IF NOT EXISTS insight_recommendations_created_idx ON insight_recommendations(created_at);
CREATE INDEX IF NOT EXISTS insight_recommendations_category_idx ON insight_recommendations(category);

COMMENT ON TABLE insight_recommendations IS 'AI-generated insights and actionable recommendations based on analytics';
COMMENT ON COLUMN insight_recommendations.insight_type IS 'Insight type: opportunity, risk, optimization, alert, information';
COMMENT ON COLUMN insight_recommendations.priority IS 'Priority level: critical, high, medium, low';
COMMENT ON COLUMN insight_recommendations.confidence_score IS 'AI confidence in this insight (0-1)';
COMMENT ON COLUMN insight_recommendations.status IS 'Status: new, acknowledged, in_progress, completed, dismissed';
COMMENT ON COLUMN insight_recommendations.acknowledged_by IS 'Clerk user ID who acknowledged';
COMMENT ON COLUMN insight_recommendations.dismissed_by IS 'Clerk user ID who dismissed';

-- ============================================
-- Comparative Analyses Table (Azure/Clerk Compatible)
-- Cross-organization comparisons and benchmarking
-- ============================================
CREATE TABLE IF NOT EXISTS comparative_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  analysis_name TEXT NOT NULL,
  comparison_type TEXT NOT NULL, -- 'peer_comparison', 'industry_benchmark', 'historical_comparison'
  organization_ids JSONB, -- Array of org IDs being compared (for peer comparison)
  metrics JSONB NOT NULL, -- Array of metrics being compared
  time_range JSONB NOT NULL,
  results JSONB NOT NULL, -- Comparison results with percentiles, rankings
  benchmarks JSONB, -- Industry or peer benchmarks
  organization_ranking JSONB, -- How this org ranks
  gaps JSONB, -- Areas where org is underperforming
  strengths JSONB, -- Areas where org is outperforming
  recommendations JSONB,
  visualization_data JSONB,
  is_public BOOLEAN DEFAULT FALSE, -- Allow sharing with other orgs
  created_by TEXT NOT NULL, -- Clerk user ID
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS comparative_analyses_org_idx ON comparative_analyses(organization_id);
CREATE INDEX IF NOT EXISTS comparative_analyses_created_idx ON comparative_analyses(created_at);
CREATE INDEX IF NOT EXISTS comparative_analyses_type_idx ON comparative_analyses(comparison_type);
CREATE INDEX IF NOT EXISTS comparative_analyses_created_by_idx ON comparative_analyses(created_by);

COMMENT ON TABLE comparative_analyses IS 'Cross-organization comparisons and benchmarking analysis';
COMMENT ON COLUMN comparative_analyses.comparison_type IS 'Type: peer_comparison, industry_benchmark, historical_comparison';
COMMENT ON COLUMN comparative_analyses.is_public IS 'Whether this analysis can be shared with other organizations';
COMMENT ON COLUMN comparative_analyses.created_by IS 'Clerk user ID of creator';

-- ============================================
-- Row-Level Security (RLS) Policies
-- Using standard PostgreSQL RLS without Supabase auth schema
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE kpi_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparative_analyses ENABLE ROW LEVEL SECURITY;

-- KPI Configurations RLS Policies
-- Note: In production, you'll need to set a session variable with the current user's org ID
-- This can be done via SET LOCAL in your API middleware

CREATE POLICY "Users can view KPIs for their organization"
  ON kpi_configurations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE clerk_user_id = current_setting('app.current_user_id', TRUE)
    )
  );

CREATE POLICY "Admins and managers can create KPIs"
  ON kpi_configurations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.clerk_user_id = current_setting('app.current_user_id', TRUE)
        AND om.role IN ('super_admin', 'org_admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update KPIs"
  ON kpi_configurations FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.clerk_user_id = current_setting('app.current_user_id', TRUE)
        AND om.role IN ('super_admin', 'org_admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete KPIs"
  ON kpi_configurations FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.clerk_user_id = current_setting('app.current_user_id', TRUE)
        AND om.role IN ('super_admin', 'org_admin')
    )
  );

-- Insight Recommendations RLS Policies
CREATE POLICY "Users can view insights for their organization"
  ON insight_recommendations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE clerk_user_id = current_setting('app.current_user_id', TRUE)
    )
  );

CREATE POLICY "System can insert insights"
  ON insight_recommendations FOR INSERT
  WITH CHECK (true); -- Insights are generated by cron job with elevated privileges

CREATE POLICY "Users can update insights (acknowledge/dismiss)"
  ON insight_recommendations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE clerk_user_id = current_setting('app.current_user_id', TRUE)
    )
  );

-- Comparative Analyses RLS Policies
CREATE POLICY "Users can view comparative analyses for their organization"
  ON comparative_analyses FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE clerk_user_id = current_setting('app.current_user_id', TRUE)
    )
    OR is_public = TRUE
  );

CREATE POLICY "Admins and managers can create comparative analyses"
  ON comparative_analyses FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.clerk_user_id = current_setting('app.current_user_id', TRUE)
        AND om.role IN ('super_admin', 'org_admin', 'manager')
    )
  );

CREATE POLICY "Creators can update their comparative analyses"
  ON comparative_analyses FOR UPDATE
  USING (
    created_by = current_setting('app.current_user_id', TRUE)
    OR organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.clerk_user_id = current_setting('app.current_user_id', TRUE)
        AND om.role IN ('super_admin', 'org_admin')
    )
  );

CREATE POLICY "Admins can delete comparative analyses"
  ON comparative_analyses FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.clerk_user_id = current_setting('app.current_user_id', TRUE)
        AND om.role IN ('super_admin', 'org_admin')
    )
  );

-- ============================================
-- Audit Triggers
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kpi_configurations_updated_at
  BEFORE UPDATE ON kpi_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insight_recommendations_updated_at
  BEFORE UPDATE ON insight_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Grants for service role (cron jobs)
-- Note: Create a service_user if not exists
-- ============================================

-- Grant necessary permissions for automated processes
-- These will be used by the cron job that generates insights
DO $$
BEGIN
  -- Grant basic permissions to public for now
  -- In production, you'd create a specific service role
  GRANT SELECT, INSERT, UPDATE ON analytics_metrics TO PUBLIC;
  GRANT SELECT, INSERT, UPDATE ON ml_predictions TO PUBLIC;
  GRANT SELECT, INSERT, UPDATE ON trend_analyses TO PUBLIC;
  GRANT SELECT, INSERT, UPDATE ON kpi_configurations TO PUBLIC;
  GRANT SELECT, INSERT, UPDATE ON insight_recommendations TO PUBLIC;
  GRANT SELECT, INSERT, UPDATE ON comparative_analyses TO PUBLIC;
END $$;

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Note: Commented out - uncomment if you want sample data
/*
INSERT INTO kpi_configurations (
  organization_id,
  created_by,
  name,
  description,
  metric_type,
  data_source,
  calculation,
  visualization_type,
  target_value
)
SELECT 
  id,
  'system',
  'Monthly Claims Volume',
  'Total number of claims filed per month',
  'claims_volume',
  'claims',
  '{"aggregation": "count", "groupBy": "month"}'::jsonb,
  'line',
  100
FROM organizations
WHERE type = 'union_local'
LIMIT 1;
*/

COMMENT ON SCHEMA public IS 'Q1 2025 - Advanced Analytics: KPI configurations, AI insights, comparative analysis (Azure PostgreSQL + Clerk)';
