-- Migration: 067_advanced_analytics_q1_2025
-- Description: Advanced Analytics System - Predictive analytics, ML predictions, trend analysis, KPI configurations, insights
-- Created: 2024-12-15
-- Phase: Q1 2025 - Advanced Analytics

-- ============================================
-- Analytics Metrics Table
-- Stores computed metrics for dashboard and reporting
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'claims_volume', 'resolution_time', 'member_growth', 'custom'
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT, -- 'count', 'percentage', 'days', 'dollars'
  period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  metadata JSONB, -- Additional context, filters applied, calculation method
  comparison_value NUMERIC, -- Previous period value for comparison
  trend TEXT, -- 'up', 'down', 'stable'
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS analytics_metrics_org_idx ON analytics_metrics(organization_id);
CREATE INDEX IF NOT EXISTS analytics_metrics_type_idx ON analytics_metrics(metric_type);
CREATE INDEX IF NOT EXISTS analytics_metrics_period_idx ON analytics_metrics(period_start, period_end);

COMMENT ON TABLE analytics_metrics IS 'Stores computed metrics for dashboard, reporting, and comparative analysis';
COMMENT ON COLUMN analytics_metrics.metric_type IS 'Type of metric: claims_volume, resolution_time, member_growth, custom';
COMMENT ON COLUMN analytics_metrics.period_type IS 'Time period: daily, weekly, monthly, quarterly, yearly';
COMMENT ON COLUMN analytics_metrics.trend IS 'Trend direction: up, down, stable';

-- ============================================
-- KPI Configurations Table
-- User-defined KPIs with thresholds, alerts, visualization settings
-- ============================================
CREATE TABLE IF NOT EXISTS kpi_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
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

-- ============================================
-- ML Predictions Table
-- Stores machine learning predictions for forecasting
-- ============================================
CREATE TABLE IF NOT EXISTS ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL, -- 'claims_volume', 'resource_needs', 'budget_forecast'
  model_name TEXT NOT NULL, -- 'arima', 'prophet', 'linear_regression', 'random_forest'
  model_version TEXT NOT NULL,
  target_date TIMESTAMP NOT NULL, -- Date being predicted
  predicted_value NUMERIC NOT NULL,
  confidence_interval JSONB, -- { lower: number, upper: number }
  confidence_score NUMERIC, -- 0-1
  features JSONB, -- Input features used for prediction
  actual_value NUMERIC, -- Filled in when actual data becomes available
  accuracy NUMERIC, -- Calculated after actual value is known
  metadata JSONB, -- Training data range, hyperparameters, etc.
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  validated_at TIMESTAMP -- When actual value was recorded
);

CREATE INDEX IF NOT EXISTS ml_predictions_org_idx ON ml_predictions(organization_id);
CREATE INDEX IF NOT EXISTS ml_predictions_type_idx ON ml_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS ml_predictions_date_idx ON ml_predictions(target_date);
CREATE INDEX IF NOT EXISTS ml_predictions_model_idx ON ml_predictions(model_name, model_version);

COMMENT ON TABLE ml_predictions IS 'Machine learning predictions for forecasting claims volume, resource needs, budgets';
COMMENT ON COLUMN ml_predictions.prediction_type IS 'Type of prediction: claims_volume, resource_needs, budget_forecast';
COMMENT ON COLUMN ml_predictions.model_name IS 'ML model used: arima, prophet, linear_regression, random_forest';
COMMENT ON COLUMN ml_predictions.confidence_score IS 'Model confidence in prediction (0-1)';
COMMENT ON COLUMN ml_predictions.accuracy IS 'Prediction accuracy calculated after actual value is known';

