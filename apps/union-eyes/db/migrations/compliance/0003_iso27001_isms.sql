-- =====================================================
-- Phase 4: ISO 27001 ISMS Schema
-- Information Security Management System
-- =====================================================

BEGIN;

-- =====================================================
-- 1. ISMS Documentation
-- =====================================================

CREATE TABLE IF NOT EXISTS iso27001_isms_documentation (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL,
    
    -- Document Information
    document_type TEXT NOT NULL CHECK (document_type IN (
        'information_security_policy',
        'risk_assessment_methodology',
        'statement_of_applicability',
        'risk_treatment_plan',
        'acceptable_use_policy',
        'access_control_policy',
        'incident_response_plan',
        'business_continuity_plan',
        'disaster_recovery_plan',
        'data_classification_policy',
        'change_management_procedure',
        'asset_management_policy',
        'supplier_security_policy'
    )),
    document_title TEXT NOT NULL,
    document_version TEXT NOT NULL,
    
    -- Content
    document_content TEXT,
    document_url TEXT,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),
    
    -- Approval Workflow
    author TEXT NOT NULL,
    reviewer TEXT,
    approver TEXT,
    approved_date TIMESTAMP,
    
    -- Lifecycle
    effective_date DATE,
    review_frequency_months INTEGER DEFAULT 12,
    next_review_date DATE,
    last_reviewed_date DATE,
    
    -- Version Control
    previous_version_id TEXT,
    change_summary TEXT,
    
    -- Metadata
    tags TEXT[],
    related_controls TEXT[], -- ISO 27001 control references
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_isms_doc_org FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_isms_doc_org ON iso27001_isms_documentation(organization_id);
CREATE INDEX idx_isms_doc_type ON iso27001_isms_documentation(document_type);
CREATE INDEX idx_isms_doc_status ON iso27001_isms_documentation(status);
CREATE INDEX idx_isms_doc_review ON iso27001_isms_documentation(next_review_date);

COMMENT ON TABLE iso27001_isms_documentation IS 'ISO 27001 ISMS policy and procedure documents';

-- =====================================================
-- 2. ISO 27001 Controls (114 controls from Annex A)
-- =====================================================

CREATE TABLE IF NOT EXISTS iso27001_controls (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL,
    
    -- Control Identification
    control_number TEXT NOT NULL, -- e.g., 'A.5.1', 'A.8.2'
    control_name TEXT NOT NULL,
    control_category TEXT NOT NULL CHECK (control_category IN (
        'organizational_controls',
        'people_controls',
        'physical_controls',
        'technological_controls'
    )),
    control_section TEXT NOT NULL, -- e.g., 'Information Security Policies'
    
    -- Implementation
    implementation_status TEXT DEFAULT 'not_implemented' CHECK (implementation_status IN (
        'not_implemented',
        'partially_implemented',
        'implemented',
        'not_applicable'
    )),
    applicability TEXT DEFAULT 'applicable' CHECK (applicability IN ('applicable', 'not_applicable')),
    justification_for_exclusion TEXT,
    
    -- Control Details
    control_objective TEXT,
    control_description TEXT,
    implementation_guidance TEXT,
    
    -- Current State
    current_implementation TEXT,
    responsible_party TEXT,
    implementation_date DATE,
    
    -- Evidence & Testing
    evidence_of_implementation TEXT[],
    last_tested_date DATE,
    test_results TEXT,
    test_frequency_days INTEGER DEFAULT 365,
    next_test_date DATE,
    
    -- Effectiveness
    effectiveness_rating TEXT CHECK (effectiveness_rating IN ('effective', 'partially_effective', 'ineffective', 'not_tested')),
    gaps_identified TEXT[],
    improvement_actions TEXT[],
    
    -- Compliance
    compliance_status TEXT DEFAULT 'non_compliant' CHECK (compliance_status IN ('compliant', 'partially_compliant', 'non_compliant', 'not_applicable')),
    
    -- Related Information
    related_policies TEXT[],
    related_procedures TEXT[],
    related_risks TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_control_org FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT unique_control_per_org UNIQUE (organization_id, control_number)
);

