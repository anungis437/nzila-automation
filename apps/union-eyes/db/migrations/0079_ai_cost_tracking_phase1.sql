-- Phase 1: AI Cost Tracking and Rate Limiting
-- Generated: 2026-02-12
-- Part of LLM Excellence roadmap

BEGIN;

-- ============================================================================
-- 1. Create ai_usage_metrics table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'azure')),
    model TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('completion', 'embedding', 'moderation')),
    tokens_input INTEGER NOT NULL CHECK (tokens_input >= 0),
    tokens_output INTEGER NOT NULL CHECK (tokens_output >= 0),
    tokens_total INTEGER NOT NULL CHECK (tokens_total >= 0),
    estimated_cost DECIMAL(10, 6) NOT NULL CHECK (estimated_cost >= 0),
    request_id TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID,
    latency_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT tokens_total_check CHECK (tokens_total = tokens_input + tokens_output)
);

-- Add comment
COMMENT ON TABLE ai_usage_metrics IS 'Tracks all LLM API usage for cost monitoring and attribution';

-- ============================================================================
-- 2. Create ai_rate_limits table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    limit_type TEXT NOT NULL CHECK (limit_type IN ('requests_per_minute', 'tokens_per_hour', 'cost_per_day')),
    limit_value INTEGER NOT NULL CHECK (limit_value > 0),
    current_value INTEGER DEFAULT 0 CHECK (current_value >= 0),
    window_start TIMESTAMPTZ DEFAULT NOW(),
    window_duration INTERVAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (organization_id, limit_type)
);

COMMENT ON TABLE ai_rate_limits IS 'Rate limiting configuration per organization';

-- ============================================================================
-- 3. Create ai_budgets table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    monthly_limit_usd DECIMAL(10, 2) NOT NULL CHECK (monthly_limit_usd > 0),
    current_spend_usd DECIMAL(10, 2) DEFAULT 0 CHECK (current_spend_usd >= 0),
    alert_threshold DECIMAL(3, 2) DEFAULT 0.80 CHECK (alert_threshold BETWEEN 0 AND 1),
    hard_limit BOOLEAN DEFAULT TRUE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (organization_id, billing_period_start),
    CONSTRAINT billing_period_check CHECK (billing_period_end > billing_period_start)
);

COMMENT ON TABLE ai_budgets IS 'Monthly AI budget allocations and spend tracking per organization';

-- ============================================================================
-- 4. Create indexes for performance
-- ============================================================================