-- ============================================
-- Trend Analyses Table
-- Stores trend detection results and anomaly detection
-- ============================================
CREATE TABLE IF NOT EXISTS trend_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL, -- 'trend', 'anomaly', 'pattern', 'correlation'
  data_source TEXT NOT NULL, -- 'claims', 'members', 'financial', etc.
  time_range JSONB NOT NULL, -- { start: date, end: date }
  detected_trend TEXT, -- 'increasing', 'decreasing', 'seasonal', 'cyclical', 'stable'
  trend_strength NUMERIC, -- 0-1, how strong the trend is
  anomalies_detected JSONB, -- Array of anomaly points with dates and values
  anomaly_count INTEGER DEFAULT 0,
  seasonal_pattern JSONB, -- Detected seasonal patterns
  correlations JSONB, -- Correlations with other metrics
  insights TEXT, -- AI-generated human-readable insights
  recommendations JSONB, -- Actionable recommendations
  statistical_tests JSONB, -- Results of statistical significance tests
  visualization_data JSONB, -- Pre-computed data for charts
  confidence NUMERIC, -- 0-1
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS trend_analyses_org_idx ON trend_analyses(organization_id);
CREATE INDEX IF NOT EXISTS trend_analyses_type_idx ON trend_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS trend_analyses_created_idx ON trend_analyses(created_at);
CREATE INDEX IF NOT EXISTS trend_analyses_data_source_idx ON trend_analyses(data_source);

COMMENT ON TABLE trend_analyses IS 'Trend detection results, anomaly detection, and pattern recognition';
COMMENT ON COLUMN trend_analyses.analysis_type IS 'Analysis type: trend, anomaly, pattern, correlation';
COMMENT ON COLUMN trend_analyses.detected_trend IS 'Trend direction: increasing, decreasing, seasonal, cyclical, stable';
COMMENT ON COLUMN trend_analyses.trend_strength IS 'Strength of detected trend (0-1)';
COMMENT ON COLUMN trend_analyses.confidence IS 'Confidence in analysis results (0-1)';

-- ============================================
-- Insight Recommendations Table
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
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  dismissed_by UUID REFERENCES users(id),
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

-- ============================================
-- Comparative Analyses Table
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
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS comparative_analyses_org_idx ON comparative_analyses(organization_id);
CREATE INDEX IF NOT EXISTS comparative_analyses_created_idx ON comparative_analyses(created_at);
CREATE INDEX IF NOT EXISTS comparative_analyses_type_idx ON comparative_analyses(comparison_type);
CREATE INDEX IF NOT EXISTS comparative_analyses_created_by_idx ON comparative_analyses(created_by);

COMMENT ON TABLE comparative_analyses IS 'Cross-organization comparisons and benchmarking analysis';
COMMENT ON COLUMN comparative_analyses.comparison_type IS 'Type: peer_comparison, industry_benchmark, historical_comparison';
COMMENT ON COLUMN comparative_analyses.is_public IS 'Whether this analysis can be shared with other organizations';

-- ============================================
-- Row-Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all analytics tables
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparative_analyses ENABLE ROW LEVEL SECURITY;

-- Analytics Metrics RLS Policies
CREATE POLICY "Users can view analytics metrics for their organization"
  ON analytics_metrics FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can insert analytics metrics"
  ON analytics_metrics FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON om.user_id = u.id
      WHERE u.id = auth.uid() AND om.role IN ('super_admin', 'org_admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update analytics metrics"
  ON analytics_metrics FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON om.user_id = u.id
      WHERE u.id = auth.uid() AND om.role IN ('super_admin', 'org_admin', 'manager')
    )
  );

-- KPI Configurations RLS Policies
CREATE POLICY "Users can view KPI configurations for their organization"
  ON kpi_configurations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert KPI configurations for their organization"
  ON kpi_configurations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their own KPI configurations"
  ON kpi_configurations FOR UPDATE
  USING (
    created_by = auth.uid()
    OR organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON om.user_id = u.id
      WHERE u.id = auth.uid() AND om.role IN ('super_admin', 'org_admin', 'manager')
    )
  );