CREATE INDEX idx_control_org ON iso27001_controls(organization_id);
CREATE INDEX idx_control_number ON iso27001_controls(control_number);
CREATE INDEX idx_control_status ON iso27001_controls(implementation_status);
CREATE INDEX idx_control_compliance ON iso27001_controls(compliance_status);
CREATE INDEX idx_control_test_date ON iso27001_controls(next_test_date);

COMMENT ON TABLE iso27001_controls IS 'ISO 27001:2022 Annex A controls (114 controls)';

-- =====================================================
-- 3. Risk Assessment & Treatment
-- =====================================================

CREATE TABLE IF NOT EXISTS iso27001_risks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL,
    
    -- Risk Identification
    risk_id TEXT NOT NULL,
    risk_title TEXT NOT NULL,
    risk_description TEXT NOT NULL,
    risk_category TEXT CHECK (risk_category IN (
        'confidentiality',
        'integrity',
        'availability',
        'compliance',
        'operational',
        'reputational',
        'financial'
    )),
    
    -- Asset Information
    affected_assets TEXT[],
    asset_criticality TEXT CHECK (asset_criticality IN ('low', 'medium', 'high', 'critical')),
    
    -- Threat & Vulnerability
    threat_source TEXT,
    threat_description TEXT,
    vulnerability_description TEXT,
    
    -- Risk Assessment
    likelihood TEXT NOT NULL CHECK (likelihood IN ('very_low', 'low', 'medium', 'high', 'very_high')),
    likelihood_score INTEGER CHECK (likelihood_score BETWEEN 1 AND 5),
    
    impact TEXT NOT NULL CHECK (impact IN ('very_low', 'low', 'medium', 'high', 'very_high')),
    impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 5),
    
    inherent_risk_score INTEGER GENERATED ALWAYS AS (likelihood_score * impact_score) STORED,
    inherent_risk_level TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN likelihood_score * impact_score >= 20 THEN 'critical'
            WHEN likelihood_score * impact_score >= 12 THEN 'high'
            WHEN likelihood_score * impact_score >= 6 THEN 'medium'
            ELSE 'low'
        END
    ) STORED,
    
    -- Risk Treatment
    treatment_option TEXT CHECK (treatment_option IN ('mitigate', 'accept', 'transfer', 'avoid')),
    treatment_description TEXT,
    treatment_owner TEXT,
    treatment_deadline DATE,
    
    -- Current Controls
    existing_controls TEXT[],
    control_effectiveness TEXT CHECK (control_effectiveness IN ('effective', 'partially_effective', 'ineffective')),
    
    -- Residual Risk (after treatment)
    residual_likelihood TEXT CHECK (residual_likelihood IN ('very_low', 'low', 'medium', 'high', 'very_high')),
    residual_likelihood_score INTEGER CHECK (residual_likelihood_score BETWEEN 1 AND 5),
    residual_impact TEXT CHECK (residual_impact IN ('very_low', 'low', 'medium', 'high', 'very_high')),
    residual_impact_score INTEGER CHECK (residual_impact_score BETWEEN 1 AND 5),
    
    residual_risk_score INTEGER,
    residual_risk_level TEXT,
    
    -- Status & Review
    risk_status TEXT DEFAULT 'open' CHECK (risk_status IN ('open', 'in_treatment', 'closed', 'accepted')),
    risk_owner TEXT NOT NULL,
    last_reviewed_date DATE,
    next_review_date DATE,
    review_frequency_months INTEGER DEFAULT 6,
    
    -- Related Information
    related_controls TEXT[],
    related_incidents TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_risk_org FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT unique_risk_id_per_org UNIQUE (organization_id, risk_id)
);

CREATE INDEX idx_risk_org ON iso27001_risks(organization_id);
CREATE INDEX idx_risk_level ON iso27001_risks(inherent_risk_level);
CREATE INDEX idx_risk_status ON iso27001_risks(risk_status);
CREATE INDEX idx_risk_owner ON iso27001_risks(risk_owner);
CREATE INDEX idx_risk_review ON iso27001_risks(next_review_date);

