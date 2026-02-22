-- Migration: Add Row-Level Security Policies for Calendar Tables
-- Date: February 6, 2026
-- Priority: MEDIUM - Meeting data exposure risk
-- Severity: 🟡 MEDIUM DATA EXPOSURE

-- ============================================================================
-- 1. CALENDARS TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS on calendars table
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT their own calendars or shared calendars
CREATE POLICY "calendars_owner_or_shared" ON calendars
FOR SELECT
TO public
USING (
  owner_id = current_setting('app.current_user_id', true)
  OR id IN (
    SELECT calendar_id 
    FROM calendar_sharing 
    WHERE shared_with_user_id = current_setting('app.current_user_id', true) 
      AND is_shared = true
  )
);

-- Policy 2: Users can INSERT their own calendars
CREATE POLICY "calendars_create_own" ON calendars
FOR INSERT
TO public
WITH CHECK (owner_id = current_setting('app.current_user_id', true));

-- Policy 3: Calendar owners can UPDATE their calendars
CREATE POLICY "calendars_update_owner" ON calendars
FOR UPDATE
TO public
USING (owner_id = current_setting('app.current_user_id', true));

-- Policy 4: Calendar owners can DELETE their calendars
CREATE POLICY "calendars_delete_owner" ON calendars
FOR DELETE
TO public
USING (owner_id = current_setting('app.current_user_id', true));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendars_owner_id ON calendars(owner_id);
CREATE INDEX IF NOT EXISTS idx_calendars_is_public ON calendars(is_public) WHERE is_public = true;

-- ============================================================================
-- 2. CALENDAR_EVENTS TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS on calendar_events table
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT events in calendars they have access to
CREATE POLICY "calendar_events_in_accessible_calendars" ON calendar_events
FOR SELECT
TO public
USING (
  calendar_id IN (
    SELECT id FROM calendars c
    WHERE c.owner_id = current_setting('app.current_user_id', true)
      OR c.is_public = true
      OR c.id IN (
        SELECT calendar_id 
        FROM calendar_sharing 
        WHERE shared_with_user_id = current_setting('app.current_user_id', true) 
          AND is_shared = true
      )
  )
);

-- Policy 2: Users can INSERT events in their own calendars or shared calendars with write access
CREATE POLICY "calendar_events_create_owner_or_shared" ON calendar_events
FOR INSERT
TO public
WITH CHECK (
  calendar_id IN (
    SELECT id FROM calendars c
    WHERE c.owner_id = current_setting('app.current_user_id', true)
      OR c.id IN (
        SELECT calendar_id 
        FROM calendar_sharing 
        WHERE shared_with_user_id = current_setting('app.current_user_id', true) 
          AND is_shared = true
          AND allow_modify = true
      )
  )
);

-- Policy 3: Users can UPDATE events they created or in calendars with modify access
CREATE POLICY "calendar_events_update_creator_or_admin" ON calendar_events
FOR UPDATE
TO public
USING (
  created_by = current_setting('app.current_user_id', true)
  OR calendar_id IN (
    SELECT id FROM calendars c
    WHERE c.owner_id = current_setting('app.current_user_id', true)
      OR c.id IN (
        SELECT calendar_id 
        FROM calendar_sharing 
        WHERE shared_with_user_id = current_setting('app.current_user_id', true) 
          AND is_shared = true
          AND allow_modify = true
      )
  )
);

