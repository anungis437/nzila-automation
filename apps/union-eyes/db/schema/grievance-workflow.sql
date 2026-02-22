-- ============================================================================
-- PHASE 6: ADVANCED GRIEVANCE MANAGEMENT - DATABASE SCHEMA
-- ============================================================================
-- Description: Enhanced workflow automation, case assignment, document management,
--              deadline tracking, and settlement recommendations for grievances
-- Created: 2025-12-06
-- Dependencies: claims table, organization_members, collective_agreements
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Workflow status enum
CREATE TYPE grievance_workflow_status AS ENUM (
  'active',
  'draft',
  'archived'
);

-- Stage type enum
CREATE TYPE grievance_stage_type AS ENUM (
  'filed',           -- Initial filing
  'intake',          -- Initial review and categorization
  'investigation',   -- Gathering facts and evidence
  'step_1',          -- First level grievance meeting
  'step_2',          -- Second level grievance meeting
  'step_3',          -- Third level grievance meeting
  'mediation',       -- Mediation attempt
  'pre_arbitration', -- Preparing for arbitration
  'arbitration',     -- Arbitration hearing
  'resolved',        -- Successfully resolved
  'withdrawn',       -- Withdrawn by grievant
  'denied',          -- Grievance denied
  'settled'          -- Settlement reached
);

-- Transition trigger type
CREATE TYPE transition_trigger_type AS ENUM (
  'manual',          -- User-initiated transition
  'automatic',       -- Automatic based on conditions
  'deadline',        -- Triggered by deadline
  'approval',        -- Requires approval
  'rejection'        -- Rejection triggers transition
);

-- Assignment status enum
CREATE TYPE assignment_status AS ENUM (
  'assigned',
  'accepted',
  'in_progress',
  'completed',
  'reassigned',
  'declined'
);

-- Document version status
CREATE TYPE document_version_status AS ENUM (
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'superseded'
);

-- Settlement status enum
CREATE TYPE settlement_status AS ENUM (
  'proposed',
  'under_review',
  'accepted',
  'rejected',
  'finalized'
);

-- Assignment role enum
CREATE TYPE assignment_role AS ENUM (
  'primary_officer',    -- Lead union officer
  'secondary_officer',  -- Supporting officer
  'legal_counsel',      -- Legal representative
  'external_arbitrator',-- External arbitrator
  'management_rep',     -- Management representative
  'witness',            -- Witness
  'observer'            -- Observer role
);

-- ============================================================================
-- GRIEVANCE WORKFLOWS TABLE
-- ============================================================================
-- Stores configurable workflow definitions for different grievance types

CREATE TABLE IF NOT EXISTS grievance_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Workflow configuration
  grievance_type VARCHAR(100), -- Links to claim_type enum values
  contract_id UUID, -- References collective_agreements
  is_default BOOLEAN DEFAULT FALSE,
  status grievance_workflow_status DEFAULT 'active',
  
  -- Workflow settings
  auto_assign BOOLEAN DEFAULT FALSE,
  require_approval BOOLEAN DEFAULT FALSE,
  sla_days INTEGER, -- Service level agreement in days
  
  -- Stages configuration (ordered array of stage IDs)
  stages JSONB DEFAULT '[]'::jsonb, -- [{stage_id, order, required, sla_days}]
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT grievance_workflows_name_tenant_unique UNIQUE(tenant_id, name)
);

CREATE INDEX idx_grievance_workflows_tenant ON grievance_workflows(tenant_id);
CREATE INDEX idx_grievance_workflows_type ON grievance_workflows(grievance_type);
CREATE INDEX idx_grievance_workflows_status ON grievance_workflows(status);

-- ============================================================================
-- GRIEVANCE STAGES TABLE
-- ============================================================================
-- Defines individual stages in grievance workflows

