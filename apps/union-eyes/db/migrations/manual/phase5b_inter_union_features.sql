-- Phase 5B: Inter-Union Features - Database Schema
-- Created: November 19, 2025
-- Purpose: Enable controlled cross-organization sharing of clauses, precedents, and analytics

-- ============================================================================
-- SHARED CLAUSE LIBRARY
-- ============================================================================

-- Main table for shared clauses (opt-in from CBAs)
CREATE TABLE IF NOT EXISTS shared_clause_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source information
  source_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_cba_id UUID REFERENCES cba(id), -- NULL if generic template
  original_clause_id UUID REFERENCES cba_clauses(id), -- Link to original
  
  -- Clause content
  clause_number VARCHAR(50),
  clause_title VARCHAR(500) NOT NULL,
  clause_text TEXT NOT NULL,
  clause_type VARCHAR(100) NOT NULL, -- wages, benefits, hours, grievance_procedure, etc.
  
  -- Anonymization
  is_anonymized BOOLEAN DEFAULT false,
  original_employer_name VARCHAR(200),
  anonymized_employer_name VARCHAR(200), -- "Public Sector Employer A"
  
  -- Sharing controls
  sharing_level VARCHAR(50) NOT NULL DEFAULT 'private', 
    -- private, federation, congress, public
  shared_with_org_ids UUID[], -- Specific orgs (if not using level)
  
  -- Metadata
  effective_date DATE,
  expiry_date DATE,
  sector VARCHAR(100), -- public, private, education, healthcare, construction, etc.
  province VARCHAR(2), -- ON, QC, BC, AB, MB, SK, NS, NB, PE, NL, YT, NT, NU
  
  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  citation_count INTEGER DEFAULT 0,
  comparison_count INTEGER DEFAULT 0,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES shared_clause_library(id),
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_sharing_level CHECK (
    sharing_level IN ('private', 'federation', 'congress', 'public')
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_clauses_org ON shared_clause_library(source_organization_id);
CREATE INDEX IF NOT EXISTS idx_shared_clauses_type ON shared_clause_library(clause_type);
CREATE INDEX IF NOT EXISTS idx_shared_clauses_sharing ON shared_clause_library(sharing_level);
CREATE INDEX IF NOT EXISTS idx_shared_clauses_sector ON shared_clause_library(sector);
CREATE INDEX IF NOT EXISTS idx_shared_clauses_province ON shared_clause_library(province);
CREATE INDEX IF NOT EXISTS idx_shared_clauses_dates ON shared_clause_library(effective_date, expiry_date);

-- Full-text search on clause content
CREATE INDEX IF NOT EXISTS idx_shared_clauses_text ON shared_clause_library 
  USING gin(to_tsvector('english', clause_text));
CREATE INDEX IF NOT EXISTS idx_shared_clauses_title ON shared_clause_library 
  USING gin(to_tsvector('english', clause_title));

-- Tags for categorization
CREATE TABLE IF NOT EXISTS clause_library_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clause_id UUID NOT NULL REFERENCES shared_clause_library(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(clause_id, tag_name)
);

CREATE INDEX IF NOT EXISTS idx_clause_tags_clause ON clause_library_tags(clause_id);
CREATE INDEX IF NOT EXISTS idx_clause_tags_name ON clause_library_tags(tag_name);

-- Comparison history (track when users compare clauses)
CREATE TABLE IF NOT EXISTS clause_comparisons_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  clause_ids UUID[] NOT NULL,
  comparison_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clause_comparisons_user ON clause_comparisons_history(user_id);
CREATE INDEX IF NOT EXISTS idx_clause_comparisons_org ON clause_comparisons_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_clause_comparisons_time ON clause_comparisons_history(created_at DESC);

-- ============================================================================
-- ARBITRATION PRECEDENT DATABASE
-- ============================================================================

-- Main table for arbitration precedents (shared cases)
CREATE TABLE IF NOT EXISTS arbitration_precedents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source information
  source_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_decision_id UUID REFERENCES arbitration_decisions(id), -- Link to original if exists
  
  -- Case identification
  case_number VARCHAR(100),
  case_title VARCHAR(500) NOT NULL,
  decision_date DATE NOT NULL,
  
  -- Parties (anonymized if needed)
  is_parties_anonymized BOOLEAN DEFAULT false,
  union_name VARCHAR(200), -- Can be actual or "Union A"
  employer_name VARCHAR(200), -- Can be actual or "Employer B"
  
  -- Arbitrator
  arbitrator_name VARCHAR(200) NOT NULL,
  tribunal VARCHAR(200), -- Ontario Labour Relations Board, CIRB, etc.
  jurisdiction VARCHAR(50) NOT NULL, -- Federal, ON, QC, BC, AB, etc.
  
  -- Case details
  grievance_type VARCHAR(100) NOT NULL, -- discharge, discipline, wages, hours, benefits, etc.
  issue_summary TEXT NOT NULL,
  union_position TEXT,
  employer_position TEXT,
  
  -- Decision
  outcome VARCHAR(50) NOT NULL, -- grievance_upheld, denied, split_decision, withdrawn, settled
  decision_summary TEXT NOT NULL,
  reasoning TEXT,
  key_findings TEXT[],
  
  -- Precedent value
  precedent_level VARCHAR(50) NOT NULL DEFAULT 'low',
    -- high (landmark case), medium (significant), low (routine)
  cited_cases UUID[], -- Other precedent IDs this case cites
  citation_count INTEGER DEFAULT 0, -- How many times this is cited by others
  
  -- Documents
  decision_document_url TEXT, -- PDF/DOC of full decision (S3/Azure Storage)
  redacted_document_url TEXT, -- Version with member names removed
  
  -- Member privacy
  is_member_names_redacted BOOLEAN DEFAULT true,
  grievor_names TEXT[], -- Only if not redacted (rare)
  
  -- Sharing controls
  sharing_level VARCHAR(50) NOT NULL DEFAULT 'federation', 
    -- private, federation, congress, public
  shared_with_org_ids UUID[],
  
  -- Metadata
  sector VARCHAR(100), -- public, private, education, healthcare, etc.
  industry VARCHAR(100), -- manufacturing, retail, transportation, etc.
  bargaining_unit_size VARCHAR(50), -- small (<100), medium (100-1000), large (>1000)
  
  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  -- Audit
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_precedent_outcome CHECK (
    outcome IN ('grievance_upheld', 'denied', 'split_decision', 'withdrawn', 'settled')
  ),
  CONSTRAINT valid_precedent_level CHECK (
    precedent_level IN ('high', 'medium', 'low')
  ),
  CONSTRAINT valid_precedent_sharing CHECK (
    sharing_level IN ('private', 'federation', 'congress', 'public')
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_precedents_org ON arbitration_precedents(source_organization_id);
CREATE INDEX IF NOT EXISTS idx_precedents_type ON arbitration_precedents(grievance_type);
CREATE INDEX IF NOT EXISTS idx_precedents_outcome ON arbitration_precedents(outcome);
CREATE INDEX IF NOT EXISTS idx_precedents_arbitrator ON arbitration_precedents(arbitrator_name);
CREATE INDEX IF NOT EXISTS idx_precedents_jurisdiction ON arbitration_precedents(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_precedents_date ON arbitration_precedents(decision_date DESC);
CREATE INDEX IF NOT EXISTS idx_precedents_sharing ON arbitration_precedents(sharing_level);
CREATE INDEX IF NOT EXISTS idx_precedents_level ON arbitration_precedents(precedent_level);
CREATE INDEX IF NOT EXISTS idx_precedents_sector ON arbitration_precedents(sector);

-- Full-text search on case details
CREATE INDEX IF NOT EXISTS idx_precedents_summary ON arbitration_precedents 
  USING gin(to_tsvector('english', 
    issue_summary || ' ' || decision_summary || ' ' || COALESCE(reasoning, '')
  ));

-- Tags for precedents (e.g., "just cause", "progressive discipline", "accommodation")
CREATE TABLE IF NOT EXISTS precedent_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  precedent_id UUID NOT NULL REFERENCES arbitration_precedents(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(precedent_id, tag_name)
);

CREATE INDEX IF NOT EXISTS idx_precedent_tags_precedent ON precedent_tags(precedent_id);
CREATE INDEX IF NOT EXISTS idx_precedent_tags_name ON precedent_tags(tag_name);

-- Citation tracking (which claims/cases reference this precedent)
CREATE TABLE IF NOT EXISTS precedent_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  precedent_id UUID NOT NULL REFERENCES arbitration_precedents(id) ON DELETE CASCADE,
  
  -- Where it was cited
  citing_claim_id UUID REFERENCES claims(id) ON DELETE SET NULL,
  citing_precedent_id UUID REFERENCES arbitration_precedents(id) ON DELETE SET NULL,
  citing_organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Context of citation
  citation_context TEXT,
  citation_type VARCHAR(50), -- supporting, distinguishing, critical
  
  -- Audit
  cited_by UUID NOT NULL,
  cited_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_citation_type CHECK (
    citation_type IN ('supporting', 'distinguishing', 'critical', 'informational')
  )
);

CREATE INDEX IF NOT EXISTS idx_citations_precedent ON precedent_citations(precedent_id);
CREATE INDEX IF NOT EXISTS idx_citations_claim ON precedent_citations(citing_claim_id);
CREATE INDEX IF NOT EXISTS idx_citations_org ON precedent_citations(citing_organization_id);
CREATE INDEX IF NOT EXISTS idx_citations_time ON precedent_citations(cited_at DESC);

-- ============================================================================
-- SHARING PERMISSIONS & ACCESS CONTROL
-- ============================================================================

-- Organization-level sharing settings (opt-in model)
CREATE TABLE IF NOT EXISTS organization_sharing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Clause sharing settings
  enable_clause_sharing BOOLEAN DEFAULT false,
  default_clause_sharing_level VARCHAR(50) DEFAULT 'private',
  auto_anonymize_clauses BOOLEAN DEFAULT true,
  
  -- Precedent sharing settings
  enable_precedent_sharing BOOLEAN DEFAULT false,
  default_precedent_sharing_level VARCHAR(50) DEFAULT 'federation',
  always_redact_member_names BOOLEAN DEFAULT true,
  
  -- Analytics sharing
  enable_analytics_sharing BOOLEAN DEFAULT false,
  share_member_counts BOOLEAN DEFAULT true,
  share_financial_data BOOLEAN DEFAULT false,
  share_claims_data BOOLEAN DEFAULT true,
  
  -- Audit
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sharing_settings_org ON organization_sharing_settings(organization_id);

-- Access logs for cross-organization data access (compliance and security)
CREATE TABLE IF NOT EXISTS cross_org_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who accessed
  user_id UUID NOT NULL,
  user_organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- What was accessed
  resource_type VARCHAR(50) NOT NULL, -- clause, precedent, analytics, document
  resource_id UUID NOT NULL,
  resource_owner_org_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Access context
  access_type VARCHAR(50) NOT NULL, -- view, download, compare, cite, search
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_resource_type CHECK (
    resource_type IN ('clause', 'precedent', 'analytics', 'document')
  ),
  CONSTRAINT valid_access_type CHECK (
    access_type IN ('view', 'download', 'compare', 'cite', 'search')
  )
);

CREATE INDEX IF NOT EXISTS idx_access_log_user ON cross_org_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_log_resource ON cross_org_access_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_access_log_owner ON cross_org_access_log(resource_owner_org_id);
CREATE INDEX IF NOT EXISTS idx_access_log_time ON cross_org_access_log(accessed_at DESC);

-- Sharing relationships (explicit grants between organizations)
CREATE TABLE IF NOT EXISTS organization_sharing_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Grant details
  grantor_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  grantee_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- What is shared
  resource_type VARCHAR(50) NOT NULL, -- clauses, precedents, analytics
  
  -- Scope
  all_resources BOOLEAN DEFAULT false,
  specific_resource_ids UUID[], -- If not all_resources, specify which ones
  
  -- Expiry
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL means no expiry
  revoked_at TIMESTAMPTZ, -- NULL means still active
  
  -- Audit
  granted_by UUID NOT NULL,
  
  CONSTRAINT different_orgs CHECK (grantor_org_id != grantee_org_id),
  CONSTRAINT valid_grant_resource_type CHECK (
    resource_type IN ('clauses', 'precedents', 'analytics')
  ),
  UNIQUE(grantor_org_id, grantee_org_id, resource_type)
);

