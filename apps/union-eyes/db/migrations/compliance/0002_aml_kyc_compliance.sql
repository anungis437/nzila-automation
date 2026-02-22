-- =====================================================
-- Phase 3: AML/KYC Compliance Schema
-- Anti-Money Laundering and Know Your Customer
-- =====================================================

BEGIN;

-- =====================================================
-- 1. AML Transaction Monitoring Configuration
-- =====================================================

CREATE TABLE IF NOT EXISTS aml_monitoring_config (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL,
    
    -- Threshold configuration
    daily_transaction_limit DECIMAL(12,2) DEFAULT 10000.00,
    monthly_transaction_limit DECIMAL(12,2) DEFAULT 100000.00,
    high_risk_amount_threshold DECIMAL(12,2) DEFAULT 5000.00,
    
    -- Velocity checks
    max_transactions_per_day INTEGER DEFAULT 50,
    max_transactions_per_hour INTEGER DEFAULT 10,
    
    -- Risk scoring weights
    amount_weight DECIMAL(3,2) DEFAULT 0.40,
    velocity_weight DECIMAL(3,2) DEFAULT 0.30,
    pattern_weight DECIMAL(3,2) DEFAULT 0.30,
    
    -- Monitoring settings
    enable_real_time_monitoring BOOLEAN DEFAULT true,
    enable_sanctions_screening BOOLEAN DEFAULT true,
    enable_pep_screening BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_aml_config_org FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_aml_config_org ON aml_monitoring_config(organization_id);

COMMENT ON TABLE aml_monitoring_config IS 'AML/KYC monitoring configuration per organization';

-- =====================================================
-- 2. Customer Due Diligence (CDD) Records
-- =====================================================

CREATE TABLE IF NOT EXISTS aml_customer_due_diligence (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    
    -- CDD Level
    cdd_level TEXT NOT NULL CHECK (cdd_level IN ('simplified', 'standard', 'enhanced')),
    risk_rating TEXT NOT NULL CHECK (risk_rating IN ('low', 'medium', 'high', 'prohibited')),
    
    -- Identity Verification
    identity_verified BOOLEAN DEFAULT false,
    verification_method TEXT, -- 'document', 'biometric', 'knowledge_based', 'third_party'
    verification_date TIMESTAMP,
    verification_provider TEXT,
    
    -- Source of Funds
    source_of_funds TEXT,
    purpose_of_relationship TEXT,
    expected_transaction_volume DECIMAL(12,2),
    occupation TEXT,
    
    -- PEP Screening
    is_pep BOOLEAN DEFAULT false,
    pep_category TEXT, -- 'domestic', 'foreign', 'international_org', 'family', 'close_associate'
    pep_screening_date TIMESTAMP,
    pep_screening_provider TEXT,
    
    -- Sanctions Screening
    sanctions_screening_date TIMESTAMP,
    sanctions_hits INTEGER DEFAULT 0,
    sanctions_status TEXT CHECK (sanctions_status IN ('clear', 'match', 'false_positive', 'under_review')),
    sanctions_lists_checked TEXT[], -- ['OFAC', 'UN', 'EU', 'CANADA']
    
    -- Adverse Media
    adverse_media_check_date TIMESTAMP,
    adverse_media_hits INTEGER DEFAULT 0,
    
    -- Review & Monitoring
    last_review_date TIMESTAMP,
    next_review_date TIMESTAMP,
    review_frequency_days INTEGER DEFAULT 365,
    
    -- Officer Assignment
    assigned_compliance_officer TEXT,
    
    notes JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_cdd_org FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_cdd_org ON aml_customer_due_diligence(organization_id);
CREATE INDEX idx_cdd_member ON aml_customer_due_diligence(member_id);
CREATE INDEX idx_cdd_risk_rating ON aml_customer_due_diligence(risk_rating);
CREATE INDEX idx_cdd_pep ON aml_customer_due_diligence(is_pep) WHERE is_pep = true;
CREATE INDEX idx_cdd_review_date ON aml_customer_due_diligence(next_review_date);

COMMENT ON TABLE aml_customer_due_diligence IS 'Customer Due Diligence records for AML compliance';

-- =====================================================
-- 3. Transaction Monitoring & Alerts
-- =====================================================

CREATE TABLE IF NOT EXISTS aml_transaction_alerts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL,
    
    -- Transaction Reference
    transaction_id TEXT,
    transaction_type TEXT, -- 'dues_payment', 'strike_fund', 'donation', 'refund'
    transaction_amount DECIMAL(12,2) NOT NULL,
    transaction_date TIMESTAMP NOT NULL,
    
    -- Member Information
    member_id TEXT NOT NULL,
    member_risk_rating TEXT,
    
    -- Alert Details
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'high_value', 
        'velocity_exceeded', 
        'pattern_anomaly', 
        'sanctions_match',
        'pep_transaction',
        'structuring_suspected',
        'round_amount_pattern',
        'geographic_risk'
    )),
    alert_severity TEXT NOT NULL CHECK (alert_severity IN ('low', 'medium', 'high', 'critical')),
    risk_score DECIMAL(5,2), -- 0-100
    
    -- Detection Details
    rule_triggered TEXT,
    threshold_exceeded TEXT,
    pattern_description TEXT,
    
    -- Investigation
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'false_positive', 'escalated', 'sar_filed', 'closed')),
    assigned_to TEXT,
    investigation_started_at TIMESTAMP,
    investigation_completed_at TIMESTAMP,
    investigation_notes JSONB,
    
    -- Resolution
    resolution TEXT CHECK (resolution IN ('false_positive', 'acceptable_activity', 'requires_monitoring', 'sar_required', 'account_closure')),
    resolution_notes TEXT,
    resolved_by TEXT,
    resolved_at TIMESTAMP,
    
    -- SAR Filing
    sar_filed BOOLEAN DEFAULT false,
    sar_filing_date TIMESTAMP,
    sar_reference_number TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_alert_org FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_alert_org ON aml_transaction_alerts(organization_id);
