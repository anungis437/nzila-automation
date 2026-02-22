/**
 * ROLLBACK for Migration 0064: Immutability Triggers
 * 
 * ⚠️ CRITICAL WARNING: Removing immutability triggers removes audit compliance protection!
 * 
 * Usage:
 *   psql -d your_database -f db/migrations/rollback/0064_rollback.sql
 * 
 * What this does:
 * - Drops all immutability triggers from protected tables
 * - Drops reject_mutation() function
 * - Drops audit_log_immutability_guard() function
 * - Allows data modification on previously protected tables
 * 
 * Prerequisites:
 * - Database backup completed
 * - Legal/compliance team approval (this removes SOC 2/GDPR protections)
 * - Document reason for rollback
 */

BEGIN;

-- Step 1: Log pre-rollback state
INSERT INTO audit_security.audit_logs (
    event_type,
    severity,
    user_id,
    details,
    timestamp
) VALUES (
    'migration_rollback',
    'critical',
    current_user,
    jsonb_build_object(
        'migration', '0064',
        'action', 'immutability_rollback_started',
        'warning', 'Removing audit compliance protections',
        'started_at', NOW()
    ),
    NOW()
);

-- Step 2: Drop all immutability triggers
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Find and drop all triggers using immutability functions
    FOR r IN 
        SELECT 
            n.nspname AS schema_name,
            c.relname AS table_name,
            t.tgname AS trigger_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE p.proname IN ('reject_mutation', 'audit_log_immutability_guard')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE',
            r.trigger_name, r.schema_name, r.table_name);
        
        RAISE NOTICE 'Dropped trigger % on %.%', 
            r.trigger_name, r.schema_name, r.table_name;
    END LOOP;
END $$;

-- Step 3: Drop immutability functions
DROP FUNCTION IF EXISTS public.reject_mutation() CASCADE;
DROP FUNCTION IF EXISTS public.audit_log_immutability_guard() CASCADE;

-- Step 4: Log the rollback completion
INSERT INTO audit_security.audit_logs (
    event_type,
    severity,
    user_id,
    details,
    timestamp
) VALUES (
    'migration_rollback',
    'critical',
    current_user,
    jsonb_build_object(
        'migration', '0064',
        'action', 'immutability_rollback_complete',
        'functions_dropped', ARRAY['reject_mutation', 'audit_log_immutability_guard'],
        'rolled_back_at', NOW(),
        'warning', 'Tables are now mutable - audit compliance compromised'
    ),
    NOW()
);

COMMIT;

-- Verification queries
SELECT 'Rollback 0064 complete. Immutability protections removed:' AS status;

SELECT 'Immutability functions status:' AS check_type;
SELECT 
    function_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = f.function_name
        ) THEN '❌ STILL EXISTS (rollback failed)'
        ELSE '✅ DROPPED'
    END AS status
FROM (VALUES 
    ('reject_mutation'),
    ('audit_log_immutability_guard')
) AS f(function_name);

SELECT 'Remaining immutability triggers:' AS check_type;
SELECT 
    COUNT(*) AS trigger_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All removed'
        ELSE '⚠️ Some triggers remain'
    END AS status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE p.proname IN ('reject_mutation', 'audit_log_immutability_guard');

\echo ''
\echo '⚠️  CRITICAL: Immutability protections have been removed!'
\echo '⚠️  Previously protected tables can now be modified.'
\echo '⚠️  This may violate audit compliance requirements.'