CREATE TABLE IF NOT EXISTS grievance_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  workflow_id UUID REFERENCES grievance_workflows(id) ON DELETE CASCADE,
  
  -- Stage details
  name VARCHAR(255) NOT NULL,
  stage_type grievance_stage_type NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  
  -- Stage configuration
  is_required BOOLEAN DEFAULT TRUE,
  sla_days INTEGER, -- Days allowed for this stage
  auto_transition BOOLEAN DEFAULT FALSE,
  require_approval BOOLEAN DEFAULT FALSE,
  
  -- Transition conditions
  next_stage_id UUID, -- Default next stage
  conditions JSONB DEFAULT '{}'::jsonb, -- Conditions for auto-transition
  
  -- Actions on entry/exit
  entry_actions JSONB DEFAULT '[]'::jsonb, -- Actions when entering stage
  exit_actions JSONB DEFAULT '[]'::jsonb,  -- Actions when leaving stage
  
  -- Notification settings
  notify_on_entry BOOLEAN DEFAULT TRUE,
  notify_on_deadline BOOLEAN DEFAULT TRUE,
  notification_template_id UUID,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grievance_stages_tenant ON grievance_stages(tenant_id);
CREATE INDEX idx_grievance_stages_workflow ON grievance_stages(workflow_id);
CREATE INDEX idx_grievance_stages_type ON grievance_stages(stage_type);
CREATE INDEX idx_grievance_stages_order ON grievance_stages(workflow_id, order_index);

-- ============================================================================
-- GRIEVANCE TRANSITIONS TABLE
-- ============================================================================
-- Tracks stage transitions for each grievance

CREATE TABLE IF NOT EXISTS grievance_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  claim_id UUID NOT NULL, -- References claims table
  
  -- Transition details
  from_stage_id UUID REFERENCES grievance_stages(id),
  to_stage_id UUID NOT NULL REFERENCES grievance_stages(id),
  trigger_type transition_trigger_type NOT NULL,
  
  -- Transition metadata
  reason TEXT,
  notes TEXT,
  transitioned_by UUID NOT NULL,
  transitioned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Approval tracking
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Duration tracking
  stage_duration_days INTEGER, -- Days spent in previous stage
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_grievance_transitions_tenant ON grievance_transitions(tenant_id);
CREATE INDEX idx_grievance_transitions_claim ON grievance_transitions(claim_id);
CREATE INDEX idx_grievance_transitions_from_stage ON grievance_transitions(from_stage_id);
CREATE INDEX idx_grievance_transitions_to_stage ON grievance_transitions(to_stage_id);
CREATE INDEX idx_grievance_transitions_date ON grievance_transitions(transitioned_at);

-- ============================================================================
-- GRIEVANCE ASSIGNMENTS TABLE
-- ============================================================================
-- Tracks officer and representative assignments to grievances

CREATE TABLE IF NOT EXISTS grievance_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  claim_id UUID NOT NULL, -- References claims table
  
  -- Assignment details
  assigned_to UUID NOT NULL, -- References users/profiles
  role assignment_role NOT NULL,
  status assignment_status DEFAULT 'assigned',
  
  -- Assignment metadata
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Workload tracking
  estimated_hours DECIMAL(10, 2),
  actual_hours DECIMAL(10, 2),
  
  -- Notes and reason
  assignment_reason TEXT,
  notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT grievance_assignments_unique UNIQUE(claim_id, assigned_to, role)
);

CREATE INDEX idx_grievance_assignments_tenant ON grievance_assignments(tenant_id);
CREATE INDEX idx_grievance_assignments_claim ON grievance_assignments(claim_id);
CREATE INDEX idx_grievance_assignments_assigned_to ON grievance_assignments(assigned_to);
CREATE INDEX idx_grievance_assignments_status ON grievance_assignments(status);
CREATE INDEX idx_grievance_assignments_role ON grievance_assignments(role);

-- ============================================================================
-- GRIEVANCE DOCUMENTS TABLE
-- ============================================================================
-- Manages versioned document storage for grievances

