-- Migration 0055: Align User IDs to Clerk varchar(255) format
-- This migration converts UUID user identifier columns to varchar(255)
-- COMPREHENSIVE APPROACH: Root conversion (users.user_id) first, then all references

BEGIN;

-- =============================================================================
-- STEP 1: Drop all views that depend on affected columns (CASCADE for complete cleanup)
-- =============================================================================

DROP VIEW IF EXISTS v_member_training_transcript CASCADE;
DROP VIEW IF EXISTS v_member_education_summary CASCADE;
DROP VIEW IF EXISTS v_member_certification_status CASCADE;
DROP VIEW IF EXISTS v_member_course_history CASCADE;
DROP VIEW IF EXISTS v_training_analytics CASCADE;
DROP VIEW IF EXISTS v_member_skills CASCADE;
DROP VIEW IF EXISTS v_certification_expiry_tracking CASCADE;
DROP VIEW IF EXISTS v_course_session_dashboard CASCADE;
DROP VIEW IF EXISTS v_training_program_progress CASCADE;

-- =============================================================================
-- STEP 2: Drop ALL foreign key constraints on affected tables
-- =============================================================================

-- FK constraints referencing public.users.user_id
ALTER TABLE public.oauth_providers DROP CONSTRAINT IF EXISTS oauth_providers_user_id_users_user_id_fk;
ALTER TABLE public.tenant_users DROP CONSTRAINT IF EXISTS tenant_users_invited_by_users_user_id_fk;
ALTER TABLE public.user_sessions DROP CONSTRAINT IF EXISTS user_sessions_user_id_users_user_id_fk;
ALTER TABLE audit_security.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_users_user_id_fk;
ALTER TABLE audit_security.security_events DROP CONSTRAINT IF EXISTS security_events_user_id_users_user_id_fk;
ALTER TABLE audit_security.security_events DROP CONSTRAINT IF EXISTS security_events_resolved_by_users_user_id_fk;
ALTER TABLE claims DROP CONSTRAINT IF EXISTS fk_claims_member;
ALTER TABLE claims DROP CONSTRAINT IF EXISTS fk_claims_assigned_to;
ALTER TABLE claim_updates DROP CONSTRAINT IF EXISTS fk_claim_updates_user;

-- FK constraints on other affected tables
ALTER TABLE course_registrations DROP CONSTRAINT IF EXISTS course_registrations_member_id_fkey;
ALTER TABLE member_certifications DROP CONSTRAINT IF EXISTS member_certifications_member_id_fkey;
ALTER TABLE member_certifications DROP CONSTRAINT IF EXISTS member_certifications_verified_by_fkey;
ALTER TABLE program_enrollments DROP CONSTRAINT IF EXISTS program_enrollments_member_id_fkey;

-- =============================================================================
-- STEP 3: Drop all RLS policies on affected tables
-- =============================================================================

-- Users table policies
DROP POLICY IF EXISTS users_own_record ON public.users;
DROP POLICY IF EXISTS users_admin_access ON public.users;
DROP POLICY IF EXISTS users_tenant_access ON public.users;

-- OAuth providers policies
DROP POLICY IF EXISTS oauth_own_providers ON public.oauth_providers;

-- Tenant users policies
DROP POLICY IF EXISTS tenant_users_own_record ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_admin_access ON public.tenant_users;

-- User sessions policies
DROP POLICY IF EXISTS user_sessions_own_records ON public.user_sessions;

-- Audit logs policies
DROP POLICY IF EXISTS audit_logs_admin_access ON audit_security.audit_logs;

-- Security events policies
DROP POLICY IF EXISTS security_events_admin_access ON audit_security.security_events;

-- Course registrations policies
DROP POLICY IF EXISTS select_course_registrations ON course_registrations;
DROP POLICY IF EXISTS insert_course_registrations ON course_registrations;
DROP POLICY IF EXISTS update_course_registrations ON course_registrations;
DROP POLICY IF EXISTS delete_course_registrations ON course_registrations;
DROP POLICY IF EXISTS manage_course_registrations ON course_registrations;

-- Member certifications policies
DROP POLICY IF EXISTS select_member_certifications ON member_certifications;
DROP POLICY IF EXISTS manage_member_certifications ON member_certifications;
DROP POLICY IF EXISTS insert_member_certifications ON member_certifications;
DROP POLICY IF EXISTS update_member_certifications ON member_certifications;
DROP POLICY IF EXISTS delete_member_certifications ON member_certifications;

-- Program enrollments policies
DROP POLICY IF EXISTS select_program_enrollments ON program_enrollments;
DROP POLICY IF EXISTS insert_program_enrollments ON program_enrollments;
DROP POLICY IF EXISTS update_program_enrollments ON program_enrollments;
DROP POLICY IF EXISTS delete_program_enrollments ON program_enrollments;
DROP POLICY IF EXISTS manage_program_enrollments ON program_enrollments;

