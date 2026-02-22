-- ============================================================================
-- Migration: Add Defensibility Packs Infrastructure
-- PR-12: Complete Defensibility Pack Integration
-- Description: System-of-record exports with cryptographic integrity for arbitration
-- Created: 2025-01-11
-- ============================================================================

-- ============================================================================
-- PART 1: Main Table - Defensibility Packs
-- ============================================================================

CREATE TABLE defensibility_packs (
  pack_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Case association
  case_id UUID NOT NULL, -- References claims.claim_id
  case_number VARCHAR(50) NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Pack metadata
  pack_version VARCHAR(10) NOT NULL DEFAULT '1.0.0',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by VARCHAR(255) NOT NULL,
  
  -- Export details
  export_format VARCHAR(10) NOT NULL, -- 'json' | 'pdf' | 'zip'
  export_purpose VARCHAR(50) NOT NULL, -- 'arbitration' | 'legal_defense' | 'audit' | 'member_request'
  requested_by VARCHAR(255), -- User who requested export (if manual)
  
  -- Pack content (stored as JSONB for queryability)
  pack_data JSONB NOT NULL,
  
  -- Integrity verification
  integrity_hash VARCHAR(64) NOT NULL, -- SHA-256 combined hash
  timeline_hash VARCHAR(64) NOT NULL,
  audit_hash VARCHAR(64) NOT NULL,
  state_transition_hash VARCHAR(64) NOT NULL,
  
  -- Verification status
  verification_status VARCHAR(20) NOT NULL DEFAULT 'verified', -- 'verified' | 'tampered' | 'unverified'
  last_verified_at TIMESTAMPTZ,
  verification_attempts INTEGER DEFAULT 0,
  
  -- Download tracking
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  last_downloaded_by VARCHAR(255),
  
  -- Storage metadata
  file_size_bytes INTEGER,
  storage_location TEXT, -- For future cloud storage integration
  
  -- Soft delete (packs should never be truly deleted - institutional dependency)
  deleted_at TIMESTAMPTZ,
  deleted_by VARCHAR(255),
  deletion_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 2: Download Log Table
-- ============================================================================

CREATE TABLE pack_download_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  pack_id UUID NOT NULL, -- References defensibility_packs.pack_id
  case_number VARCHAR(50) NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Download details
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  downloaded_by VARCHAR(255) NOT NULL,
  downloaded_by_role VARCHAR(50), -- 'admin' | 'steward' | 'member'
  
  -- Access context
  download_purpose VARCHAR(100), -- 'review' | 'arbitration' | 'legal' | 'member_request'
  ip_address VARCHAR(45), -- IPv4 or IPv6
  user_agent TEXT,
  
  -- File details at time of download
  export_format VARCHAR(10) NOT NULL,
  file_size_bytes INTEGER,
  integrity_verified BOOLEAN DEFAULT true,
  
  -- Download success
  download_success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- ============================================================================
-- PART 3: Verification Log Table
-- ============================================================================

CREATE TABLE pack_verification_log (
  verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  pack_id UUID NOT NULL,
  case_number VARCHAR(50) NOT NULL,
  
  -- Verification details
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_by VARCHAR(255), -- User or 'system' for auto-checks
  
  -- Verification results
  verification_passed BOOLEAN NOT NULL,
  expected_hash VARCHAR(64) NOT NULL,
  actual_hash VARCHAR(64),
  
  -- Failure details
  failure_reason TEXT,
  tampered_fields JSONB, -- Array of field paths that failed verification
  
  -- Context
  verification_trigger VARCHAR(50) -- 'download' | 'scheduled' | 'manual' | 'alert'
);

-- ============================================================================
-- PART 4: Indexes for Query Performance
-- ============================================================================

-- Defensibility packs indexes
CREATE INDEX IF NOT EXISTS idx_defensibility_packs_case_id ON defensibility_packs(case_id);
CREATE INDEX IF NOT EXISTS idx_defensibility_packs_case_number ON defensibility_packs(case_number);
CREATE INDEX IF NOT EXISTS idx_defensibility_packs_org_id ON defensibility_packs(organization_id);
CREATE INDEX IF NOT EXISTS idx_defensibility_packs_generated_at ON defensibility_packs(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_defensibility_packs_integrity_hash ON defensibility_packs(integrity_hash);
CREATE INDEX IF NOT EXISTS idx_defensibility_packs_verification_status ON defensibility_packs(verification_status);

-- Download log indexes
CREATE INDEX IF NOT EXISTS idx_pack_download_log_pack_id ON pack_download_log(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_download_log_case_number ON pack_download_log(case_number);
CREATE INDEX IF NOT EXISTS idx_pack_download_log_downloaded_at ON pack_download_log(downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_pack_download_log_downloaded_by ON pack_download_log(downloaded_by);

-- Verification log indexes
CREATE INDEX IF NOT EXISTS idx_pack_verification_log_pack_id ON pack_verification_log(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_verification_log_passed ON pack_verification_log(verification_passed);
CREATE INDEX IF NOT EXISTS idx_pack_verification_log_verified_at ON pack_verification_log(verified_at DESC);

-- ============================================================================
-- PART 5: Comments for Documentation
-- ============================================================================

COMMENT ON TABLE defensibility_packs IS 'System-of-record exports with SHA-256 integrity for arbitration proceedings, legal defense, and institutional accountability. Philosophy: "If it''s not in UnionEyes, it didn''t happen"';

COMMENT ON COLUMN defensibility_packs.pack_data IS 'Full DefensibilityPack structure from lib/services/defensibility-pack.ts, includes timeline, audit trail, state transitions, signals, SLA compliance';

COMMENT ON COLUMN defensibility_packs.integrity_hash IS 'SHA-256 combined hash of all pack components - tamper detection';

COMMENT ON COLUMN defensibility_packs.verification_status IS 'verified = hash matches, tampered = hash mismatch, unverified = not yet checked';

COMMENT ON TABLE pack_download_log IS 'Audit trail of every pack access - who downloaded what, when, and why';

COMMENT ON TABLE pack_verification_log IS 'Integrity check history - tracks verification attempts and tamper detection';

-- ============================================================================
-- PART 6: Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on defensibility packs table
ALTER TABLE defensibility_packs ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can see all packs
CREATE POLICY admin_view_all_packs ON defensibility_packs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = current_setting('app.user_id')::TEXT
      AND profiles.role = 'admin'
    )
  );

-- Policy: Staff/Stewards can see packs for their organization
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

-- Policy: Members can see packs for their own cases
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

-- Policy: System can insert packs (auto-generation)
CREATE POLICY system_insert_packs ON defensibility_packs
  FOR INSERT
  WITH CHECK (generated_by = 'system' OR generated_by = current_setting('app.user_id')::TEXT);

-- Enable RLS on download log
ALTER TABLE pack_download_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can see all download logs
CREATE POLICY admin_view_all_downloads ON pack_download_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = current_setting('app.user_id')::TEXT
      AND profiles.role = 'admin'
    )
  );

-- Policy: Staff can see download logs for their organization
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

-- Policy: Users can see their own downloads
CREATE POLICY user_view_own_downloads ON pack_download_log
  FOR SELECT
  USING (downloaded_by = current_setting('app.user_id')::TEXT);

-- Enable RLS on verification log
ALTER TABLE pack_verification_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can see all verification logs
CREATE POLICY admin_view_all_verifications ON pack_verification_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = current_setting('app.user_id')::TEXT
      AND profiles.role = 'admin'
    )
  );

-- Policy: Staff can see verification logs via pack association
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

-- ============================================================================
-- PART 7: Triggers
-- ============================================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_defensibility_packs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_defensibility_packs_updated_at
  BEFORE UPDATE ON defensibility_packs
  FOR EACH ROW
  EXECUTE FUNCTION update_defensibility_packs_updated_at();

-- ============================================================================
-- Migration Complete
-- ============================================================================
