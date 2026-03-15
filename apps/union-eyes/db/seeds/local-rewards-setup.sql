-- Create reward tables for local dev
-- Run against local DB: localhost:5433/nzila_automation
BEGIN;

-- Enum types
DO $$ BEGIN CREATE TYPE program_status AS ENUM ('draft','active','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE award_kind AS ENUM ('milestone','peer','admin','automated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE award_status AS ENUM ('pending','approved','issued','rejected','revoked'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE wallet_event_type AS ENUM ('earn','spend','expire','revoke','adjust','refund'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE wallet_source_type AS ENUM ('award','redemption','admin_adjustment','system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE budget_scope_type AS ENUM ('org','local','department','manager'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE budget_period AS ENUM ('monthly','quarterly','annual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE redemption_status AS ENUM ('initiated','pending_payment','ordered','fulfilled','cancelled','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE redemption_provider AS ENUM ('shopify'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE webhook_provider AS ENUM ('shopify'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- recognition_programs
CREATE TABLE IF NOT EXISTS recognition_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status program_status NOT NULL DEFAULT 'draft',
  currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS recognition_programs_org_id_idx ON recognition_programs(org_id);

-- recognition_award_types
CREATE TABLE IF NOT EXISTS recognition_award_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES recognition_programs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  kind award_kind NOT NULL,
  default_credit_amount INTEGER NOT NULL CHECK (default_credit_amount > 0),
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  rules_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS recognition_award_types_org_id_idx ON recognition_award_types(org_id);
CREATE INDEX IF NOT EXISTS recognition_award_types_program_id_idx ON recognition_award_types(program_id);

-- recognition_awards
CREATE TABLE IF NOT EXISTS recognition_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES recognition_programs(id) ON DELETE CASCADE,
  award_type_id UUID NOT NULL REFERENCES recognition_award_types(id) ON DELETE RESTRICT,
  recipient_user_id VARCHAR(255) NOT NULL,
  issuer_user_id VARCHAR(255),
  reason TEXT NOT NULL,
  status award_status NOT NULL DEFAULT 'pending',
  approved_by_user_id VARCHAR(255),
  approved_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS recognition_awards_org_id_idx ON recognition_awards(org_id);
CREATE INDEX IF NOT EXISTS recognition_awards_program_id_idx ON recognition_awards(program_id);
CREATE INDEX IF NOT EXISTS recognition_awards_recipient_user_id_idx ON recognition_awards(recipient_user_id);
CREATE INDEX IF NOT EXISTS recognition_awards_status_idx ON recognition_awards(status);

-- reward_wallet_ledger
CREATE TABLE IF NOT EXISTS reward_wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  event_type wallet_event_type NOT NULL,
  amount_credits INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  source_type wallet_source_type NOT NULL,
  source_id UUID,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reward_wallet_ledger_org_user_idx ON reward_wallet_ledger(org_id, user_id);
CREATE INDEX IF NOT EXISTS reward_wallet_ledger_user_created_idx ON reward_wallet_ledger(user_id, created_at);

-- reward_budget_envelopes
CREATE TABLE IF NOT EXISTS reward_budget_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES recognition_programs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  scope_type budget_scope_type NOT NULL,
  scope_ref_id VARCHAR(255),
  period budget_period NOT NULL,
  amount_limit INTEGER NOT NULL CHECK (amount_limit > 0),
  amount_used INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (amount_used >= 0 AND amount_used <= amount_limit),
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS reward_budget_envelopes_org_id_idx ON reward_budget_envelopes(org_id);
CREATE INDEX IF NOT EXISTS reward_budget_envelopes_program_id_idx ON reward_budget_envelopes(program_id);

-- reward_redemptions
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  program_id UUID NOT NULL REFERENCES recognition_programs(id) ON DELETE RESTRICT,
  credits_spent INTEGER NOT NULL CHECK (credits_spent > 0),
  status redemption_status NOT NULL DEFAULT 'initiated',
  provider redemption_provider NOT NULL,
  provider_order_id VARCHAR(255),
  provider_checkout_id VARCHAR(255),
  provider_payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reward_redemptions_org_id_idx ON reward_redemptions(org_id);
CREATE INDEX IF NOT EXISTS reward_redemptions_user_id_idx ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS reward_redemptions_provider_order_idx ON reward_redemptions(provider_order_id);

-- shopify_config
CREATE TABLE IF NOT EXISTS shopify_config (
  org_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  shop_domain VARCHAR(255) NOT NULL,
  storefront_token_secret_ref VARCHAR(255) NOT NULL,
  admin_token_secret_ref VARCHAR(255),
  allowed_collections JSONB NOT NULL DEFAULT '[]'::jsonb,
  webhook_secret_ref VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- webhook_receipts
CREATE TABLE IF NOT EXISTS webhook_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider webhook_provider NOT NULL,
  webhook_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  payload_json JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS webhook_receipts_provider_webhook_idx ON webhook_receipts(provider, webhook_id);

-- automation_rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  award_type_id UUID REFERENCES recognition_award_types(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;

-- Now insert seed data
BEGIN;

-- Get org ID from local DB
DO $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'No organizations found, skipping seed data';
    RETURN;
  END IF;

  -- Programs
  INSERT INTO recognition_programs (id, org_id, name, description, status, currency) VALUES
    ('a1000001-0001-4000-8000-000000000001', v_org_id, 'Peer Recognition', 'Peer-to-peer recognition for team contributions', 'active', 'CAD'),
    ('a1000001-0002-4000-8000-000000000002', v_org_id, 'Safety Excellence', 'Awards for outstanding safety practices', 'active', 'CAD'),
    ('a1000001-0003-4000-8000-000000000003', v_org_id, 'Innovation Awards', 'Recognizing innovative ideas and implementations', 'draft', 'CAD')
  ON CONFLICT (id) DO NOTHING;

  -- Award Types
  INSERT INTO recognition_award_types (id, org_id, program_id, name, kind, default_credit_amount, requires_approval) VALUES
    ('a2000001-0001-4000-8000-000000000001', v_org_id, 'a1000001-0001-4000-8000-000000000001', 'Team Player', 'peer', 50, false),
    ('a2000001-0002-4000-8000-000000000001', v_org_id, 'a1000001-0001-4000-8000-000000000001', 'Above & Beyond', 'peer', 100, true),
    ('a2000001-0003-4000-8000-000000000001', v_org_id, 'a1000001-0002-4000-8000-000000000002', 'Safety Champion', 'admin', 200, true),
    ('a2000001-0004-4000-8000-000000000001', v_org_id, 'a1000001-0001-4000-8000-000000000001', 'Work Anniversary', 'milestone', 150, false)
  ON CONFLICT (id) DO NOTHING;

  -- Awards
  INSERT INTO recognition_awards (id, org_id, program_id, award_type_id, recipient_user_id, issuer_user_id, reason, status, approved_at, issued_at) VALUES
    ('a3000001-0001-4000-8000-000000000001', v_org_id, 'a1000001-0001-4000-8000-000000000001', 'a2000001-0001-4000-8000-000000000001', 'user_3A2c7IXYOHgNMiIdOte7C5MEwFd', 'user_3A2c7Rsg6612F3BAxHxx5L29jRH', 'Great collaboration on Q1 project', 'issued', NOW()-interval '60 days', NOW()-interval '59 days'),
    ('a3000001-0002-4000-8000-000000000001', v_org_id, 'a1000001-0001-4000-8000-000000000001', 'a2000001-0002-4000-8000-000000000001', 'user_3A2c7Rsg6612F3BAxHxx5L29jRH', 'user_3A2c7IXYOHgNMiIdOte7C5MEwFd', 'Exceptional work on platform migration', 'approved', NOW()-interval '15 days', NULL),
    ('a3000001-0003-4000-8000-000000000001', v_org_id, 'a1000001-0002-4000-8000-000000000002', 'a2000001-0003-4000-8000-000000000001', 'user_3A2c7IXYOHgNMiIdOte7C5MEwFd', NULL, 'Zero incidents for 6 consecutive months', 'pending', NULL, NULL),
    ('a3000001-0004-4000-8000-000000000001', v_org_id, 'a1000001-0001-4000-8000-000000000001', 'a2000001-0004-4000-8000-000000000001', 'user_3A2c7Rsg6612F3BAxHxx5L29jRH', NULL, '5-year work anniversary milestone', 'issued', NOW()-interval '30 days', NOW()-interval '30 days'),
    ('a3000001-0005-4000-8000-000000000001', v_org_id, 'a1000001-0001-4000-8000-000000000001', 'a2000001-0001-4000-8000-000000000001', 'user_3A2c7Rsg6612F3BAxHxx5L29jRH', 'user_3A2c7IXYOHgNMiIdOte7C5MEwFd', 'Mentoring new team members', 'pending', NULL, NULL)
  ON CONFLICT (id) DO NOTHING;

  -- Budget Envelopes
  INSERT INTO reward_budget_envelopes (id, org_id, program_id, name, scope_type, period, amount_limit, amount_used, starts_at, ends_at) VALUES
    ('a4000001-0001-4000-8000-000000000001', v_org_id, 'a1000001-0001-4000-8000-000000000001', 'Q1 2026 Peer Recognition', 'org', 'quarterly', 5000, 1250, '2026-01-01', '2026-03-31'),
    ('a4000001-0002-4000-8000-000000000001', v_org_id, 'a1000001-0002-4000-8000-000000000002', 'Annual Safety Budget', 'org', 'annual', 10000, 2400, '2026-01-01', '2026-12-31')
  ON CONFLICT (id) DO NOTHING;

  -- Wallet Ledger
  INSERT INTO reward_wallet_ledger (id, org_id, user_id, event_type, amount_credits, balance_after, source_type, source_id, memo) VALUES
    ('a5000001-0001-4000-8000-000000000001', v_org_id, 'user_3A2c7IXYOHgNMiIdOte7C5MEwFd', 'earn', 50, 50, 'award', 'a3000001-0001-4000-8000-000000000001', 'Team Player award from peer'),
    ('a5000001-0002-4000-8000-000000000001', v_org_id, 'user_3A2c7Rsg6612F3BAxHxx5L29jRH', 'earn', 150, 150, 'award', 'a3000001-0004-4000-8000-000000000001', '5-year anniversary award')
  ON CONFLICT (id) DO NOTHING;

END $$;

COMMIT;