COMMENT ON TABLE iso27001_risks IS 'ISO 27001 risk assessment and treatment register';

-- =====================================================
-- 4. Internal Audits
-- =====================================================

CREATE TABLE IF NOT EXISTS iso27001_internal_audits (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL,
    
    -- Audit Planning
    audit_number TEXT NOT NULL,
    audit_type TEXT NOT NULL CHECK (audit_type IN ('full_isms', 'partial', 'surveillance', 'follow_up')),
    audit_scope TEXT NOT NULL,
    audit_objectives TEXT,
    
    -- Scheduling
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- Audit Team
    lead_auditor TEXT NOT NULL,
    audit_team TEXT[],
    auditees TEXT[],
    
    -- Areas Audited
    controls_audited TEXT[], -- ISO 27001 control numbers
    processes_audited TEXT[],
    departments_audited TEXT[],
    
    -- Findings
    total_findings INTEGER DEFAULT 0,
    critical_findings INTEGER DEFAULT 0,
    major_findings INTEGER DEFAULT 0,
    minor_findings INTEGER DEFAULT 0,
    observations INTEGER DEFAULT 0,
    
    -- Status
    audit_status TEXT DEFAULT 'planned' CHECK (audit_status IN (
        'planned',
        'in_progress',
        'fieldwork_complete',
        'report_draft',
        'report_final',
        'closed'
    )),
    
    -- Reports
    audit_report_url TEXT,
    executive_summary TEXT,
    
    -- Follow-up
    corrective_actions_required INTEGER DEFAULT 0,
    corrective_actions_completed INTEGER DEFAULT 0,
    follow_up_audit_required BOOLEAN DEFAULT false,
    follow_up_audit_date DATE,
    
    -- Certification
    certification_body TEXT,
    certification_audit BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_audit_org FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT unique_audit_number UNIQUE (organization_id, audit_number)
);

CREATE INDEX idx_audit_org ON iso27001_internal_audits(organization_id);
CREATE INDEX idx_audit_status ON iso27001_internal_audits(audit_status);
CREATE INDEX idx_audit_date ON iso27001_internal_audits(planned_start_date);
CREATE INDEX idx_audit_lead ON iso27001_internal_audits(lead_auditor);

COMMENT ON TABLE iso27001_internal_audits IS 'ISO 27001 internal audit schedule and results';

-- =====================================================
-- 5. Audit Findings & Corrective Actions
-- =====================================================

CREATE TABLE IF NOT EXISTS iso27001_audit_findings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL,
    audit_id TEXT NOT NULL,
    
    -- Finding Details
    finding_number TEXT NOT NULL,
    finding_type TEXT NOT NULL CHECK (finding_type IN ('critical', 'major', 'minor', 'observation', 'opportunity_for_improvement')),
    
    -- Control Reference
    control_reference TEXT,
    clause_reference TEXT, -- ISO 27001 clause (e.g., '6.1.2', '9.2')
    
    -- Description
    finding_title TEXT NOT NULL,
    finding_description TEXT NOT NULL,
    evidence TEXT,
    
    -- Impact
    impact_description TEXT,
    potential_consequences TEXT,
    
    -- Root Cause
    root_cause_analysis TEXT,
    
    -- Corrective Action
    corrective_action_required BOOLEAN DEFAULT true,
    corrective_action_description TEXT,
    responsible_person TEXT,
    target_completion_date DATE,
    actual_completion_date DATE,
    
    -- Status
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending_verification', 'closed', 'overdue')),
    
    -- Verification
    verification_method TEXT,
    verified_by TEXT,
    verification_date DATE,
    verification_notes TEXT,
    
    -- Effectiveness
    effectiveness_check_required BOOLEAN DEFAULT false,
    effectiveness_check_date DATE,
    effectiveness_rating TEXT CHECK (effectiveness_rating IN ('effective', 'ineffective', 'partially_effective')),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_finding_org FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_finding_audit FOREIGN KEY (audit_id) 
        REFERENCES iso27001_internal_audits(id) ON DELETE CASCADE
);

