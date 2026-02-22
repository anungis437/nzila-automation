-- Migration: Update documents, reports, and calendar RLS for Session Context
-- Date: February 10, 2026
-- Purpose: Convert member_documents, reports, calendars RLS policies from current_setting('app.current_user_id', true) to session context
-- Related: Migration 0071 (messaging), Migration 0072 (notifications)

-- ============================================================================
-- HELPER FUNCTIONS (should already exist from migration 0071/0072)
-- ============================================================================

-- Ensure helper functions exist
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_organization_id', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 1. MEMBER_DOCUMENTS (or documents) TABLE - SESSION CONTEXT RLS
-- ============================================================================

-- Drop old Supabase auth-based policies
DROP POLICY IF EXISTS "member_documents_own_access" ON documents;
DROP POLICY IF EXISTS "member_documents_org_admin_access" ON documents;
DROP POLICY IF EXISTS "member_documents_own_insert" ON documents;
DROP POLICY IF EXISTS "member_documents_own_update" ON documents;
DROP POLICY IF EXISTS "member_documents_org_admin_update" ON documents;
DROP POLICY IF EXISTS "member_documents_own_delete" ON documents;
DROP POLICY IF EXISTS "member_documents_org_admin_delete" ON documents;

-- Ensure RLS is enabled
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT their own documents
CREATE POLICY "documents_read_own"  ON documents
FOR SELECT
TO public
USING (uploaded_by = current_user_id());

-- Policy 2: Organization admins can SELECT documents in their organization
CREATE POLICY "documents_read_org_admin" ON documents
FOR SELECT
TO public
USING (
  tenant_id = current_tenant_id()
  AND EXISTS (
    SELECT 1 
    FROM organization_users 
    WHERE user_id = current_user_id()
      AND organization_id = current_organization_id()
      AND role IN ('admin', 'officer', 'hr')
      AND status = 'active'
  )
);

-- Policy 3: Users can INSERT their own documents
CREATE POLICY "documents_create_own" ON documents
FOR INSERT
TO public
WITH CHECK (
  uploaded_by = current_user_id()
  AND tenant_id = current_tenant_id()
);

-- Policy 4: Users can UPDATE their own documents
CREATE POLICY "documents_update_own" ON documents
FOR UPDATE
TO public
USING (uploaded_by = current_user_id())
WITH CHECK (uploaded_by = current_user_id());

-- Policy 5: Users can DELETE their own documents
CREATE POLICY "documents_delete_own" ON documents
FOR DELETE
TO public
USING (uploaded_by = current_user_id());

-- ============================================================================
-- 2. REPORTS TABLE - SESSION CONTEXT RLS
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "reports_tenant_isolation" ON reports;
DROP POLICY IF EXISTS "reports_public_access" ON reports;
DROP POLICY IF EXISTS "reports_creator_access" ON reports;
DROP POLICY IF EXISTS "reports_org_admin_access" ON reports;

-- Ensure RLS is enabled
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy 1: Tenant isolation - users can only see reports in their tenant
CREATE POLICY "reports_read_tenant" ON reports
FOR SELECT
TO public
USING (
  tenant_id = current_tenant_id()
  OR is_public = true
);

-- Policy 2: Users can INSERT reports in their tenant
CREATE POLICY "reports_create_tenant" ON reports
FOR INSERT
TO public
WITH CHECK (
  tenant_id = current_tenant_id()
  AND created_by = current_user_id()
);

-- Policy 3: Creators can UPDATE their own reports
CREATE POLICY "reports_update_own" ON reports
FOR UPDATE
TO public
USING (created_by = current_user_id())
WITH CHECK (created_by = current_user_id());

-- Policy 4: Creators can DELETE their own reports
CREATE POLICY "reports_delete_own" ON reports
FOR DELETE
TO public
USING (created_by = current_user_id());

-- ============================================================================
-- 3. REPORT_SHARES TABLE - SESSION CONTEXT RLS
-- ============================================================================

