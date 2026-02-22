/**
 * ROLLBACK for Migration 0063: Audit Log Archive Support
 * 
 * ⚠️ WARNING: This will remove archive functionality. Archived logs will lose metadata.
 * 
 * Usage:
 *   psql -d your_database -f db/migrations/rollback/0063_rollback.sql
 * 
 * What this does:
 * - Drops archived, archived_at, archived_path columns from audit_logs
 * - Does NOT delete audit log records (preserves data)
 * 
 * Prerequisites:
 * - Database backup completed
 * - Confirmation that no archive process is running
 * - Document any currently archived logs before rollback
 */

BEGIN;

-- Step 1: Log pre-rollback state
DO $$
DECLARE
    archived_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO archived_count
    FROM audit_security.audit_logs
    WHERE archived = true;
    
    INSERT INTO audit_security.audit_logs (
        event_type,
        severity,
        user_id,
        details,
        timestamp
    ) VALUES (
        'migration_rollback',
        'high',
        current_user,
        jsonb_build_object(
            'migration', '0063',
            'action', 'pre_rollback_snapshot',
            'archived_logs_count', archived_count,
            'snapshot_at', NOW()
        ),
        NOW()
    );
END $$;

-- Step 2: Drop archive-related columns
ALTER TABLE audit_security.audit_logs 
    DROP COLUMN IF EXISTS archived CASCADE,
    DROP COLUMN IF EXISTS archived_at CASCADE,
    DROP COLUMN IF EXISTS archived_path CASCADE;

-- Step 3: Drop any archive-related indexes
DROP INDEX IF EXISTS audit_security.idx_audit_logs_archived;
DROP INDEX IF EXISTS audit_security.idx_audit_logs_archived_at;

-- Step 4: Log the rollback completion
INSERT INTO audit_security.audit_logs (
    event_type,
    severity,
    user_id,
    details,
    timestamp
) VALUES (
    'migration_rollback',
    'high',
    current_user,
    jsonb_build_object(
        'migration', '0063',
        'action', 'rollback_complete',
        'columns_dropped', ARRAY['archived', 'archived_at', 'archived_path'],
        'rolled_back_at', NOW()
    ),
    NOW()
);

COMMIT;

-- Verification query
SELECT 'Rollback 0063 complete. Archive columns dropped:' AS status;
SELECT 
    column_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'audit_security' 
            AND table_name = 'audit_logs' 
            AND columns.column_name = c.column_name
        ) THEN '❌ STILL EXISTS (rollback failed)'
        ELSE '✅ DROPPED'
    END AS status
FROM (VALUES 
    ('archived'),
    ('archived_at'),
    ('archived_path')
) AS c(column_name);
