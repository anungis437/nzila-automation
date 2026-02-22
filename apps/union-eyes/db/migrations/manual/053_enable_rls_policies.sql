-- =====================================================
-- CRITICAL SECURITY FIX: Enable RLS on All Unprotected Tables
-- Migration: 053_enable_rls_policies.sql
-- Purpose: Add Row Level Security policies to 67 tables identified as unprotected
-- Based on: PHASE_1_3_VALIDATION_SUITE.sql results
-- Authentication: Custom JWT (NOT Supabase auth schema)
-- =====================================================

-- Helper functions to get current user and tenant IDs
CREATE OR REPLACE FUNCTION get_current_user_id() RETURNS text AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'sub'),
    current_setting('app.current_user_id', true)
  );
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_current_tenant_id() RETURNS uuid AS $$
  SELECT current_setting('app.current_tenant_id', true)::uuid;
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- SECTION 1: VOTING & ELECTORAL (7 tables)
-- =====================================================

-- 1. voter_eligibility
ALTER TABLE public.voter_eligibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voter_eligibility_org_isolation" ON public.voter_eligibility
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.voting_sessions vs
    WHERE vs.id = voter_eligibility.session_id
    AND vs.organization_id::text IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = get_current_user_id()
    )
  )
);

-- 2. voting_options
ALTER TABLE public.voting_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voting_options_org_isolation" ON public.voting_options
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.voting_sessions vs
    WHERE vs.id = voting_options.session_id
    AND vs.organization_id::text IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = get_current_user_id()
    )
  )
);

-- 3. voting_notifications
ALTER TABLE public.voting_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voting_notifications_org_isolation" ON public.voting_notifications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.voting_sessions vs
    WHERE vs.id = voting_notifications.session_id
    AND vs.organization_id::text IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = get_current_user_id()
    )
  )
);

-- 4. voting_sessions
ALTER TABLE public.voting_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voting_sessions_org_isolation" ON public.voting_sessions
FOR ALL USING (
  organization_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- 5. votes
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes_org_isolation" ON public.votes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.voting_sessions vs
    WHERE vs.id = votes.session_id
    AND vs.organization_id::text IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = get_current_user_id()
    )
  )
);

-- 6. voting_session_auditors
ALTER TABLE public.voting_session_auditors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voting_session_auditors_org_isolation" ON public.voting_session_auditors
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.voting_sessions vs
    WHERE vs.id = voting_session_auditors.voting_session_id
    AND vs.organization_id::text IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = get_current_user_id()
    )
  )
);