CREATE TABLE IF NOT EXISTS grievance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  claim_id UUID NOT NULL, -- References claims table
  
  -- Document details
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NOT NULL, -- 'evidence', 'settlement', 'correspondence', 'hearing_notes'
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  
  -- Version control
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES grievance_documents(id),
  is_latest_version BOOLEAN DEFAULT TRUE,
  version_status document_version_status DEFAULT 'draft',
  
  -- Document metadata
  description TEXT,
  tags TEXT[],
  category VARCHAR(100),
  
  -- Access control
  is_confidential BOOLEAN DEFAULT FALSE,
  access_level VARCHAR(50) DEFAULT 'standard', -- 'public', 'standard', 'confidential', 'restricted'
  
  -- E-signature tracking
  requires_signature BOOLEAN DEFAULT FALSE,
  signature_status VARCHAR(50), -- 'pending', 'signed', 'declined', 'expired'
  signed_by UUID,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_data JSONB, -- DocuSign/Adobe Sign metadata
  
  -- OCR and indexing
  ocr_text TEXT, -- Full-text extracted via OCR
  indexed BOOLEAN DEFAULT FALSE,
  
  -- Audit trail
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Retention policy
  retention_period_days INTEGER,
  archived_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_grievance_documents_tenant ON grievance_documents(tenant_id);
CREATE INDEX idx_grievance_documents_claim ON grievance_documents(claim_id);
CREATE INDEX idx_grievance_documents_type ON grievance_documents(document_type);
CREATE INDEX idx_grievance_documents_version ON grievance_documents(parent_document_id, version);
CREATE INDEX idx_grievance_documents_latest ON grievance_documents(claim_id, is_latest_version);
CREATE INDEX idx_grievance_documents_signature ON grievance_documents(requires_signature, signature_status);
-- Full-text search index on OCR text
CREATE INDEX idx_grievance_documents_ocr_text ON grievance_documents USING GIN(to_tsvector('english', COALESCE(ocr_text, '')));

-- ============================================================================
-- GRIEVANCE DEADLINES TABLE
-- ============================================================================
-- Tracks critical deadlines for grievance processing

CREATE TABLE IF NOT EXISTS grievance_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  claim_id UUID NOT NULL, -- References claims table
  stage_id UUID REFERENCES grievance_stages(id),
  
  -- Deadline details
  deadline_type VARCHAR(100) NOT NULL, -- 'filing', 'response', 'hearing', 'arbitration', 'settlement'
  deadline_date DATE NOT NULL,
  deadline_time TIME,
  timezone VARCHAR(50) DEFAULT 'America/Toronto',
  
  -- Calculation source
  calculated_from VARCHAR(100), -- 'incident_date', 'filing_date', 'stage_entry', 'contract_clause'
  contract_clause_reference VARCHAR(255), -- CBA clause defining this deadline
  days_from_source INTEGER, -- Days added to source date
  
  -- Status tracking
  is_met BOOLEAN,
  met_at TIMESTAMP WITH TIME ZONE,
  is_extended BOOLEAN DEFAULT FALSE,
  extension_reason TEXT,
  extended_to DATE,
  
  -- Reminder configuration
  reminder_days INTEGER[] DEFAULT ARRAY[7, 3, 1], -- Days before deadline to send reminders
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Escalation
  escalate_on_miss BOOLEAN DEFAULT TRUE,
  escalate_to UUID, -- User to escalate to
  escalated_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grievance_deadlines_tenant ON grievance_deadlines(tenant_id);
CREATE INDEX idx_grievance_deadlines_claim ON grievance_deadlines(claim_id);
CREATE INDEX idx_grievance_deadlines_stage ON grievance_deadlines(stage_id);
CREATE INDEX idx_grievance_deadlines_date ON grievance_deadlines(deadline_date);
CREATE INDEX idx_grievance_deadlines_type ON grievance_deadlines(deadline_type);
CREATE INDEX idx_grievance_deadlines_upcoming ON grievance_deadlines(deadline_date, is_met) WHERE is_met IS NOT TRUE;

