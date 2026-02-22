-- ============================================================================
-- PR #12: Add Database Immutability Constraints
-- ============================================================================
-- Description: Prevent modification of historical records to ensure audit trail
--              integrity and enforce append-only patterns for critical tables
-- Created: 2026-02-09
-- ============================================================================

-- ============================================================================
-- IMMUTABILITY TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION reject_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Record is immutable: modifications not allowed on table %', TG_TABLE_NAME
    USING HINT = 'This table uses append-only pattern for audit compliance',
          ERRCODE = '23502';  -- not_null_violation (repurposed for immutability)
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reject_mutation() IS 'Trigger function to prevent UPDATE/DELETE on immutable tables';

-- ============================================================================
-- GRIEVANCE TRANSITIONS - Prevent modification of historical transitions
-- ============================================================================

CREATE TRIGGER prevent_transition_updates
BEFORE UPDATE ON grievance_transitions
FOR EACH ROW
EXECUTE FUNCTION reject_mutation();

CREATE TRIGGER prevent_transition_deletions
BEFORE DELETE ON grievance_transitions
FOR EACH ROW
EXECUTE FUNCTION reject_mutation();

COMMENT ON TRIGGER prevent_transition_updates ON grievance_transitions IS
  'PR #12: Enforce immutability - transitions are historical records';
COMMENT ON TRIGGER prevent_transition_deletions ON grievance_transitions IS
  'PR #12: Enforce immutability - transitions cannot be deleted';

-- ============================================================================
-- GRIEVANCE APPROVALS - Prevent modification of approval records
-- ============================================================================

CREATE TRIGGER prevent_approval_updates
BEFORE UPDATE ON grievance_approvals
FOR EACH ROW
EXECUTE FUNCTION reject_mutation();

CREATE TRIGGER prevent_approval_deletions
BEFORE DELETE ON grievance_approvals
FOR EACH ROW
EXECUTE FUNCTION reject_mutation();

COMMENT ON TRIGGER prevent_approval_updates ON grievance_approvals IS
  'PR #12: Enforce immutability - approvals are permanent records';
COMMENT ON TRIGGER prevent_approval_deletions ON grievance_approvals IS
  'PR #12: Enforce immutability - approvals cannot be deleted';

-- ============================================================================
-- CLAIM UPDATES - Prevent modification of claim update history
-- ============================================================================

CREATE TRIGGER prevent_claim_update_modifications
BEFORE UPDATE ON claim_updates
FOR EACH ROW
EXECUTE FUNCTION reject_mutation();

CREATE TRIGGER prevent_claim_update_deletions
BEFORE DELETE ON claim_updates
FOR EACH ROW
EXECUTE FUNCTION reject_mutation();

COMMENT ON TRIGGER prevent_claim_update_modifications ON claim_updates IS
  'PR #12: Enforce immutability - claim updates are historical records';
COMMENT ON TRIGGER prevent_claim_update_deletions ON claim_updates IS
  'PR #12: Enforce immutability - claim updates cannot be deleted';

-- ============================================================================
-- AUDIT LOGS - Prevent modification of audit trail (except archiving)
-- ============================================================================

-- Create function that allows ONLY archiving (setting archived flag)
CREATE OR REPLACE FUNCTION audit_log_immutability_guard()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow archiving: UPDATE that only changes archived, archived_at, archived_path
  IF TG_OP = 'UPDATE' THEN
    -- Check if ONLY archive-related fields are being updated
    IF (
      OLD.id = NEW.id AND
      OLD.organization_id = NEW.organization_id AND
      OLD.user_id = NEW.user_id AND
      OLD.action = NEW.action AND
      OLD.resource_type = NEW.resource_type AND
      OLD.resource_id = NEW.resource_id AND
      OLD.metadata::text = NEW.metadata::text AND
      OLD.ip_address = NEW.ip_address AND
      OLD.user_agent = NEW.user_agent AND
      OLD.created_at = NEW.created_at
    ) THEN
      -- Only archive fields changed, allow it
      RETURN NEW;
    ELSE
      -- Other fields changed, reject
      RAISE EXCEPTION 'Audit logs are immutable: only archiving is permitted'
        USING HINT = 'Use archive functions to move logs to cold storage',
              ERRCODE = '23502';
    END IF;
  END IF;

  -- Reject DELETE (use archiving instead)
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Audit logs cannot be deleted: use archiving instead'
      USING HINT = 'Call archiveOldAuditLogs() to mark logs as archived',
            ERRCODE = '23502';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_immutability
BEFORE UPDATE OR DELETE ON audit_security.audit_logs
FOR EACH ROW
EXECUTE FUNCTION audit_log_immutability_guard();

COMMENT ON TRIGGER audit_log_immutability ON audit_security.audit_logs IS
  'PR #12: Enforce immutability - audit logs can only be archived, not modified or deleted';

-- ============================================================================
-- PAYMENT TRANSACTIONS - Prevent modification of financial records
-- ============================================================================
-- NOTE: Skipped - payment_transactions table does not exist in current schema
-- Will be added when financial module is implemented
-- 
-- CREATE TRIGGER prevent_payment_transaction_updates
-- BEFORE UPDATE ON payment_transactions
-- FOR EACH ROW
-- EXECUTE FUNCTION reject_mutation();
-- 
-- CREATE TRIGGER prevent_payment_transaction_deletions
-- BEFORE DELETE ON payment_transactions
-- FOR EACH ROW
-- EXECUTE FUNCTION reject_mutation();

-- ============================================================================
-- VOTES - Prevent modification of voting records
-- ============================================================================

CREATE TRIGGER prevent_vote_updates
BEFORE UPDATE ON votes
FOR EACH ROW
EXECUTE FUNCTION reject_mutation();

CREATE TRIGGER prevent_vote_deletions
BEFORE DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION reject_mutation();

COMMENT ON TRIGGER prevent_vote_updates ON votes IS
  'PR #12: Enforce immutability - votes are permanent and tamper-proof';
COMMENT ON TRIGGER prevent_vote_deletions ON votes IS
  'PR #12: Enforce immutability - votes cannot be deleted';

-- ============================================================================
-- VERIFICATION & TESTING
-- ============================================================================

-- Test immutability constraints (these should fail):
-- UPDATE grievance_transitions SET notes = 'test' WHERE id = (SELECT id FROM grievance_transitions LIMIT 1);
-- DELETE FROM grievance_approvals WHERE id = (SELECT id FROM grievance_approvals LIMIT 1);
-- UPDATE claim_updates SET old_value = 'changed' WHERE id = (SELECT id FROM claim_updates LIMIT 1);
-- DELETE FROM votes WHERE id = (SELECT id FROM votes LIMIT 1);

-- Verify triggers are installed:
SELECT 
  n.nspname as schema_name,
  c.relname as table_name,
  string_agg(t.tgname, ', ') as triggers
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE t.tgname LIKE 'prevent_%' OR t.tgname LIKE '%_immutability%'
GROUP BY n.nspname, c.relname
ORDER BY n.nspname, c.relname;
