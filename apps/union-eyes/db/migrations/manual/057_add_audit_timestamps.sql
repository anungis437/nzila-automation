-- Migration: 057_add_audit_timestamps.sql
-- Description: Add created_at and updated_at timestamp columns to 7 audit tables
-- Priority 3: Complete audit timestamp implementation
-- Date: 2025-11-24

-- ========================================
-- 1. ADD TIMESTAMPS TO voting_notifications
-- ========================================
-- Already has sent_at, add created_at and updated_at
ALTER TABLE voting_notifications 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update existing records to use sent_at as created_at
UPDATE voting_notifications 
SET created_at = sent_at, updated_at = sent_at 
WHERE created_at IS NULL;

-- Make columns NOT NULL after backfill
ALTER TABLE voting_notifications 
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN voting_notifications.created_at IS 'Timestamp when notification record was created';
COMMENT ON COLUMN voting_notifications.updated_at IS 'Timestamp when notification was last updated';

-- ========================================
-- 2. ADD TIMESTAMPS TO claim_precedent_analysis
-- ========================================
-- Already has analyzed_at and last_updated, rename to standard names
ALTER TABLE claim_precedent_analysis 
  RENAME COLUMN last_updated TO updated_at;

ALTER TABLE claim_precedent_analysis
  RENAME COLUMN analyzed_at TO created_at;

-- Ensure NOT NULL constraint
ALTER TABLE claim_precedent_analysis
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN claim_precedent_analysis.created_at IS 'Timestamp when analysis was created';
COMMENT ON COLUMN claim_precedent_analysis.updated_at IS 'Timestamp when analysis was last updated';

-- ========================================
-- 3. ADD TIMESTAMPS TO ai_query_logs
-- ========================================
-- Already has timestamp, rename and add updated_at
ALTER TABLE ai_query_logs
  RENAME COLUMN timestamp TO created_at;

ALTER TABLE ai_query_logs
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill updated_at with created_at
UPDATE ai_query_logs 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Make updated_at NOT NULL
ALTER TABLE ai_query_logs
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN ai_query_logs.created_at IS 'Timestamp when query was logged';
COMMENT ON COLUMN ai_query_logs.updated_at IS 'Timestamp when log entry was last updated';

-- ========================================
-- 4. ADD TIMESTAMPS TO votes
-- ========================================
-- Already has cast_at, add created_at and updated_at
ALTER TABLE votes
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill with cast_at timestamp
UPDATE votes
SET created_at = cast_at, updated_at = cast_at
WHERE created_at IS NULL;

-- Make columns NOT NULL
ALTER TABLE votes
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN votes.created_at IS 'Timestamp when vote record was created';
COMMENT ON COLUMN votes.updated_at IS 'Timestamp when vote was last updated';

-- ========================================
-- 5. ADD TIMESTAMPS TO signature_audit_log
-- ========================================
-- Already has event_timestamp, add created_at and updated_at
ALTER TABLE signature_audit_log
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill with event_timestamp
UPDATE signature_audit_log
SET created_at = event_timestamp, updated_at = event_timestamp
WHERE created_at IS NULL;

-- Make columns NOT NULL
ALTER TABLE signature_audit_log
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN signature_audit_log.created_at IS 'Timestamp when audit log entry was created';
COMMENT ON COLUMN signature_audit_log.updated_at IS 'Timestamp when audit log was last updated';

-- ========================================
-- 6. ADD TIMESTAMPS TO organization_hierarchy_audit
-- ========================================
-- Already has changed_at, add created_at and updated_at
ALTER TABLE organization_hierarchy_audit
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill with changed_at
UPDATE organization_hierarchy_audit
SET created_at = changed_at, updated_at = changed_at
WHERE created_at IS NULL;

-- Make columns NOT NULL
ALTER TABLE organization_hierarchy_audit
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN organization_hierarchy_audit.created_at IS 'Timestamp when hierarchy audit entry was created';
COMMENT ON COLUMN organization_hierarchy_audit.updated_at IS 'Timestamp when audit entry was last updated';