DROP POLICY IF EXISTS "report_shares_participant_access" ON report_shares;
DROP POLICY IF EXISTS "report_shares_owner_manage" ON report_shares;

ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;

-- Policy 1: Participants (sharer and sharee) can view shares
CREATE POLICY "report_shares_read_participant" ON report_shares
FOR SELECT
TO public
USING (
  shared_by = current_user_id()
  OR shared_with = current_user_id()
);

-- Policy 2: Owners can create shares
CREATE POLICY "report_shares_create_owner" ON report_shares
FOR INSERT
TO public
WITH CHECK (
  shared_by = current_user_id()
  AND tenant_id = current_tenant_id()
);

-- Policy 3: Owners can delete shares
CREATE POLICY "report_shares_delete_owner" ON report_shares
FOR DELETE
TO public
USING (shared_by = current_user_id());

-- ============================================================================
-- 4. SCHEDULED_REPORTS TABLE - SESSION CONTEXT RLS
-- ============================================================================

DROP POLICY IF EXISTS "scheduled_reports_creator_access" ON scheduled_reports;
DROP POLICY IF EXISTS "scheduled_reports_admin_access" ON scheduled_reports;

ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Policy 1: Creators can manage their scheduled reports
CREATE POLICY "scheduled_reports_read_own" ON scheduled_reports
FOR SELECT
TO public
USING (created_by = current_user_id());

-- Policy 2: Creators can create scheduled reports
CREATE POLICY "scheduled_reports_create_own" ON scheduled_reports
FOR INSERT
TO public
WITH CHECK (
  created_by = current_user_id()
  AND tenant_id = current_tenant_id()
);

-- Policy 3: Creators can update their scheduled reports
CREATE POLICY "scheduled_reports_update_own" ON scheduled_reports
FOR UPDATE
TO public
USING (created_by = current_user_id())
WITH CHECK (created_by = current_user_id());

-- Policy 4: Creators can delete their scheduled reports
CREATE POLICY "scheduled_reports_delete_own" ON scheduled_reports
FOR DELETE
TO public
USING (created_by = current_user_id());

-- ============================================================================
-- 5. CALENDARS TABLE - SESSION CONTEXT RLS
-- ============================================================================

DROP POLICY IF EXISTS "calendars_owner_access" ON calendars;
DROP POLICY IF EXISTS "calendars_shared_access" ON calendars;
DROP POLICY IF EXISTS "calendars_org_access" ON calendars;

ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;

-- Policy 1: Owners can manage their calendars
CREATE POLICY "calendars_read_own" ON calendars
FOR SELECT
TO public
USING (owner_id = current_user_id());

-- Policy 2: Shared users can view calendars shared with them
CREATE POLICY "calendars_read_shared" ON calendars
FOR SELECT
TO public
USING (
  id IN (
    SELECT calendar_id 
    FROM calendar_sharing 
    WHERE shared_with_user_id = current_user_id()
  )
);

-- Policy 3: Owners can create calendars
CREATE POLICY "calendars_create_own" ON calendars
FOR INSERT
TO public
WITH CHECK (
  owner_id = current_user_id()
  AND tenant_id = current_tenant_id()
);

-- Policy 4: Owners can update their calendars
CREATE POLICY "calendars_update_own" ON calendars
FOR UPDATE
TO public
USING (owner_id = current_user_id())
WITH CHECK (owner_id = current_user_id());

-- Policy 5: Owners can delete their calendars
CREATE POLICY "calendars_delete_own" ON calendars
FOR DELETE
TO public
USING (owner_id = current_user_id());

-- ============================================================================
-- 6. CALENDAR_EVENTS TABLE - SESSION CONTEXT RLS
-- ============================================================================

