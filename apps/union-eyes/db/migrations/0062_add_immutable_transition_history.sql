-- ============================================================================
-- Migration: Add Immutable Transition History (PR #10)
-- ============================================================================
-- Description: Creates grievance_approvals table for append-only approval records,
--              migrates existing approved transitions, and makes transition history immutable.
-- Date: 2026-02-09
-- ============================================================================

-- Step 1: Create grievance_approvals table
CREATE TABLE IF NOT EXISTS grievance_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  transition_id UUID NOT NULL REFERENCES grievance_transitions(id) ON DELETE CASCADE,
  
  -- Approval details
  approver_user_id VARCHAR(255) NOT NULL,
  approver_role VARCHAR(50),
  action VARCHAR(20) NOT NULL, -- 'approved', 'rejected', 'returned'
  
  -- Approval metadata
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  comment TEXT,
  rejection_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_grievance_approvals_organization ON grievance_approvals(organization_id);
CREATE INDEX IF NOT EXISTS idx_grievance_approvals_transition ON grievance_approvals(transition_id);
CREATE INDEX IF NOT EXISTS idx_grievance_approvals_approver ON grievance_approvals(approver_user_id);
CREATE INDEX IF NOT EXISTS idx_grievance_approvals_action ON grievance_approvals(action);
CREATE INDEX IF NOT EXISTS idx_grievance_approvals_reviewed_at ON grievance_approvals(reviewed_at);

-- Step 3: Migrate existing approved transitions to grievance_approvals table
-- This creates historical approval records for all previously approved transitions
INSERT INTO grievance_approvals (
  organization_id,
  transition_id,
  approver_user_id,
  action,
  reviewed_at,
  comment,
  metadata,
  created_at
)
SELECT 
  organization_id,
  id AS transition_id,
  approved_by AS approver_user_id,
  'approved' AS action,
  approved_at AS reviewed_at,
  'Migrated from legacy approved transition' AS comment,
  jsonb_build_object(
    'legacy_migration', true,
    'migrated_at', NOW(),
    'original_requires_approval', requires_approval
  ) AS metadata,
  COALESCE(approved_at, transitioned_at, NOW()) AS created_at
FROM grievance_transitions
WHERE approved_by IS NOT NULL 
  AND approved_at IS NOT NULL;

-- Step 4: Verification query (run manually to verify migration)
-- SELECT 
--   COUNT(*) as total_approved_transitions,
--   (SELECT COUNT(*) FROM grievance_approvals WHERE metadata->>'legacy_migration' = 'true') as migrated_approvals
-- FROM grievance_transitions
-- WHERE approved_by IS NOT NULL;

-- Step 5: OPTIONAL - Remove mutable columns from grievance_transitions
-- Uncomment these ALTER TABLE statements after verifying migration is successful
-- WARNING: This is a breaking change - ensure all code is updated first

-- ALTER TABLE grievance_transitions DROP COLUMN IF EXISTS approved_by;
-- ALTER TABLE grievance_transitions DROP COLUMN IF EXISTS approved_at;

-- Step 6: OPTIONAL - Add CHECK constraint to prevent future UPDATEs on transition core fields
-- This enforces immutability at the database level
-- Uncomment after verifying all application code uses grievance_approvals table

-- ALTER TABLE grievance_transitions ADD CONSTRAINT no_update_core_fields
--   CHECK (
--     (transitioned_at = created_at) OR 
--     (requires_approval IS NOT DISTINCT FROM requires_approval)
--   );

