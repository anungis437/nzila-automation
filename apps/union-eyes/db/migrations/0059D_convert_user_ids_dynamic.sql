-- Migration 0059D: Convert User ID Columns to VARCHAR(255) (Dynamic Discovery)
-- Date: 2026-02-08
-- Discovers and converts only columns that actually exist

BEGIN;

-- =============================================================================
-- STEP 1: Drop dependent views that reference user ID columns
-- =============================================================================

DROP VIEW IF EXISTS v_critical_deadlines CASCADE;
DROP VIEW IF EXISTS members_with_pii CASCADE;

-- =============================================================================
-- STEP 2: Discover and convert all UUID user ID columns dynamically
-- =============================================================================

DO $$
DECLARE
  table_record RECORD;
  column_record RECORD;
  fk_record RECORD;
  policy_record RECORD;
  table_count INT := 0;
  column_count INT := 0;
  policies_dropped INT := 0;
  rls_policies_backup TEXT := '';
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Starting dynamic user ID column migration...';
  RAISE NOTICE '=============================================================================';
  
  -- Loop through all tables (not views) with UUID user ID columns
  FOR table_record IN 
    SELECT DISTINCT t.table_name
    FROM information_schema.tables t
    INNER JOIN information_schema.columns c 
      ON t.table_name = c.table_name AND t.table_schema = c.table_schema
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'  -- Exclude views
      AND c.column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by', 
                            'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                            'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
      AND c.data_type = 'uuid'
    ORDER BY t.table_name
  LOOP
    table_count := table_count + 1;
    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE 'Processing table: %', table_record.table_name;
    
    -- Drop RLS policies that might reference user ID columns
    FOR policy_record IN
      SELECT polname AS policyname,
             pg_get_expr(polqual, polrelid) AS qual,
             pg_get_expr(polwithcheck, polrelid) AS with_check,
             CASE polcmd
               WHEN 'r' THEN 'SELECT'
               WHEN 'a' THEN 'INSERT'
               WHEN 'w' THEN 'UPDATE'
               WHEN 'd' THEN 'DELETE'
               WHEN '*' THEN 'ALL'
             END AS cmd,
             CASE 
               WHEN polpermissive THEN 'PERMISSIVE'
               ELSE 'RESTRICTIVE'
             END AS permissive,
             ARRAY(SELECT rolname FROM pg_roles WHERE oid = ANY(polroles)) AS roles
      FROM pg_policy
      WHERE polrelid = (quote_ident('public') || '.' || quote_ident(table_record.table_name))::regclass
        AND (pg_get_expr(polqual, polrelid) ~ 'user_id|created_by|updated_by|approved_by|recipient_id'
             OR pg_get_expr(polwithcheck, polrelid) ~ 'user_id|created_by|updated_by|approved_by|recipient_id')
    LOOP
      RAISE NOTICE '  Dropping RLS policy: %', policy_record.policyname;
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 
        policy_record.policyname, table_record.table_name);
      policies_dropped := policies_dropped + 1;
      
      -- Save policy definition for recreation later
      rls_policies_backup := rls_policies_backup || format(
        E'\n-- Policy: %s on %s\nCREATE POLICY %I ON %I FOR %s AS %s TO %s USING (%s)%s;\n',
        policy_record.policyname,
        table_record.table_name,
        policy_record.policyname,
        table_record.table_name,
        policy_record.cmd,
        policy_record.permissive,
        COALESCE(array_to_string(policy_record.roles, ', '), 'PUBLIC'),
        COALESCE(policy_record.qual, 'true'),
        CASE WHEN policy_record.with_check IS NOT NULL 
          THEN ' WITH CHECK (' || policy_record.with_check || ')' 
          ELSE '' 
        END
      );
    END LOOP;
    
    -- Drop all FK constraints for this table's user ID columns
    FOR fk_record IN
      SELECT DISTINCT 
        tc.constraint_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      INNER JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name 
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = table_record.table_name
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by', 
                                'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                                'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
    LOOP
      RAISE NOTICE '  Dropping FK: %', fk_record.constraint_name;
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
        table_record.table_name, fk_record.constraint_name);
    END LOOP;
    
    -- Convert all UUID user ID columns in this table
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
      RAISE NOTICE '  Converting column: %', column_record.column_name;
      EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE varchar(255)', 
        table_record.table_name, column_record.column_name);
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Column conversion complete:';
  RAISE NOTICE '  -  Tables processed: %', table_count;
  RAISE NOTICE '  - Columns converted: %', column_count;
  RAISE NOTICE '  - RLS policies dropped: %', policies_dropped;
  RAISE NOTICE '=============================================================================';
  
  IF policies_dropped > 0 THEN
    RAISE NOTICE 'RLS policies backup (manual recreation required):';
    RAISE NOTICE '%', rls_policies_backup;
  END IF;
END $$;

-- =============================================================================
-- STEP 3: Recreate common FK constraints (best effort)
-- =============================================================================

