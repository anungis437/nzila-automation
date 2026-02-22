-- =====================================================
-- Recognition & Rewards System - Database Migration
-- Migration: 058_recognition_rewards_system.sql
-- Purpose: Create core recognition & rewards tables with RLS policies
-- Date: 2026-02-05
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE program_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE award_kind AS ENUM ('milestone', 'peer', 'admin', 'automated');
CREATE TYPE award_status AS ENUM ('pending', 'approved', 'issued', 'rejected', 'revoked');
CREATE TYPE wallet_event_type AS ENUM ('earn', 'spend', 'expire', 'revoke', 'adjust', 'refund');
CREATE TYPE wallet_source_type AS ENUM ('award', 'redemption', 'admin_adjustment', 'system');
CREATE TYPE budget_scope_type AS ENUM ('org', 'local', 'department', 'manager');
CREATE TYPE budget_period AS ENUM ('monthly', 'quarterly', 'annual');
CREATE TYPE redemption_status AS ENUM ('initiated', 'pending_payment', 'ordered', 'fulfilled', 'cancelled', 'refunded');
CREATE TYPE redemption_provider AS ENUM ('shopify');
CREATE TYPE webhook_provider AS ENUM ('shopify');

-- =====================================================
-- TABLES
-- =====================================================

-- Recognition Programs
CREATE TABLE public.recognition_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status program_status NOT NULL DEFAULT 'draft',
  currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX recognition_programs_org_id_idx ON public.recognition_programs(org_id);

COMMENT ON TABLE public.recognition_programs IS 'Container for recognition initiatives within an organization';

-- Recognition Award Types
CREATE TABLE public.recognition_award_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.recognition_programs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  kind award_kind NOT NULL,
  default_credit_amount INTEGER NOT NULL,
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  rules_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT award_type_credit_amount_positive CHECK (default_credit_amount > 0)
);

CREATE INDEX recognition_award_types_org_id_idx ON public.recognition_award_types(org_id);
CREATE INDEX recognition_award_types_program_id_idx ON public.recognition_award_types(program_id);

COMMENT ON TABLE public.recognition_award_types IS 'Templates for different types of recognition';

-- Recognition Awards
CREATE TABLE public.recognition_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.recognition_programs(id) ON DELETE CASCADE,
  award_type_id UUID NOT NULL REFERENCES public.recognition_award_types(id) ON DELETE RESTRICT,
  recipient_user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  issuer_user_id VARCHAR(255), -- Nullable for automated awards
  reason TEXT NOT NULL,
  status award_status NOT NULL DEFAULT 'pending',
  approved_by_user_id VARCHAR(255),
  approved_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX recognition_awards_org_id_idx ON public.recognition_awards(org_id);
CREATE INDEX recognition_awards_program_id_idx ON public.recognition_awards(program_id);
CREATE INDEX recognition_awards_recipient_user_id_idx ON public.recognition_awards(recipient_user_id);
CREATE INDEX recognition_awards_status_idx ON public.recognition_awards(status);

COMMENT ON TABLE public.recognition_awards IS 'Individual award instances (requests, approvals, issuances)';

-- Reward Wallet Ledger
CREATE TABLE public.reward_wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  event_type wallet_event_type NOT NULL,
  amount_credits INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  source_type wallet_source_type NOT NULL,
  source_id UUID, -- FK to awards or redemptions (soft reference)
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wallet_balance_non_negative CHECK (balance_after >= 0)
);

CREATE INDEX reward_wallet_ledger_org_user_idx ON public.reward_wallet_ledger(org_id, user_id);
CREATE INDEX reward_wallet_ledger_user_created_idx ON public.reward_wallet_ledger(user_id, created_at DESC);

COMMENT ON TABLE public.reward_wallet_ledger IS 'Append-only ledger for all credit transactions';
COMMENT ON COLUMN public.reward_wallet_ledger.balance_after IS 'Denormalized running balance for O(1) lookups';

-- Reward Budget Envelopes
CREATE TABLE public.reward_budget_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.recognition_programs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  scope_type budget_scope_type NOT NULL,
  scope_ref_id VARCHAR(255), -- Future: department/manager IDs
  period budget_period NOT NULL,
  amount_limit INTEGER NOT NULL,
  amount_used INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT budget_limit_positive CHECK (amount_limit > 0),
  CONSTRAINT budget_used_valid CHECK (amount_used >= 0 AND amount_used <= amount_limit),
  CONSTRAINT budget_dates_valid CHECK (ends_at > starts_at)
);

CREATE INDEX reward_budget_envelopes_org_id_idx ON public.reward_budget_envelopes(org_id);
CREATE INDEX reward_budget_envelopes_program_id_idx ON public.reward_budget_envelopes(program_id);

