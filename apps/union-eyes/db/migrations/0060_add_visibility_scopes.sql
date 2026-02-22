-- ============================================================================
-- Migration: Add Visibility Scopes for Dual-Surface Enforcement
-- PR-4: Visibility Scopes (dual-surface enforcement)
-- Description: Same events, different views - members see status, LROs see process
-- Created: 2025-01-11
-- ============================================================================

-- Create visibility_scope enum
CREATE TYPE visibility_scope AS ENUM ('member', 'staff', 'admin', 'system');

-- Add visibility_scope to claim_updates table
ALTER TABLE claim_updates 
  ADD COLUMN visibility_scope visibility_scope DEFAULT 'member' NOT NULL;

-- Add visibility_scope to grievance_transitions table
ALTER TABLE grievance_transitions 
  ADD COLUMN visibility_scope visibility_scope DEFAULT 'staff' NOT NULL;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_claim_updates_visibility ON claim_updates(claim_id, visibility_scope);
CREATE INDEX IF NOT EXISTS idx_grievance_transitions_visibility ON grievance_transitions(claim_id, visibility_scope);

-- Add comments for documentation
COMMENT ON TYPE visibility_scope IS 'Defines who can see an event: member (union member), staff (steward/officer), admin (union administrator), system (internal only)';
COMMENT ON COLUMN claim_updates.visibility_scope IS 'Visibility level: member sees status updates, staff sees process details';
COMMENT ON COLUMN grievance_transitions.visibility_scope IS 'Visibility level: staff and admin see workflow transitions, members see simplified status';