-- Claims policies (all policies to ensure no dependencies)
DROP POLICY IF EXISTS claims_hierarchical_insert ON claims;
DROP POLICY IF EXISTS claims_hierarchical_select ON claims;
DROP POLICY IF EXISTS claims_hierarchical_update ON claims;
DROP POLICY IF EXISTS select_claims ON claims;
DROP POLICY IF EXISTS insert_claims ON claims;
DROP POLICY IF EXISTS update_claims ON claims;
DROP POLICY IF EXISTS delete_claims ON claims;

-- Claim updates policies
DROP POLICY IF EXISTS claim_updates_access ON claim_updates;
DROP POLICY IF EXISTS claim_updates_insert ON claim_updates;

-- =============================================================================
-- STEP 4: Convert public.users.user_id (ROOT TABLE - convert FIRST)
-- =============================================================================

ALTER TABLE public.users 
  ALTER COLUMN user_id TYPE varchar(255);

-- =============================================================================
-- STEP 5: Convert all columns that reference public.users.user_id
-- =============================================================================

-- OAuth providers
ALTER TABLE public.oauth_providers 
  ALTER COLUMN user_id TYPE varchar(255);

-- Tenant users (invited_by references users.user_id)
ALTER TABLE public.tenant_users 
  ALTER COLUMN invited_by TYPE varchar(255);

-- User sessions
ALTER TABLE public.user_sessions 
  ALTER COLUMN user_id TYPE varchar(255);

-- Audit logs
ALTER TABLE audit_security.audit_logs 
  ALTER COLUMN user_id TYPE varchar(255);

-- Security events
ALTER TABLE audit_security.security_events 
  ALTER COLUMN user_id TYPE varchar(255),
  ALTER COLUMN resolved_by TYPE varchar(255);

-- Claims
ALTER TABLE claims 
  ALTER COLUMN member_id TYPE varchar(255),
  ALTER COLUMN assigned_to TYPE varchar(255);

-- Claim updates
ALTER TABLE claim_updates 
  ALTER COLUMN created_by TYPE varchar(255);

-- =============================================================================
-- STEP 6: Convert other user-related columns that may reference user IDs
-- =============================================================================

-- Course registrations
ALTER TABLE course_registrations 
  ALTER COLUMN member_id TYPE varchar(255);

-- Member certifications
ALTER TABLE member_certifications 
  ALTER COLUMN member_id TYPE varchar(255),
  ALTER COLUMN verified_by TYPE varchar(255);

-- Program enrollments
ALTER TABLE program_enrollments 
  ALTER COLUMN member_id TYPE varchar(255);

-- Tenant configurations (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'tenant_management' AND table_name = 'tenant_configurations') THEN
    ALTER TABLE -- DISABLED: tenant_management.tenant_configurations ALTER COLUMN updated_by TYPE varchar(255);
  END IF;
END $$;

-- =============================================================================
-- STEP 7: Handle optional tables (grievance, traditional knowledge, etc.)
-- =============================================================================

DO $$
BEGIN
  -- Grievance assignments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grievance_assignments') THEN
    DROP POLICY IF EXISTS grievance_assignments_access ON grievance_assignments;
    ALTER TABLE grievance_assignments DROP CONSTRAINT IF EXISTS grievance_assignments_assigned_to_fkey;
    ALTER TABLE grievance_assignments DROP CONSTRAINT IF EXISTS grievance_assignments_assigned_by_fkey;
    ALTER TABLE grievance_assignments
      ALTER COLUMN assigned_to TYPE varchar(255),
      ALTER COLUMN assigned_by TYPE varchar(255);
  END IF;

  -- Grievance documents
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grievance_documents') THEN
    DROP POLICY IF EXISTS grievance_documents_access ON grievance_documents;
    ALTER TABLE grievance_documents DROP CONSTRAINT IF EXISTS grievance_documents_signed_by_fkey;
    ALTER TABLE grievance_documents DROP CONSTRAINT IF EXISTS grievance_documents_uploaded_by_fkey;
    ALTER TABLE grievance_documents DROP CONSTRAINT IF EXISTS grievance_documents_reviewed_by_fkey;
    ALTER TABLE grievance_documents
      ALTER COLUMN signed_by TYPE varchar(255),
      ALTER COLUMN uploaded_by TYPE varchar(255),
      ALTER COLUMN reviewed_by TYPE varchar(255);
  END IF;

  -- Grievance settlements
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grievance_settlements') THEN
    DROP POLICY IF EXISTS grievance_settlements_access ON grievance_settlements;
    ALTER TABLE grievance_settlements DROP CONSTRAINT IF EXISTS grievance_settlements_proposed_by_user_fkey;
    ALTER TABLE grievance_settlements DROP CONSTRAINT IF EXISTS grievance_settlements_responded_by_user_fkey;
    ALTER TABLE grievance_settlements DROP CONSTRAINT IF EXISTS grievance_settlements_union_approved_by_fkey;
    ALTER TABLE grievance_settlements DROP CONSTRAINT IF EXISTS grievance_settlements_management_approved_by_fkey;
    ALTER TABLE grievance_settlements DROP CONSTRAINT IF EXISTS grievance_settlements_finalized_by_fkey;
    ALTER TABLE grievance_settlements
      ALTER COLUMN proposed_by_user TYPE varchar(255),
      ALTER COLUMN responded_by_user TYPE varchar(255),
      ALTER COLUMN union_approved_by TYPE varchar(255),
      ALTER COLUMN management_approved_by TYPE varchar(255),
      ALTER COLUMN finalized_by TYPE varchar(255);
  END IF;

  -- Grievance communications
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grievance_communications') THEN
    DROP POLICY IF EXISTS grievance_communications_access ON grievance_communications;
    ALTER TABLE grievance_communications DROP CONSTRAINT IF EXISTS grievance_communications_from_user_id_fkey;
    ALTER TABLE grievance_communications DROP CONSTRAINT IF EXISTS grievance_communications_recorded_by_fkey;
    ALTER TABLE grievance_communications
      ALTER COLUMN from_user_id TYPE varchar(255),
      ALTER COLUMN to_user_ids TYPE varchar(255)[] USING ARRAY(SELECT unnest(to_user_ids)::text),
      ALTER COLUMN recorded_by TYPE varchar(255);
  END IF;

  -- Traditional knowledge registry
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'traditional_knowledge_registry') THEN
    DROP POLICY IF EXISTS traditional_knowledge_access ON traditional_knowledge_registry;
    ALTER TABLE traditional_knowledge_registry DROP CONSTRAINT IF EXISTS traditional_knowledge_primary_keeper_fkey;
    ALTER TABLE traditional_knowledge_registry
      ALTER COLUMN primary_keeper_user_id TYPE varchar(255);
  END IF;
