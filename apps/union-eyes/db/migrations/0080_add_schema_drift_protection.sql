-- Migration: Add Schema Drift Protection (DDL Event Logging)
-- Generated: 2026-02-12
-- Part of Schema Drift Protection Strategy
-- Priority: P1 - High Priority Security Enhancement

BEGIN;

-- ============================================================================
-- 1. Create schema_drift_log table
-- ============================================================================
-- This table tracks all DDL (Data Definition Language) changes to detect
-- unauthorized schema modifications that bypass the migration system.

CREATE TABLE IF NOT EXISTS schema_drift_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'DDL_CHANGE',
        'TABLE_CREATE',
        'TABLE_ALTER',
        'TABLE_DROP',
        'COLUMN_ADD',
        'COLUMN_DROP',
        'INDEX_CREATE',
        'INDEX_DROP',
        'TRIGGER_CREATE',
        'TRIGGER_DROP',
        'FUNCTION_CREATE',
        'FUNCTION_DROP'
    )),
    object_type TEXT CHECK (object_type IN (
        'TABLE',
        'VIEW',
        'INDEX',
        'TRIGGER',
        'FUNCTION',
        'SEQUENCE',
        'POLICY',
        'CONSTRAINT'
    )),
    object_name TEXT NOT NULL,
    schema_name TEXT DEFAULT 'public',
    command_tag TEXT,
    ddl_command TEXT,
    executed_by TEXT NOT NULL DEFAULT current_user,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_info JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Track whether this was a migration or manual change
    is_migration BOOLEAN DEFAULT FALSE,
    migration_name TEXT,
    
    -- Enable auditing
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying recent changes
CREATE INDEX IF NOT EXISTS idx_schema_drift_log_executed_at 
    ON schema_drift_log(executed_at DESC);

-- Index for querying by object
CREATE INDEX IF NOT EXISTS idx_schema_drift_log_object 
    ON schema_drift_log(object_name, schema_name);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_schema_drift_log_user 
    ON schema_drift_log(executed_by, executed_at DESC);

-- Index for finding manual changes (non-migration)
CREATE INDEX IF NOT EXISTS idx_schema_drift_log_manual 
    ON schema_drift_log(is_migration, executed_at DESC) 
    WHERE is_migration = FALSE;

COMMENT ON TABLE schema_drift_log IS 'Tracks all DDL changes for schema drift detection';
COMMENT ON COLUMN schema_drift_log.is_migration IS 'TRUE if change was from a migration, FALSE if manual';
COMMENT ON COLUMN schema_drift_log.executed_by IS 'Database role/user that executed the DDL';

-- ============================================================================
-- 2. Create function to log DDL events
-- ============================================================================
-- This function is triggered on all DDL events to capture schema changes

CREATE OR REPLACE FUNCTION log_ddl_events()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    obj record;
    cmd_info record;
    event_type TEXT;
    obj_type TEXT;
    obj_name TEXT;
BEGIN
    -- Determine event type from TG_TAG
    event_type := CASE 
        WHEN TG_TAG LIKE 'CREATE%' THEN 'DDL_CHANGE'
        WHEN TG_TAG LIKE 'ALTER%' THEN 'DDL_CHANGE'
        WHEN TG_TAG LIKE 'DROP%' THEN 'DDL_CHANGE'
        ELSE 'DDL_CHANGE'
    END;
    
    -- Get command information
    FOR cmd_info IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        -- Extract object type and name
        obj_type := cmd_info.object_type;
        obj_name := cmd_info.object_identity;
        
        -- Log the DDL event
        INSERT INTO schema_drift_log (
            event_type,
            object_type,
            object_name,
            schema_name,
            command_tag,
            executed_by,
            executed_at,
            session_info,
            metadata,
            is_migration
        ) VALUES (
            event_type,
            obj_type,
            obj_name,
            cmd_info.schema_name,
            TG_TAG,
            current_user,
            NOW(),
            jsonb_build_object(
                'application_name', current_setting('application_name', TRUE),
                'client_addr', inet_client_addr()::text,
                'backend_pid', pg_backend_pid()
            ),
            jsonb_build_object(
                'in_extension', cmd_info.in_extension,
                'command_tag', TG_TAG
            ),
            -- Detect if this is likely a migration based on application name
            current_setting('application_name', TRUE) LIKE '%migration%' OR
            current_setting('application_name', TRUE) LIKE '%drizzle%'
        );
    END LOOP;
    
EXCEPTION WHEN OTHERS THEN
    -- Don't fail the DDL if logging fails
    RAISE WARNING 'Failed to log DDL event: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION log_ddl_events() IS 'Event trigger function to log all DDL changes for drift detection';

-- ============================================================================
-- 3. Create event triggers for DDL tracking
-- ============================================================================

-- Track DDL command execution (CREATE, ALTER)
DROP EVENT TRIGGER IF EXISTS track_ddl_commands CASCADE;
CREATE EVENT TRIGGER track_ddl_commands
    ON ddl_command_end
    WHEN TAG IN (
        'CREATE TABLE',
        'ALTER TABLE',
        'DROP TABLE',
        'CREATE INDEX',
        'DROP INDEX',
        'CREATE FUNCTION',
        'DROP FUNCTION',
        'CREATE TRIGGER',
        'DROP TRIGGER',
        'CREATE VIEW',
        'DROP VIEW',
        'CREATE POLICY',
        'DROP POLICY'
    )
    EXECUTE FUNCTION log_ddl_events();