CREATE POLICY "Users can delete their own KPI configurations"
  ON kpi_configurations FOR DELETE
  USING (
    created_by = auth.uid()
    OR organization_id IN (
      SELECT om.organization_id FROM organization_members om
      JOIN users u ON om.user_id = u.id
      WHERE u.id = auth.uid() AND om.role IN ('super_admin', 'org_admin')
    )
  );

-- ML Predictions RLS Policies
CREATE POLICY "Users can view ML predictions for their organization"
  ON ml_predictions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert ML predictions"
  ON ml_predictions FOR INSERT
  WITH CHECK (true); -- System/service account will insert predictions

CREATE POLICY "System can update ML predictions with actual values"
  ON ml_predictions FOR UPDATE
  USING (true); -- System/service account will update with actuals

-- Trend Analyses RLS Policies
CREATE POLICY "Users can view trend analyses for their organization"
  ON trend_analyses FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert trend analyses"
  ON trend_analyses FOR INSERT
  WITH CHECK (true); -- System/service account will insert analyses

-- Insight Recommendations RLS Policies
CREATE POLICY "Users can view insight recommendations for their organization"
  ON insight_recommendations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert insight recommendations"
  ON insight_recommendations FOR INSERT
  WITH CHECK (true); -- System/service account will generate insights

CREATE POLICY "Users can update insight recommendations they can view"
  ON insight_recommendations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Comparative Analyses RLS Policies
CREATE POLICY "Users can view comparative analyses for their organization"
  ON comparative_analyses FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
    OR is_public = true
  );

CREATE POLICY "Users can insert comparative analyses for their organization"
  ON comparative_analyses FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their own comparative analyses"
  ON comparative_analyses FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own comparative analyses"
  ON comparative_analyses FOR DELETE
  USING (created_by = auth.uid());

-- ============================================
-- Triggers for updated_at timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analytics_metrics_updated_at
  BEFORE UPDATE ON analytics_metrics
  FOR EACH ROW EXECUTE FUNCTION update_analytics_updated_at();

CREATE TRIGGER kpi_configurations_updated_at
  BEFORE UPDATE ON kpi_configurations
  FOR EACH ROW EXECUTE FUNCTION update_analytics_updated_at();

CREATE TRIGGER insight_recommendations_updated_at
  BEFORE UPDATE ON insight_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_analytics_updated_at();

-- ============================================
-- Grant Permissions
-- ============================================

-- Grant permissions to authenticated users
GRANT SELECT ON analytics_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON kpi_configurations TO authenticated;
GRANT SELECT ON ml_predictions TO authenticated;
GRANT SELECT ON trend_analyses TO authenticated;
GRANT SELECT, UPDATE ON insight_recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON comparative_analyses TO authenticated;

-- Grant permissions to service role for system operations
GRANT ALL ON analytics_metrics TO service_role;
GRANT ALL ON kpi_configurations TO service_role;
GRANT ALL ON ml_predictions TO service_role;
GRANT ALL ON trend_analyses TO service_role;
GRANT ALL ON insight_recommendations TO service_role;
GRANT ALL ON comparative_analyses TO service_role;

-- ============================================
-- Initial Data / Seed Data (Optional)
-- ============================================

-- Create default KPI templates
INSERT INTO kpi_configurations (
  organization_id,
  created_by,
  name,
  description,
  metric_type,
  data_source,
  calculation,
  visualization_type,
  is_active
)
SELECT 
  o.id as organization_id,
  (SELECT id FROM users WHERE email LIKE '%admin%' LIMIT 1) as created_by,
  'Claims Volume Trend',
  'Track the monthly trend of claims submitted',
  'claims_volume',
  'claims',
  '{"aggregation": "count", "groupBy": "month", "filters": {}}',
  'line',
  false
FROM organizations o
LIMIT 1; -- Insert template for first org only

COMMENT ON MIGRATION 067 IS 'Q1 2025 - Advanced Analytics: Predictive analytics, ML predictions, trend analysis, KPI configurations, AI insights, comparative analysis';
