-- Add Missing Financial Tables
-- Creates: donations, picket_tracking (alias for picket_attendance), arrears

-- ============================================================================
-- 1. DONATIONS TABLE (for strike fund donations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    strike_fund_id UUID NOT NULL,
    
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    
    donor_name TEXT,
    donor_email TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    message TEXT,
    
    status TEXT NOT NULL DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
    payment_method TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS donations_tenant_idx ON public.donations(tenant_id);
CREATE INDEX IF NOT EXISTS donations_fund_idx ON public.donations(strike_fund_id);
CREATE INDEX IF NOT EXISTS donations_status_idx ON public.donations(status);
CREATE INDEX IF NOT EXISTS donations_stripe_idx ON public.donations(stripe_payment_intent_id);

-- ============================================================================
-- 2. PICKET TRACKING TABLE (simpler name, matches schema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.picket_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    strike_fund_id UUID NOT NULL,
    member_id UUID NOT NULL,
    
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE,
    
    check_in_latitude DECIMAL(10,8),
    check_in_longitude DECIMAL(11,8),
    check_out_latitude DECIMAL(10,8),
    check_out_longitude DECIMAL(11,8),
    location_verified BOOLEAN DEFAULT false,
    
    check_in_method TEXT CHECK (
        check_in_method IN ('nfc', 'qr_code', 'gps', 'manual')
    ),
    nfc_tag_uid TEXT,
    qr_code_data TEXT,
    device_id TEXT,
    
    duration_minutes INTEGER,
    hours_worked DECIMAL(4,2),
    
    coordinator_override BOOLEAN DEFAULT false,
    override_reason TEXT,
    verified_by TEXT,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS picket_tracking_tenant_idx ON public.picket_tracking(tenant_id);
CREATE INDEX IF NOT EXISTS picket_tracking_fund_idx ON public.picket_tracking(strike_fund_id);
CREATE INDEX IF NOT EXISTS picket_tracking_member_idx ON public.picket_tracking(member_id);
CREATE INDEX IF NOT EXISTS picket_tracking_date_idx ON public.picket_tracking(check_in_time);

-- ============================================================================
-- 3. ARREARS TABLE (for tracking overdue payments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.arrears (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    member_id UUID NOT NULL,
    
    total_owed DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    oldest_debt_date DATE,
    months_overdue INTEGER DEFAULT 0,
    
    arrears_status TEXT NOT NULL DEFAULT 'active' CHECK (
        arrears_status IN ('active', 'payment_plan', 'suspended', 'legal_action', 'resolved', 'written_off')
    ),
    
    payment_plan_active BOOLEAN DEFAULT false,
    payment_plan_amount DECIMAL(10,2),
    payment_plan_frequency TEXT,
    payment_plan_start_date DATE,
    payment_plan_end_date DATE,
    
    suspension_effective_date DATE,
    suspension_reason TEXT,
    
    collection_agency TEXT,
    legal_action_date DATE,
    legal_reference TEXT,
    
    notes TEXT,
    last_contact_date DATE,
    next_follow_up_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_member_arrears UNIQUE (tenant_id, member_id)
);

CREATE INDEX IF NOT EXISTS arrears_tenant_idx ON public.arrears(tenant_id);
CREATE INDEX IF NOT EXISTS arrears_member_idx ON public.arrears(member_id);
CREATE INDEX IF NOT EXISTS arrears_status_idx ON public.arrears(arrears_status);

-- Grant permissions (adjust schema as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.picket_tracking TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arrears TO PUBLIC;