COMMENT ON EVENT TRIGGER track_ddl_commands IS 'Captures DDL commands for schema drift detection';

-- ============================================================================
-- 4. Create function to detect unauthorized schema changes
-- ============================================================================
-- This function can be called to check for manual (non-migration) changes

CREATE OR REPLACE FUNCTION detect_unauthorized_schema_changes(
    p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    change_time TIMESTAMPTZ,
    change_type TEXT,
    object_name TEXT,
    executed_by TEXT,
    command_tag TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        executed_at,
        event_type,
        sdl.object_name,
        sdl.executed_by,
        sdl.command_tag
    FROM schema_drift_log sdl
    WHERE 
        is_migration = FALSE
        AND executed_at > NOW() - (p_hours_back || ' hours')::INTERVAL
        -- Exclude postgres and superuser automated tasks
        AND executed_by NOT IN ('postgres', 'rdsadmin')
    ORDER BY executed_at DESC;
END;
$$;

COMMENT ON FUNCTION detect_unauthorized_schema_changes IS 'Returns manual schema changes that bypassed migrations';

-- ============================================================================
-- 5. Create view for recent schema changes
-- ============================================================================

CREATE OR REPLACE VIEW v_recent_schema_changes AS
SELECT 
    id,
    event_type,
    object_type,
    object_name,
    schema_name,
    command_tag,
    executed_by,
    executed_at,
    is_migration,
    migration_name,
    CASE 
        WHEN is_migration THEN '✅ Migration'
        ELSE '⚠️  Manual'
    END as change_source
FROM schema_drift_log
WHERE executed_at > NOW() - INTERVAL '7 days'
ORDER BY executed_at DESC;

COMMENT ON VIEW v_recent_schema_changes IS 'Shows recent schema changes with migration status';

-- ============================================================================
-- 6. Create alerting function
-- ============================================================================
-- This function can be called periodically to check for drift and alert

CREATE OR REPLACE FUNCTION check_schema_drift_alerts()
RETURNS TABLE (
    alert_severity TEXT,
    alert_message TEXT,
    change_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    manual_changes_24h BIGINT;
    manual_changes_1h BIGINT;
BEGIN
    -- Count manual changes in last 24 hours
    SELECT COUNT(*) INTO manual_changes_24h
    FROM schema_drift_log
    WHERE is_migration = FALSE
        AND executed_at > NOW() - INTERVAL '24 hours'
        AND executed_by NOT IN ('postgres', 'rdsadmin');
    
    -- Count manual changes in last hour
    SELECT COUNT(*) INTO manual_changes_1h
    FROM schema_drift_log
    WHERE is_migration = FALSE
        AND executed_at > NOW() - INTERVAL '1 hour'
        AND executed_by NOT IN ('postgres', 'rdsadmin');
    
    -- Return alerts based on thresholds
    IF manual_changes_1h > 0 THEN
        RETURN QUERY SELECT 
            'CRITICAL'::TEXT,
            'Manual schema changes detected in last hour'::TEXT,
            manual_changes_1h;
    END IF;
    
    IF manual_changes_24h > 0 THEN
        RETURN QUERY SELECT 
            'WARNING'::TEXT,
            'Manual schema changes detected in last 24 hours'::TEXT,
            manual_changes_24h;
    END IF;
    
    IF manual_changes_24h = 0 THEN
        RETURN QUERY SELECT 
            'INFO'::TEXT,
            'No unauthorized schema changes detected'::TEXT,
            0::BIGINT;
    END IF;
END;
$$;

COMMENT ON FUNCTION check_schema_drift_alerts IS 'Checks for schema drift and returns alert severity';

-- ============================================================================
-- 7. Grant appropriate permissions
-- ============================================================================

-- Allow read access to monitoring roles
GRANT SELECT ON schema_drift_log TO PUBLIC;
GRANT SELECT ON v_recent_schema_changes TO PUBLIC;

-- Only superuser should be able to modify drift log
REVOKE INSERT, UPDATE, DELETE ON schema_drift_log FROM PUBLIC;

-- ============================================================================
-- 8. Log this migration as authorized
-- ============================================================================

-- Mark this migration run
INSERT INTO schema_drift_log (
    event_type,
    object_type,
    object_name,
    command_tag,
    executed_by,
    is_migration,
    migration_name,
    metadata
) VALUES (
    'DDL_CHANGE',
    'TABLE',
    'schema_drift_log',
    'CREATE TABLE',
    current_user,
    TRUE,
    '0080_add_schema_drift_protection.sql',
    jsonb_build_object(
        'description', 'Schema drift protection system initialized',
        'version', '1.0.0'
    )
);

COMMIT;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- View recent schema changes:
-- SELECT * FROM v_recent_schema_changes;

-- Check for unauthorized changes in last 24 hours:
-- SELECT * FROM detect_unauthorized_schema_changes(24);

-- Check drift alerts:
-- SELECT * FROM check_schema_drift_alerts();

-- Query manual changes by user:
-- SELECT executed_by, COUNT(*), MIN(executed_at), MAX(executed_at)
-- FROM schema_drift_log
-- WHERE is_migration = FALSE
-- GROUP BY executed_by;
