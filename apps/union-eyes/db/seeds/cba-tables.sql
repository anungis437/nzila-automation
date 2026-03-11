-- ============================================================================
-- CBA DOMAIN: TABLE CREATION (DDL)
-- ============================================================================
-- Creates all tables for Collective Bargaining Agreement features
-- Target: Docker DB (nzila-postgres container)
-- Run: Get-Content cba-tables.sql | docker exec -i nzila-postgres psql -U nzila -d nzila_automation
-- ============================================================================

BEGIN;

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN CREATE TYPE cba_jurisdiction AS ENUM (
  'federal','ontario','bc','alberta','quebec','manitoba','saskatchewan',
  'nova_scotia','new_brunswick','pei','newfoundland',
  'northwest_territories','yukon','nunavut'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE cba_language AS ENUM ('en','fr','bilingual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE cba_status AS ENUM (
  'active','expired','under_negotiation','ratified_pending','archived'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE clause_type AS ENUM (
  'wages_compensation','benefits_insurance','working_conditions',
  'grievance_arbitration','seniority_promotion','health_safety',
  'union_rights','management_rights','duration_renewal',
  'vacation_leave','hours_scheduling','disciplinary_procedures',
  'training_development','pension_retirement','overtime',
  'job_security','technological_change','workplace_rights','other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE entity_type AS ENUM (
  'monetary_amount','percentage','date','time_period','job_position',
  'location','person','organization','legal_reference','other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE tribunal_type AS ENUM (
  'fpslreb','provincial_labour_board','private_arbitrator',
  'court_federal','court_provincial','other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE decision_type AS ENUM (
  'grievance','unfair_practice','certification',
  'judicial_review','interpretation','scope_bargaining','other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE outcome AS ENUM (
  'grievance_upheld','grievance_denied','partial_success',
  'dismissed','withdrawn','settled'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE precedent_value AS ENUM ('high','medium','low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE negotiation_status AS ENUM (
  'scheduled','active','impasse','conciliation','tentative',
  'ratified','rejected','strike_lockout','completed','abandoned'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE proposal_type AS ENUM (
  'union_demand','management_offer','joint_proposal','mediator_proposal'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE proposal_status AS ENUM (
  'draft','submitted','under_review','accepted','rejected',
  'counter_offered','withdrawn','superseded'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE negotiation_session_type AS ENUM (
  'opening','negotiation','caucus','conciliation',
  'information','closing','ratification'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE bargaining_team_role AS ENUM (
  'chief_negotiator','committee_member','researcher','note_taker',
  'subject_expert','observer','legal_counsel','financial_advisor'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE grievance_type AS ENUM (
  'individual','group','policy','contract','harassment',
  'discrimination','safety','seniority','discipline','termination','other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE grievance_status AS ENUM (
  'draft','filed','acknowledged','investigating','response_due',
  'response_received','escalated','mediation','arbitration',
  'settled','withdrawn','denied','closed'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE grievance_priority AS ENUM (
  'low','medium','high','urgent'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE grievance_step AS ENUM (
  'step_1','step_2','step_3','final','arbitration'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE arbitration_status AS ENUM (
  'pending','scheduled','in_progress','adjourned',
  'reserved','award_rendered','settled','withdrawn'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE settlement_type AS ENUM (
  'monetary','non_monetary','policy_change',
  'reinstatement','apology','training','other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- CORE CBA TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS collective_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  cba_number VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  jurisdiction cba_jurisdiction NOT NULL,
  language cba_language NOT NULL DEFAULT 'en',
  employer_name VARCHAR(300) NOT NULL,
  employer_id VARCHAR(100),
  union_name VARCHAR(300) NOT NULL,
  union_local VARCHAR(100),
  union_id VARCHAR(100),
  effective_date TIMESTAMPTZ NOT NULL,
  expiry_date TIMESTAMPTZ NOT NULL,
  signed_date TIMESTAMPTZ,
  ratification_date TIMESTAMPTZ,
  industry_sector VARCHAR(200) NOT NULL,
  sector VARCHAR(200),
  employee_coverage INTEGER,
  bargaining_unit_description TEXT,
  document_url TEXT,
  document_hash VARCHAR(64),
  raw_text TEXT,
  structured_data JSONB,
  embedding TEXT,
  summary_generated TEXT,
  key_terms JSONB,
  ai_processed BOOLEAN DEFAULT FALSE,
  status cba_status NOT NULL DEFAULT 'active',
  is_public BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255),
  last_modified_by VARCHAR(255),
  version INTEGER NOT NULL DEFAULT 1,
  superseded_by UUID,
  precedes_id UUID
);

CREATE INDEX IF NOT EXISTS cba_organization_idx ON collective_agreements(organization_id);
CREATE INDEX IF NOT EXISTS cba_jurisdiction_idx ON collective_agreements(jurisdiction);
CREATE INDEX IF NOT EXISTS cba_employer_idx ON collective_agreements(employer_name);
CREATE INDEX IF NOT EXISTS cba_union_idx ON collective_agreements(union_name);
CREATE INDEX IF NOT EXISTS cba_expiry_idx ON collective_agreements(expiry_date);
CREATE INDEX IF NOT EXISTS cba_status_idx ON collective_agreements(status);
CREATE INDEX IF NOT EXISTS cba_effective_date_idx ON collective_agreements(effective_date);
CREATE INDEX IF NOT EXISTS cba_sector_idx ON collective_agreements(industry_sector);

-- ============================================================================
-- CBA VERSION HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS cba_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cba_id UUID NOT NULL REFERENCES collective_agreements(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  change_description TEXT NOT NULL,
  change_type VARCHAR(50) NOT NULL,
  previous_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS cba_version_cba_idx ON cba_version_history(cba_id);
CREATE INDEX IF NOT EXISTS cba_version_number_idx ON cba_version_history(version);

-- ============================================================================
-- CBA CONTACTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS cba_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cba_id UUID NOT NULL REFERENCES collective_agreements(id) ON DELETE CASCADE,
  contact_type VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  title VARCHAR(200),
  organization VARCHAR(300),
  email VARCHAR(255),
  phone VARCHAR(50),
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cba_contacts_cba_idx ON cba_contacts(cba_id);
CREATE INDEX IF NOT EXISTS cba_contacts_type_idx ON cba_contacts(contact_type);

-- ============================================================================
-- CBA CLAUSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS cba_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  cba_id UUID NOT NULL REFERENCES collective_agreements(id) ON DELETE CASCADE,
  clause_number VARCHAR(50) NOT NULL,
  clause_type clause_type NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  content_plain_text TEXT,
  page_number INTEGER,
  article_number VARCHAR(50),
  section_hierarchy JSONB,
  parent_clause_id UUID,
  order_index INTEGER NOT NULL DEFAULT 0,
  embedding TEXT,
  confidence_score DECIMAL(5,4),
  orgs JSONB,
  key_terms JSONB,
  related_clause_ids JSONB,
  interpretation_notes TEXT,
  view_count INTEGER DEFAULT 0,
  citation_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cba_clauses_cba_idx ON cba_clauses(cba_id);
CREATE INDEX IF NOT EXISTS cba_clauses_type_idx ON cba_clauses(clause_type);
CREATE INDEX IF NOT EXISTS cba_clauses_number_idx ON cba_clauses(clause_number);
CREATE INDEX IF NOT EXISTS cba_clauses_parent_idx ON cba_clauses(parent_clause_id);
CREATE INDEX IF NOT EXISTS cba_clauses_confidence_idx ON cba_clauses(confidence_score);

-- ============================================================================
-- CLAUSE COMPARISONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS clause_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_name VARCHAR(200) NOT NULL,
  clause_type clause_type NOT NULL,
  organization_id UUID NOT NULL,
  clause_ids JSONB NOT NULL,
  analysis_results JSONB,
  industry_average JSONB,
  market_position VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS clause_comparisons_organization_idx ON clause_comparisons(organization_id);
CREATE INDEX IF NOT EXISTS clause_comparisons_type_idx ON clause_comparisons(clause_type);

-- ============================================================================
-- WAGE PROGRESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS wage_progressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cba_id UUID NOT NULL REFERENCES collective_agreements(id) ON DELETE CASCADE,
  clause_id UUID REFERENCES cba_clauses(id) ON DELETE SET NULL,
  classification VARCHAR(200) NOT NULL,
  classification_code VARCHAR(50),
  step INTEGER NOT NULL,
  hourly_rate DECIMAL(10,2),
  annual_salary DECIMAL(12,2),
  effective_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  premiums JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wage_progressions_cba_idx ON wage_progressions(cba_id);
CREATE INDEX IF NOT EXISTS wage_progressions_clause_idx ON wage_progressions(clause_id);
CREATE INDEX IF NOT EXISTS wage_progressions_classification_idx ON wage_progressions(classification);
CREATE INDEX IF NOT EXISTS wage_progressions_effective_date_idx ON wage_progressions(effective_date);

-- ============================================================================
-- BENEFIT COMPARISONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS benefit_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cba_id UUID NOT NULL REFERENCES collective_agreements(id) ON DELETE CASCADE,
  clause_id UUID REFERENCES cba_clauses(id) ON DELETE SET NULL,
  benefit_type VARCHAR(100) NOT NULL,
  benefit_name VARCHAR(200) NOT NULL,
  coverage_details JSONB,
  monthly_premium DECIMAL(10,2),
  annual_cost DECIMAL(12,2),
  industry_benchmark VARCHAR(50),
  effective_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS benefit_comparisons_cba_idx ON benefit_comparisons(cba_id);
CREATE INDEX IF NOT EXISTS benefit_comparisons_type_idx ON benefit_comparisons(benefit_type);

-- ============================================================================
-- ARBITRATION DECISIONS (PRECEDENT DATABASE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS arbitration_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(100) NOT NULL UNIQUE,
  case_title VARCHAR(500) NOT NULL,
  tribunal tribunal_type NOT NULL,
  decision_type decision_type NOT NULL,
  decision_date TIMESTAMPTZ NOT NULL,
  filing_date TIMESTAMPTZ,
  hearing_date TIMESTAMPTZ,
  arbitrator VARCHAR(200) NOT NULL,
  panel_members JSONB,
  grievor VARCHAR(300),
  "union" VARCHAR(300) NOT NULL,
  employer VARCHAR(300) NOT NULL,
  outcome outcome NOT NULL,
  remedy JSONB,
  key_findings JSONB,
  issue_types JSONB,
  precedent_value precedent_value NOT NULL,
  legal_citations JSONB,
  related_decisions JSONB,
  cba_references JSONB,
  full_text TEXT NOT NULL,
  summary TEXT,
  headnote TEXT,
  precedent_summary TEXT,
  reasoning TEXT,
  key_facts TEXT,
  sector VARCHAR(100),
  jurisdiction VARCHAR(50),
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  citation_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  embedding TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  access_restrictions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  imported_from VARCHAR(200)
);

CREATE INDEX IF NOT EXISTS arbitration_tribunal_idx ON arbitration_decisions(tribunal);
CREATE INDEX IF NOT EXISTS arbitration_decision_date_idx ON arbitration_decisions(decision_date);
CREATE INDEX IF NOT EXISTS arbitration_arbitrator_idx ON arbitration_decisions(arbitrator);
CREATE INDEX IF NOT EXISTS arbitration_outcome_idx ON arbitration_decisions(outcome);
CREATE INDEX IF NOT EXISTS arbitration_precedent_idx ON arbitration_decisions(precedent_value);
CREATE INDEX IF NOT EXISTS arbitration_jurisdiction_idx ON arbitration_decisions(jurisdiction);
CREATE INDEX IF NOT EXISTS arbitration_case_number_idx ON arbitration_decisions(case_number);

-- ============================================================================
-- ARBITRATOR PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS arbitrator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL UNIQUE,
  total_decisions INTEGER NOT NULL DEFAULT 0,
  grievor_success_rate DECIMAL(5,2),
  employer_success_rate DECIMAL(5,2),
  average_award_amount DECIMAL(12,2),
  median_award_amount DECIMAL(12,2),
  highest_award_amount DECIMAL(12,2),
  common_remedies JSONB,
  specializations JSONB,
  primary_sectors JSONB,
  jurisdictions JSONB,
  avg_decision_days INTEGER,
  median_decision_days INTEGER,
  decision_range_min INTEGER,
  decision_range_max INTEGER,
  decision_patterns JSONB,
  contact_info JSONB,
  biography TEXT,
  credentials JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  last_decision_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS arbitrator_profiles_name_idx ON arbitrator_profiles(name);
CREATE INDEX IF NOT EXISTS arbitrator_profiles_active_idx ON arbitrator_profiles(is_active);

-- ============================================================================
-- BARGAINING NOTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS bargaining_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cba_id UUID REFERENCES collective_agreements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  session_date TIMESTAMPTZ NOT NULL,
  session_type VARCHAR(100) NOT NULL,
  session_number INTEGER,
  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL,
  attendees JSONB,
  related_clause_ids JSONB,
  related_decision_ids JSONB,
  tags JSONB,
  confidentiality_level VARCHAR(50) DEFAULT 'internal',
  embedding TEXT,
  key_insights JSONB,
  attachments JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS bargaining_notes_cba_idx ON bargaining_notes(cba_id);
CREATE INDEX IF NOT EXISTS bargaining_notes_organization_idx ON bargaining_notes(organization_id);
CREATE INDEX IF NOT EXISTS bargaining_notes_session_date_idx ON bargaining_notes(session_date);
CREATE INDEX IF NOT EXISTS bargaining_notes_session_type_idx ON bargaining_notes(session_type);

-- ============================================================================
-- CBA FOOTNOTES (CROSS-REFERENCES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cba_footnotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_clause_id UUID NOT NULL REFERENCES cba_clauses(id) ON DELETE CASCADE,
  target_clause_id UUID REFERENCES cba_clauses(id) ON DELETE CASCADE,
  target_decision_id UUID REFERENCES arbitration_decisions(id) ON DELETE CASCADE,
  footnote_number INTEGER NOT NULL,
  footnote_text TEXT NOT NULL,
  context TEXT,
  link_type VARCHAR(50) NOT NULL,
  start_offset INTEGER,
  end_offset INTEGER,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS cba_footnotes_source_idx ON cba_footnotes(source_clause_id);
CREATE INDEX IF NOT EXISTS cba_footnotes_target_clause_idx ON cba_footnotes(target_clause_id);
CREATE INDEX IF NOT EXISTS cba_footnotes_target_decision_idx ON cba_footnotes(target_decision_id);

-- ============================================================================
-- CLAIM PRECEDENT ANALYSIS
-- ============================================================================

CREATE TABLE IF NOT EXISTS claim_precedent_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL,
  precedent_matches JSONB,
  success_probability DECIMAL(5,2),
  confidence_level VARCHAR(50),
  suggested_strategy TEXT,
  potential_remedies JSONB,
  arbitrator_tendencies JSONB,
  relevant_cba_clause_ids JSONB,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analyzed_by VARCHAR(50) NOT NULL DEFAULT 'ai_system',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS claim_precedent_claim_idx ON claim_precedent_analysis(claim_id);

-- ============================================================================
-- NEGOTIATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  expiring_cba_id UUID REFERENCES collective_agreements(id) ON DELETE SET NULL,
  resulting_cba_id UUID REFERENCES collective_agreements(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  union_name VARCHAR(300) NOT NULL,
  union_local VARCHAR(100),
  employer_name VARCHAR(300) NOT NULL,
  bargaining_unit_size INTEGER,
  notice_given_date TIMESTAMPTZ,
  first_session_date TIMESTAMPTZ,
  target_completion_date TIMESTAMPTZ,
  tentative_agreement_date TIMESTAMPTZ,
  ratification_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  status negotiation_status NOT NULL DEFAULT 'scheduled',
  current_round INTEGER DEFAULT 1,
  total_sessions INTEGER DEFAULT 0,
  key_issues JSONB,
  strike_vote_passed BOOLEAN DEFAULT FALSE,
  strike_vote_date TIMESTAMPTZ,
  strike_vote_yes_percent DECIMAL(5,2),
  mandate_expiry TIMESTAMPTZ,
  estimated_cost DECIMAL(15,2),
  maximum_cost DECIMAL(15,2),
  progress_summary TEXT,
  last_activity_date TIMESTAMPTZ,
  tags JSONB,
  confidentiality_level VARCHAR(50) DEFAULT 'restricted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS negotiations_organization_idx ON negotiations(organization_id);
CREATE INDEX IF NOT EXISTS negotiations_status_idx ON negotiations(status);
CREATE INDEX IF NOT EXISTS negotiations_expiring_cba_idx ON negotiations(expiring_cba_id);
CREATE INDEX IF NOT EXISTS negotiations_first_session_idx ON negotiations(first_session_date);

-- ============================================================================
-- BARGAINING PROPOSALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS bargaining_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
  proposal_number VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  proposal_type proposal_type NOT NULL,
  status proposal_status NOT NULL DEFAULT 'draft',
  related_clause_id UUID,
  clause_category VARCHAR(100),
  current_language TEXT,
  proposed_language TEXT NOT NULL,
  rationale TEXT,
  estimated_cost DECIMAL(15,2),
  costing_notes TEXT,
  union_position VARCHAR(50),
  management_position VARCHAR(50),
  submitted_date TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ,
  resolved_date TIMESTAMPTZ,
  parent_proposal_id UUID REFERENCES bargaining_proposals(id) ON DELETE SET NULL,
  superseded_by_id UUID REFERENCES bargaining_proposals(id) ON DELETE SET NULL,
  attachments JSONB,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS bargaining_proposals_negotiation_idx ON bargaining_proposals(negotiation_id);
CREATE INDEX IF NOT EXISTS bargaining_proposals_status_idx ON bargaining_proposals(status);
CREATE INDEX IF NOT EXISTS bargaining_proposals_type_idx ON bargaining_proposals(proposal_type);
CREATE INDEX IF NOT EXISTS bargaining_proposals_category_idx ON bargaining_proposals(clause_category);
CREATE INDEX IF NOT EXISTS bargaining_proposals_number_idx ON bargaining_proposals(proposal_number);

-- ============================================================================
-- TENTATIVE AGREEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tentative_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
  agreement_number VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  clause_category VARCHAR(100) NOT NULL,
  agreed_language TEXT NOT NULL,
  previous_language TEXT,
  related_proposal_ids JSONB,
  related_clause_id UUID,
  requires_ratification BOOLEAN DEFAULT TRUE,
  ratified BOOLEAN DEFAULT FALSE,
  ratification_date TIMESTAMPTZ,
  ratification_vote_yes INTEGER,
  ratification_vote_no INTEGER,
  ratification_notes TEXT,
  annual_cost DECIMAL(15,2),
  implementation_cost DECIMAL(15,2),
  costing_approved BOOLEAN DEFAULT FALSE,
  agreed_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_date TIMESTAMPTZ,
  union_signed_by VARCHAR(255),
  union_signed_date TIMESTAMPTZ,
  employer_signed_by VARCHAR(255),
  employer_signed_date TIMESTAMPTZ,
  attachments JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS tentative_agreements_negotiation_idx ON tentative_agreements(negotiation_id);
CREATE INDEX IF NOT EXISTS tentative_agreements_category_idx ON tentative_agreements(clause_category);
CREATE INDEX IF NOT EXISTS tentative_agreements_ratified_idx ON tentative_agreements(ratified);

-- ============================================================================
-- NEGOTIATION SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS negotiation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  session_type negotiation_session_type NOT NULL,
  title VARCHAR(300) NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  scheduled_end_date TIMESTAMPTZ,
  actual_start_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  location VARCHAR(300),
  is_virtual BOOLEAN DEFAULT FALSE,
  meeting_link TEXT,
  union_attendees JSONB,
  employer_attendees JSONB,
  agenda JSONB,
  outcomes JSONB,
  summary TEXT,
  next_steps TEXT,
  proposals_discussed JSONB,
  bargaining_note_id UUID,
  status VARCHAR(50) DEFAULT 'scheduled',
  cancelled BOOLEAN DEFAULT FALSE,
  cancellation_reason TEXT,
  attachments JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS negotiation_sessions_negotiation_idx ON negotiation_sessions(negotiation_id);
CREATE INDEX IF NOT EXISTS negotiation_sessions_scheduled_idx ON negotiation_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS negotiation_sessions_number_idx ON negotiation_sessions(session_number);
CREATE INDEX IF NOT EXISTS negotiation_sessions_status_idx ON negotiation_sessions(status);

-- ============================================================================
-- BARGAINING TEAM MEMBERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS bargaining_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
  member_id UUID,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  role bargaining_team_role NOT NULL,
  is_chief BOOLEAN DEFAULT FALSE,
  organization VARCHAR(300),
  title VARCHAR(200),
  worksite VARCHAR(200),
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  expertise JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bargaining_team_negotiation_idx ON bargaining_team_members(negotiation_id);
CREATE INDEX IF NOT EXISTS bargaining_team_role_idx ON bargaining_team_members(role);

-- ============================================================================
-- GRIEVANCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS grievances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_number VARCHAR(50) UNIQUE NOT NULL,
  type grievance_type NOT NULL,
  status grievance_status NOT NULL DEFAULT 'draft',
  priority grievance_priority DEFAULT 'medium',
  step grievance_step,
  grievant_id UUID,
  grievant_name VARCHAR(255),
  grievant_email VARCHAR(255),
  union_rep_id UUID,
  employer_rep_id VARCHAR(255),
  employer_id UUID,
  employer_name VARCHAR(255),
  workplace_id UUID,
  workplace_name VARCHAR(255),
  cba_id UUID,
  cba_article VARCHAR(100),
  cba_section VARCHAR(100),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  background TEXT,
  desired_outcome TEXT,
  incident_date TIMESTAMPTZ,
  filed_date TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ,
  meeting_date TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  timeline JSONB,
  group_grievance_id UUID,
  related_grievance_ids UUID[],
  attachments JSONB,
  is_group_grievance BOOLEAN DEFAULT FALSE,
  is_arbitration_eligible BOOLEAN DEFAULT FALSE,
  has_legal_implications BOOLEAN DEFAULT FALSE,
  is_confidential BOOLEAN DEFAULT FALSE,
  organization_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  last_updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_grievances_number ON grievances(grievance_number);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_type ON grievances(type);
CREATE INDEX IF NOT EXISTS idx_grievances_priority ON grievances(priority);
CREATE INDEX IF NOT EXISTS idx_grievances_step ON grievances(step);
CREATE INDEX IF NOT EXISTS idx_grievances_grievant ON grievances(grievant_id);
CREATE INDEX IF NOT EXISTS idx_grievances_union_rep ON grievances(union_rep_id);
CREATE INDEX IF NOT EXISTS idx_grievances_employer ON grievances(employer_id);
CREATE INDEX IF NOT EXISTS idx_grievances_cba ON grievances(cba_id);
CREATE INDEX IF NOT EXISTS idx_grievances_org ON grievances(organization_id);
CREATE INDEX IF NOT EXISTS idx_grievances_deadline ON grievances(response_deadline);

-- ============================================================================
-- GRIEVANCE RESPONSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS grievance_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID NOT NULL REFERENCES grievances(id),
  response_number INTEGER NOT NULL,
  responding_party VARCHAR(100) NOT NULL,
  responder_name VARCHAR(255),
  responder_title VARCHAR(255),
  response TEXT NOT NULL,
  position TEXT,
  response_date TIMESTAMPTZ NOT NULL,
  received_date TIMESTAMPTZ,
  accepted_by_grievant BOOLEAN,
  accepted_by_employer BOOLEAN,
  next_deadline TIMESTAMPTZ,
  next_step VARCHAR(100),
  attachments JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grievance_responses_grievance ON grievance_responses(grievance_id);
CREATE INDEX IF NOT EXISTS idx_grievance_responses_date ON grievance_responses(response_date);

-- ============================================================================
-- ARBITRATIONS (ACTIVE PROCEEDINGS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS arbitrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID NOT NULL REFERENCES grievances(id),
  arbitration_number VARCHAR(50) UNIQUE NOT NULL,
  board_name VARCHAR(255) NOT NULL,
  board_type VARCHAR(100) NOT NULL,
  arbitrator_ids UUID[],
  arbitrator_names VARCHAR(255)[],
  union_appointee VARCHAR(255),
  employer_appointee VARCHAR(255),
  chair_appointee VARCHAR(255),
  status arbitration_status NOT NULL DEFAULT 'pending',
  scheduled_date TIMESTAMPTZ,
  location VARCHAR(500),
  virtual_meeting_url VARCHAR(500),
  submission_deadline TIMESTAMPTZ,
  evidence_deadline TIMESTAMPTZ,
  reply_deadline TIMESTAMPTZ,
  hearing_days INTEGER[],
  hearing_dates TIMESTAMPTZ[],
  adjourned_to TIMESTAMPTZ,
  award_deadline TIMESTAMPTZ,
  award_date TIMESTAMPTZ,
  award TEXT,
  award_summary TEXT,
  union_cost_share INTEGER,
  employer_cost_share INTEGER,
  estimated_cost INTEGER,
  actual_cost INTEGER,
  submissions JSONB,
  exhibits JSONB,
  organization_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arbitrations_number ON arbitrations(arbitration_number);
CREATE INDEX IF NOT EXISTS idx_arbitrations_grievance ON arbitrations(grievance_id);
CREATE INDEX IF NOT EXISTS idx_arbitrations_status ON arbitrations(status);
CREATE INDEX IF NOT EXISTS idx_arbitrations_board ON arbitrations(board_name);
CREATE INDEX IF NOT EXISTS idx_arbitrations_date ON arbitrations(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_arbitrations_org ON arbitrations(organization_id);

-- ============================================================================
-- SETTLEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID NOT NULL REFERENCES grievances(id),
  arbitration_id UUID REFERENCES arbitrations(id),
  settlement_type settlement_type NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'proposed',
  monetary_amount INTEGER,
  monetary_details TEXT,
  non_monetary_terms JSONB,
  implemented_at TIMESTAMPTZ,
  implementation_notes TEXT,
  compliance_deadline TIMESTAMPTZ,
  compliance_status VARCHAR(50),
  compliance_notes TEXT,
  approved_by_grievant BOOLEAN,
  approved_by_employer BOOLEAN,
  approved_by_union BOOLEAN,
  approval_dates TIMESTAMPTZ[],
  agreement_url VARCHAR(500),
  confidentiality BOOLEAN DEFAULT FALSE,
  organization_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlements_grievance ON settlements(grievance_id);
CREATE INDEX IF NOT EXISTS idx_settlements_arbitration ON settlements(arbitration_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_org ON settlements(organization_id);

-- ============================================================================
-- GRIEVANCE TIMELINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS grievance_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID NOT NULL REFERENCES grievances(id),
  event_type VARCHAR(100) NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  actor VARCHAR(255),
  actor_role VARCHAR(100),
  description TEXT NOT NULL,
  notes TEXT,
  attachments JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grievance_timeline_grievance ON grievance_timeline(grievance_id);
CREATE INDEX IF NOT EXISTS idx_grievance_timeline_date ON grievance_timeline(event_date);

-- ============================================================================
-- SHARED CLAUSE LIBRARY
-- ============================================================================

CREATE TABLE IF NOT EXISTS shared_clause_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_organization_id UUID NOT NULL,
  source_cba_id UUID REFERENCES collective_agreements(id),
  original_clause_id UUID,
  clause_number VARCHAR(50),
  clause_title VARCHAR(500) NOT NULL,
  clause_text TEXT NOT NULL,
  clause_type VARCHAR(100) NOT NULL,
  is_anonymized BOOLEAN DEFAULT FALSE,
  original_employer_name VARCHAR(200),
  anonymized_employer_name VARCHAR(200),
  sharing_level VARCHAR(50) NOT NULL DEFAULT 'private',
  shared_with_org_ids UUID[],
  effective_date DATE,
  expiry_date DATE,
  sector VARCHAR(100),
  province VARCHAR(2),
  view_count INTEGER DEFAULT 0,
  citation_count INTEGER DEFAULT 0,
  comparison_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES shared_clause_library(id),
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_clauses_org ON shared_clause_library(source_organization_id);
CREATE INDEX IF NOT EXISTS idx_shared_clauses_type ON shared_clause_library(clause_type);
CREATE INDEX IF NOT EXISTS idx_shared_clauses_sharing ON shared_clause_library(sharing_level);
CREATE INDEX IF NOT EXISTS idx_shared_clauses_sector ON shared_clause_library(sector);
CREATE INDEX IF NOT EXISTS idx_shared_clauses_province ON shared_clause_library(province);

-- ============================================================================
-- CLAUSE LIBRARY TAGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS clause_library_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clause_id UUID NOT NULL REFERENCES shared_clause_library(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clause_tags_clause ON clause_library_tags(clause_id);
CREATE INDEX IF NOT EXISTS idx_clause_tags_name ON clause_library_tags(tag_name);

-- ============================================================================
-- CLAUSE COMPARISONS HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS clause_comparisons_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  organization_id UUID NOT NULL,
  clause_ids UUID[] NOT NULL,
  comparison_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clause_comparisons_user ON clause_comparisons_history(user_id);
CREATE INDEX IF NOT EXISTS idx_clause_comparisons_org ON clause_comparisons_history(organization_id);

-- ============================================================================
-- CLAUSE EMBEDDINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS clause_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clause_id UUID NOT NULL REFERENCES cba_clauses(id) ON DELETE CASCADE,
  embedding_vector TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clause_embeddings_clause ON clause_embeddings(clause_id);

COMMIT;

-- Verify
SELECT 'CBA tables created: ' || count(*) FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'collective_agreements','cba_version_history','cba_contacts',
  'cba_clauses','clause_comparisons','wage_progressions',
  'benefit_comparisons','arbitration_decisions','arbitrator_profiles',
  'bargaining_notes','cba_footnotes','claim_precedent_analysis',
  'negotiations','bargaining_proposals','tentative_agreements',
  'negotiation_sessions','bargaining_team_members',
  'grievances','grievance_responses','arbitrations','settlements',
  'grievance_timeline','shared_clause_library','clause_library_tags',
  'clause_comparisons_history','clause_embeddings'
);