END $$;

-- =============================================================================
-- STEP 8: Recreate critical FK constraints
-- =============================================================================

-- Re-establish FK constraints referencing public.users.user_id (now varchar)
ALTER TABLE public.oauth_providers
  ADD CONSTRAINT oauth_providers_user_id_users_user_id_fk
  FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE public.tenant_users
  ADD CONSTRAINT tenant_users_invited_by_users_user_id_fk
  FOREIGN KEY (invited_by) REFERENCES public.users(user_id);

ALTER TABLE public.user_sessions
  ADD CONSTRAINT user_sessions_user_id_users_user_id_fk
  FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE audit_security.audit_logs
  ADD CONSTRAINT audit_logs_user_id_users_user_id_fk
  FOREIGN KEY (user_id) REFERENCES public.users(user_id);

ALTER TABLE audit_security.security_events
  ADD CONSTRAINT security_events_user_id_users_user_id_fk
  FOREIGN KEY (user_id) REFERENCES public.users(user_id);

ALTER TABLE audit_security.security_events
  ADD CONSTRAINT security_events_resolved_by_users_user_id_fk
  FOREIGN KEY (resolved_by) REFERENCES public.users(user_id);

ALTER TABLE claims
  ADD CONSTRAINT fk_claims_member
  FOREIGN KEY (member_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE claims
  ADD CONSTRAINT fk_claims_assigned_to
  FOREIGN KEY (assigned_to) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE claim_updates
  ADD CONSTRAINT fk_claim_updates_user
  FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- Note: We do NOT recreate FK constraints for course_registrations, member_certifications,
-- program_enrollments yet until we determine the correct parent table (users vs members)

-- =============================================================================
-- STEP 9: Recreate basic RLS policies for affected tables
-- Simplified policies for essential security. Expand as needed for production.
-- =============================================================================

-- Users table policies
CREATE POLICY users_own_record ON public.users
  FOR ALL
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Claims RLS (org-based isolation)
CREATE POLICY claims_hierarchical_select ON claims
  FOR SELECT
  USING (
    organization_id::text IN (
      SELECT DISTINCT COALESCE(tenant_id::text, organization_id)
      FROM organization_members
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND status = 'active'
    )
  );

CREATE POLICY claims_hierarchical_insert ON claims
  FOR INSERT
  WITH CHECK (
    organization_id::text IN (
      SELECT DISTINCT COALESCE(tenant_id::text, organization_id)
      FROM organization_members
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND status = 'active'
    )
  );

CREATE POLICY claims_hierarchical_update ON claims
  FOR UPDATE
  USING (
    organization_id::text IN (
      SELECT DISTINCT COALESCE(tenant_id::text, organization_id)
      FROM organization_members
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND status = 'active'
    )
  );

COMMIT;

-- =============================================================================
-- Migration 0055 complete!
-- 
-- Summary:
-- - Converted public.users.user_id from UUID to varchar(255)
-- - Converted all referencing columns to varchar(255)
-- - Recreated essential FK constraints
-- - Recreated basic RLS policies (expand as needed)
-- 
-- Next steps:
-- 1. Run validation: pnpm tsx scripts/validate-clerk-user-ids.ts
-- 2. Verify application authentication flow
-- 3. Test claims CRUD operations
-- 4. Restore any custom views if necessary
-- 5. Add additional RLS policies for INSERT/UPDATE/DELETE as required
-- =============================================================================