-- ========================================
-- 7. ADD TIMESTAMPS TO voting_key_access_log
-- ========================================
-- Already has accessed_at, add created_at and updated_at
ALTER TABLE voting_key_access_log
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill with accessed_at
UPDATE voting_key_access_log
SET created_at = accessed_at, updated_at = accessed_at
WHERE created_at IS NULL;

-- Make columns NOT NULL
ALTER TABLE voting_key_access_log
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN voting_key_access_log.created_at IS 'Timestamp when access log entry was created';
COMMENT ON COLUMN voting_key_access_log.updated_at IS 'Timestamp when access log was last updated';

-- ========================================
-- CREATE UPDATE TRIGGER FUNCTION
-- ========================================
-- Create or replace function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update updated_at timestamp on row updates';

-- ========================================
-- ADD UPDATE TRIGGERS TO ALL 7 TABLES
-- ========================================

-- Trigger for voting_notifications
DROP TRIGGER IF EXISTS update_voting_notifications_updated_at ON voting_notifications;
CREATE TRIGGER update_voting_notifications_updated_at
  BEFORE UPDATE ON voting_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for claim_precedent_analysis
DROP TRIGGER IF EXISTS update_claim_precedent_analysis_updated_at ON claim_precedent_analysis;
CREATE TRIGGER update_claim_precedent_analysis_updated_at
  BEFORE UPDATE ON claim_precedent_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for ai_query_logs
DROP TRIGGER IF EXISTS update_ai_query_logs_updated_at ON ai_query_logs;
CREATE TRIGGER update_ai_query_logs_updated_at
  BEFORE UPDATE ON ai_query_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for votes
DROP TRIGGER IF EXISTS update_votes_updated_at ON votes;
CREATE TRIGGER update_votes_updated_at
  BEFORE UPDATE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for signature_audit_log
DROP TRIGGER IF EXISTS update_signature_audit_log_updated_at ON signature_audit_log;
CREATE TRIGGER update_signature_audit_log_updated_at
  BEFORE UPDATE ON signature_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for organization_hierarchy_audit
DROP TRIGGER IF EXISTS update_organization_hierarchy_audit_updated_at ON organization_hierarchy_audit;
CREATE TRIGGER update_organization_hierarchy_audit_updated_at
  BEFORE UPDATE ON organization_hierarchy_audit
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for voting_key_access_log
DROP TRIGGER IF EXISTS update_voting_key_access_log_updated_at ON voting_key_access_log;
CREATE TRIGGER update_voting_key_access_log_updated_at
  BEFORE UPDATE ON voting_key_access_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- CREATE INDEXES FOR TIMESTAMP QUERIES
-- ========================================

-- Indexes for created_at queries (if not already present)
CREATE INDEX IF NOT EXISTS idx_voting_notifications_created_at ON voting_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_claim_precedent_analysis_created_at ON claim_precedent_analysis(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_query_logs_created_at ON ai_query_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);
CREATE INDEX IF NOT EXISTS idx_signature_audit_log_created_at ON signature_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_organization_hierarchy_audit_created_at ON organization_hierarchy_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_voting_key_access_log_created_at ON voting_key_access_log(created_at);

-- Indexes for updated_at queries
CREATE INDEX IF NOT EXISTS idx_voting_notifications_updated_at ON voting_notifications(updated_at);
CREATE INDEX IF NOT EXISTS idx_claim_precedent_analysis_updated_at ON claim_precedent_analysis(updated_at);
CREATE INDEX IF NOT EXISTS idx_ai_query_logs_updated_at ON ai_query_logs(updated_at);
CREATE INDEX IF NOT EXISTS idx_votes_updated_at ON votes(updated_at);
CREATE INDEX IF NOT EXISTS idx_signature_audit_log_updated_at ON signature_audit_log(updated_at);
CREATE INDEX IF NOT EXISTS idx_organization_hierarchy_audit_updated_at ON organization_hierarchy_audit(updated_at);
CREATE INDEX IF NOT EXISTS idx_voting_key_access_log_updated_at ON voting_key_access_log(updated_at);

