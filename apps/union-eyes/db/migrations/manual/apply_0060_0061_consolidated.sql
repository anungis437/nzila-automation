-- ============================================================================
-- CONSOLIDATED MIGRATION: Visibility Scopes + Defensibility Packs
-- Combines migrations 0060 and 0061 with idempotent checks
-- Can be safely re-run - includes IF NOT EXISTS and DO $$ checks
-- ============================================================================

-- ============================================================================
-- MIGRATION 0060: Visibility Scopes
-- ============================================================================

-- Create visibility_scope enum (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility_scope') THEN
        CREATE TYPE visibility_scope AS ENUM ('member', 'staff', 'admin', 'system');
        RAISE NOTICE 'Created visibility_scope enum';
    ELSE
        RAISE NOTICE 'visibility_scope enum already exists';
    END IF;
END $$;

-- Add visibility_scope column to claim_updates (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'claim_updates' AND column_name = 'visibility_scope'
    ) THEN
        ALTER TABLE claim_updates 
          ADD COLUMN visibility_scope visibility_scope DEFAULT 'member' NOT NULL;
        RAISE NOTICE 'Added visibility_scope to claim_updates';
    ELSE
        RAISE NOTICE 'visibility_scope column already exists in claim_updates';
    END IF;
END $$;

-- Add visibility_scope column to grievance_transitions (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grievance_transitions' AND column_name = 'visibility_scope'
    ) THEN
        ALTER TABLE grievance_transitions 
          ADD COLUMN visibility_scope visibility_scope DEFAULT 'staff' NOT NULL;
        RAISE NOTICE 'Added visibility_scope to grievance_transitions';
    ELSE
        RAISE NOTICE 'visibility_scope column already exists in grievance_transitions';
    END IF;
END $$;

-- Create indexes (if not exist)
CREATE INDEX IF NOT EXISTS idx_claim_updates_visibility ON claim_updates(claim_id, visibility_scope);
CREATE INDEX IF NOT EXISTS idx_grievance_transitions_visibility ON grievance_transitions(claim_id, visibility_scope);

-- Add comments
COMMENT ON TYPE visibility_scope IS 'Defines who can see an event: member (union member), staff (steward/officer), admin (union administrator), system (internal only)';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claim_updates' AND column_name = 'visibility_scope') THEN
        COMMENT ON COLUMN claim_updates.visibility_scope IS 'Visibility level: member sees status updates, staff sees process details';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grievance_transitions' AND column_name = 'visibility_scope') THEN
        COMMENT ON COLUMN grievance_transitions.visibility_scope IS 'Visibility level: staff and admin see workflow transitions, members see simplified status';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION 0061: Defensibility Packs
-- ============================================================================

-- Create defensibility_packs table (if not exists)
CREATE TABLE IF NOT EXISTS defensibility_packs (
  pack_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Case association
  case_id UUID NOT NULL,
  case_number VARCHAR(50) NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Pack metadata
  pack_version VARCHAR(10) NOT NULL DEFAULT '1.0.0',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by VARCHAR(255) NOT NULL,
  
  -- Export details
  export_format VARCHAR(10) NOT NULL,
  export_purpose VARCHAR(50) NOT NULL,
  requested_by VARCHAR(255),
  
  -- Pack content
  pack_data JSONB NOT NULL,
  
  -- Integrity verification
  integrity_hash VARCHAR(64) NOT NULL,
  timeline_hash VARCHAR(64) NOT NULL,
  audit_hash VARCHAR(64) NOT NULL,
  state_transition_hash VARCHAR(64) NOT NULL,
  
  -- Verification status
  verification_status VARCHAR(20) NOT NULL DEFAULT 'verified',
  last_verified_at TIMESTAMPTZ,
  verification_attempts INTEGER DEFAULT 0,
  
  -- Download tracking
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  last_downloaded_by VARCHAR(255),
  
  -- Storage metadata
  file_size_bytes INTEGER,
  storage_location TEXT,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by VARCHAR(255),
  deletion_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pack_download_log table (if not exists)
CREATE TABLE IF NOT EXISTS pack_download_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  pack_id UUID NOT NULL,
  case_number VARCHAR(50) NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Download details
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  downloaded_by VARCHAR(255) NOT NULL,
  downloaded_by_role VARCHAR(50),
  
  -- Access context
  download_purpose VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- File details
  export_format VARCHAR(10) NOT NULL,
  file_size_bytes INTEGER,
  integrity_verified BOOLEAN DEFAULT true,
  
  -- Success tracking
  download_success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- Create pack_verification_log table (if not exists)
CREATE TABLE IF NOT EXISTS pack_verification_log (
  verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  pack_id UUID NOT NULL,
  case_number VARCHAR(50) NOT NULL,
  
  -- Verification details
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_by VARCHAR(255),
  
  -- Results
  verification_passed BOOLEAN NOT NULL,
  expected_hash VARCHAR(64) NOT NULL,
  actual_hash VARCHAR(64),
  
  -- Failure details
  failure_reason TEXT,
  tampered_fields JSONB,
  
  -- Context
  verification_trigger VARCHAR(50)
);

-- Create indexes (if not exist)
CREATE INDEX IF NOT EXISTS idx_defensibility_packs_case_id ON defensibility_packs(case_id);
CREATE INDEX IF NOT EXISTS idx_defensibility_packs_case_number ON defensibility_packs(case_number);
CREATE INDEX IF NOT EXISTS idx_defensibility_packs_org_id ON defensibility_packs(organization_id);
CREATE INDEX IF NOT EXISTS idx_defensibility_packs_generated_at ON defensibility_packs(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_defensibility_packs_integrity_hash ON defensibility_packs(integrity_hash);
CREATE INDEX IF NOT EXISTS idx_defensibility_packs_verification_status ON defensibility_packs(verification_status);

CREATE INDEX IF NOT EXISTS idx_pack_download_log_pack_id ON pack_download_log(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_download_log_case_number ON pack_download_log(case_number);
CREATE INDEX IF NOT EXISTS idx_pack_download_log_downloaded_at ON pack_download_log(downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_pack_download_log_downloaded_by ON pack_download_log(downloaded_by);

CREATE INDEX IF NOT EXISTS idx_pack_verification_log_pack_id ON pack_verification_log(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_verification_log_passed ON pack_verification_log(verification_passed);
CREATE INDEX IF NOT EXISTS idx_pack_verification_log_verified_at ON pack_verification_log(verified_at DESC);

-- Add comments
COMMENT ON TABLE defensibility_packs IS 'System-of-record exports with SHA-256 integrity for arbitration proceedings, legal defense, and institutional accountability. Philosophy: "If it''s not in UnionEyes, it didn''t happen"';
COMMENT ON COLUMN defensibility_packs.pack_data IS 'Full DefensibilityPack structure from lib/services/defensibility-pack.ts, includes timeline, audit trail, state transitions, signals, SLA compliance';
COMMENT ON COLUMN defensibility_packs.integrity_hash IS 'SHA-256 combined hash of all pack components - tamper detection';
COMMENT ON COLUMN defensibility_packs.verification_status IS 'verified = hash matches, tampered = hash mismatch, unverified = not yet checked';
COMMENT ON TABLE pack_download_log IS 'Audit trail of every pack access - who downloaded what, when, and why';
COMMENT ON TABLE pack_verification_log IS 'Integrity check history - tracks verification attempts and tamper detection';

-- Enable RLS (if not already enabled)
DO $$ 
BEGIN
    ALTER TABLE defensibility_packs ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE pack_download_log ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE pack_verification_log ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create RLS policies (if not exist)
DO $$ 
BEGIN
    CREATE POLICY admin_view_all_packs ON defensibility_packs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = current_setting('app.user_id')::TEXT
          AND profiles.role = 'admin'
        )
      );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE POLICY staff_view_org_packs ON defensibility_packs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = current_setting('app.user_id')::TEXT
          AND (profiles.role = 'steward' OR profiles.role = 'staff')
          AND profiles.union_id = defensibility_packs.organization_id
        )
      );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE POLICY member_view_own_packs ON defensibility_packs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM claims
          JOIN profiles ON profiles.profile_id = claims.member_id
          WHERE claims.claim_id = defensibility_packs.case_id
          AND profiles.user_id = current_setting('app.user_id')::TEXT
        )
      );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE POLICY system_insert_packs ON defensibility_packs
      FOR INSERT
      WITH CHECK (generated_by = 'system' OR generated_by = current_setting('app.user_id')::TEXT);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE POLICY admin_view_all_downloads ON pack_download_log
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = current_setting('app.user_id')::TEXT
          AND profiles.role = 'admin'
        )
      );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE POLICY staff_view_org_downloads ON pack_download_log
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = current_setting('app.user_id')::TEXT
          AND (profiles.role = 'steward' OR profiles.role = 'staff')
          AND profiles.union_id = pack_download_log.organization_id
        )
      );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE POLICY user_view_own_downloads ON pack_download_log
      FOR SELECT
      USING (downloaded_by = current_setting('app.user_id')::TEXT);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE POLICY admin_view_all_verifications ON pack_verification_log
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = current_setting('app.user_id')::TEXT
          AND profiles.role = 'admin'
        )
      );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE POLICY staff_view_verifications ON pack_verification_log
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM defensibility_packs dp
          JOIN profiles ON profiles.union_id = dp.organization_id
          WHERE dp.pack_id = pack_verification_log.pack_id
          AND profiles.user_id = current_setting('app.user_id')::TEXT
          AND (profiles.role = 'steward' OR profiles.role = 'staff')
        )
      );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_defensibility_packs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (if not exists)