-- Policy 4: Users can DELETE events they created
CREATE POLICY "calendar_events_delete_creator" ON calendar_events
FOR DELETE
TO public
USING (created_by = current_setting('app.current_user_id', true));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_calendar_id ON calendar_events(calendar_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON calendar_events(end_time);

-- ============================================================================
-- 3. CALENDAR_SHARING TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS on calendar_sharing table
ALTER TABLE calendar_sharing ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT shares for their own calendars or shares they receive
CREATE POLICY "calendar_sharing_owner_or_recipient" ON calendar_sharing
FOR SELECT
TO public
USING (
  calendar_id IN (
    SELECT id FROM calendars WHERE owner_id = current_setting('app.current_user_id', true)
  )
  OR shared_with_user_id = current_setting('app.current_user_id', true)
);

-- Policy 2: Calendar owners can CREATE shares for their calendars
CREATE POLICY "calendar_sharing_create_owner" ON calendar_sharing
FOR INSERT
TO public
WITH CHECK (
  calendar_id IN (
    SELECT id FROM calendars WHERE owner_id = current_setting('app.current_user_id', true)
  )
);

-- Policy 3: Calendar owners can UPDATE shares for their calendars
CREATE POLICY "calendar_sharing_update_owner" ON calendar_sharing
FOR UPDATE
TO public
USING (
  calendar_id IN (
    SELECT id FROM calendars WHERE owner_id = current_setting('app.current_user_id', true)
  )
);

-- Policy 4: Calendar owners can DELETE shares for their calendars
CREATE POLICY "calendar_sharing_delete_owner" ON calendar_sharing
FOR DELETE
TO public
USING (
  calendar_id IN (
    SELECT id FROM calendars WHERE owner_id = current_setting('app.current_user_id', true)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_sharing_calendar_id ON calendar_sharing(calendar_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sharing_shared_with_user_id ON calendar_sharing(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sharing_is_shared ON calendar_sharing(is_shared) WHERE is_shared = true;

-- ============================================================================
-- 4. EVENT_ATTENDEES TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS on event_attendees table
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT attendee info for events in accessible calendars
CREATE POLICY "event_attendees_accessible_events" ON event_attendees
FOR SELECT
TO public
USING (
  event_id IN (
    SELECT id FROM calendar_events ce
    WHERE ce.calendar_id IN (
      SELECT id FROM calendars c
      WHERE c.owner_id = current_setting('app.current_user_id', true)
        OR c.is_public = true
        OR c.id IN (
          SELECT calendar_id 
          FROM calendar_sharing 
          WHERE shared_with_user_id = current_setting('app.current_user_id', true) 
            AND is_shared = true
        )
    )
  )
);

-- Policy 2: Event creators or calendar owners can INSERT attendees
CREATE POLICY "event_attendees_create_event_owner" ON event_attendees
FOR INSERT
TO public
WITH CHECK (
  event_id IN (
    SELECT id FROM calendar_events ce
    WHERE ce.calendar_id IN (
      SELECT id FROM calendars c
      WHERE c.owner_id = current_setting('app.current_user_id', true)
        OR c.id IN (
          SELECT calendar_id 
          FROM calendar_sharing 
          WHERE shared_with_user_id = current_setting('app.current_user_id', true) 
            AND is_shared = true
            AND allow_modify = true
        )
    )
  )
);

-- Policy 3: Event creators or calendar owners can UPDATE attendees
CREATE POLICY "event_attendees_update_event_owner" ON event_attendees
FOR UPDATE
TO public
USING (
  event_id IN (
    SELECT id FROM calendar_events ce
    WHERE ce.calendar_id IN (
      SELECT id FROM calendars c
      WHERE c.owner_id = current_setting('app.current_user_id', true)
        OR c.id IN (
          SELECT calendar_id 
          FROM calendar_sharing 
          WHERE shared_with_user_id = current_setting('app.current_user_id', true) 
            AND is_shared = true
            AND allow_modify = true
        )
    )
  )
);

-- Policy 4: Users can update their own RSVP status
CREATE POLICY "event_attendees_update_own_rsvp" ON event_attendees
FOR UPDATE
TO public
USING (attendee_id = current_setting('app.current_user_id', true))
WITH CHECK (attendee_id = current_setting('app.current_user_id', true));

-- Policy 5: Event creators can DELETE attendees
CREATE POLICY "event_attendees_delete_event_owner" ON event_attendees
FOR DELETE
TO public
USING (
  event_id IN (
    SELECT id FROM calendar_events ce
    WHERE ce.calendar_id IN (
      SELECT id FROM calendars c
      WHERE c.owner_id = current_setting('app.current_user_id', true)
    )
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_attendee_id ON event_attendees(attendee_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_rsvp_status ON event_attendees(rsvp_status);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is enabled on all calendar tables
DO $$ 
DECLARE
  v_table TEXT;
  v_count INTEGER := 0;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['calendars', 'calendar_events', 'calendar_sharing', 'event_attendees']
  LOOP
    IF (SELECT relrowsecurity FROM pg_class WHERE relname = v_table) THEN
      RAISE NOTICE 'RLS enabled: %', v_table;
      v_count := v_count + 1;
    ELSE
      RAISE WARNING 'RLS NOT enabled: %', v_table;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Calendar tables RLS enforcement complete: % of 4 tables protected', v_count;
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
  'medium',
  'Applied Row-Level Security policies to calendar and event tables (calendars, calendar_events, calendar_sharing, event_attendees)',
  'calendars,calendar_events,calendar_sharing,event_attendees',
  0, -- Remediation of vulnerability
  'resolved'
);
