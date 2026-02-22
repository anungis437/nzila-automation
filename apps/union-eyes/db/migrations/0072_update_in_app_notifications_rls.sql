-- Migration: Update in_app_notifications RLS for Session Context
-- Date: February 10, 2026
-- Purpose: Convert in_app_notifications RLS policies from current_setting('app.current_user_id', true) to session context
-- Related: Migration 0071 (messaging tables), Migration 0052 (original policies)

-- ============================================================================
-- HELPER FUNCTIONS (should already exist from migration 0071)
-- ============================================================================

-- Create helper function to get current user ID from session context
-- This replaces current_setting('app.current_user_id', true) for Azure PostgreSQL compatibility
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create helper function to get current organization ID from session context
CREATE OR REPLACE FUNCTION current_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_organization_id', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- DROP OLD SUPABASE AUTH-BASED POLICIES (if they exist)
-- ============================================================================

DROP POLICY IF EXISTS "notifications_own_user_only" ON in_app_notifications;
DROP POLICY IF EXISTS "notifications_own_insert" ON in_app_notifications;
DROP POLICY IF EXISTS "notifications_own_update" ON in_app_notifications;
DROP POLICY IF EXISTS "notifications_own_delete" ON in_app_notifications;

-- ============================================================================
-- IN_APP_NOTIFICATIONS TABLE - NEW SESSION CONTEXT RLS POLICIES
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can only SELECT their own notifications
CREATE POLICY "in_app_notifications_read_own" ON in_app_notifications
FOR SELECT
TO public
USING (user_id = current_user_id());

-- Policy 2: System can create notifications for users
-- Allow creation but enforce read isolation via user_id
CREATE POLICY "in_app_notifications_create_system" ON in_app_notifications
FOR INSERT
TO public
WITH CHECK (true); -- Allow creation, RLS enforces read isolation

-- Policy 3: Users can UPDATE their own notifications (mark as read, archive, etc)
CREATE POLICY "in_app_notifications_update_own" ON in_app_notifications
FOR UPDATE
TO public
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

-- Policy 4: Users can DELETE their own notifications
CREATE POLICY "in_app_notifications_delete_own" ON in_app_notifications
FOR DELETE
TO public
USING (user_id = current_user_id());

-- Policy 5: Organization admins can view notifications in their org
-- This allows org admins to see notification activity for support/audit purposes
CREATE POLICY "in_app_notifications_org_admin_read" ON in_app_notifications
FOR SELECT
TO public
USING (
  organization_id = current_organization_id()
  AND EXISTS (
    SELECT 1 
    FROM organization_users 
    WHERE user_id = current_user_id()
      AND organization_id = in_app_notifications.organization_id
      AND role IN ('admin', 'officer')
      AND status = 'active'
  )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'in_app_notifications' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on in_app_notifications';
  END IF;
  
  RAISE NOTICE 'RLS verification complete: in_app_notifications table secured';
END $$;

-- Verify policies exist
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
  AND tablename = 'in_app_notifications';
  
  IF policy_count < 5 THEN
    RAISE WARNING 'Expected 5 policies on in_app_notifications, found %', policy_count;
  ELSE
    RAISE NOTICE '% RLS policies verified on in_app_notifications', policy_count;
  END IF;
END $$;