-- 7. voting_auditors
ALTER TABLE public.voting_auditors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voting_auditors_org_isolation" ON public.voting_auditors
FOR ALL USING (
  organization_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- =====================================================
-- SECTION 2: AI & DOCUMENT PROCESSING (5 tables)
-- =====================================================

-- 1. ai_documents
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_documents_tenant_isolation" ON public.ai_documents
FOR ALL USING (tenant_id = get_current_user_id());

-- 2. ai_chunks
ALTER TABLE public.ai_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_chunks_tenant_isolation" ON public.ai_chunks
FOR ALL USING (tenant_id = get_current_user_id());

-- 3. ai_query_logs
ALTER TABLE public.ai_query_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_query_logs_tenant_isolation" ON public.ai_query_logs
FOR ALL USING (tenant_id = get_current_user_id());

-- 4. ai_queries
ALTER TABLE public.ai_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_queries_tenant_isolation" ON public.ai_queries
FOR ALL USING (tenant_id = get_current_user_id());

-- 5. ai_feedback
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_feedback_tenant_isolation" ON public.ai_feedback
FOR ALL USING (tenant_id = get_current_user_id());

-- =====================================================
-- SECTION 3: ORGANIZATIONS (6 tables)
-- =====================================================

-- 1. organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizations_member_access" ON public.organizations
FOR ALL USING (
  id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- 2. organization_sharing_settings
ALTER TABLE public.organization_sharing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organization_sharing_settings_org_member" ON public.organization_sharing_settings
FOR ALL USING (
  organization_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- 3. organization_sharing_grants
ALTER TABLE public.organization_sharing_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organization_sharing_grants_access" ON public.organization_sharing_grants
FOR ALL USING (
  granter_org_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
  OR grantee_org_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- 4. cross_org_access_log
ALTER TABLE public.cross_org_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cross_org_access_log_participant" ON public.cross_org_access_log
FOR ALL USING (
  user_organization_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
  OR resource_organization_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- 5. organization_relationships
ALTER TABLE public.organization_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organization_relationships_participant" ON public.organization_relationships
FOR ALL USING (
  parent_org_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
  OR child_org_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- 6. organization_hierarchy_audit
ALTER TABLE public.organization_hierarchy_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organization_hierarchy_audit_org_member" ON public.organization_hierarchy_audit
FOR ALL USING (
  organization_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- =====================================================
-- SECTION 4: CBA & ARBITRATION (19 tables)
-- NOTE: Some tables may not exist - skipping to avoid errors
-- =====================================================

-- 1. cba_version_history
ALTER TABLE public.cba_version_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cba_version_history_tenant" ON public.cba_version_history
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.collective_agreements ca
    WHERE ca.id = cba_version_history.cba_id
    AND ca.tenant_id = get_current_tenant_id()
  )
);

-- 2. benefit_comparisons
ALTER TABLE public.benefit_comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "benefit_comparisons_tenant" ON public.benefit_comparisons
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.collective_agreements ca
    WHERE ca.id = benefit_comparisons.cba_id
    AND ca.tenant_id = get_current_tenant_id()
  )
);

-- 3. clause_comparisons
ALTER TABLE public.clause_comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clause_comparisons_tenant" ON public.clause_comparisons
FOR ALL USING (tenant_id = get_current_tenant_id());

-- 4. profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own_profile" ON public.profiles
FOR ALL USING (user_id = get_current_user_id());

-- 5. pending_profiles
ALTER TABLE public.pending_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pending_profiles_own_profile" ON public.pending_profiles
FOR SELECT USING (id = get_current_user_id() OR email = (current_setting('request.jwt.claims', true)::json->>'email'));

-- 6. arbitrator_profiles (public data - read only for authenticated users)
ALTER TABLE public.arbitrator_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "arbitrator_profiles_authenticated_read" ON public.arbitrator_profiles
FOR SELECT USING (get_current_user_id() IS NOT NULL);

-- 7. claim_precedent_analysis
ALTER TABLE public.claim_precedent_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "claim_precedent_analysis_tenant" ON public.claim_precedent_analysis
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.claims c
    WHERE c.claim_id = claim_precedent_analysis.claim_id
    AND c.tenant_id = get_current_tenant_id()
  )
);

-- 8. cba_contacts
ALTER TABLE public.cba_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cba_contacts_tenant" ON public.cba_contacts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.collective_agreements ca
    WHERE ca.id = cba_contacts.cba_id
    AND ca.tenant_id = get_current_tenant_id()
  )
);

-- 9. wage_progressions
ALTER TABLE public.wage_progressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wage_progressions_tenant" ON public.wage_progressions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.collective_agreements ca
    WHERE ca.id = wage_progressions.cba_id
    AND ca.tenant_id = get_current_tenant_id()
  )
);

-- 10. bargaining_notes
ALTER TABLE public.bargaining_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bargaining_notes_tenant" ON public.bargaining_notes
FOR ALL USING (tenant_id = get_current_tenant_id());

-- 11. cba_footnotes
ALTER TABLE public.cba_footnotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cba_footnotes_tenant" ON public.cba_footnotes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.cba_clauses cc
    JOIN public.collective_agreements ca ON ca.id = cc.cba_id
    WHERE cc.id = cba_footnotes.source_clause_id
    AND ca.tenant_id = get_current_tenant_id()
  )
);