DROP POLICY IF EXISTS "calendar_events_calendar_access" ON calendar_events;
DROP POLICY IF EXISTS "calendar_events_edit_permission" ON calendar_events;

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policy 1: Calendar owners and shared users can view events
CREATE POLICY "calendar_events_read_access" ON calendar_events
FOR SELECT
TO public
USING (
  calendar_id IN (
    SELECT id FROM calendars 
    WHERE owner_id = current_user_id()
       OR id IN (
         SELECT calendar_id FROM calendar_sharing 
         WHERE shared_with_user_id = current_user_id()
       )
  )
);

-- Policy 2: Calendar owners can create events
CREATE POLICY "calendar_events_create_owner" ON calendar_events
FOR INSERT
TO public
WITH CHECK (
  calendar_id IN (SELECT id FROM calendars WHERE owner_id = current_user_id())
  AND tenant_id = current_tenant_id()
);

-- Policy 3: Users with canCreateEvents permission can create events
CREATE POLICY "calendar_events_create_shared" ON calendar_events
FOR INSERT
TO public
WITH CHECK (
  calendar_id IN (
    SELECT calendar_id FROM calendar_sharing 
    WHERE shared_with_user_id = current_user_id()
      AND can_create_events = true
  )
  AND tenant_id = current_tenant_id()
);

-- Policy 4: Calendar owners can update events
CREATE POLICY "calendar_events_update_owner" ON calendar_events
FOR UPDATE
TO public
USING (
  calendar_id IN (SELECT id FROM calendars WHERE owner_id = current_user_id())
)
WITH CHECK (
  calendar_id IN (SELECT id FROM calendars WHERE owner_id = current_user_id())
);

-- Policy 5: Users with canEditEvents permission can update events
CREATE POLICY "calendar_events_update_shared" ON calendar_events
FOR UPDATE
TO public
USING (
  calendar_id IN (
    SELECT calendar_id FROM calendar_sharing 
    WHERE shared_with_user_id = current_user_id()
      AND can_edit_events = true
  )
)
WITH CHECK (
  calendar_id IN (
    SELECT calendar_id FROM calendar_sharing 
    WHERE shared_with_user_id = current_user_id()
      AND can_edit_events = true
  )
);

-- Policy 6: Calendar owners can delete events
CREATE POLICY "calendar_events_delete_owner" ON calendar_events
FOR DELETE
TO public
USING (
  calendar_id IN (SELECT id FROM calendars WHERE owner_id = current_user_id())
);

-- ============================================================================
-- 7. EVENT_ATTENDEES TABLE - SESSION CONTEXT RLS
-- ============================================================================

DROP POLICY IF EXISTS "event_attendees_self_management" ON event_attendees;
DROP POLICY IF EXISTS "event_attendees_organizer_access" ON event_attendees;

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Policy 1: Attendees can view their own attendance records
CREATE POLICY "event_attendees_read_own" ON event_attendees
FOR SELECT
TO public
USING (user_id = current_user_id() OR email = (SELECT email FROM users WHERE id = current_user_id()));

-- Policy 2: Event organizers can view all attendees
CREATE POLICY "event_attendees_read_organizer" ON event_attendees
FOR SELECT
TO public
USING (
  event_id IN (
    SELECT ce.id FROM calendar_events ce
    INNER JOIN calendars c ON ce.calendar_id = c.id
    WHERE c.owner_id = current_user_id()
  )
);

-- Policy 3: Organizers can add attendees
CREATE POLICY "event_attendees_create_organizer" ON event_attendees
FOR INSERT
TO public
WITH CHECK (
  event_id IN (
    SELECT ce.id FROM calendar_events ce
    INNER JOIN calendars c ON ce.calendar_id = c.id
    WHERE c.owner_id = current_user_id()
  )
  AND tenant_id = current_tenant_id()
);

-- Policy 4: Attendees can update their own RSVP status
CREATE POLICY "event_attendees_update_own" ON event_attendees
FOR UPDATE
TO public
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

