-- Migration: 055_pension_trustee_rls_policies
-- Description: Add RLS policies for pension trustee tables
-- Created: 2025-11-24
-- Dependencies: pension_plans must have organization_id and RLS policies

-- ============================================================
-- PENSION TRUSTEE BOARDS
-- ============================================================

-- Enable RLS on pension_trustee_boards
ALTER TABLE public.pension_trustee_boards ENABLE ROW LEVEL SECURITY;

-- Policy: Access via pension plan organization membership
CREATE POLICY pension_trustee_boards_org_access ON public.pension_trustee_boards
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.pension_plans pp
    WHERE pp.id = pension_trustee_boards.pension_plan_id
    AND pp.organization_id::text IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = get_current_user_id()
    )
  )
);

-- ============================================================
-- PENSION TRUSTEES
-- ============================================================

-- Enable RLS on pension_trustees
ALTER TABLE public.pension_trustees ENABLE ROW LEVEL SECURITY;

-- Policy: Access via trustee board -> pension plan -> organization membership
CREATE POLICY pension_trustees_org_access ON public.pension_trustees
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.pension_trustee_boards ptb
    JOIN public.pension_plans pp ON pp.id = ptb.pension_plan_id
    WHERE ptb.id = pension_trustees.trustee_board_id
    AND pp.organization_id::text IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = get_current_user_id()
    )
  )
);

-- ============================================================
-- PENSION TRUSTEE MEETINGS
-- ============================================================

-- Enable RLS on pension_trustee_meetings
ALTER TABLE public.pension_trustee_meetings ENABLE ROW LEVEL SECURITY;

-- Policy: Access via trustee board -> pension plan -> organization membership
CREATE POLICY pension_trustee_meetings_org_access ON public.pension_trustee_meetings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.pension_trustee_boards ptb
    JOIN public.pension_plans pp ON pp.id = ptb.pension_plan_id
    WHERE ptb.id = pension_trustee_meetings.trustee_board_id
    AND pp.organization_id::text IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = get_current_user_id()
    )
  )
);

-- ============================================================
-- VALIDATION
-- ============================================================

-- Verify all 3 tables now have RLS enabled
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND t.tablename IN ('pension_trustee_boards', 'pension_trustees', 'pension_trustee_meetings')
    AND t.rowsecurity = true;
  
  IF v_count = 3 THEN
    RAISE NOTICE 'SUCCESS: All 3 pension trustee tables have RLS enabled';
  ELSE
    RAISE WARNING 'INCOMPLETE: Only % of 3 pension trustee tables have RLS enabled', v_count;
  END IF;
END $$;

-- Verify all 3 tables have at least one policy
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(DISTINCT tablename) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('pension_trustee_boards', 'pension_trustees', 'pension_trustee_meetings');
  
  IF v_count = 3 THEN
    RAISE NOTICE 'SUCCESS: All 3 pension trustee tables have RLS policies';
  ELSE
    RAISE WARNING 'INCOMPLETE: Only % of 3 pension trustee tables have RLS policies', v_count;
  END IF;
END $$;
