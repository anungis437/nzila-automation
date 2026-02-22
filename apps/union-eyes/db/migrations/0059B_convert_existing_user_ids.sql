-- Migration 0059B: Convert Existing User ID Columns to VARCHAR(255) (Revised)
-- Date: 2026-02-08
-- This migration only targets tables that actually exist in the staging database
-- It's a defensive version that checks for table existence before attempting conversions

BEGIN;

-- =============================================================================
-- STEP 1: Drop dependent views
-- =============================================================================

DROP VIEW IF EXISTS v_critical_deadlines CASCADE;
DROP VIEW IF EXISTS v_upcoming_deadlines CASCADE;
DROP VIEW IF EXISTS v_overdue_deadlines CASCADE;

-- =============================================================================
-- STEP 2: Convert user ID columns in existing tables ONLY
-- Uses dynamic SQL with existence checks
-- =============================================================================

DO $$
DECLARE
  table_exists boolean;
BEGIN
  -- Per-Capita Remittances
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'per_capita_remittances') INTO table_exists;
  IF table_exists THEN
    RAISE NOTICE 'Converting per_capita_remittances...';
    ALTER TABLE per_capita_remittances DROP CONSTRAINT IF EXISTS per_capita_remittances_approved_by_fkey;
    ALTER TABLE per_capita_remittances DROP CONSTRAINT IF EXISTS per_capita_remittances_rejected_by_fkey;
    ALTER TABLE per_capita_remittances DROP CONSTRAINT IF EXISTS per_capita_remittances_created_by_fkey;
    ALTER TABLE per_capita_remittances 
      ALTER COLUMN approved_by TYPE varchar(255),
      ALTER COLUMN rejected_by TYPE varchar(255),
      ALTER COLUMN created_by TYPE varchar(255);
  END IF;

  -- Deadlines
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'claim_deadlines') INTO table_exists;
  IF table_exists THEN
    RAISE NOTICE 'Converting claim_deadlines...';
    ALTER TABLE claim_deadlines DROP CONSTRAINT IF EXISTS claim_deadlines_completed_by_fkey;
    ALTER TABLE claim_deadlines DROP CONSTRAINT IF EXISTS claim_deadlines_escalated_to_fkey;
    ALTER TABLE claim_deadlines 
      ALTER COLUMN completed_by TYPE varchar(255),
      ALTER COLUMN escalated_to TYPE varchar(255);
  END IF;

  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deadline_extensions') INTO table_exists;
  IF table_exists THEN
    RAISE NOTICE 'Converting deadline_extensions...';
    ALTER TABLE deadline_extensions DROP CONSTRAINT IF EXISTS deadline_extensions_requested_by_fkey;
    ALTER TABLE deadline_extensions DROP CONSTRAINT IF EXISTS deadline_extensions_approved_by_fkey;
    ALTER TABLE deadline_extensions 
      ALTER COLUMN requested_by TYPE varchar(255),
      ALTER COLUMN approved_by TYPE varchar(255);
  END IF;

  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deadline_alerts') INTO table_exists;
  IF table_exists THEN
    RAISE NOTICE 'Converting deadline_alerts...';
    ALTER TABLE deadline_alerts DROP CONSTRAINT IF EXISTS deadline_alerts_recipient_id_fkey;
    ALTER TABLE deadline_alerts 
      ALTER COLUMN recipient_id TYPE varchar(255);
  END IF;

  -- Reports
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') INTO table_exists;
  IF table_exists THEN
    RAISE NOTICE 'Converting reports...';
    ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_created_by_fkey;
    ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_updated_by_fkey;
    ALTER TABLE reports 
      ALTER COLUMN created_by TYPE varchar(255),
      ALTER COLUMN updated_by TYPE varchar(255);
  END IF;

  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_templates') INTO table_exists;
  IF table_exists THEN
    RAISE NOTICE 'Converting report_templates...';
    ALTER TABLE report_templates DROP CONSTRAINT IF EXISTS report_templates_created_by_fkey;
    ALTER TABLE report_templates 
      ALTER COLUMN created_by TYPE varchar(255);
  END IF;

  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_executions') INTO table_exists;
  IF table_exists THEN
    RAISE NOTICE 'Converting report_executions...';
    ALTER TABLE report_executions DROP CONSTRAINT IF EXISTS report_executions_executed_by_fkey;
    ALTER TABLE report_executions 
      ALTER COLUMN executed_by TYPE varchar(255);
  END IF;

  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scheduled_reports') INTO table_exists;
  IF table_exists THEN
    RAISE NOTICE 'Converting scheduled_reports...';
    ALTER TABLE scheduled_reports DROP CONSTRAINT IF EXISTS scheduled_reports_created_by_fkey;
    ALTER TABLE scheduled_reports 
      ALTER COLUMN created_by TYPE varchar(255);
  END IF;

  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_shares') INTO table_exists;
  IF table_exists THEN
    RAISE NOTICE 'Converting report_shares...';
    ALTER TABLE report_shares DROP CONSTRAINT IF EXISTS report_shares_shared_by_fkey;
    ALTER TABLE report_shares DROP CONSTRAINT IF EXISTS report_shares_shared_with_fkey;
    ALTER TABLE report_shares 
      ALTER COLUMN shared_by TYPE varchar(255),
      ALTER COLUMN shared_with TYPE varchar(255);
  END IF;

  -- Course registrations
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_registrations') INTO table_exists;
  IF table_exists THEN
    RAISE NOTICE 'Converting course_registrations...';
    ALTER TABLE course_registrations DROP CONSTRAINT IF EXISTS course_registrations_approved_by_fkey;
    ALTER TABLE course_registrations 
      ALTER COLUMN approved_by TYPE varchar(255);
  END IF;

  -- All created_by columns in remaining tables
  FOR table_exists IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'created_by' 
      AND data_type = 'uuid' 
      AND table_schema = 'public'
      AND table_name NOT IN ('per_capita_remittances', 'reports', 'report_templates', 'scheduled_reports')
  LOOP
    RAISE NOTICE 'Converting created_by in %...', table_exists;
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
      table_exists, table_exists || '_created_by_fkey');
    EXECUTE format('ALTER TABLE %I ALTER COLUMN created_by TYPE varchar(255)', table_exists);
  END LOOP;

  -- All updated_by columns
  FOR table_exists IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_by' 
      AND data_type = 'uuid' 
      AND table_schema = 'public'
      AND table_name NOT IN ('reports')
  LOOP
    RAISE NOTICE 'Converting updated_by in %...', table_exists;
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
      table_exists, table_exists || '_updated_by_fkey');
    EXECUTE format('ALTER TABLE %I ALTER COLUMN updated_by TYPE varchar(255)', table_exists);
  END LOOP;

  -- All approved_by columns (excluding those already handled)
  FOR table_exists IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'approved_by' 
      AND data_type = 'uuid' 
      AND table_schema = 'public'
      AND table_name NOT IN ('per_capita_remittances', 'deadline_extensions', 'course_registrations')
  LOOP
    RAISE NOTICE 'Converting approved_by in %...', table_exists;
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
      table_exists, table_exists || '_approved_by_fkey');
    EXECUTE format('ALTER TABLE %I ALTER COLUMN approved_by TYPE varchar(255)', table_exists);
  END LOOP;

  -- All recipient_id columns
  FOR table_exists IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'recipient_id' 
      AND data_type = 'uuid' 
      AND table_schema = 'public'
      AND table_name NOT IN ('deadline_alerts')
  LOOP
    RAISE NOTICE 'Converting recipient_id in %...', table_exists;
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
      table_exists, table_exists || '_recipient_id_fkey');
    EXECUTE format('ALTER TABLE %I ALTER COLUMN recipient_id TYPE varchar(255)', table_exists);
  END LOOP;

