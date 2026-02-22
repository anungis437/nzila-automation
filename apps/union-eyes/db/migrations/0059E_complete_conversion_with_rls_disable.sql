-- Migration 0059E: Complete User ID Conversion with Temporary RLS Disable
-- Date: 2026-02-08
-- CAUTION: This script temporarily disables RLS for all tables during migration
-- ONLY run this on staging/non-production databases during planned maintenance

-- =============================================================================
-- PREREQUISITES
-- =============================================================================
-- 1. Announce maintenance window (estimated 5-10 minutes)
-- 2. Verify no active user sessions
-- 3. Take database backup:
--    pg_dump -h unioneyes-staging-db.postgres.database.azure.com -U unionadmin -d unioneyes > backup_before_0059.sql
-- 4. Verify migration script 0059D exists

BEGIN;

-- =============================================================================
-- STEP 1: Backup current state
-- =============================================================================

-- Create backup table for RLS policies
CREATE TEMP TABLE rls_policy_backup AS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public';

-- Create backup of current UUID columns
CREATE TEMP TABLE uuid_columns_backup AS
SELECT table_schema, table_name, column_name, data_type, udt_name
FROM information_schema.columns
WHERE column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by',
                      'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                      'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
  AND data_type = 'uuid'
  AND table_schema = 'public';

-- Log starting state
DO $$
DECLARE
  uuid_count int;
  policy_count int;
  table_count int;
BEGIN
  SELECT COUNT(*) INTO uuid_count FROM uuid_columns_backup;
  SELECT COUNT(*) INTO policy_count FROM rls_policy_backup;
  SELECT COUNT(DISTINCT table_name) INTO table_count FROM uuid_columns_backup;
  
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Migration 0059E: Complete User ID Conversion';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Pre-migration state:';
  RAISE NOTICE '  - UUID user ID columns: %', uuid_count;
  RAISE NOTICE '  - Tables affected: %', table_count;
  RAISE NOTICE '  - RLS policies in database: %', policy_count;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 2: Disable RLS on all tables
-- =============================================================================

DO $$
DECLARE
  tbl RECORD;
  disabled_count INT := 0;
BEGIN
  RAISE NOTICE 'Disabling Row Level Security on all tables...';
  
  FOR tbl IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
      AND rowsecurity = true  -- Only tables with RLS enabled
    ORDER BY tablename
  LOOP
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl.tablename);
    disabled_count := disabled_count + 1;
    
    IF disabled_count % 10 = 0 THEN
      RAISE NOTICE '  Disabled RLS on % tables so far...', disabled_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'RLS disabled on % tables', disabled_count;
END $$;

-- =============================================================================
-- STEP 2.5: Drop all RLS policies
-- =============================================================================

DO $$
DECLARE
  pol RECORD;
  policy_count INT := 0;
BEGIN
  RAISE NOTICE 'Dropping all RLS policies...';
  
  FOR pol IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      pol.policyname, pol.schemaname, pol.tablename);
    policy_count := policy_count + 1;
    
    IF policy_count % 50 = 0 THEN
      RAISE NOTICE '  Dropped % policies so far...', policy_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Dropped % RLS policies', policy_count;
END $$;

-- =============================================================================
-- STEP 3: Drop dependent views that reference user ID columns
-- =============================================================================

-- These views all reference user_id, created_by, updated_by, or other user columns
-- that will be converted from UUID to VARCHAR(255)
DROP VIEW IF EXISTS members_with_pii CASCADE;
DROP VIEW IF EXISTS v_certification_expiry_tracking CASCADE;
DROP VIEW IF EXISTS v_critical_deadlines CASCADE;
DROP VIEW IF EXISTS v_member_certification_status CASCADE;
DROP VIEW IF EXISTS v_member_course_history CASCADE;
DROP VIEW IF EXISTS v_member_education_summary CASCADE;
DROP VIEW IF EXISTS v_member_skills CASCADE;
DROP VIEW IF EXISTS v_member_training_transcript CASCADE;
DROP VIEW IF EXISTS v_pension_funding_summary CASCADE;
DROP VIEW IF EXISTS v_training_program_progress CASCADE;
DO $$ BEGIN RAISE NOTICE 'Dependent views dropped (10 views)'; END $$;

-- =============================================================================
-- STEP 4: Convert all UUID user ID columns to VARCHAR(255)
-- =============================================================================

DO $$
DECLARE
  table_record RECORD;
  column_record RECORD;
  fk_record RECORD;
  table_count INT := 0;
  column_count INT := 0;