-- ============================================================================
-- GRIEVANCE SETTLEMENTS TABLE
-- ============================================================================
-- Tracks settlement proposals and outcomes

CREATE TABLE IF NOT EXISTS grievance_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  claim_id UUID NOT NULL, -- References claims table
  
  -- Settlement details
  settlement_type VARCHAR(100) NOT NULL, -- 'monetary', 'reinstatement', 'policy_change', 'combined'
  status settlement_status DEFAULT 'proposed',
  
  -- Financial terms
  monetary_amount DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'CAD',
  payment_schedule JSONB, -- Payment terms if installments
  
  -- Non-monetary terms
  terms_description TEXT NOT NULL,
  terms_structured JSONB, -- Structured terms data
  
  -- Proposal tracking
  proposed_by VARCHAR(50) NOT NULL, -- 'union', 'management'
  proposed_by_user UUID,
  proposed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Response tracking
  responded_by VARCHAR(50), -- 'union', 'management'
  responded_by_user UUID,
  responded_at TIMESTAMP WITH TIME ZONE,
  response_notes TEXT,
  
  -- Approval workflow
  requires_member_approval BOOLEAN DEFAULT TRUE,
  member_approved BOOLEAN,
  member_approved_at TIMESTAMP WITH TIME ZONE,
  
  requires_union_approval BOOLEAN DEFAULT TRUE,
  union_approved BOOLEAN,
  union_approved_by UUID,
  union_approved_at TIMESTAMP WITH TIME ZONE,
  
  requires_management_approval BOOLEAN DEFAULT TRUE,
  management_approved BOOLEAN,
  management_approved_by UUID,
  management_approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Finalization
  finalized_at TIMESTAMP WITH TIME ZONE,
  finalized_by UUID,
  
  -- Document references
  settlement_document_id UUID REFERENCES grievance_documents(id),
  signed_agreement_id UUID REFERENCES grievance_documents(id),
  
  -- Precedent value
  set_precedent BOOLEAN DEFAULT FALSE,
  precedent_description TEXT,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grievance_settlements_tenant ON grievance_settlements(tenant_id);
CREATE INDEX idx_grievance_settlements_claim ON grievance_settlements(claim_id);
CREATE INDEX idx_grievance_settlements_status ON grievance_settlements(status);
CREATE INDEX idx_grievance_settlements_type ON grievance_settlements(settlement_type);
CREATE INDEX idx_grievance_settlements_proposed_at ON grievance_settlements(proposed_at);

-- ============================================================================
-- GRIEVANCE COMMUNICATIONS LOG
-- ============================================================================
-- Centralized log of all communications related to grievances

CREATE TABLE IF NOT EXISTS grievance_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  claim_id UUID NOT NULL, -- References claims table
  
  -- Communication details
  communication_type VARCHAR(100) NOT NULL, -- 'email', 'sms', 'phone_call', 'meeting', 'letter'
  direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
  
  -- Parties involved
  from_user_id UUID,
  from_external VARCHAR(255), -- External party name if not a user
  to_user_ids UUID[],
  to_external VARCHAR(255)[], -- External recipients
  
  -- Content
  subject VARCHAR(500),
  body TEXT,
  summary TEXT, -- AI-generated summary
  
  -- Metadata
  communication_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_minutes INTEGER, -- For calls/meetings
  
  -- Attachments
  attachment_ids UUID[], -- References grievance_documents
  
  -- Integration references
  email_message_id VARCHAR(255),
  sms_message_id UUID, -- References sms_messages if integrated
  calendar_event_id UUID, -- References calendar events
  
  -- Tracking
  is_important BOOLEAN DEFAULT FALSE,
  requires_followup BOOLEAN DEFAULT FALSE,
  followup_date DATE,
  followup_completed BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  recorded_by UUID NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grievance_communications_tenant ON grievance_communications(tenant_id);