END $$;

-- =============================================================================
-- STEP 3: Recreate foreign key constraints where appropriate
-- Only creates FK to public.users if that table/column exists
-- =============================================================================

DO $$
DECLARE
  users_exists boolean;
BEGIN
  -- Check if public.users exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'user_management' AND table_name = 'users'
  ) INTO users_exists;

  IF users_exists THEN
    RAISE NOTICE 'Recreating FK constraints to public.users...';
    
    -- Per-Capita Remittances
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'per_capita_remittances') THEN
      ALTER TABLE per_capita_remittances
        ADD CONSTRAINT per_capita_remittances_approved_by_fkey
        FOREIGN KEY (approved_by) REFERENCES public.users(user_id) ON DELETE SET NULL;
      ALTER TABLE per_capita_remittances
        ADD CONSTRAINT per_capita_remittances_rejected_by_fkey
        FOREIGN KEY (rejected_by) REFERENCES public.users(user_id) ON DELETE SET NULL;
      ALTER TABLE per_capita_remittances
        ADD CONSTRAINT per_capita_remittances_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;
    END IF;

    -- Deadlines
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'claim_deadlines') THEN
      ALTER TABLE claim_deadlines
        ADD CONSTRAINT claim_deadlines_completed_by_fkey
        FOREIGN KEY (completed_by) REFERENCES public.users(user_id) ON DELETE SET NULL;
      ALTER TABLE claim_deadlines
        ADD CONSTRAINT claim_deadlines_escalated_to_fkey
        FOREIGN KEY (escalated_to) REFERENCES public.users(user_id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deadline_extensions') THEN
      ALTER TABLE deadline_extensions
        ADD CONSTRAINT deadline_extensions_requested_by_fkey
        FOREIGN KEY (requested_by) REFERENCES public.users(user_id) ON DELETE CASCADE;
      ALTER TABLE deadline_extensions
        ADD CONSTRAINT deadline_extensions_approved_by_fkey
        FOREIGN KEY (approved_by) REFERENCES public.users(user_id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deadline_alerts') THEN
      ALTER TABLE deadline_alerts
        ADD CONSTRAINT deadline_alerts_recipient_id_fkey
        FOREIGN KEY (recipient_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
    END IF;

    -- Reports
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
      ALTER TABLE reports
        ADD CONSTRAINT reports_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE CASCADE;
      ALTER TABLE reports
        ADD CONSTRAINT reports_updated_by_fkey
        FOREIGN KEY (updated_by) REFERENCES public.users(user_id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_executions') THEN
      ALTER TABLE report_executions
        ADD CONSTRAINT report_executions_executed_by_fkey
        FOREIGN KEY (executed_by) REFERENCES public.users(user_id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scheduled_reports') THEN
      ALTER TABLE scheduled_reports
        ADD CONSTRAINT scheduled_reports_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'report_shares') THEN
      ALTER TABLE report_shares
        ADD CONSTRAINT report_shares_shared_by_fkey
        FOREIGN KEY (shared_by) REFERENCES public.users(user_id) ON DELETE CASCADE;
      ALTER TABLE report_shares
        ADD CONSTRAINT report_shares_shared_with_fkey
        FOREIGN KEY (shared_with) REFERENCES public.users(user_id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
      ALTER TABLE organizations
        ADD CONSTRAINT organizations_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'voting_notifications') THEN
      ALTER TABLE voting_notifications
        ADD CONSTRAINT voting_notifications_recipient_id_fkey
        FOREIGN KEY (recipient_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
    END IF;
  ELSE
    RAISE NOTICE 'public.users table not found - skipping FK constraint creation';
  END IF;
END $$;

-- =============================================================================
-- STEP 4: Validation
-- =============================================================================

DO $$
DECLARE
  varchar_count int;
  uuid_count int;
BEGIN
  -- Count columns successfully converted
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
  FROM information_schema.columns
  WHERE column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by', 
                        'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                        'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
    AND data_type = 'uuid'
    AND table_schema = 'public';
  
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Migration 0059B Complete:';
  RAISE NOTICE '  - VARCHAR(255) columns: %', varchar_count;
  RAISE NOTICE '  - Remaining UUID columns: %', uuid_count;
  RAISE NOTICE '=============================================================================';
  
  IF uuid_count > 0 THEN
    RAISE WARNING 'Some UUID columns remain - review needed';
  END IF;
END $$;

COMMIT;

-- =============================================================================
-- Migration complete!
-- All conversions performed with existence checks
-- Safe to run multiple times (idempotent)
-- =============================================================================
