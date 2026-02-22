-- Rollback: Remove Schema Drift Protection
-- Rollback for: 0080_add_schema_drift_protection.sql
-- Generated: 2026-02-12

BEGIN;

-- ============================================================================
-- 1. Drop event triggers first
-- ============================================================================

DROP EVENT TRIGGER IF EXISTS track_ddl_commands CASCADE;

-- ============================================================================
-- 2. Drop functions
-- ============================================================================

DROP FUNCTION IF EXISTS log_ddl_events() CASCADE;
DROP FUNCTION IF EXISTS detect_unauthorized_schema_changes(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS check_schema_drift_alerts() CASCADE;

-- ============================================================================
-- 3. Drop views
-- ============================================================================

DROP VIEW IF EXISTS v_recent_schema_changes CASCADE;

-- ============================================================================
-- 4. Drop table and indexes
-- ============================================================================

DROP TABLE IF EXISTS schema_drift_log CASCADE;

-- All indexes will be automatically dropped with the table

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify cleanup:
-- SELECT * FROM pg_tables WHERE tablename = 'schema_drift_log';
-- SELECT * FROM pg_event_trigger WHERE evtname = 'track_ddl_commands';
-- SELECT proname FROM pg_proc WHERE proname IN ('log_ddl_events', 'detect_unauthorized_schema_changes', 'check_schema_drift_alerts');