BEGIN
  RAISE NOTICE '---------------------------------------------------';
  RAISE NOTICE 'Starting column conversion...';
  RAISE NOTICE '---------------------------------------------------';
  
  -- Loop through all tables (not views) with UUID user ID columns
  FOR table_record IN 
    SELECT DISTINCT t.table_name
    FROM information_schema.tables t
    INNER JOIN information_schema.columns c 
      ON t.table_name = c.table_name AND t.table_schema = c.table_schema
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND c.column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by', 
                            'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                            'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
      AND c.data_type = 'uuid'
    ORDER BY t.table_name
  LOOP
    table_count := table_count + 1;
    RAISE NOTICE 'Processing table: % (% of ~54)', table_record.table_name, table_count;
    
    -- Drop FK constraints
    FOR fk_record IN
      SELECT DISTINCT tc.constraint_name, kcu.column_name
      FROM information_schema.table_constraints tc
      INNER JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = table_record.table_name
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by', 
                                'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                                'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
    LOOP
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
        table_record.table_name, fk_record.constraint_name);
    END LOOP;
    
    -- Convert UUID columns
    FOR column_record IN
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = table_record.table_name
        AND column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by', 
                            'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                            'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
        AND data_type = 'uuid'
    LOOP
      column_count := column_count + 1;
      EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE varchar(255)', 
        table_record.table_name, column_record.column_name);
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Column conversion complete:';
  RAISE NOTICE '  - Tables processed: %', table_count;
  RAISE NOTICE '  - Columns converted: %', column_count;
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 5: Recreate foreign key constraints
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'SKIPPING Foreign key constraint recreation';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Foreign key constraints to public.users are NOT being recreated';
  RAISE NOTICE 'due to potential data integrity issues (orphaned data).';
  RAISE NOTICE '';
  RAISE NOTICE 'After this migration completes, you should:';
  RAISE NOTICE '  1. Clean up orphaned data in affected tables';
  RAISE NOTICE '  2. Manually recreate foreign key constraints as needed';
  RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- STEP 6: Recreate dropped views
-- =============================================================================

CREATE OR REPLACE VIEW members_with_pii 
WITH (security_barrier=true) 
AS
SELECT id, organization_id, user_id, first_name, last_name, email, status,
       created_at, updated_at, encrypted_sin, encrypted_ssn, encrypted_bank_account,
       CASE WHEN encrypted_sin IS NOT NULL THEN decrypt_pii(encrypted_sin) ELSE NULL::text END AS decrypted_sin,
       CASE WHEN encrypted_ssn IS NOT NULL THEN decrypt_pii(encrypted_ssn) ELSE NULL::text END AS decrypted_ssn,
       CASE WHEN encrypted_bank_account IS NOT NULL THEN decrypt_pii(encrypted_bank_account) ELSE NULL::text END AS decrypted_bank_account
FROM members m;

DO $$ BEGIN 
  RAISE NOTICE 'Members view recreated. The following 9 views need manual recreation:';
  RAISE NOTICE '  1. v_certification_expiry_tracking';
  RAISE NOTICE '  2. v_critical_deadlines';
  RAISE NOTICE '  3. v_member_certification_status';
  RAISE NOTICE '  4. v_member_course_history';
  RAISE NOTICE '  5. v_member_education_summary';
  RAISE NOTICE '  6. v_member_skills';
  RAISE NOTICE '  7. v_member_training_transcript';
  RAISE NOTICE '  8. v_pension_funding_summary';
  RAISE NOTICE '  9. v_training_program_progress';
END $$;

-- =============================================================================
-- STEP 7: Re-enable RLS on all tables
-- =============================================================================

DO $$
DECLARE
  tbl RECORD;
  enabled_count INT := 0;
BEGIN
  RAISE NOTICE 'Re-enabling Row Level Security...';
  
  FOR tbl IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    -- RLS is enabled by default when policies exist
    -- We just need to ensure ENABLE ROW LEVEL SECURITY is set
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl.tablename);
    enabled_count := enabled_count + 1;
    
    IF enabled_count % 10 = 0 THEN
      RAISE NOTICE '  Enabled RLS on % tables so far...', enabled_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'RLS re-enabled on % tables', enabled_count;
END $$;

-- =============================================================================
-- STEP 7.5: Recreate all RLS policies from backup
-- =============================================================================

DO $$
DECLARE
  pol RECORD;
  policy_count INT := 0;
  pol_sql TEXT;