CREATE INDEX idx_grievance_communications_claim ON grievance_communications(claim_id);
CREATE INDEX idx_grievance_communications_type ON grievance_communications(communication_type);
CREATE INDEX idx_grievance_communications_date ON grievance_communications(communication_date);
CREATE INDEX idx_grievance_communications_followup ON grievance_communications(requires_followup, followup_completed);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE grievance_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_communications ENABLE ROW LEVEL SECURITY;

-- Grievance Workflows Policies
CREATE POLICY grievance_workflows_tenant_isolation_select ON grievance_workflows
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_workflows_tenant_isolation_insert ON grievance_workflows
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_workflows_tenant_isolation_update ON grievance_workflows
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_workflows_tenant_isolation_delete ON grievance_workflows
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Grievance Stages Policies
CREATE POLICY grievance_stages_tenant_isolation_select ON grievance_stages
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_stages_tenant_isolation_insert ON grievance_stages
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_stages_tenant_isolation_update ON grievance_stages
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_stages_tenant_isolation_delete ON grievance_stages
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Grievance Transitions Policies
CREATE POLICY grievance_transitions_tenant_isolation_select ON grievance_transitions
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_transitions_tenant_isolation_insert ON grievance_transitions
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_transitions_tenant_isolation_update ON grievance_transitions
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_transitions_tenant_isolation_delete ON grievance_transitions
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Grievance Assignments Policies
CREATE POLICY grievance_assignments_tenant_isolation_select ON grievance_assignments
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_assignments_tenant_isolation_insert ON grievance_assignments
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_assignments_tenant_isolation_update ON grievance_assignments
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_assignments_tenant_isolation_delete ON grievance_assignments
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Grievance Documents Policies (with access level consideration)
CREATE POLICY grievance_documents_tenant_isolation_select ON grievance_documents
  FOR SELECT USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND (
      access_level IN ('public', 'standard')
      OR uploaded_by = current_setting('app.current_user_id', true)::uuid
      -- TODO: Add role-based access for confidential/restricted documents
    )
  );

CREATE POLICY grievance_documents_tenant_isolation_insert ON grievance_documents
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_documents_tenant_isolation_update ON grievance_documents
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_documents_tenant_isolation_delete ON grievance_documents
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Grievance Deadlines Policies
CREATE POLICY grievance_deadlines_tenant_isolation_select ON grievance_deadlines
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_deadlines_tenant_isolation_insert ON grievance_deadlines
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_deadlines_tenant_isolation_update ON grievance_deadlines
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_deadlines_tenant_isolation_delete ON grievance_deadlines
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Grievance Settlements Policies
CREATE POLICY grievance_settlements_tenant_isolation_select ON grievance_settlements
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_settlements_tenant_isolation_insert ON grievance_settlements
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_settlements_tenant_isolation_update ON grievance_settlements
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_settlements_tenant_isolation_delete ON grievance_settlements
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Grievance Communications Policies
CREATE POLICY grievance_communications_tenant_isolation_select ON grievance_communications
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_communications_tenant_isolation_insert ON grievance_communications
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_communications_tenant_isolation_update ON grievance_communications
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY grievance_communications_tenant_isolation_delete ON grievance_communications
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update grievance_workflows updated_at
CREATE OR REPLACE FUNCTION update_grievance_workflows_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_grievance_workflows_timestamp
  BEFORE UPDATE ON grievance_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_grievance_workflows_timestamp();

-- Trigger: Update grievance_stages updated_at
CREATE OR REPLACE FUNCTION update_grievance_stages_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_grievance_stages_timestamp
  BEFORE UPDATE ON grievance_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_grievance_stages_timestamp();

-- Trigger: Calculate stage duration on transition
CREATE OR REPLACE FUNCTION calculate_stage_duration()
RETURNS TRIGGER AS $$
DECLARE
  previous_transition_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the date of the previous transition (entry to from_stage)
  SELECT transitioned_at INTO previous_transition_date
  FROM grievance_transitions
  WHERE claim_id = NEW.claim_id
    AND to_stage_id = NEW.from_stage_id
  ORDER BY transitioned_at DESC
  LIMIT 1;
  
  -- Calculate days spent in previous stage
  IF previous_transition_date IS NOT NULL THEN
    NEW.stage_duration_days = EXTRACT(DAY FROM (NEW.transitioned_at - previous_transition_date));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_stage_duration
  BEFORE INSERT ON grievance_transitions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_stage_duration();