-- Usage metrics indexes
CREATE INDEX IF NOT EXISTS idx_usage_org_time ON ai_usage_metrics(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_provider_time ON ai_usage_metrics(provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_model ON ai_usage_metrics(model);
CREATE INDEX IF NOT EXISTS idx_usage_user ON ai_usage_metrics(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usage_metadata ON ai_usage_metrics USING gin(metadata);

-- Rate limits indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_org ON ai_rate_limits(organization_id, limit_type);

-- Budgets indexes
CREATE INDEX IF NOT EXISTS idx_budgets_org_period ON ai_budgets(organization_id, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_budgets_alert ON ai_budgets(organization_id) WHERE (current_spend_usd / monthly_limit_usd) >= alert_threshold;

-- ============================================================================
-- 5. Create materialized view for daily usage aggregation
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS ai_usage_daily AS
SELECT 
    organization_id,
    provider,
    model,
    DATE(created_at) as usage_date,
    COUNT(*) as request_count,
    SUM(tokens_input) as total_tokens_input,
    SUM(tokens_output) as total_tokens_output,
    SUM(tokens_total) as total_tokens,
    SUM(estimated_cost) as total_cost,
    AVG(latency_ms) as avg_latency_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency_ms
FROM ai_usage_metrics
GROUP BY organization_id, provider, model, DATE(created_at);

-- Indexes on materialized view
CREATE UNIQUE INDEX idx_usage_daily_unique ON ai_usage_daily(organization_id, provider, model, usage_date);
CREATE INDEX IF NOT EXISTS idx_usage_daily_date ON ai_usage_daily(usage_date DESC);

COMMENT ON MATERIALIZED VIEW ai_usage_daily IS 'Daily aggregated AI usage metrics for reporting';

-- ============================================================================
-- 6. Create function to refresh materialized view
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_ai_usage_daily()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY ai_usage_daily;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_ai_usage_daily() IS 'Refresh the daily AI usage materialized view';

-- ============================================================================
-- 7. Insert default budgets for existing organizations
-- ============================================================================

INSERT INTO ai_budgets (organization_id, monthly_limit_usd, billing_period_start, billing_period_end)
SELECT 
    id,
    1000.00, -- Default $1k/month
    DATE_TRUNC('month', NOW())::DATE,
    (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day')::DATE
FROM organizations
ON CONFLICT (organization_id, billing_period_start) DO NOTHING;

-- ============================================================================
-- 8. Add trigger to update current_spend_usd
-- ============================================================================

CREATE OR REPLACE FUNCTION update_budget_spend()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ai_budgets
    SET 
        current_spend_usd = current_spend_usd + NEW.estimated_cost,
        updated_at = NOW()
    WHERE 
        organization_id = NEW.organization_id
        AND billing_period_start <= DATE(NEW.created_at)
        AND billing_period_end >= DATE(NEW.created_at);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_budget_spend
AFTER INSERT ON ai_usage_metrics
FOR EACH ROW
EXECUTE FUNCTION update_budget_spend();

COMMENT ON FUNCTION update_budget_spend() IS 'Automatically update budget spend when usage is recorded';

-- ============================================================================
-- 9. Create view for budget alerts
-- ============================================================================

CREATE OR REPLACE VIEW ai_budget_alerts AS
SELECT 
    ab.id,
    ab.organization_id,
    o.name as organization_name,
    ab.current_spend_usd,
    ab.monthly_limit_usd,
    (ab.current_spend_usd / ab.monthly_limit_usd) as percent_used,
    ab.alert_threshold,
    ab.hard_limit,
    ab.billing_period_start,
    ab.billing_period_end,
    CASE 
        WHEN (ab.current_spend_usd / ab.monthly_limit_usd) >= 1.0 THEN 'EXCEEDED'
        WHEN (ab.current_spend_usd / ab.monthly_limit_usd) >= ab.alert_threshold THEN 'WARNING'
        ELSE 'OK'
    END as status
FROM ai_budgets ab
JOIN organizations o ON o.id = ab.organization_id
WHERE ab.billing_period_end >= CURRENT_DATE;

COMMENT ON VIEW ai_budget_alerts IS 'Current budget status with alert levels';

-- ============================================================================
-- 10. RLS Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE ai_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_budgets ENABLE ROW LEVEL SECURITY;

-- ai_usage_metrics policies
CREATE POLICY "Users can view their organization's AI usage"
    ON ai_usage_metrics FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.user_id()
        )
    );

CREATE POLICY "System can insert AI usage metrics"
    ON ai_usage_metrics FOR INSERT
    WITH CHECK (true);

-- ai_rate_limits policies
CREATE POLICY "Users can view their organization's rate limits"
    ON ai_rate_limits FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.user_id()
        )
    );

CREATE POLICY "Admins can manage rate limits"
    ON ai_rate_limits FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.user_id() 
              AND role IN ('owner', 'admin')
        )
    );

-- ai_budgets policies
CREATE POLICY "Users can view their organization's budget"
    ON ai_budgets FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.user_id()
        )
    );

CREATE POLICY "Admins can manage budgets"
    ON ai_budgets FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.user_id() 
              AND role IN ('owner', 'admin')
        )
    );

-- ============================================================================
-- 11. Grant permissions
-- ============================================================================

GRANT SELECT ON ai_usage_metrics TO authenticated;
GRANT INSERT ON ai_usage_metrics TO authenticated;
GRANT SELECT ON ai_rate_limits TO authenticated;
GRANT ALL ON ai_rate_limits TO authenticated;
GRANT SELECT ON ai_budgets TO authenticated;
GRANT ALL ON ai_budgets TO authenticated;
GRANT SELECT ON ai_usage_daily TO authenticated;
GRANT SELECT ON ai_budget_alerts TO authenticated;

COMMIT;
