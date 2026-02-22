/**
 * ROLLBACK for Migration 0065: Governance Tables
 * 
 * ⚠️ WARNING: This will permanently delete all governance data!
 * 
 * Usage:
 *   psql -d your_database -f db/migrations/rollback/0065_rollback.sql
 * 
 * What this does:
 * - Drops all governance schema tables
 * - Removes golden share, reserved matter votes, council elections
 * - Deletes all mission audit records
 * 
 * Prerequisites:
 * - Database backup completed
 * - Export governance data if needed for historical records
 * - Confirmation from governance/executive team
 */

BEGIN;

-- Step 1: Log pre-rollback state
DO $$
DECLARE
    governance_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'golden_shares', (SELECT COUNT(*) FROM governance.golden_shares),
        'reserved_matter_votes', (SELECT COUNT(*) FROM governance.reserved_matter_votes),
        'council_elections', (SELECT COUNT(*) FROM governance.council_elections),
        'mission_audits', (SELECT COUNT(*) FROM governance.mission_audits)
    ) INTO governance_stats;
    
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
            'migration', '0065',
            'action', 'pre_rollback_snapshot',
            'record_counts', governance_stats,
            'snapshot_at', NOW()
        ),
        NOW()
    );
END $$;

-- Step 2: Drop dependent foreign keys and views
DROP VIEW IF EXISTS governance.v_active_golden_shares CASCADE;
DROP VIEW IF EXISTS governance.v_pending_reserved_matters CASCADE;
DROP VIEW IF EXISTS governance.v_election_results CASCADE;

-- Step 3: Drop governance tables in dependency order
DROP TABLE IF EXISTS governance.mission_audit_items CASCADE;
DROP TABLE IF EXISTS governance.mission_audits CASCADE;
DROP TABLE IF EXISTS governance.reserved_matter_votes CASCADE;
DROP TABLE IF EXISTS governance.council_election_votes CASCADE;
DROP TABLE IF EXISTS governance.council_election_candidates CASCADE;
DROP TABLE IF EXISTS governance.council_elections CASCADE;
DROP TABLE IF EXISTS governance.golden_share_delegations CASCADE;
DROP TABLE IF EXISTS governance governance.golden_shares CASCADE;

-- Step 4: Drop governance schema if empty
DROP SCHEMA IF EXISTS governance CASCADE;

-- Step 5: Log rollback completion
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
        'migration', '0065',
        'action', 'rollback_complete',
        'schema_dropped', 'governance',
        'rolled_back_at', NOW()
    ),
    NOW()
);

COMMIT;

-- Verification query
SELECT 'Rollback 0065 complete. Governance schema dropped:' AS status;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.schemata 
            WHERE schema_name = 'governance'
        ) THEN '❌ Schema still exists (rollback failed)'
        ELSE '✅ Schema dropped successfully'
    END AS governance_schema_status;

SELECT 
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'governance' AND tables.table_name = t.table_name
        ) THEN '❌ STILL EXISTS'
        ELSE '✅ DROPPED'
    END AS status
FROM (VALUES 
    ('golden_shares'),
    ('reserved_matter_votes'),
    ('council_elections'),
    ('mission_audits')
) AS t(table_name);