COMMENT ON TABLE public.reward_budget_envelopes IS 'Time-bound credit pools for controlling recognition spending';

-- Reward Redemptions
CREATE TABLE public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  program_id UUID NOT NULL REFERENCES public.recognition_programs(id) ON DELETE RESTRICT,
  credits_spent INTEGER NOT NULL,
  status redemption_status NOT NULL DEFAULT 'initiated',
  provider redemption_provider NOT NULL,
  provider_order_id VARCHAR(255),
  provider_checkout_id VARCHAR(255),
  provider_payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT redemption_credits_positive CHECK (credits_spent > 0)
);

CREATE INDEX reward_redemptions_org_id_idx ON public.reward_redemptions(org_id);
CREATE INDEX reward_redemptions_user_id_idx ON public.reward_redemptions(user_id);
CREATE INDEX reward_redemptions_provider_order_idx ON public.reward_redemptions(provider_order_id);

COMMENT ON TABLE public.reward_redemptions IS 'Tracks member redemption requests and Shopify order lifecycle';

-- Shopify Config
CREATE TABLE public.shopify_config (
  org_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  shop_domain VARCHAR(255) NOT NULL,
  storefront_token_secret_ref VARCHAR(255) NOT NULL,
  admin_token_secret_ref VARCHAR(255),
  allowed_collections JSONB NOT NULL DEFAULT '[]'::jsonb,
  webhook_secret_ref VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.shopify_config IS 'Per-organization Shopify integration settings';
COMMENT ON COLUMN public.shopify_config.storefront_token_secret_ref IS 'Reference to env var or Key Vault secret (e.g., SHOPIFY_TOKEN_ORG_{org_id})';

-- Webhook Receipts
CREATE TABLE public.webhook_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider webhook_provider NOT NULL,
  webhook_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  payload_json JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX webhook_receipts_provider_webhook_idx ON public.webhook_receipts(provider, webhook_id);

COMMENT ON TABLE public.webhook_receipts IS 'Idempotency tracking for external webhooks (Shopify, etc.)';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.recognition_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_award_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_budget_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_receipts ENABLE ROW LEVEL SECURITY;

-- Recognition Programs: Organization isolation
CREATE POLICY "recognition_programs_org_isolation" 
ON public.recognition_programs
FOR ALL 
USING (
  org_id::text IN (
    SELECT organization_id 
    FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- Recognition Award Types: Organization isolation via program
CREATE POLICY "recognition_award_types_org_isolation" 
ON public.recognition_award_types
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.recognition_programs rp
    WHERE rp.id = recognition_award_types.program_id
      AND rp.org_id::text IN (
        SELECT organization_id 
        FROM public.organization_members
        WHERE user_id = get_current_user_id()
      )
  )
);

-- Recognition Awards: Members read own, admins read all in org
CREATE POLICY "recognition_awards_read_own" 
ON public.recognition_awards
FOR SELECT 
USING (
  recipient_user_id = get_current_user_id()
  AND org_id::text IN (
    SELECT organization_id 
    FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

CREATE POLICY "recognition_awards_admin_read" 
ON public.recognition_awards
FOR SELECT 
USING (
  org_id::text IN (
    SELECT organization_id 
    FROM public.organization_members
    WHERE user_id = get_current_user_id()
      AND role IN ('admin', 'owner')
  )
);

CREATE POLICY "recognition_awards_admin_write" 
ON public.recognition_awards
FOR INSERT 
WITH CHECK (
  org_id::text IN (
    SELECT organization_id 
    FROM public.organization_members
    WHERE user_id = get_current_user_id()
      AND role IN ('admin', 'owner')
  )
);

CREATE POLICY "recognition_awards_admin_update" 
ON public.recognition_awards
FOR UPDATE 
USING (
  org_id::text IN (
    SELECT organization_id 
    FROM public.organization_members
    WHERE user_id = get_current_user_id()
      AND role IN ('admin', 'owner')
  )
);

-- Reward Wallet Ledger: Users read own, admins read all in org
CREATE POLICY "reward_wallet_ledger_read_own" 
ON public.reward_wallet_ledger
FOR SELECT 
USING (
  user_id = get_current_user_id()
  AND org_id::text IN (
    SELECT organization_id 
    FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

CREATE POLICY "reward_wallet_ledger_admin_read" 
ON public.reward_wallet_ledger
FOR SELECT 
USING (
  org_id::text IN (
    SELECT organization_id 
    FROM public.organization_members
    WHERE user_id = get_current_user_id()
      AND role IN ('admin', 'owner')
  )
);

-- Reward Budget Envelopes: Admin-only access
CREATE POLICY "reward_budget_envelopes_admin" 
ON public.reward_budget_envelopes
FOR ALL 
USING (
  org_id::text IN (
    SELECT organization_id 
    FROM public.organization_members
    WHERE user_id = get_current_user_id()
      AND role IN ('admin', 'owner')
  )
);

-- Reward Redemptions: Users CRUD own, admins read all in org
CREATE POLICY "reward_redemptions_read_own" 
ON public.reward_redemptions
FOR SELECT 
USING (
  user_id = get_current_user_id()
  AND org_id::text IN (
    SELECT organization_id 
    FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

CREATE POLICY "reward_redemptions_insert_own" 
ON public.reward_redemptions
FOR INSERT 
WITH CHECK (
  user_id = get_current_user_id()
  AND org_id::text IN (
    SELECT organization_id 
    FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

CREATE POLICY "reward_redemptions_admin_read" 
ON public.reward_redemptions
FOR SELECT 
USING (
  org_id::text IN (
    SELECT organization_id 
    FROM public.organization_members
    WHERE user_id = get_current_user_id()
      AND role IN ('admin', 'owner')
  )
);

-- Shopify Config: Admin-only access
CREATE POLICY "shopify_config_admin" 
ON public.shopify_config
FOR ALL 
USING (
  org_id::text IN (
    SELECT organization_id 
    FROM public.organization_members
    WHERE user_id = get_current_user_id()
      AND role IN ('admin', 'owner')
  )
);

-- Webhook Receipts: No user-level access (service role only)
-- Optional: Allow admins to read for debugging
CREATE POLICY "webhook_receipts_admin_read" 
ON public.webhook_receipts
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.organization_members
    WHERE user_id = get_current_user_id()
      AND role IN ('admin', 'owner')
  )
);

-- =====================================================
-- GRANTS FOR SERVICE ROLE
-- Note: Service role should be created in deployment scripts
-- This migration assumes service role exists or will be created
-- =====================================================

-- Example grants (adjust based on actual service role name):
-- GRANT SELECT, INSERT ON public.reward_wallet_ledger TO service_role;
-- GRANT SELECT, UPDATE ON public.reward_redemptions TO service_role;
-- GRANT SELECT, INSERT ON public.webhook_receipts TO service_role;

COMMENT ON DATABASE current_database() IS 'Service role grants should be configured in deployment scripts';

-- =====================================================
-- AUDIT LOG INTEGRATION
-- =====================================================

-- Trigger to log award issuance to audit_security.audit_logs
CREATE OR REPLACE FUNCTION log_award_issued()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'issued' AND OLD.status != 'issued' THEN
    INSERT INTO audit_security.audit_logs (
      organization_id,
      user_id,
      action,
      resource_type,
      resource_id,
      old_values,
      new_values,
      severity,
      outcome
    ) VALUES (
      NEW.org_id,
      NEW.recipient_user_id::uuid,
      'award_issued',
      'recognition_award',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      'info',
      'success'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recognition_awards_audit_trigger
AFTER UPDATE ON public.recognition_awards
FOR EACH ROW
EXECUTE FUNCTION log_award_issued();

-- Trigger to log redemption creation
CREATE OR REPLACE FUNCTION log_redemption_initiated()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_security.audit_logs (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    new_values,
    severity,
    outcome
  ) VALUES (
    NEW.org_id,
    NEW.user_id::uuid,
    'redemption_initiated',
    'reward_redemption',
    NEW.id,
    to_jsonb(NEW),
    'info',
    'success'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reward_redemptions_audit_trigger
AFTER INSERT ON public.reward_redemptions
FOR EACH ROW
EXECUTE FUNCTION log_redemption_initiated();

-- =====================================================
-- FUNCTION: Get User Wallet Balance (Latest)
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_wallet_balance(
  p_org_id UUID,
  p_user_id VARCHAR
)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT balance_after INTO v_balance
  FROM public.reward_wallet_ledger
  WHERE org_id = p_org_id AND user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_wallet_balance IS 'Returns the latest wallet balance for a user in an organization';

-- =====================================================
-- FUNCTION: Get Available Budget
-- =====================================================

CREATE OR REPLACE FUNCTION get_available_budget(
  p_program_id UUID,
  p_scope_type budget_scope_type,
  p_scope_ref_id VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_available INTEGER;
BEGIN
  SELECT (amount_limit - amount_used) INTO v_available
  FROM public.reward_budget_envelopes
  WHERE program_id = p_program_id
    AND scope_type = p_scope_type
    AND (p_scope_ref_id IS NULL OR scope_ref_id = p_scope_ref_id)
    AND NOW() BETWEEN starts_at AND ends_at
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_available, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_available_budget IS 'Returns available credits in the most recent active budget envelope';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON SCHEMA public IS 'Recognition & Rewards system migration 058 applied successfully';