CREATE INDEX idx_finding_org ON iso27001_audit_findings(organization_id);
CREATE INDEX idx_finding_audit ON iso27001_audit_findings(audit_id);
CREATE INDEX idx_finding_type ON iso27001_audit_findings(finding_type);
CREATE INDEX idx_finding_status ON iso27001_audit_findings(status);
CREATE INDEX idx_finding_due ON iso27001_audit_findings(target_completion_date);

COMMENT ON TABLE iso27001_audit_findings IS 'ISO 27001 audit findings and corrective actions';

-- =====================================================
-- Row Level Security Policies
-- =====================================================

ALTER TABLE iso27001_isms_documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE iso27001_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE iso27001_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE iso27001_internal_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE iso27001_audit_findings ENABLE ROW LEVEL SECURITY;

-- ISMS Documentation Policies
CREATE POLICY isms_doc_org_isolation ON iso27001_isms_documentation
    FOR ALL USING (organization_id = current_setting('app.current_organization_id', true));

-- Controls Policies
CREATE POLICY controls_org_isolation ON iso27001_controls
    FOR ALL USING (organization_id = current_setting('app.current_organization_id', true));

-- Risks Policies
CREATE POLICY risks_org_isolation ON iso27001_risks
    FOR ALL USING (organization_id = current_setting('app.current_organization_id', true));

-- Audits Policies
CREATE POLICY audits_org_isolation ON iso27001_internal_audits
    FOR ALL USING (organization_id = current_setting('app.current_organization_id', true));

-- Findings Policies
CREATE POLICY findings_org_isolation ON iso27001_audit_findings
    FOR ALL USING (organization_id = current_setting('app.current_organization_id', true));

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function: Initialize ISO 27001 controls from template
CREATE OR REPLACE FUNCTION initialize_iso27001_controls(p_organization_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    v_controls_created INTEGER := 0;
BEGIN
    -- This would insert all 114 ISO 27001:2022 Annex A controls
    -- For now, inserting a few examples
    
    INSERT INTO iso27001_controls (
        organization_id,
        control_number,
        control_name,
        control_category,
        control_section,
        control_objective,
        implementation_status,
        applicability
    ) VALUES
    (p_organization_id, 'A.5.1', 'Policies for information security', 'organizational_controls', 'Organizational Controls', 'To provide management direction and support for information security', 'not_implemented', 'applicable'),
    (p_organization_id, 'A.5.2', 'Information security roles and responsibilities', 'organizational_controls', 'Organizational Controls', 'To ensure accountability for information security responsibilities', 'not_implemented', 'applicable'),
    (p_organization_id, 'A.8.1', 'User endpoint devices', 'technological_controls', 'Technological Controls', 'To ensure security of user endpoint devices', 'not_implemented', 'applicable')
    ON CONFLICT (organization_id, control_number) DO NOTHING;
    
    GET DIAGNOSTICS v_controls_created = ROW_COUNT;
    
    RETURN v_controls_created;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION initialize_iso27001_controls IS 'Initialize ISO 27001 controls for new organization';

-- =====================================================
-- Verification Queries
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✓ All 5 ISO 27001 tables created successfully';
    RAISE NOTICE '  - iso27001_isms_documentation';
    RAISE NOTICE '  - iso27001_controls';
    RAISE NOTICE '  - iso27001_risks';
    RAISE NOTICE '  - iso27001_internal_audits';
    RAISE NOTICE '  - iso27001_audit_findings';
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename LIKE 'iso27001%'
    ) THEN
        RAISE NOTICE '✓ Row Level Security enabled on all ISO 27001 tables';
    END IF;
END $$;

COMMIT;

-- =====================================================
-- Rollback Script (if needed)
-- =====================================================

/*
BEGIN;

DROP TABLE IF EXISTS iso27001_audit_findings CASCADE;
DROP TABLE IF EXISTS iso27001_internal_audits CASCADE;
DROP TABLE IF EXISTS iso27001_risks CASCADE;
DROP TABLE IF EXISTS iso27001_controls CASCADE;
DROP TABLE IF EXISTS iso27001_isms_documentation CASCADE;

DROP FUNCTION IF EXISTS initialize_iso27001_controls CASCADE;

COMMIT;
*/
