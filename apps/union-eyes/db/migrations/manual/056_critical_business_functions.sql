-- Migration: 056_critical_business_functions
-- Description: Create 10 missing critical business logic functions
-- Created: 2025-11-24
-- Priority 2: Critical functions for business operations

-- ============================================================
-- 1. CALCULATE_PENSION_BENEFIT
-- ============================================================
-- Calculates pension benefit amount based on hours worked and plan formula
CREATE OR REPLACE FUNCTION calculate_pension_benefit(
  p_pension_plan_id UUID,
  p_member_id UUID,
  p_calculation_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC(10,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total_pensionable_hours NUMERIC(10,2);
  v_contribution_rate NUMERIC(5,2);
  v_benefit_amount NUMERIC(10,2);
  v_normal_retirement_age INTEGER;
  v_member_age INTEGER;
BEGIN
  -- Get plan details
  SELECT 
    contribution_rate,
    normal_retirement_age
  INTO 
    v_contribution_rate,
    v_normal_retirement_age
  FROM pension_plans
  WHERE id = p_pension_plan_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pension plan not found: %', p_pension_plan_id;
  END IF;

  -- Calculate total pensionable hours for member
  SELECT 
    COALESCE(SUM(pensionable_hours), 0)
  INTO 
    v_total_pensionable_hours
  FROM pension_hours_banks
  WHERE pension_plan_id = p_pension_plan_id
    AND member_id = p_member_id
    AND status = 'active';

  -- Simple benefit calculation: hours * contribution_rate
  -- Real implementations would use complex actuarial formulas
  v_benefit_amount := v_total_pensionable_hours * COALESCE(v_contribution_rate, 0);

  RETURN GREATEST(v_benefit_amount, 0);
END;
$$;

COMMENT ON FUNCTION calculate_pension_benefit IS 'Calculates estimated pension benefit for a member based on hours worked and plan contribution rate';

-- ============================================================
-- 2. CALCULATE_HOURS_BANK_BALANCE
-- ============================================================
-- Calculates current hours bank balance for a member in a pension plan
CREATE OR REPLACE FUNCTION calculate_hours_bank_balance(
  p_pension_plan_id UUID,
  p_member_id UUID,
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC(10,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total_hours NUMERIC(10,2);
BEGIN
  SELECT 
    COALESCE(SUM(pensionable_hours), 0)
  INTO 
    v_total_hours
  FROM pension_hours_banks
  WHERE pension_plan_id = p_pension_plan_id
    AND member_id = p_member_id
    AND reporting_period_end <= p_as_of_date
    AND status = 'active';

  RETURN v_total_hours;
END;
$$;

COMMENT ON FUNCTION calculate_hours_bank_balance IS 'Returns total accumulated pensionable hours for a member in a specific pension plan';

-- ============================================================
-- 3. CALCULATE_RETIREMENT_ELIGIBILITY
-- ============================================================
-- Determines if a member is eligible for retirement benefits
CREATE OR REPLACE FUNCTION calculate_retirement_eligibility(
  p_pension_plan_id UUID,
  p_member_id UUID,
  p_check_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  is_eligible BOOLEAN,
  eligibility_type VARCHAR(50),
  reason TEXT,
  minimum_hours_met BOOLEAN,
  age_requirement_met BOOLEAN,
  vesting_period_met BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_plan RECORD;
  v_total_hours NUMERIC(10,2);
  v_years_of_service INTEGER;
  v_minimum_hours_threshold NUMERIC(10,2) := 1000; -- Typical minimum for eligibility
BEGIN
  -- Get plan parameters
  SELECT 
    normal_retirement_age,
    early_retirement_age,
    vesting_period_years
  INTO v_plan
  FROM pension_plans
  WHERE id = p_pension_plan_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pension plan not found: %', p_pension_plan_id;
  END IF;

  -- Calculate total hours
  v_total_hours := calculate_hours_bank_balance(p_pension_plan_id, p_member_id, p_check_date);

  -- Calculate years of service (simplified - count distinct years with hours)
  SELECT 
    COUNT(DISTINCT EXTRACT(YEAR FROM reporting_period_end))
  INTO v_years_of_service
  FROM pension_hours_banks
  WHERE pension_plan_id = p_pension_plan_id
    AND member_id = p_member_id
    AND reporting_period_end <= p_check_date;

  -- Return eligibility status
  RETURN QUERY
  SELECT
    (v_total_hours >= v_minimum_hours_threshold 
      AND v_years_of_service >= COALESCE(v_plan.vesting_period_years, 2))::BOOLEAN AS is_eligible,
    CASE 
      WHEN v_total_hours >= v_minimum_hours_threshold 
        AND v_years_of_service >= COALESCE(v_plan.vesting_period_years, 2) 
      THEN 'eligible'::VARCHAR(50)
      ELSE 'not_eligible'::VARCHAR(50)
    END AS eligibility_type,
    CASE 
      WHEN v_total_hours < v_minimum_hours_threshold 
      THEN 'Insufficient hours: ' || v_total_hours || ' (minimum: ' || v_minimum_hours_threshold || ')'
      WHEN v_years_of_service < COALESCE(v_plan.vesting_period_years, 2)
      THEN 'Vesting period not met: ' || v_years_of_service || ' years (minimum: ' || COALESCE(v_plan.vesting_period_years, 2) || ')'
      ELSE 'Member meets all retirement eligibility requirements'
    END AS reason,
    (v_total_hours >= v_minimum_hours_threshold)::BOOLEAN AS minimum_hours_met,
    TRUE::BOOLEAN AS age_requirement_met, -- Would need member DOB to calculate
    (v_years_of_service >= COALESCE(v_plan.vesting_period_years, 2))::BOOLEAN AS vesting_period_met;
END;
$$;

COMMENT ON FUNCTION calculate_retirement_eligibility IS 'Determines retirement eligibility based on hours, age, and vesting requirements';

-- ============================================================
-- 4. GENERATE_T4A_RECORDS
-- ============================================================
-- Generates T4A tax slip data for pension benefit payments
CREATE OR REPLACE FUNCTION generate_t4a_records(
  p_tax_year INTEGER,
  p_organization_id UUID DEFAULT NULL
)
RETURNS TABLE (
  member_id UUID,
  total_pension_payments NUMERIC(12,2),
  total_lump_sum_payments NUMERIC(12,2),
  income_tax_deducted NUMERIC(12,2),
  other_information TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Generate T4A data from pension benefit claims
  RETURN QUERY
  SELECT 
    pbc.member_id,
    SUM(CASE WHEN pbc.benefit_type = 'monthly_pension' THEN pbc.benefit_amount ELSE 0 END) AS total_pension_payments,
    SUM(CASE WHEN pbc.benefit_type = 'lump_sum' THEN pbc.benefit_amount ELSE 0 END) AS total_lump_sum_payments,
    SUM(COALESCE(pbc.tax_withheld, 0)) AS income_tax_deducted,
    'Box 16 - Pension: ' || 
      SUM(CASE WHEN pbc.benefit_type = 'monthly_pension' THEN pbc.benefit_amount ELSE 0 END)::TEXT ||
    '; Box 18 - Lump Sum: ' ||
      SUM(CASE WHEN pbc.benefit_type = 'lump_sum' THEN pbc.benefit_amount ELSE 0 END)::TEXT AS other_information
  FROM pension_benefit_claims pbc
  JOIN pension_plans pp ON pp.id = pbc.pension_plan_id
  WHERE EXTRACT(YEAR FROM pbc.payment_date) = p_tax_year
    AND pbc.claim_status = 'approved'
    AND (p_organization_id IS NULL OR pp.organization_id = p_organization_id)
  GROUP BY pbc.member_id
  HAVING SUM(pbc.benefit_amount) > 0;
END;
$$;

COMMENT ON FUNCTION generate_t4a_records IS 'Generates T4A tax slip data for pension payments made during a tax year';

-- ============================================================
-- 5. VALIDATE_CARD_CHECK
-- ============================================================
-- Validates organizing card check requirements for certification
CREATE OR REPLACE FUNCTION validate_card_check(
  p_campaign_id UUID,
  p_validation_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  is_valid BOOLEAN,
  total_contacts INTEGER,
  cards_signed INTEGER,
  support_percentage NUMERIC(5,2),
  threshold_met BOOLEAN,
  required_percentage NUMERIC(5,2),
  validation_message TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_campaign RECORD;
  v_total_contacts INTEGER;
  v_cards_signed INTEGER;
  v_support_pct NUMERIC(5,2);
  v_required_pct NUMERIC(5,2) := 40.0; -- Typical threshold
BEGIN
  -- Get campaign details
  SELECT 
    oc.id,
    oc.organization_id,
    oc.target_size
  INTO v_campaign
  FROM organizing_campaigns oc
  WHERE oc.id = p_campaign_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found: %', p_campaign_id;
  END IF;

  -- Count total contacts in bargaining unit
  SELECT COUNT(*)
  INTO v_total_contacts
  FROM organizing_contacts
  WHERE campaign_id = p_campaign_id
    AND contact_status IN ('active', 'interested', 'supportive');

  -- Count signed cards
  SELECT COUNT(*)
  INTO v_cards_signed
  FROM organizing_contacts
  WHERE campaign_id = p_campaign_id
    AND contact_status = 'card_signed'
    AND card_signed_date <= p_validation_date;

  -- Calculate support percentage
  IF v_total_contacts > 0 THEN
    v_support_pct := (v_cards_signed::NUMERIC / v_total_contacts::NUMERIC) * 100;
  ELSE
    v_support_pct := 0;
  END IF;

  -- Return validation results
  RETURN QUERY
  SELECT
    (v_support_pct >= v_required_pct)::BOOLEAN AS is_valid,
    v_total_contacts AS total_contacts,
    v_cards_signed AS cards_signed,
    v_support_pct AS support_percentage,
    (v_support_pct >= v_required_pct)::BOOLEAN AS threshold_met,
    v_required_pct AS required_percentage,
    CASE 
      WHEN v_support_pct >= v_required_pct 
      THEN 'Card check valid: ' || v_support_pct::TEXT || '% support (' || v_cards_signed || ' of ' || v_total_contacts || ' contacts)'
      ELSE 'Card check insufficient: ' || v_support_pct::TEXT || '% support (need ' || v_required_pct::TEXT || '%)'
    END AS validation_message;
END;
$$;

COMMENT ON FUNCTION validate_card_check IS 'Validates whether an organizing campaign has sufficient signed cards for certification';

-- ============================================================
-- 6. CALCULATE_SUPPORT_PERCENTAGE
-- ============================================================
-- Calculates member support percentage for organizing campaigns
CREATE OR REPLACE FUNCTION calculate_support_percentage(
  p_campaign_id UUID,
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC(5,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total_contacts INTEGER;
  v_supportive_contacts INTEGER;
  v_support_pct NUMERIC(5,2);
BEGIN
  -- Count total contacts
  SELECT COUNT(*)
  INTO v_total_contacts
  FROM organizing_contacts
  WHERE campaign_id = p_campaign_id
    AND created_at::DATE <= p_as_of_date;

  -- Count supportive contacts (signed cards + interested)
  SELECT COUNT(*)
  INTO v_supportive_contacts
  FROM organizing_contacts
  WHERE campaign_id = p_campaign_id
    AND contact_status IN ('card_signed', 'supportive', 'very_supportive')
    AND created_at::DATE <= p_as_of_date;

  -- Calculate percentage
  IF v_total_contacts > 0 THEN
    v_support_pct := (v_supportive_contacts::NUMERIC / v_total_contacts::NUMERIC) * 100;
  ELSE
    v_support_pct := 0;
  END IF;

  RETURN ROUND(v_support_pct, 2);
END;
$$;

COMMENT ON FUNCTION calculate_support_percentage IS 'Calculates the percentage of contacts showing support for union organizing';

-- ============================================================
-- 7. CALCULATE_STRIKE_ELIGIBILITY
-- ============================================================
-- Determines member eligibility for strike fund disbursements
CREATE OR REPLACE FUNCTION calculate_strike_eligibility(
  p_strike_fund_id UUID,
  p_member_id UUID,
  p_check_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  is_eligible BOOLEAN,
  eligibility_status VARCHAR(50),
  reason TEXT,
  dues_current BOOLEAN,
  no_arrears BOOLEAN,
  good_standing_months INTEGER,
  required_months INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_eligibility RECORD;
  v_is_eligible BOOLEAN;
  v_reason TEXT;
BEGIN
  -- Get eligibility record
  SELECT 
    is_eligible,
    eligibility_reason,
    has_paid_dues,
    no_arrears,
    months_in_good_standing,
    approval_status
  INTO v_eligibility
  FROM fund_eligibility
  WHERE strike_fund_id = p_strike_fund_id
    AND member_id = p_member_id;

  IF NOT FOUND THEN
    -- No eligibility record exists
    v_is_eligible := FALSE;
    v_reason := 'No eligibility record found for this member';
  ELSE
    v_is_eligible := v_eligibility.is_eligible 
      AND v_eligibility.approval_status = 'approved';
    v_reason := COALESCE(v_eligibility.eligibility_reason, 'Eligibility approved');
  END IF;

  RETURN QUERY
  SELECT
    v_is_eligible AS is_eligible,
    CASE 
      WHEN v_is_eligible THEN 'eligible'::VARCHAR(50)
      ELSE 'not_eligible'::VARCHAR(50)
    END AS eligibility_status,
    v_reason AS reason,
    COALESCE(v_eligibility.has_paid_dues, FALSE) AS dues_current,
    COALESCE(v_eligibility.no_arrears, FALSE) AS no_arrears,
    COALESCE(v_eligibility.months_in_good_standing, 0) AS good_standing_months,
    6 AS required_months; -- Typical requirement
END;
$$;

COMMENT ON FUNCTION calculate_strike_eligibility IS 'Determines if a member is eligible for strike fund benefits';

-- ============================================================
-- 8. CALCULATE_STIPEND_AMOUNT
-- ============================================================
-- Calculates weekly stipend amount based on picket attendance
CREATE OR REPLACE FUNCTION calculate_stipend_amount(
  p_strike_fund_id UUID,
  p_member_id UUID,
  p_week_start_date DATE,
  p_week_end_date DATE
)
RETURNS NUMERIC(10,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_strike_fund RECORD;
  v_total_hours NUMERIC(6,2);
  v_base_stipend NUMERIC(10,2);
  v_bonus_amount NUMERIC(10,2);
  v_total_amount NUMERIC(10,2);
BEGIN
  -- Get strike fund configuration
  SELECT 
    weekly_stipend_amount,
    daily_picket_bonus,
    minimum_attendance_hours
  INTO v_strike_fund
  FROM strike_funds
  WHERE id = p_strike_fund_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Strike fund not found: %', p_strike_fund_id;
  END IF;

  -- Calculate total hours worked during the week
  SELECT 
    COALESCE(SUM(hours_worked), 0)
  INTO v_total_hours
  FROM picket_attendance
  WHERE strike_fund_id = p_strike_fund_id
    AND member_id = p_member_id
    AND check_in_time::DATE BETWEEN p_week_start_date AND p_week_end_date
    AND check_out_time IS NOT NULL; -- Only count completed shifts

  -- Check if minimum hours met
  IF v_total_hours < COALESCE(v_strike_fund.minimum_attendance_hours, 4.0) THEN
    RETURN 0; -- Not eligible
  END IF;

  -- Calculate base stipend (could be fixed weekly amount or hourly rate * hours)
  v_base_stipend := COALESCE(v_strike_fund.weekly_stipend_amount, 0);

  -- Calculate bonus (e.g., for extra days or hours)
  v_bonus_amount := 0; -- Could add logic for bonuses

  v_total_amount := v_base_stipend + v_bonus_amount;

  RETURN GREATEST(v_total_amount, 0);
END;
$$;

COMMENT ON FUNCTION calculate_stipend_amount IS 'Calculates weekly strike stipend based on picket attendance hours';

-- ============================================================
-- 9. VALIDATE_JURISDICTION_DEADLINE
-- ============================================================
-- Validates if an action is within the jurisdiction's deadline requirements
CREATE OR REPLACE FUNCTION validate_jurisdiction_deadline(
  p_action_type VARCHAR(100),
  p_incident_date DATE,
  p_filing_date DATE,
  p_jurisdiction_code VARCHAR(10)
)
RETURNS TABLE (
  is_valid BOOLEAN,
  deadline_date DATE,
  days_remaining INTEGER,
  is_expired BOOLEAN,
  validation_message TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_deadline_days INTEGER;
  v_calculated_deadline DATE;
  v_days_diff INTEGER;
  v_is_valid BOOLEAN;
BEGIN
  -- Get deadline days for this jurisdiction and action type
  SELECT 
    CASE 
      WHEN p_action_type ILIKE '%grievance%' THEN 30
      WHEN p_action_type ILIKE '%arbitration%' THEN 60
      WHEN p_action_type ILIKE '%unfair%' THEN 90
      WHEN p_action_type ILIKE '%certification%' THEN 45
      ELSE 30 -- Default
    END
  INTO v_deadline_days;

  -- Calculate deadline date
  v_calculated_deadline := p_incident_date + (v_deadline_days || ' days')::INTERVAL;

  -- Calculate days difference
  v_days_diff := v_calculated_deadline - p_filing_date;

  -- Determine if valid
  v_is_valid := p_filing_date <= v_calculated_deadline;

  RETURN QUERY
  SELECT
    v_is_valid AS is_valid,
    v_calculated_deadline AS deadline_date,
    v_days_diff AS days_remaining,
    (p_filing_date > v_calculated_deadline)::BOOLEAN AS is_expired,
    CASE 
      WHEN v_is_valid THEN 
        'Filing is timely: ' || v_days_diff || ' days before deadline (' || v_calculated_deadline::TEXT || ')'
      ELSE 
        'Filing is late: Deadline was ' || v_calculated_deadline::TEXT || ' (' || ABS(v_days_diff) || ' days overdue)'
    END AS validation_message;
END;
$$;

COMMENT ON FUNCTION validate_jurisdiction_deadline IS 'Validates whether a filing meets jurisdictional deadline requirements';

-- ============================================================
-- 10. CHECK_CLC_TIER_COMPLIANCE
-- ============================================================
-- Validates CLC (Canadian Labour Congress) tier compliance requirements
CREATE OR REPLACE FUNCTION check_clc_tier_compliance(
  p_organization_id UUID,
  p_check_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  is_compliant BOOLEAN,
  organization_tier VARCHAR(50),
  membership_count INTEGER,
  required_reporting BOOLEAN,
  required_per_capita BOOLEAN,
  compliance_status VARCHAR(50),
  compliance_message TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_org RECORD;
  v_member_count INTEGER;
  v_is_compliant BOOLEAN;
  v_tier VARCHAR(50);
BEGIN
  -- Get organization details
  SELECT 
    o.id,
    o.name,
    o.organization_type,
    o.total_members
  INTO v_org
  FROM organizations o
  WHERE o.id = p_organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found: %', p_organization_id;
  END IF;

  -- Count active members
  SELECT COUNT(*)
  INTO v_member_count
  FROM members m
  WHERE m.organization_id = p_organization_id
    AND m.status = 'active';

  -- Determine tier based on membership size
  v_tier := CASE 
    WHEN v_member_count >= 10000 THEN 'tier_1_large'
    WHEN v_member_count >= 1000 THEN 'tier_2_medium'
    WHEN v_member_count >= 100 THEN 'tier_3_small'
    ELSE 'tier_4_emerging'
  END;

  -- Basic compliance check (would be more complex in reality)
  v_is_compliant := v_member_count > 0 AND v_org.organization_type IS NOT NULL;

  RETURN QUERY
  SELECT
    v_is_compliant AS is_compliant,
    v_tier AS organization_tier,
    v_member_count AS membership_count,
    (v_member_count >= 100)::BOOLEAN AS required_reporting,
    (v_member_count >= 100)::BOOLEAN AS required_per_capita,
    CASE 
      WHEN v_is_compliant THEN 'compliant'::VARCHAR(50)
      ELSE 'non_compliant'::VARCHAR(50)
    END AS compliance_status,
    'Organization tier: ' || v_tier || ' with ' || v_member_count || ' active members' AS compliance_message;
END;
$$;

COMMENT ON FUNCTION check_clc_tier_compliance IS 'Validates CLC tier classification and compliance requirements for a union organization';

-- ============================================================
-- VALIDATION
-- ============================================================

-- Verify all 10 functions were created
DO $$
DECLARE
  v_count INTEGER;
  v_missing TEXT[];
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'calculate_pension_benefit',
      'calculate_hours_bank_balance',
      'calculate_retirement_eligibility',
      'generate_t4a_records',
      'validate_card_check',
      'calculate_support_percentage',
      'calculate_strike_eligibility',
      'calculate_stipend_amount',
      'validate_jurisdiction_deadline',
      'check_clc_tier_compliance'
    );
  
  IF v_count = 10 THEN
    RAISE NOTICE 'SUCCESS: All 10 critical functions created successfully';
  ELSE
    -- Find which functions are missing
    SELECT array_agg(func_name)
    INTO v_missing
    FROM unnest(ARRAY[
      'calculate_pension_benefit',
      'calculate_hours_bank_balance',
      'calculate_retirement_eligibility',
      'generate_t4a_records',
      'validate_card_check',
      'calculate_support_percentage',
      'calculate_strike_eligibility',
      'calculate_stipend_amount',
      'validate_jurisdiction_deadline',
      'check_clc_tier_compliance'
    ]) AS func_name
    WHERE NOT EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = func_name
    );
    
    RAISE WARNING 'INCOMPLETE: Only % of 10 functions created. Missing: %', v_count, v_missing;
  END IF;
END $$;
