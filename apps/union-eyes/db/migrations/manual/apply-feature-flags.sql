-- Standalone Feature Flags Migration
-- Apply only if table doesn't exist

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text DEFAULT 'boolean' NOT NULL CHECK (type IN ('boolean', 'percentage', 'tenant', 'user')),
  enabled boolean DEFAULT false NOT NULL,
  percentage integer CHECK (percentage >= 0 AND percentage <= 100),
  allowed_tenants json DEFAULT '[]'::json,
  allowed_users json DEFAULT '[]'::json,
  description text,
  tags json DEFAULT '[]'::json,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by text,
  last_modified_by text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_type ON feature_flags(type);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER trigger_update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_flags_updated_at();

-- Insert default feature flags
INSERT INTO feature_flags (name, type, enabled, description, tags, percentage) VALUES
  ('new-claim-flow', 'boolean', true, 'New streamlined claim submission flow', '["claims"]'::json, NULL),
  ('ai-claim-suggestions', 'percentage', true, 'AI-powered claim suggestions', '["claims", "ai", "ml"]'::json, 10),
  ('advanced-claim-filters', 'boolean', true, 'Advanced filtering for claims dashboard', '["claims", "ui"]'::json, NULL),
  ('ml-predictions', 'percentage', true, 'Machine learning predictions', '["ml", "analytics"]'::json, 10),
  ('nlp-document-analysis', 'percentage', false, 'NLP-powered document analysis', '["ml", "documents"]'::json, 0),
  ('sms-notifications', 'boolean', true, 'SMS notification delivery', '["notifications"]'::json, NULL),
  ('push-notifications', 'boolean', false, 'Push notifications for mobile', '["notifications", "mobile"]'::json, NULL),
  ('email-digests', 'boolean', true, 'Daily email digest summaries', '["notifications", "email"]'::json, NULL),
  ('self-serve-onboarding', 'boolean', false, 'Self-service organization onboarding', '["onboarding"]'::json, NULL),
  ('member-portal-v2', 'tenant', false, 'New member portal interface', '["ui", "member"]'::json, NULL),
  ('mobile-app', 'boolean', false, 'Native mobile app features', '["mobile"]'::json, NULL),
  ('realtime-analytics', 'tenant', true, 'Real-time analytics dashboard', '["analytics"]'::json, NULL),
  ('advanced-reporting', 'boolean', true, 'Advanced report builder', '["analytics", "reports"]'::json, NULL),
  ('stripe-payments', 'boolean', false, 'Stripe payment integration', '["payments"]'::json, NULL),
  ('external-calendar-sync', 'boolean', true, 'External calendar synchronization', '["calendar"]'::json, NULL),
  ('online-voting', 'boolean', true, 'Online voting and elections', '["voting"]'::json, NULL),
  ('ranked-choice-voting', 'percentage', false, 'Ranked-choice voting method', '["voting"]'::json, 0),
  ('audit-log-export', 'boolean', true, 'Export audit logs for compliance', '["admin", "security"]'::json, NULL),
  ('bulk-operations', 'boolean', true, 'Bulk operations on members/claims', '["admin"]'::json, NULL)
ON CONFLICT (name) DO NOTHING;

-- Add comments
COMMENT ON TABLE feature_flags IS 'Runtime feature toggles for gradual rollouts, A/B testing, and kill switches';
COMMENT ON COLUMN feature_flags.name IS 'Unique feature flag identifier (kebab-case)';
COMMENT ON COLUMN feature_flags.type IS 'Flag type: boolean (on/off), percentage (gradual rollout), tenant (org-specific), user (user-specific)';
COMMENT ON COLUMN feature_flags.enabled IS 'Master enable switch for the feature';
COMMENT ON COLUMN feature_flags.percentage IS 'Percentage of users to enable (0-100) for percentage-based rollouts';
COMMENT ON COLUMN feature_flags.allowed_tenants IS 'List of tenant IDs allowed to use this feature (for tenant flags)';
COMMENT ON COLUMN feature_flags.allowed_users IS 'List of user IDs allowed to use this feature (for user flags)';
