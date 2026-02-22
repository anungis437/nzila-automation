/**
 * ROLLBACK for Migration 0062: Immutable Transition History
 * 
 * ⚠️ WARNING: This will permanently delete data. Backup first!
 * 
 * Usage:
 *   psql -d your_database -f db/migrations/rollback/0062_rollback.sql
 * 
 * What this does:
 * - Drops grievance_transitions table (and all data)
 * - Drops grievance_approvals table (and all data)
 * - Removes any dependent views or foreign keys
 * 
 * Prerequisites:
 * - Database backup completed
 * - Confirmation from team lead
 * - No active grievance workflows in progress
 */

BEGIN;

-- Step 1: Drop dependent views (if any)
DROP VIEW IF EXISTS grievances.v_transition_history CASCADE;
DROP VIEW IF EXISTS grievances.v_approval_status CASCADE;

-- Step 2: Drop foreign key constraints that reference these tables
-- (Adjust schema/table names as needed based on your actual structure)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Find and drop foreign keys pointing to grievance_transitions
    FOR r IN 
        SELECT 
            tc.table_schema,
            tc.table_name,
            tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name IN ('grievance_transitions', 'grievance_approvals')
          AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I CASCADE',
            r.table_schema, r.table_name, r.constraint_name);
    END LOOP;
END $$;

-- Step 3: Drop tables
DROP TABLE IF EXISTS grievances.grievance_approvals CASCADE;
DROP TABLE IF EXISTS grievances.grievance_transitions CASCADE;

-- Step 4: Log the rollback
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
        'migration', '0062',
        'action', 'rollback',
        'tables_dropped', ARRAY['grievance_transitions', 'grievance_approvals'],
        'rolled_back_at', NOW()
    ),
    NOW()
);

COMMIT;

-- Verification query
SELECT 'Rollback 0062 complete. Tables dropped:' AS status;
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'grievances' AND tables.table_name = t.table_name
        ) THEN '❌ STILL EXISTS (rollback failed)'
        ELSE '✅ DROPPED'
    END AS status
FROM (VALUES 
    ('grievance_transitions'),
    ('grievance_approvals')
) AS t(table_name);