-- 12. arbitration_decisions (public data - read only for authenticated)
ALTER TABLE public.arbitration_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "arbitration_decisions_public_read" ON public.arbitration_decisions
FOR SELECT USING (is_public = true OR get_current_tenant_id() IS NOT NULL);

-- 13-19: Skipping tables that reference non-existent 'cba' table or have structural issues

-- =====================================================
-- SECTION 5: NOTIFICATIONS (4 tables)
-- =====================================================

-- 1. notification_queue
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_queue_own_user" ON public.notification_queue
FOR ALL USING (user_id::text = get_current_user_id());

-- 2. notification_templates
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_templates_tenant" ON public.notification_templates
FOR ALL USING (tenant_id = get_current_tenant_id());

-- 3. notification_log
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_log_own_notifications" ON public.notification_log
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.notification_queue nq
    WHERE nq.id = notification_log.notification_id
    AND nq.user_id::text = get_current_user_id()
  )
);

-- 4. user_notification_preferences
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_notification_preferences_own_prefs" ON public.user_notification_preferences
FOR ALL USING (user_id::text = get_current_user_id());

-- =====================================================
-- SECTION 6: JURISDICTION & COMPLIANCE (4 tables)
-- =====================================================

-- 1. jurisdiction_templates (public reference data)
ALTER TABLE public.jurisdiction_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jurisdiction_templates_authenticated_read" ON public.jurisdiction_templates
FOR SELECT USING (get_current_user_id() IS NOT NULL);

-- 2. donations (public donations - associated with strike funds)
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations_tenant" ON public.donations
FOR ALL USING (tenant_id = get_current_tenant_id());

-- 3. picket_tracking
ALTER TABLE public.picket_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "picket_tracking_tenant" ON public.picket_tracking
FOR ALL USING (tenant_id = get_current_tenant_id());

-- 4. arrears
ALTER TABLE public.arrears ENABLE ROW LEVEL SECURITY;
CREATE POLICY "arrears_tenant" ON public.arrears
FOR ALL USING (tenant_id = get_current_tenant_id());

-- =====================================================
-- SECTION 7: FINANCIAL & MEMBER MANAGEMENT (5 tables)
-- =====================================================

-- 1. clause_comparisons_history
ALTER TABLE public.clause_comparisons_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clause_comparisons_history_own_user" ON public.clause_comparisons_history
FOR ALL USING (user_id::text = get_current_user_id());

-- 2. arbitration_precedents
ALTER TABLE public.arbitration_precedents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "arbitration_precedents_org_access" ON public.arbitration_precedents
FOR ALL USING (
  source_organization_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
  OR sharing_level = 'public'
);

-- 3. precedent_tags
ALTER TABLE public.precedent_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "precedent_tags_accessible_precedent" ON public.precedent_tags
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.arbitration_precedents ap
    WHERE ap.id = precedent_tags.precedent_id
    AND (
      ap.source_organization_id::text IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = get_current_user_id()
      )
      OR ap.sharing_level = 'public'
    )
  )
);

-- 4. precedent_citations
ALTER TABLE public.precedent_citations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "precedent_citations_accessible" ON public.precedent_citations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.arbitration_precedents ap
    WHERE ap.id = precedent_citations.precedent_id
    AND (
      ap.source_organization_id::text IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = get_current_user_id()
      )
      OR ap.sharing_level = 'public'
    )
  )
);

-- 5. shared_clause_library
ALTER TABLE public.shared_clause_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared_clause_library_org_access" ON public.shared_clause_library
FOR ALL USING (
  source_organization_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
  OR sharing_level = 'public'
);

-- =====================================================
-- SECTION 8: PENSION & SECURITY (9 tables)
-- NOTE: Pension trustee tables reference non-existent columns - skip for now
-- =====================================================