-- ========================================
-- VALIDATION
-- ========================================

DO $$
DECLARE
  v_tables_with_timestamps INTEGER;
  v_tables_with_triggers INTEGER;
  v_missing_tables TEXT[];
  v_missing_triggers TEXT[];
BEGIN
  -- Check all 7 tables have both created_at and updated_at columns
  SELECT COUNT(*)
  INTO v_tables_with_timestamps
  FROM information_schema.columns c1
  WHERE c1.table_schema = 'public'
    AND c1.table_name IN (
      'voting_notifications',
      'claim_precedent_analysis',
      'ai_query_logs',
      'votes',
      'signature_audit_log',
      'organization_hierarchy_audit',
      'voting_key_access_log'
    )
    AND c1.column_name = 'created_at'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns c2
      WHERE c2.table_schema = 'public'
        AND c2.table_name = c1.table_name
        AND c2.column_name = 'updated_at'
    );

  -- Check for tables missing timestamps
  SELECT array_agg(t.table_name)
  INTO v_missing_tables
  FROM unnest(ARRAY[
    'voting_notifications',
    'claim_precedent_analysis',
    'ai_query_logs',
    'votes',
    'signature_audit_log',
    'organization_hierarchy_audit',
    'voting_key_access_log'
  ]) AS t(table_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND information_schema.columns.table_name = t.table_name
      AND column_name IN ('created_at', 'updated_at')
    HAVING COUNT(*) = 2
  );

  -- Check all 7 tables have update triggers
  SELECT COUNT(DISTINCT event_object_table)
  INTO v_tables_with_triggers
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND event_object_table IN (
      'voting_notifications',
      'claim_precedent_analysis',
      'ai_query_logs',
      'votes',
      'signature_audit_log',
      'organization_hierarchy_audit',
      'voting_key_access_log'
    )
    AND action_timing = 'BEFORE'
    AND event_manipulation = 'UPDATE'
    AND action_statement LIKE '%update_updated_at_column%';

  -- Check for tables missing triggers
  SELECT array_agg(t.table_name)
  INTO v_missing_triggers
  FROM unnest(ARRAY[
    'voting_notifications',
    'claim_precedent_analysis',
    'ai_query_logs',
    'votes',
    'signature_audit_log',
    'organization_hierarchy_audit',
    'voting_key_access_log'
  ]) AS t(table_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND event_object_table = t.table_name
      AND action_timing = 'BEFORE'
      AND event_manipulation = 'UPDATE'
      AND action_statement LIKE '%update_updated_at_column%'
  );

  -- Report results
  IF v_tables_with_timestamps = 7 AND v_tables_with_triggers = 7 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SUCCESS: All 7 tables now have audit timestamps';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables with created_at/updated_at: %', v_tables_with_timestamps;
    RAISE NOTICE 'Tables with update triggers: %', v_tables_with_triggers;
    RAISE NOTICE '';
    RAISE NOTICE 'Timestamp columns added to:';
    RAISE NOTICE '  ✓ voting_notifications';
    RAISE NOTICE '  ✓ claim_precedent_analysis';
    RAISE NOTICE '  ✓ ai_query_logs';
    RAISE NOTICE '  ✓ votes';
    RAISE NOTICE '  ✓ signature_audit_log';
    RAISE NOTICE '  ✓ organization_hierarchy_audit';
    RAISE NOTICE '  ✓ voting_key_access_log';
    RAISE NOTICE '';
    RAISE NOTICE 'All tables now have automatic updated_at triggers.';
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION 'VALIDATION FAILED: Expected 7/7 tables with timestamps and triggers, got %/% timestamps and %/% triggers. Missing tables: %, Missing triggers: %',
      v_tables_with_timestamps, 7, v_tables_with_triggers, 7,
      COALESCE(array_to_string(v_missing_tables, ', '), 'none'),
      COALESCE(array_to_string(v_missing_triggers, ', '), 'none');
  END IF;
END;
$$;
