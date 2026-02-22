-- Seed Test Data for Financial Service
-- This creates test strike fund, dues rules, and member assignments

-- Use existing tenant: Union Local 123
SET app.current_tenant_id = 'a1111111-1111-1111-1111-111111111111';

-- 1. Create a test strike fund
INSERT INTO public.strike_funds (
    tenant_id,
    fund_name,
    fund_code,
    description,
    fund_type,
    current_balance,
    target_amount,
    accepts_public_donations,
    fundraising_goal,
    weekly_stipend_amount,
    daily_picket_bonus,
    minimum_attendance_hours,
    strike_status,
    status,
    created_at,
    updated_at
) VALUES (
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'Manufacturing Workers Strike Fund 2025',
    'MWSF2025',
    'Emergency strike fund for manufacturing workers during labor action. Supports picket line participation and hardship assistance.',
    'emergency',
    15000.00,
    100000.00,
    true,
    100000.00,
    500.00,
    50.00,
    4.0,
    'inactive',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (tenant_id, fund_code) DO NOTHING
RETURNING id, fund_name, current_balance;

-- 2. Create test dues rules
INSERT INTO public.dues_rules (
    tenant_id,
    rule_name,
    rule_code,
    description,
    calculation_type,
    flat_amount,
    percentage_rate,
    billing_frequency,
    effective_date,
    end_date,
    is_active,
    created_at,
    updated_at
) VALUES 
(
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'Standard Monthly Dues',
    'MONTHLY_STANDARD',
    'Standard flat-rate monthly dues for full-time members',
    'flat_rate',
    45.00,
    NULL,
    'monthly',
    '2025-01-01',
    NULL,
    true,
    NOW(),
    NOW()
),
(
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'Part-Time Percentage Dues',
    'PART_TIME_PCT',
    'Percentage-based dues for part-time members (2% of gross pay)',
    'percentage',
    NULL,
    2.00,
    'monthly',
    '2025-01-01',
    NULL,
    true,
    NOW(),
    NOW()
),
(
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'Hourly Worker Dues',
    'HOURLY_DUES',
    'Hourly-based dues calculation for hourly workers',
    'hourly',
    NULL,
    NULL,
    'monthly',
    '2025-01-01',
    NULL,
    true,
    NOW(),
    NOW()
),
(
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'Tiered Dues Structure',
    'TIERED_DUES',
    'Tiered dues based on salary brackets',
    'tiered',
    NULL,
    NULL,
    'monthly',
    '2025-01-01',
    NULL,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (tenant_id, rule_code) DO NOTHING
RETURNING id, rule_name, calculation_type, flat_amount;

-- 3. Create test member assignments with generated UUIDs
-- Note: member_id must be UUID type, but organization_members.user_id is TEXT
-- For testing, we'll create assignments with test UUIDs
DO $$
DECLARE
    v_rule_monthly_id UUID;
    v_rule_pct_id UUID;
    v_test_member_1 UUID := 'c1111111-1111-1111-1111-111111111111'::uuid;
    v_test_member_2 UUID := 'c2222222-2222-2222-2222-222222222222'::uuid;
    v_test_member_3 UUID := 'c3333333-3333-3333-3333-333333333333'::uuid;
BEGIN
    -- Get rule IDs
    SELECT id INTO v_rule_monthly_id 
    FROM public.dues_rules 
    WHERE tenant_id = 'a1111111-1111-1111-1111-111111111111' 
      AND rule_code = 'MONTHLY_STANDARD' 
    LIMIT 1;
    
    SELECT id INTO v_rule_pct_id 
    FROM public.dues_rules 
    WHERE tenant_id = 'a1111111-1111-1111-1111-111111111111' 
      AND rule_code = 'PART_TIME_PCT' 
    LIMIT 1;
    
    -- Assign monthly dues to test members 1 and 2
    IF v_rule_monthly_id IS NOT NULL THEN
        INSERT INTO public.member_dues_assignments (
            tenant_id,
            member_id,
            rule_id,
            override_amount,
            is_active,
            effective_date,
            created_at,
            updated_at
        ) VALUES 
        (
            'a1111111-1111-1111-1111-111111111111'::uuid,
            v_test_member_1,
            v_rule_monthly_id,
            NULL,
            true,
            CURRENT_DATE,
            NOW(),
            NOW()
        ),
        (
            'a1111111-1111-1111-1111-111111111111'::uuid,
            v_test_member_2,
            v_rule_monthly_id,
            NULL,
            true,
            CURRENT_DATE,
            NOW(),
            NOW()
        )
        ON CONFLICT (tenant_id, member_id, rule_id, effective_date) DO NOTHING;
    END IF;
    
    -- Assign percentage dues to test member 3
    IF v_rule_pct_id IS NOT NULL THEN
        INSERT INTO public.member_dues_assignments (
            tenant_id,
            member_id,
            rule_id,
            override_amount,
            is_active,
            effective_date,
            created_at,
            updated_at
        ) VALUES (
            'a1111111-1111-1111-1111-111111111111'::uuid,
            v_test_member_3,
            v_rule_pct_id,
            NULL,
            true,
            CURRENT_DATE,
            NOW(),
            NOW()
        ) ON CONFLICT (tenant_id, member_id, rule_id, effective_date) DO NOTHING;
    END IF;
    
    RAISE NOTICE 'Created dues assignments for 3 test members';
END $$;

-- 4. Verify data created
SELECT 'STRIKE FUNDS' as category, COUNT(*) as count FROM public.strike_funds 
WHERE tenant_id = 'a1111111-1111-1111-1111-111111111111'
UNION ALL
SELECT 'DUES RULES', COUNT(*) FROM public.dues_rules 
WHERE tenant_id = 'a1111111-1111-1111-1111-111111111111'
UNION ALL
SELECT 'MEMBER ASSIGNMENTS', COUNT(*) FROM public.member_dues_assignments 
WHERE tenant_id = 'a1111111-1111-1111-1111-111111111111';

-- Display created data
SELECT 
    id,
    fund_name,
    fund_code,
    fund_type,
    current_balance,
    target_amount,
    accepts_public_donations,
    status
FROM public.strike_funds
WHERE tenant_id = 'a1111111-1111-1111-1111-111111111111';

SELECT 
    id,
    rule_name,
    rule_code,
    calculation_type,
    flat_amount,
    percentage_rate,
    billing_frequency
FROM public.dues_rules
WHERE tenant_id = 'a1111111-1111-1111-1111-111111111111'
ORDER BY calculation_type;

RESET app.current_tenant_id;