-- Policy 5: Organizers can update attendee records
CREATE POLICY "event_attendees_update_organizer" ON event_attendees
FOR UPDATE
TO public
USING (
  event_id IN (
    SELECT ce.id FROM calendar_events ce
    INNER JOIN calendars c ON ce.calendar_id = c.id
    WHERE c.owner_id = current_user_id()
  )
)
WITH CHECK (
  event_id IN (
    SELECT ce.id FROM calendar_events ce
    INNER JOIN calendars c ON ce.calendar_id = c.id
    WHERE c.owner_id = current_user_id()
  )
);

-- Policy 6: Organizers can remove attendees
CREATE POLICY "event_attendees_delete_organizer" ON event_attendees
FOR DELETE
TO public
USING (
  event_id IN (
    SELECT ce.id FROM calendar_events ce
    INNER JOIN calendars c ON ce.calendar_id = c.id
    WHERE c.owner_id = current_user_id()
  )
);

-- ============================================================================
-- 8. CALENDAR_SHARING TABLE - SESSION CONTEXT RLS
-- ============================================================================

DROP POLICY IF EXISTS "calendar_sharing_owner_manage" ON calendar_sharing;
DROP POLICY IF EXISTS "calendar_sharing_participant_view" ON calendar_sharing;

ALTER TABLE calendar_sharing ENABLE ROW LEVEL SECURITY;

-- Policy 1: Calendar owners and shared users can view sharing records
CREATE POLICY "calendar_sharing_read_participant" ON calendar_sharing
FOR SELECT
TO public
USING (
  invited_by = current_user_id()
  OR shared_with_user_id = current_user_id()
);

-- Policy 2: Calendar owners can create shares
CREATE POLICY "calendar_sharing_create_owner" ON calendar_sharing
FOR INSERT
TO public
WITH CHECK (
  calendar_id IN (SELECT id FROM calendars WHERE owner_id = current_user_id())
  AND invited_by = current_user_id()
  AND tenant_id = current_tenant_id()
);

-- Policy 3: Calendar owners can update shares
CREATE POLICY "calendar_sharing_update_owner" ON calendar_sharing
FOR UPDATE
TO public
USING (
  calendar_id IN (SELECT id FROM calendars WHERE owner_id = current_user_id())
)
WITH CHECK (
  calendar_id IN (SELECT id FROM calendars WHERE owner_id = current_user_id())
);

-- Policy 4: Calendar owners can delete shares
CREATE POLICY "calendar_sharing_delete_owner" ON calendar_sharing
FOR DELETE
TO public
USING (
  calendar_id IN (SELECT id FROM calendars WHERE owner_id = current_user_id())
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is enabled on all tables
DO $$
DECLARE
  tbl_name TEXT;
  tbl_rls BOOLEAN;
BEGIN
  FOR tbl_name IN 
    SELECT unnest(ARRAY[
      'documents',
      'reports',
      'report_shares', 
      'scheduled_reports',
      'calendars',
      'calendar_events',
      'event_attendees',
      'calendar_sharing'
    ])
  LOOP
    SELECT rowsecurity INTO tbl_rls
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = tbl_name;
    
    IF tbl_rls THEN
      RAISE NOTICE '✓ RLS enabled on %', tbl_name;
    ELSE
      RAISE WARNING '✗ RLS NOT enabled on %', tbl_name;
    END IF;
  END LOOP;
END $$;

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 0073 Complete';
  RAISE NOTICE 'Updated RLS policies for:';
  RAISE NOTICE '  - documents (member_documents)';
  RAISE NOTICE '  - reports';
  RAISE NOTICE '  - report_shares'; 
  RAISE NOTICE '  - scheduled_reports';
  RAISE NOTICE '  - calendars';
  RAISE NOTICE '  - calendar_events';
  RAISE NOTICE '  - event_attendees';
  RAISE NOTICE '  - calendar_sharing';
  RAISE NOTICE '========================================';
END $$;