-- Trigger: Mark old document versions as superseded
CREATE OR REPLACE FUNCTION mark_document_versions_superseded()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a new version of an existing document
  IF NEW.parent_document_id IS NOT NULL AND NEW.is_latest_version = TRUE THEN
    -- Mark previous latest version as superseded
    UPDATE grievance_documents
    SET is_latest_version = FALSE,
        version_status = 'superseded'
    WHERE parent_document_id = NEW.parent_document_id
      AND id != NEW.id
      AND is_latest_version = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_document_versions_superseded
  BEFORE INSERT OR UPDATE ON grievance_documents
  FOR EACH ROW
  EXECUTE FUNCTION mark_document_versions_superseded();

-- Trigger: Auto-create deadlines when stage changes
CREATE OR REPLACE FUNCTION auto_create_stage_deadlines()
RETURNS TRIGGER AS $$
DECLARE
  stage_sla_days INTEGER;
  stage_record RECORD;
BEGIN
  -- Get SLA days for the new stage
  SELECT sla_days INTO stage_sla_days
  FROM grievance_stages
  WHERE id = NEW.to_stage_id;
  
  -- If stage has SLA, create deadline
  IF stage_sla_days IS NOT NULL THEN
    INSERT INTO grievance_deadlines (
      tenant_id,
      claim_id,
      stage_id,
      deadline_type,
      deadline_date,
      calculated_from,
      days_from_source
    ) VALUES (
      NEW.tenant_id,
      NEW.claim_id,
      NEW.to_stage_id,
      'stage_completion',
      CURRENT_DATE + stage_sla_days,
      'stage_entry',
      stage_sla_days
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_stage_deadlines
  AFTER INSERT ON grievance_transitions
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_stage_deadlines();

-- Trigger: Update grievance_deadlines updated_at
CREATE OR REPLACE FUNCTION update_grievance_deadlines_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_grievance_deadlines_timestamp
  BEFORE UPDATE ON grievance_deadlines
  FOR EACH ROW
  EXECUTE FUNCTION update_grievance_deadlines_timestamp();

-- Trigger: Update grievance_settlements updated_at
CREATE OR REPLACE FUNCTION update_grievance_settlements_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_grievance_settlements_timestamp
  BEFORE UPDATE ON grievance_settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_grievance_settlements_timestamp();

-- Trigger: Cleanup old archived documents (retention policy)
CREATE OR REPLACE FUNCTION cleanup_archived_documents()
RETURNS void AS $$
BEGIN
  UPDATE grievance_documents
  SET archived_at = NOW()
  WHERE retention_period_days IS NOT NULL
    AND uploaded_at < NOW() - (retention_period_days || ' days')::INTERVAL
    AND archived_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-grievance-documents', '0 2 * * *', 'SELECT cleanup_archived_documents()');

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE grievance_workflows IS 'Configurable workflow definitions for different grievance types';
COMMENT ON TABLE grievance_stages IS 'Individual stages in grievance workflows with SLA and conditions';
COMMENT ON TABLE grievance_transitions IS 'Audit trail of all stage transitions for grievances';
COMMENT ON TABLE grievance_assignments IS 'Officer and representative assignments to grievances';
COMMENT ON TABLE grievance_documents IS 'Versioned document storage with e-signature and OCR support';
COMMENT ON TABLE grievance_deadlines IS 'Critical deadlines with automatic calculation and reminders';
COMMENT ON TABLE grievance_settlements IS 'Settlement proposals and outcomes with approval workflow';
COMMENT ON TABLE grievance_communications IS 'Centralized log of all grievance-related communications';