DO $$ 
BEGIN
    CREATE TRIGGER trigger_update_defensibility_packs_updated_at
      BEFORE UPDATE ON defensibility_packs
      FOR EACH ROW
      EXECUTE FUNCTION update_defensibility_packs_updated_at();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- Migration Complete - Summary
-- ============================================================================

DO $$
DECLARE
    visibility_exists BOOLEAN;
    dp_exists BOOLEAN;
    dl_exists BOOLEAN;
    vl_exists BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility_scope') INTO visibility_exists;
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'defensibility_packs') INTO dp_exists;
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'pack_download_log') INTO dl_exists;
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'pack_verification_log') INTO vl_exists;
    
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'MIGRATION STATUS';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '0060 - Visibility Scopes:        %', CASE WHEN visibility_exists THEN '✓ APPLIED' ELSE '✗ FAILED' END;
    RAISE NOTICE '0061 - Defensibility Packs:      %', CASE WHEN dp_exists AND dl_exists AND vl_exists THEN '✓ APPLIED' ELSE '✗ FAILED' END;
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    IF dp_exists THEN RAISE NOTICE '  ✓ defensibility_packs'; END IF;
    IF dl_exists THEN RAISE NOTICE '  ✓ pack_download_log'; END IF;
    IF vl_exists THEN RAISE NOTICE '  ✓ pack_verification_log'; END IF;
    RAISE NOTICE '=============================================================================';
END $$;