BEGIN
  RAISE NOTICE 'Recreating RLS policies from backup...';
  
  FOR pol IN 
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM rls_policy_backup
    ORDER BY schemaname, tablename, policyname
  LOOP
    -- Build CREATE POLICY statement
    pol_sql := format('CREATE POLICY %I ON %I.%I', 
      pol.policyname, pol.schemaname, pol.tablename);
    
    -- Add AS PERMISSIVE/RESTRICTIVE
    IF pol.permissive = 'PERMISSIVE' THEN
      pol_sql := pol_sql || ' AS PERMISSIVE';
    ELSE
      pol_sql := pol_sql || ' AS RESTRICTIVE';
    END IF;
    
    -- Add FOR command
    pol_sql := pol_sql || format(' FOR %s', pol.cmd);
    
    -- Add TO roles
    pol_sql := pol_sql || format(' TO %s', array_to_string(pol.roles, ', '));
    
    -- Add USING clause if exists
    IF pol.qual IS NOT NULL THEN
      pol_sql := pol_sql || format(' USING (%s)', pol.qual);
    END IF;
    
    -- Add WITH CHECK clause if exists
    IF pol.with_check IS NOT NULL THEN
      pol_sql := pol_sql || format(' WITH CHECK (%s)', pol.with_check);
    END IF;
    
    -- Execute the statement
    BEGIN
      EXECUTE pol_sql;
      policy_count := policy_count + 1;
      
      IF policy_count % 50 = 0 THEN
        RAISE NOTICE '  Recreated % policies so far...', policy_count;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '  Failed to recreate policy % on %.%: %', 
        pol.policyname, pol.schemaname, pol.tablename, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Recreated % RLS policies', policy_count;
END $$;

-- =============================================================================
-- STEP 8: Validation
-- =============================================================================

DO $$
DECLARE
  varchar_count int;
  uuid_count int;
  policy_count int;
  original_uuid_count int;
  original_policy_count int;
BEGIN
  SELECT COUNT(*) INTO original_uuid_count FROM uuid_columns_backup;
  SELECT COUNT(*) INTO original_policy_count FROM rls_policy_backup;
  
  SELECT COUNT(*) INTO varchar_count
  FROM information_schema.columns
  WHERE column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by', 
                        'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                        'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
    AND data_type = 'character varying'
    AND character_maximum_length = 255
    AND table_schema = 'public';
  
  SELECT COUNT(*) INTO uuid_count
  FROM information_schema.columns c
  INNER JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
  WHERE c.column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by', 
                          'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                          'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
    AND c.data_type = 'uuid'
    AND c.table_schema = 'public'
    AND t.table_type = 'BASE TABLE';
  
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Migration 0059E Complete - Final State:';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Columns:';
  RAISE NOTICE '  - Original UUID columns: %', original_uuid_count;
  RAISE NOTICE '  - Remaining UUID columns: % (expected: 0)', uuid_count;
  RAISE NOTICE '  - New VARCHAR(255) columns: % (expected: ~%)', varchar_count, original_uuid_count;
  RAISE NOTICE '';
  RAISE NOTICE 'RLS Policies:';
  RAISE NOTICE '  - Original policies: %', original_policy_count;
  RAISE NOTICE '  - Current policies: % (expected: %)', policy_count, original_policy_count;
  RAISE NOTICE '=============================================================================';
  
  IF uuid_count = 0 AND policy_count = original_policy_count THEN
    RAISE NOTICE '✅ MIGRATION SUCCESSFUL - All UUID columns converted, all RLS policies active';
  ELSE
    IF uuid_count > 0 THEN
      RAISE WARNING '⚠️  Some UUID columns remain - manual review needed';
    END IF;
    IF policy_count <> original_policy_count THEN
      RAISE WARNING '⚠️  RLS policy count changed - verification needed';
    END IF;
  END IF;
END $$;

-- Show any remaining UUID columns
SELECT t.table_name, c.column_name, c.data_type
FROM information_schema.columns c
INNER JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE c.column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by',
                        'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                        'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
  AND c.data_type = 'uuid'
  AND c.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.column_name;

COMMIT;

-- =============================================================================
-- POST-MIGRATION VERIFICATION
-- =============================================================================
-- Run these queries after migration completes to verify success:
-- 1. Test Clerk user ID insert
--    INSERT INTO reports (title, created_by) VALUES ('Test Report', 'user_2Z1abc123def456');
-- 2. Verify RLS still works
--    SET app.current_user_id = 'user_2Z1abc123def456';
--    SELECT * FROM reports WHERE created_by = get_current_user_id();
-- 3. Check application login and basic operations
