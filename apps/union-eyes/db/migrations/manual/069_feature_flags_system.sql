-- Migration: Feature Flags System
-- Created: 2026-02-06
-- Description: Add feature flags table for runtime feature toggles

-- Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Flag identification
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'boolean' CHECK (type IN ('boolean', 'percentage', 'tenant', 'user')),
  
  -- Configuration
  enabled BOOLEAN NOT NULL DEFAULT false,
  percentage INTEGER CHECK (percentage >= 0 AND percentage <= 100),
  allowed_tenants JSONB DEFAULT '[]'::jsonb,
  allowed_users JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  description TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  last_modified_by TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_type ON feature_flags(type);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_flags_updated_at();

-- Insert default feature flags
INSERT INTO feature_flags (name, type, enabled, description, tags) VALUES
  ('new-claim-flow', 'boolean', true, 'New streamlined claim submission flow', '["claims"]'::jsonb),
  ('ai-claim-suggestions', 'percentage', true, 'AI-powered claim suggestions', '["claims", "ai", "ml"]'::jsonb),
  ('advanced-claim-filters', 'boolean', true, 'Advanced filtering for claims dashboard', '["claims", "ui"]'::jsonb),
  ('ml-predictions', 'percentage', true, 'Machine learning predictions', '["ml", "analytics"]'::jsonb),
  ('nlp-document-analysis', 'percentage', false, 'NLP-powered document analysis', '["ml", "documents"]'::jsonb),
  ('sms-notifications', 'boolean', true, 'SMS notification delivery', '["notifications"]'::jsonb),
  ('push-notifications', 'boolean', false, 'Push notifications for mobile', '["notifications", "mobile"]'::jsonb),
  ('email-digests', 'boolean', true, 'Daily email digest summaries', '["notifications", "email"]'::jsonb),
  ('self-serve-onboarding', 'boolean', false, 'Self-service organization onboarding', '["onboarding"]'::jsonb),
  ('member-portal-v2', 'tenant', false, 'New member portal interface', '["ui", "member"]'::jsonb),
  ('mobile-app', 'boolean', false, 'Native mobile app features', '["mobile"]'::jsonb),
  ('realtime-analytics', 'tenant', true, 'Real-time analytics dashboard', '["analytics"]'::jsonb),
  ('advanced-reporting', 'boolean', true, 'Advanced report builder', '["analytics", "reports"]'::jsonb),
  ('stripe-payments', 'boolean', false, 'Stripe payment integration', '["payments"]'::jsonb),
  ('external-calendar-sync', 'boolean', true, 'External calendar synchronization', '["calendar"]'::jsonb),
  ('online-voting', 'boolean', true, 'Online voting and elections', '["voting"]'::jsonb),
  ('ranked-choice-voting', 'percentage', false, 'Ranked-choice voting method', '["voting"]'::jsonb),
  ('audit-log-export', 'boolean', true, 'Export audit logs for compliance', '["admin", "security"]'::jsonb),
  ('bulk-operations', 'boolean', true, 'Bulk operations on members/claims', '["admin"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Set initial percentage values where applicable
UPDATE feature_flags SET percentage = 10 WHERE name IN ('ai-claim-suggestions', 'ml-predictions');
UPDATE feature_flags SET percentage = 0 WHERE name IN ('nlp-document-analysis', 'ranked-choice-voting');

COMMENT ON TABLE feature_flags IS 'Runtime feature toggles for gradual rollouts, A/B testing, and kill switches';
COMMENT ON COLUMN feature_flags.name IS 'Unique feature flag identifier (kebab-case)';
COMMENT ON COLUMN feature_flags.type IS 'Flag type: boolean (on/off), percentage (gradual rollout), tenant (org-specific), user (user-specific)';
COMMENT ON COLUMN feature_flags.enabled IS 'Master enable switch for the feature';
COMMENT ON COLUMN feature_flags.percentage IS 'Percentage of users to enable (0-100) for percentage-based rollouts';
COMMENT ON COLUMN feature_flags.allowed_tenants IS 'List of tenant IDs allowed to use this feature (for tenant flags)';
COMMENT ON COLUMN feature_flags.allowed_users IS 'List of user IDs allowed to use this feature (for user flags)';