-- 1. attestation_templates
ALTER TABLE public.attestation_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attestation_templates_org_member" ON public.attestation_templates
FOR ALL USING (
  organization_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- 2. clause_library_tags
ALTER TABLE public.clause_library_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clause_library_tags_org_clause" ON public.clause_library_tags
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.shared_clause_library scl
    WHERE scl.id = clause_library_tags.clause_id
    AND (
      scl.source_organization_id::text IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = get_current_user_id()
      )
      OR scl.sharing_level = 'public'
    )
  )
);

-- 3. user_uuid_mapping
ALTER TABLE public.user_uuid_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_uuid_mapping_own_mapping" ON public.user_uuid_mapping
FOR ALL USING (text_id = get_current_user_id());

-- 4. trusted_certificate_authorities
ALTER TABLE public.trusted_certificate_authorities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trusted_certificate_authorities_org_member" ON public.trusted_certificate_authorities
FOR ALL USING (
  organization_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- 5. signature_audit_log
ALTER TABLE public.signature_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signature_audit_log_org_member" ON public.signature_audit_log
FOR ALL USING (
  organization_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- 6. blockchain_audit_anchors
ALTER TABLE public.blockchain_audit_anchors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blockchain_audit_anchors_org_member" ON public.blockchain_audit_anchors
FOR ALL USING (
  organization_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- 7. vote_merkle_tree
ALTER TABLE public.vote_merkle_tree ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vote_merkle_tree_org_session" ON public.vote_merkle_tree
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.voting_sessions vs
    WHERE vs.id = vote_merkle_tree.voting_session_id
    AND vs.organization_id::text IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = get_current_user_id()
    )
  )
);

-- 8. voting_session_keys
ALTER TABLE public.voting_session_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voting_session_keys_org_session" ON public.voting_session_keys
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.voting_sessions vs
    WHERE vs.id = voting_session_keys.voting_session_id
    AND vs.organization_id::text IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = get_current_user_id()
    )
  )
);

-- 9. voting_key_access_log
ALTER TABLE public.voting_key_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voting_key_access_log_org_session" ON public.voting_key_access_log
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.voting_sessions vs
    WHERE vs.id = voting_key_access_log.voting_session_id
    AND vs.organization_id::text IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = get_current_user_id()
    )
  )
);

-- =====================================================
-- SECTION 9: MEMBER & COMPLIANCE (7 tables)
-- =====================================================

-- 1. members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_tenant" ON public.members
FOR ALL USING (tenant_id = get_current_tenant_id());

-- 2. statutory_holidays
ALTER TABLE public.statutory_holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "statutory_holidays_public_read" ON public.statutory_holidays
FOR SELECT USING (get_current_user_id() IS NOT NULL);

-- 3. jurisdiction_rules
ALTER TABLE public.jurisdiction_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jurisdiction_rules_public_read" ON public.jurisdiction_rules
FOR SELECT USING (get_current_user_id() IS NOT NULL);

-- 4. compliance_validations
ALTER TABLE public.compliance_validations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compliance_validations_tenant" ON public.compliance_validations
FOR ALL USING (tenant_id = get_current_tenant_id());

-- 5-7. pension_trustee_boards, pension_trustees, pension_trustee_meetings
-- Skipped - reference non-existent board_id column

-- =====================================================
-- SECTION 10: CBA SUMMARY & MISC (2 tables)
-- =====================================================

-- 1. case_summaries
ALTER TABLE public.case_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "case_summaries_tenant" ON public.case_summaries
FOR ALL USING (tenant_id::text = get_current_user_id());

-- 2. clc_chart_of_accounts
ALTER TABLE public.clc_chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clc_chart_of_accounts_public_read" ON public.clc_chart_of_accounts
FOR SELECT USING (get_current_user_id() IS NOT NULL);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Tables protected: 58 out of 67 identified
-- Tables skipped: 9 (due to missing columns/tables or structural issues)
-- Next steps: Run validation suite to verify RLS coverage
-- =====================================================
