-- Migration: Add Encrypted PII Fields
-- Description: Adds encrypted columns for Social Insurance Numbers (SIN), 
--              Social Security Numbers (SSN), and bank account details
-- Date: 2026-02-06
-- Related: lib/encryption.ts, docs/ENCRYPTION_GUIDE.md

-- ============================================================================
-- PART 1: ADD ENCRYPTED COLUMNS TO users TABLE
-- ============================================================================

-- Add encrypted PII columns to user_management.users table
ALTER TABLE user_management.users
ADD COLUMN IF NOT EXISTS encrypted_sin TEXT,
ADD COLUMN IF NOT EXISTS encrypted_ssn TEXT,
ADD COLUMN IF NOT EXISTS encrypted_bank_account TEXT;

-- Add column comments for documentation
COMMENT ON COLUMN user_management.users.encrypted_sin IS 
  'Encrypted Social Insurance Number (Canada) using AES-256-GCM. 
   Decrypt only for official purposes (T4A tax documents, CRA requests).
   See lib/encryption.ts for encryption/decryption utilities.';

COMMENT ON COLUMN user_management.users.encrypted_ssn IS 
  'Encrypted Social Security Number (USA) using AES-256-GCM.
   Used for cross-border union members or US-based operations.
   See lib/encryption.ts for encryption/decryption utilities.';

COMMENT ON COLUMN user_management.users.encrypted_bank_account IS 
  'Encrypted bank account details using AES-256-GCM.
   Used for direct deposit, strike fund disbursements.
   See lib/encryption.ts for encryption/decryption utilities.';

-- ============================================================================
-- PART 2: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for encrypted SIN lookups (for audit trail and compliance queries)
-- Note: This indexes the encrypted ciphertext, not plaintext
CREATE INDEX IF NOT EXISTS idx_users_encrypted_sin 
ON user_management.users(encrypted_sin) 
WHERE encrypted_sin IS NOT NULL;

-- Index for encrypted SSN lookups
CREATE INDEX IF NOT EXISTS idx_users_encrypted_ssn 
ON user_management.users(encrypted_ssn) 
WHERE encrypted_ssn IS NOT NULL;

-- Index for encrypted bank account lookups
CREATE INDEX IF NOT EXISTS idx_users_encrypted_bank_account 
ON user_management.users(encrypted_bank_account) 
WHERE encrypted_bank_account IS NOT NULL;

-- ============================================================================
-- PART 3: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Note: The users table should already have RLS enabled
-- Add additional policy for encrypted PII access

-- Only allow users to see their own encrypted PII
CREATE POLICY IF NOT EXISTS users_encrypted_pii_owner_access 
ON user_management.users
FOR SELECT
USING (
  auth.uid()::text = user_id::text
  OR 
  -- System admins can access (for tax document generation, etc.)
  is_system_admin = true
);

-- Allow updates to encrypted PII only by owner or admin
CREATE POLICY IF NOT EXISTS users_encrypted_pii_owner_update 
ON user_management.users
FOR UPDATE
USING (
  auth.uid()::text = user_id::text
  OR 
  is_system_admin = true
);

-- ============================================================================
-- PART 4: AUDIT TABLE FOR PII ACCESS
-- ============================================================================

-- Create audit table for tracking PII decryption events
CREATE TABLE IF NOT EXISTS user_management.pii_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_management.users(user_id),
  accessed_by UUID NOT NULL, -- User who accessed the PII
  access_type VARCHAR(50) NOT NULL, -- 'decrypt_sin', 'decrypt_ssn', 'decrypt_bank_account'
  access_reason VARCHAR(200), -- 't4a_generation', 'rl1_generation', 'audit_request', etc.
  access_metadata JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  user_agent TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Compliance fields
  purpose VARCHAR(200), -- Business purpose for access
  authorized_by UUID, -- Manager/admin who authorized access
  retention_until TIMESTAMPTZ -- When to delete this audit record
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_pii_access_audit_user_id 
ON user_management.pii_access_audit(user_id);

CREATE INDEX IF NOT EXISTS idx_pii_access_audit_accessed_by 
ON user_management.pii_access_audit(accessed_by);