CREATE INDEX IF NOT EXISTS idx_sharing_grants_grantor ON organization_sharing_grants(grantor_org_id);
CREATE INDEX IF NOT EXISTS idx_sharing_grants_grantee ON organization_sharing_grants(grantee_org_id);
CREATE INDEX IF NOT EXISTS idx_sharing_grants_active ON organization_sharing_grants(revoked_at) 
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sharing_grants_expires ON organization_sharing_grants(expires_at) 
  WHERE expires_at IS NOT NULL;

-- ============================================================================
-- ROW-LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on shared_clause_library
ALTER TABLE shared_clause_library ENABLE ROW LEVEL SECURITY;

-- Policy: Owners have full access to their own clauses
CREATE POLICY clause_library_owner_full_access ON shared_clause_library
  FOR ALL
  USING (
    source_organization_id IN (
      SELECT id FROM get_user_organizations(
        COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
      )
    )
  );

-- Policy: Read access based on sharing level
CREATE POLICY clause_library_shared_read ON shared_clause_library
  FOR SELECT
  USING (
    -- Public clauses (anyone can see)
    sharing_level = 'public'
    OR
    -- Congress-level (any CLC member can see)
    (
      sharing_level = 'congress' 
      AND EXISTS (
        SELECT 1 
        FROM get_user_organizations(
          COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
        ) uo
        INNER JOIN organizations o ON uo.id = o.id
        WHERE o.type IN ('congress', 'federation', 'union', 'local')
      )
    )
    OR
    -- Federation-level (same federation can see)
    (
      sharing_level = 'federation' 
      AND EXISTS (
        SELECT 1 
        FROM organizations source_org
        INNER JOIN get_user_organizations(
          COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
        ) user_org
          ON source_org.hierarchy_path[2] = user_org.hierarchy_path[2] -- Same federation (2nd level)
        WHERE source_org.id = shared_clause_library.source_organization_id
      )
    )
    OR
    -- Explicit grants (specific permission given)
    EXISTS (
      SELECT 1 
      FROM organization_sharing_grants osg
      INNER JOIN get_user_organizations(
        COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
      ) uo 
        ON uo.id = osg.grantee_org_id
      WHERE osg.grantor_org_id = shared_clause_library.source_organization_id
        AND osg.resource_type = 'clauses'
        AND osg.revoked_at IS NULL
        AND (osg.expires_at IS NULL OR osg.expires_at > NOW())
        AND (
          osg.all_resources = true 
          OR shared_clause_library.id = ANY(osg.specific_resource_ids)
        )
    )
  );