DO $$
DECLARE
  users_table_exists boolean;
  table_record RECORD;
  column_record RECORD;
  constraint_count INT := 0;
BEGIN
  -- Check if public.users table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'user_management' AND table_name = 'users'
  ) INTO users_table_exists;

  IF NOT users_table_exists THEN
    RAISE NOTICE 'public.users table not found - skipping FK recreation';
    RETURN;
  END IF;

  RAISE NOTICE '---------------------------------------------------';
  RAISE NOTICE 'Recreating FK constraints to public.users...';

  -- Recreate FK constraints for common patterns
  -- For tables we know should have FKs
  
  -- Per-Capita Remittances
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'per_capita_remittances') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'per_capita_remittances' AND column_name = 'created_by') THEN
      ALTER TABLE per_capita_remittances ADD CONSTRAINT per_capita_remittances_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;
      constraint_count := constraint_count + 1;
    END IF;
  END IF;

  -- Reports
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'created_by') THEN
      ALTER TABLE reports ADD CONSTRAINT reports_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE CASCADE;
      constraint_count := constraint_count + 1;
    END IF;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'updated_by') THEN
      ALTER TABLE reports ADD CONSTRAINT reports_updated_by_fkey
        FOREIGN KEY (updated_by) REFERENCES public.users(user_id) ON DELETE SET NULL;
      constraint_count := constraint_count + 1;
    END IF;
  END IF;

  -- Organizations
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'created_by') THEN
      ALTER TABLE organizations ADD CONSTRAINT organizations_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;
      constraint_count := constraint_count + 1;
    END IF;
  END IF;

  -- User preferences
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_notification_preferences') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_notification_preferences' AND column_name = 'user_id') THEN
      ALTER TABLE user_notification_preferences ADD CONSTRAINT user_notification_preferences_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
      constraint_count := constraint_count + 1;
    END IF;
  END IF;

  -- Cross-org access log
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cross_org_access_log') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cross_org_access_log' AND column_name = 'user_id') THEN
      ALTER TABLE cross_org_access_log ADD CONSTRAINT cross_org_access_log_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
      constraint_count := constraint_count + 1;
    END IF;
  END IF;

  RAISE NOTICE 'Recreated % FK constraints', constraint_count;
END $$;

-- =============================================================================
-- STEP 4: Final validation
-- =============================================================================

DO $$
DECLARE
  varchar_count int;
  uuid_count int;
BEGIN
  -- Count successfully converted columns
  SELECT COUNT(*) INTO varchar_count
  FROM information_schema.columns
  WHERE column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by', 
                        'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                        'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
    AND data_type = 'character varying'
    AND character_maximum_length = 255
    AND table_schema = 'public';
  
  -- Count remaining UUID columns  
  SELECT COUNT(*) INTO uuid_count
  FROM information_schema.columns c
  INNER JOIN information_schema.tables t 
    ON c.table_name = t.table_name AND c.table_schema = t.table_schema
  WHERE c.column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by', 
                          'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                          'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
    AND c.data_type = 'uuid'
    AND c.table_schema = 'public'
    AND t.table_type = 'BASE TABLE';  -- Exclude views
  
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Migration 0059D Complete:';
  RAISE NOTICE '  - VARCHAR(255) columns: %', varchar_count;
  RAISE NOTICE '  - Remaining UUID columns (tables): %', uuid_count;
  RAISE NOTICE '=============================================================================';
  
  IF uuid_count > 0 THEN
    RAISE WARNING 'Some UUID columns remain (see list below)';
  END IF;
END $$;

-- Show remaining UUID columns in BASE TABLES ONLY
SELECT t.table_name, c.column_name, c.data_type, t.table_type
FROM information_schema.columns c
INNER JOIN information_schema.tables t 
  ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE c.column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by', 
                        'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                        'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
  AND c.data_type = 'uuid'
  AND c.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.column_name;

-- =============================================================================
-- STEP  5: Recreate dropped views
-- =============================================================================

-- Recreate members_with_pii view
CREATE OR REPLACE VIEW members_with_pii 
WITH (security_barrier=true) 
AS
SELECT id,
    organization_id,
    user_id,
    first_name,
    last_name,
    email,
    status,
    created_at,
    updated_at,
    encrypted_sin,
    encrypted_ssn,
    encrypted_bank_account,
    CASE
        WHEN encrypted_sin IS NOT NULL THEN decrypt_pii(encrypted_sin)
        ELSE NULL::text
    END AS decrypted_sin,
    CASE
        WHEN encrypted_ssn IS NOT NULL THEN decrypt_pii(encrypted_ssn)
        ELSE NULL::text
    END AS decrypted_ssn,
    CASE
        WHEN encrypted_bank_account IS NOT NULL THEN decrypt_pii(encrypted_bank_account)
        ELSE NULL::text
    END AS decrypted_bank_account
FROM members m;

-- Note: v_critical_deadlines view will need manual recreation based on current schema

COMMIT;