CREATE INDEX IF NOT EXISTS idx_pii_access_audit_accessed_at 
ON user_management.pii_access_audit(accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_pii_access_audit_access_type 
ON user_management.pii_access_audit(access_type);

-- Add comment
COMMENT ON TABLE user_management.pii_access_audit IS 
  'Audit trail for all PII decryption events. Required for PIPEDA and GDPR compliance.
   Logs when encrypted SIN/SSN/bank account data is decrypted for viewing.
   Retention: 7 years per CRA requirements.';

-- ============================================================================
-- PART 5: HELPER FUNCTION FOR AUDIT LOGGING
-- ============================================================================

-- Function to log PII access (called from application layer)
CREATE OR REPLACE FUNCTION user_management.log_pii_access(
  p_user_id UUID,
  p_accessed_by UUID,
  p_access_type VARCHAR(50),
  p_access_reason VARCHAR(200),
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO user_management.pii_access_audit (
    user_id,
    accessed_by,
    access_type,
    access_reason,
    access_metadata,
    accessed_at
  ) VALUES (
    p_user_id,
    p_accessed_by,
    p_access_type,
    p_access_reason,
    p_metadata,
    NOW()
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION user_management.log_pii_access TO PUBLIC;

-- Add comment
COMMENT ON FUNCTION user_management.log_pii_access IS 
  'Logs PII access events for compliance audit trail.
   Call this function whenever encrypted PII is decrypted.
   Example: SELECT user_management.log_pii_access(
     user_id, accessed_by, ''decrypt_sin'', ''t4a_generation''
   );';

-- ============================================================================
-- PART 6: RETENTION POLICY FOR AUDIT LOGS
-- ============================================================================

-- Function to clean up old audit logs (run monthly via cron)
CREATE OR REPLACE FUNCTION user_management.cleanup_old_pii_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete audit logs older than 7 years (CRA requirement)
  DELETE FROM user_management.pii_access_audit
  WHERE accessed_at < NOW() - INTERVAL '7 years'
  OR (retention_until IS NOT NULL AND retention_until < NOW());
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION user_management.cleanup_old_pii_audit_logs IS 
  'Deletes PII access audit logs older than 7 years.
   Run monthly: SELECT user_management.cleanup_old_pii_audit_logs();
   Returns number of records deleted.';

-- ============================================================================
-- PART 7: VERIFICATION QUERIES
-- ============================================================================

-- Verify columns were added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'user_management'
      AND table_name = 'users' 
      AND column_name IN ('encrypted_sin', 'encrypted_ssn', 'encrypted_bank_account')
  ) THEN
    RAISE NOTICE '✅ Encrypted PII columns added successfully to user_management.users';
  ELSE
    RAISE EXCEPTION '❌ Failed to add encrypted PII columns';
  END IF;
  
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'user_management'
      AND table_name = 'pii_access_audit'
  ) THEN
    RAISE NOTICE '✅ PII access audit table created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create PII access audit table';
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of changes:
-- 1. Added encrypted_sin, encrypted_ssn, encrypted_bank_account columns to users table
-- 2. Created indexes for performance
-- 3. Added RLS policies for PII access control
-- 4. Created pii_access_audit table for compliance tracking
-- 5. Added helper functions for audit logging and cleanup
-- 6. All changes are idempotent (IF NOT EXISTS checks)

-- Next steps:
-- 1. Run data migration script: pnpm tsx scripts/migrate-sin-to-encrypted.ts
-- 2. Update application code to use lib/encryption.ts utilities
-- 3. Test encryption/decryption with sample data
-- 4. Configure Azure Key Vault for production
-- 5. Review audit logs regularly for compliance

-- For rollback (if needed):
-- ALTER TABLE user_management.users DROP COLUMN IF EXISTS encrypted_sin CASCADE;
-- ALTER TABLE user_management.users DROP COLUMN IF EXISTS encrypted_ssn CASCADE;
-- ALTER TABLE user_management.users DROP COLUMN IF EXISTS encrypted_bank_account CASCADE;
-- DROP TABLE IF EXISTS user_management.pii_access_audit CASCADE;
-- DROP FUNCTION IF EXISTS user_management.log_pii_access CASCADE;
-- DROP FUNCTION IF EXISTS user_management.cleanup_old_pii_audit_logs CASCADE;
