-- Migration: Add Row-Level Security Policies for Notifications and Documents
-- Date: February 6, 2026
-- Priority: CRITICAL - Personal data exposure risk
-- Severity: 🔴 CRITICAL DATA EXPOSURE

-- ============================================================================
-- 1. IN_APP_NOTIFICATIONS TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS on in_app_notifications table
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can only SELECT their own notifications
CREATE POLICY "notifications_own_user_only" ON in_app_notifications
FOR SELECT
TO public
USING (user_id = current_setting('app.current_user_id', true));

-- Policy 2: Users can only INSERT their own notifications (system/app generated)
CREATE POLICY "notifications_own_insert" ON in_app_notifications
FOR INSERT
TO public
WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Policy 3: Users can UPDATE their own notifications (mark as read, archive, etc)
CREATE POLICY "notifications_own_update" ON in_app_notifications
FOR UPDATE
TO public
USING (user_id = current_setting('app.current_user_id', true));

-- Policy 4: Users can DELETE their own notifications
CREATE POLICY "notifications_own_delete" ON in_app_notifications
FOR DELETE
TO public
USING (user_id = current_setting('app.current_user_id', true));

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_id ON in_app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_id_created_at ON in_app_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_is_read ON in_app_notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_is_archived ON in_app_notifications(is_archived) WHERE is_archived = false;

-- ============================================================================
-- 2. MEMBER_DOCUMENTS TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS on member_documents table
ALTER TABLE member_documents ENABLE ROW LEVEL SECURITY;

-- Policy 1: Members can SELECT their own documents
CREATE POLICY "member_documents_own_access" ON member_documents
FOR SELECT
TO public
USING (
  member_id IN (
    SELECT id FROM members WHERE user_id = current_setting('app.current_user_id', true)
  )
);

-- Policy 2: Organization admins/officers can SELECT documents in their organization
CREATE POLICY "member_documents_org_admin_access" ON member_documents
FOR SELECT
TO public
USING (
  member_id IN (
    SELECT m.id 
    FROM members m
    INNER JOIN organization_members om ON m.organization_id = om.organization_id
    WHERE om.user_id = current_setting('app.current_user_id', true) 
      AND om.role IN ('admin', 'officer', 'hr')
      AND om.status = 'active'
  )
);

-- Policy 3: Members can INSERT their own documents
CREATE POLICY "member_documents_own_insert" ON member_documents
FOR INSERT
TO public
WITH CHECK (
  member_id IN (
    SELECT id FROM members WHERE user_id = current_setting('app.current_user_id', true)
  )
);

-- Policy 4: Members can UPDATE their own documents
CREATE POLICY "member_documents_own_update" ON member_documents
FOR UPDATE
TO public
USING (
  member_id IN (
    SELECT id FROM members WHERE user_id = current_setting('app.current_user_id', true)
  )
)
WITH CHECK (
  member_id IN (
    SELECT id FROM members WHERE user_id = current_setting('app.current_user_id', true)
  )
);

-- Policy 5: Org admins/officers can UPDATE documents in their organization
CREATE POLICY "member_documents_org_admin_update" ON member_documents
FOR UPDATE
TO public
USING (
  member_id IN (
    SELECT m.id 
    FROM members m
    INNER JOIN organization_members om ON m.organization_id = om.organization_id
    WHERE om.user_id = current_setting('app.current_user_id', true) 
      AND om.role IN ('admin', 'officer', 'hr')
      AND om.status = 'active'
  )
)
WITH CHECK (
  member_id IN (
    SELECT m.id 
    FROM members m
    INNER JOIN organization_members om ON m.organization_id = om.organization_id
    WHERE om.user_id = current_setting('app.current_user_id', true) 
      AND om.role IN ('admin', 'officer', 'hr')
      AND om.status = 'active'
  )
);

-- Policy 6: Members can DELETE their own documents
CREATE POLICY "member_documents_own_delete" ON member_documents
FOR DELETE
TO public
USING (
  member_id IN (
    SELECT id FROM members WHERE user_id = current_setting('app.current_user_id', true)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_member_documents_member_id ON member_documents(member_id);
CREATE INDEX IF NOT EXISTS idx_member_documents_document_type ON member_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_member_documents_created_at ON member_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_documents_uploaded_by ON member_documents(uploaded_by);

-- ============================================================================
-- 3. DOCUMENT_STORAGE TABLE (if exists) - RLS POLICIES
-- ============================================================================

-- Check if document_storage table exists before adding RLS
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'document_storage') THEN
    ALTER TABLE document_storage ENABLE ROW LEVEL SECURITY;
    
    -- Users can SELECT documents they own or are authorized to access
    CREATE POLICY "document_storage_access" ON document_storage
    FOR SELECT
    TO public
    USING (
      owner_id = current_setting('app.current_user_id', true)
      OR storage_key IN (
        SELECT storage_key 
        FROM member_documents 
        WHERE member_id IN (
          SELECT id FROM members WHERE user_id = current_setting('app.current_user_id', true)
        )
      )
    );
    
    RAISE NOTICE 'RLS enabled on document_storage table';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is enabled on all notification and document tables
DO $$ 
DECLARE
  v_table TEXT;
  v_count INTEGER := 0;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['in_app_notifications', 'member_documents']
  LOOP
    IF (SELECT relrowsecurity FROM pg_class WHERE relname = v_table) THEN
      RAISE NOTICE 'RLS enabled: %', v_table;
      v_count := v_count + 1;
    ELSE
      RAISE WARNING 'RLS NOT enabled: %', v_table;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Notification & Document RLS enforcement complete: % of 2 tables protected', v_count;
END $$;

-- ============================================================================
-- AUDIT LOG ENTRY
-- ============================================================================
-- DISABLED: 
INSERT INTO audit_security.security_events (
  organization_id,
  event_category,
  event_type,
  severity,
  description,
  affected_table,
  risk_score,
  remediation_status
) VALUES (
  NULL, -- System-wide change
  'configuration',
  'rls_policies_added',
  'high',
  'Applied Row-Level Security policies to notification and document tables (in_app_notifications, member_documents)',
  'in_app_notifications,member_documents',
  0, -- Remediation of vulnerability
  'resolved'
);