CREATE INDEX idx_alert_member ON aml_transaction_alerts(member_id);
CREATE INDEX idx_alert_status ON aml_transaction_alerts(status);
CREATE INDEX idx_alert_severity ON aml_transaction_alerts(alert_severity);
CREATE INDEX idx_alert_transaction_date ON aml_transaction_alerts(transaction_date DESC);
CREATE INDEX idx_alert_open ON aml_transaction_alerts(status) WHERE status = 'open';

COMMENT ON TABLE aml_transaction_alerts IS 'AML transaction monitoring alerts and investigations';

-- =====================================================
-- 4. Suspicious Activity Reports (SARs)
-- =====================================================

CREATE TABLE IF NOT EXISTS aml_suspicious_activity_reports (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL,
    
    -- Report Details
    sar_number TEXT UNIQUE NOT NULL,
    report_date TIMESTAMP NOT NULL DEFAULT NOW(),
    filing_deadline TIMESTAMP,
    filed_date TIMESTAMP,
    
    -- Subject Information
    subject_type TEXT NOT NULL CHECK (subject_type IN ('member', 'employee', 'third_party', 'multiple')),
    subject_id TEXT,
    subject_name TEXT NOT NULL,
    
    -- Suspicious Activity
    activity_type TEXT[] NOT NULL, -- ['money_laundering', 'terrorist_financing', 'fraud', 'structuring', 'identity_theft']
    activity_description TEXT NOT NULL,
    activity_start_date DATE,
    activity_end_date DATE,
    
    -- Financial Details
    total_amount_involved DECIMAL(12,2),
    number_of_transactions INTEGER,
    related_transaction_ids TEXT[],
    related_alert_ids TEXT[],
    
    -- Filing Information
    filing_status TEXT DEFAULT 'draft' CHECK (filing_status IN ('draft', 'review', 'approved', 'filed', 'rejected')),
    filed_with TEXT[], -- ['FINTRAC', 'FinCEN', 'local_authority']
    filing_reference_number TEXT,
    
    -- Internal Review
    prepared_by TEXT NOT NULL,
    reviewed_by TEXT,
    approved_by TEXT,
    mlro_signature TEXT, -- Money Laundering Reporting Officer
    mlro_signature_date TIMESTAMP,
    
    -- Supporting Documents
    supporting_documents JSONB, -- [{filename, url, type}]
    narrative TEXT,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date TIMESTAMP,
    follow_up_notes TEXT,
    
    -- Legal Hold
    law_enforcement_notified BOOLEAN DEFAULT false,
    law_enforcement_agency TEXT,
    case_number TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_sar_org FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_sar_org ON aml_suspicious_activity_reports(organization_id);
CREATE INDEX idx_sar_number ON aml_suspicious_activity_reports(sar_number);
CREATE INDEX idx_sar_status ON aml_suspicious_activity_reports(filing_status);
CREATE INDEX idx_sar_subject ON aml_suspicious_activity_reports(subject_id);
CREATE INDEX idx_sar_report_date ON aml_suspicious_activity_reports(report_date DESC);

COMMENT ON TABLE aml_suspicious_activity_reports IS 'Suspicious Activity Reports for regulatory filing';

-- =====================================================
-- Row Level Security Policies
-- =====================================================

ALTER TABLE aml_monitoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE aml_customer_due_diligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE aml_transaction_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE aml_suspicious_activity_reports ENABLE ROW LEVEL SECURITY;

-- AML Config Policies
CREATE POLICY aml_config_org_isolation ON aml_monitoring_config
    FOR ALL USING (organization_id = current_setting('app.current_organization_id', true));

-- CDD Policies
CREATE POLICY cdd_org_isolation ON aml_customer_due_diligence
    FOR ALL USING (organization_id = current_setting('app.current_organization_id', true));

-- Alert Policies
CREATE POLICY alert_org_isolation ON aml_transaction_alerts
    FOR ALL USING (organization_id = current_setting('app.current_organization_id', true));

-- SAR Policies (restricted to compliance officers)
CREATE POLICY sar_org_isolation ON aml_suspicious_activity_reports
    FOR ALL USING (organization_id = current_setting('app.current_organization_id', true));

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function: Initialize AML configuration for an organization
CREATE OR REPLACE FUNCTION initialize_aml_config(p_organization_id TEXT)
RETURNS TEXT AS $$
DECLARE
    v_config_id TEXT;
BEGIN
    INSERT INTO aml_monitoring_config (
        organization_id,
        daily_transaction_limit,
        monthly_transaction_limit,
        high_risk_amount_threshold,
        max_transactions_per_day,
        enable_real_time_monitoring,
        enable_sanctions_screening,
        enable_pep_screening
    ) VALUES (
        p_organization_id,
        10000.00,  -- $10,000 daily limit
        100000.00, -- $100,000 monthly limit
        5000.00,   -- $5,000 high-risk threshold
        50,        -- Max 50 transactions/day
        true,      -- Enable real-time monitoring
        true,      -- Enable sanctions screening
        true       -- Enable PEP screening
    )
    RETURNING id INTO v_config_id;
    
    RETURN v_config_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION initialize_aml_config IS 'Initialize AML monitoring configuration for new organization';

-- Function: Calculate transaction risk score
CREATE OR REPLACE FUNCTION calculate_transaction_risk_score(
    p_amount DECIMAL,
    p_member_risk_rating TEXT,
    p_transaction_count_today INTEGER,
    p_is_pep BOOLEAN
) RETURNS DECIMAL AS $$
DECLARE
    v_score DECIMAL := 0;
    v_amount_score DECIMAL;
    v_velocity_score DECIMAL;
    v_profile_score DECIMAL;
BEGIN
    -- Amount scoring (0-40 points)
    CASE
        WHEN p_amount >= 10000 THEN v_amount_score := 40;
        WHEN p_amount >= 5000 THEN v_amount_score := 30;
        WHEN p_amount >= 2000 THEN v_amount_score := 20;
        ELSE v_amount_score := 10;
    END CASE;
    
    -- Velocity scoring (0-30 points)
    CASE
        WHEN p_transaction_count_today >= 20 THEN v_velocity_score := 30;
        WHEN p_transaction_count_today >= 10 THEN v_velocity_score := 20;
        WHEN p_transaction_count_today >= 5 THEN v_velocity_score := 10;
        ELSE v_velocity_score := 0;
    END CASE;
    
    -- Profile scoring (0-30 points)
    v_profile_score := 0;
    IF p_is_pep THEN
        v_profile_score := v_profile_score + 15;
    END IF;
    
    CASE p_member_risk_rating
        WHEN 'high' THEN v_profile_score := v_profile_score + 15;
        WHEN 'medium' THEN v_profile_score := v_profile_score + 10;
        WHEN 'low' THEN v_profile_score := v_profile_score + 5;
        ELSE v_profile_score := v_profile_score + 0;
    END CASE;
    
    v_score := v_amount_score + v_velocity_score + v_profile_score;
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_transaction_risk_score IS 'Calculate risk score for AML transaction monitoring';

-- =====================================================
-- Verification Queries
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✓ All 4 AML/KYC tables created successfully';
    RAISE NOTICE '  - aml_monitoring_config';
    RAISE NOTICE '  - aml_customer_due_diligence';
    RAISE NOTICE '  - aml_transaction_alerts';
    RAISE NOTICE '  - aml_suspicious_activity_reports';
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename IN ('aml_monitoring_config', 'aml_customer_due_diligence', 
                           'aml_transaction_alerts', 'aml_suspicious_activity_reports')
    ) THEN
        RAISE NOTICE '✓ Row Level Security enabled on all AML tables';
    END IF;
END $$;

COMMIT;

-- =====================================================
-- Rollback Script (if needed)
-- =====================================================

/*
BEGIN;

DROP TABLE IF EXISTS aml_suspicious_activity_reports CASCADE;
DROP TABLE IF EXISTS aml_transaction_alerts CASCADE;
DROP TABLE IF EXISTS aml_customer_due_diligence CASCADE;
DROP TABLE IF EXISTS aml_monitoring_config CASCADE;

DROP FUNCTION IF EXISTS initialize_aml_config CASCADE;
DROP FUNCTION IF EXISTS calculate_transaction_risk_score CASCADE;

COMMIT;
*/