-- Enable RLS on arbitration_precedents
ALTER TABLE arbitration_precedents ENABLE ROW LEVEL SECURITY;

-- Policy: Owners have full access to their own precedents
CREATE POLICY precedents_owner_full_access ON arbitration_precedents
  FOR ALL
  USING (
    source_organization_id IN (
      SELECT id FROM get_user_organizations(
        COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
      )
    )
  );

-- Policy: Read access based on sharing level
CREATE POLICY precedents_shared_read ON arbitration_precedents
  FOR SELECT
  USING (
    sharing_level = 'public'
    OR
    (
      sharing_level = 'congress' 
      AND EXISTS (
        SELECT 1 
        FROM get_user_organizations(
          COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
        ) uo
        INNER JOIN organizations o ON uo.id = o.id
        WHERE o.type IN ('congress', 'federation', 'union', 'local')
      )
    )
    OR
    (
      sharing_level = 'federation' 
      AND EXISTS (
        SELECT 1 
        FROM organizations source_org
        INNER JOIN get_user_organizations(
          COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
        ) user_org
          ON source_org.hierarchy_path[2] = user_org.hierarchy_path[2]
        WHERE source_org.id = arbitration_precedents.source_organization_id
      )
    )
    OR
    EXISTS (
      SELECT 1 
      FROM organization_sharing_grants osg
      INNER JOIN get_user_organizations(
        COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
      ) uo 
        ON uo.id = osg.grantee_org_id
      WHERE osg.grantor_org_id = arbitration_precedents.source_organization_id
        AND osg.resource_type = 'precedents'
        AND osg.revoked_at IS NULL
        AND (osg.expires_at IS NULL OR osg.expires_at > NOW())
    )
  );

-- Enable RLS on access logs (users can only see their own org's logs)
ALTER TABLE cross_org_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY access_log_org_admin_read ON cross_org_access_log
  FOR SELECT
  USING (
    resource_owner_org_id IN (
      SELECT id FROM get_user_organizations(
        COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
      )
    )
  );

-- Anyone can insert access logs (for auditing)
CREATE POLICY access_log_insert ON cross_org_access_log
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS FOR METRICS
-- ============================================================================

-- Trigger to update citation_count when precedent is cited
CREATE OR REPLACE FUNCTION update_precedent_citation_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE arbitration_precedents
    SET citation_count = citation_count + 1
    WHERE id = NEW.precedent_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE arbitration_precedents
    SET citation_count = GREATEST(0, citation_count - 1)
    WHERE id = OLD.precedent_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER precedent_citation_count_trigger
AFTER INSERT OR DELETE ON precedent_citations
FOR EACH ROW
EXECUTE FUNCTION update_precedent_citation_count();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shared_clause_library_updated_at
BEFORE UPDATE ON shared_clause_library
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER arbitration_precedents_updated_at
BEFORE UPDATE ON arbitration_precedents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER organization_sharing_settings_updated_at
BEFORE UPDATE ON organization_sharing_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user can access a shared clause
CREATE OR REPLACE FUNCTION can_access_clause(
  p_clause_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_can_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM shared_clause_library
    WHERE id = p_clause_id
    AND (
      -- Owner access
      source_organization_id IN (SELECT id FROM get_user_organizations(p_user_id))
      OR
      -- Sharing level access (simplified, see RLS policies for full logic)
      sharing_level = 'public'
    )
  ) INTO v_can_access;
  
  RETURN v_can_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log cross-org access
CREATE OR REPLACE FUNCTION log_cross_org_access(
  p_user_id UUID,
  p_user_org_id UUID,
  p_resource_type VARCHAR,
  p_resource_id UUID,
  p_resource_owner_org_id UUID,
  p_access_type VARCHAR,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO cross_org_access_log (
    user_id,
    user_organization_id,
    resource_type,
    resource_id,
    resource_owner_org_id,
    access_type,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_user_org_id,
    p_resource_type,
    p_resource_id,
    p_resource_owner_org_id,
    p_access_type,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE shared_clause_library IS 'Opt-in shared clause repository for cross-union collaboration';
COMMENT ON TABLE arbitration_precedents IS 'Shared arbitration case database with privacy controls';
COMMENT ON TABLE organization_sharing_settings IS 'Organization-level preferences for data sharing';
COMMENT ON TABLE cross_org_access_log IS 'Audit trail for all cross-organization data access';
COMMENT ON TABLE organization_sharing_grants IS 'Explicit sharing permissions between organizations';

COMMENT ON COLUMN shared_clause_library.sharing_level IS 'private (org only), federation (same fed), congress (all CLC), public (all)';
COMMENT ON COLUMN shared_clause_library.is_anonymized IS 'True if employer name has been replaced with generic identifier';
COMMENT ON COLUMN arbitration_precedents.precedent_level IS 'high (landmark), medium (significant), low (routine)';
COMMENT ON COLUMN arbitration_precedents.is_member_names_redacted IS 'True if grievor names have been removed for privacy';

-- Migration complete
