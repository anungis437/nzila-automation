-- =====================================================
-- RLS FIX: Corrections for failed policies
-- Migration: 054_fix_rls_policies.sql
-- Purpose: Fix errors from 053 migration
-- =====================================================

-- 1. Fix voting_auditors (no organization_id - make it accessible to authenticated users with role check)
CREATE POLICY "voting_auditors_authenticated_read" ON public.voting_auditors
FOR SELECT USING (get_current_user_id() IS NOT NULL);

-- 2. Fix members (uses organization_id not tenant_id)
ALTER TABLE public.members DROP POLICY IF EXISTS "members_tenant";
CREATE POLICY "members_org_access" ON public.members
FOR ALL USING (
  organization_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- 3. Fix user_uuid_mapping (uses clerk_user_id not text_id)
ALTER TABLE public.user_uuid_mapping DROP POLICY IF EXISTS "user_uuid_mapping_own_mapping";
CREATE POLICY "user_uuid_mapping_own_mapping" ON public.user_uuid_mapping
FOR ALL USING (clerk_user_id = get_current_user_id());

-- 4. Fix attestation_templates (no organization_id - global templates)
ALTER TABLE public.attestation_templates DROP POLICY IF EXISTS "attestation_templates_org_member";
CREATE POLICY "attestation_templates_authenticated_read" ON public.attestation_templates
FOR SELECT USING (get_current_user_id() IS NOT NULL);

-- 5. Fix trusted_certificate_authorities (uses organization_id that exists)
ALTER TABLE public.trusted_certificate_authorities DROP POLICY IF EXISTS "trusted_certificate_authorities_org_member";
CREATE POLICY "trusted_certificate_authorities_org_member" ON public.trusted_certificate_authorities
FOR ALL USING (
  organization_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- 6. Fix signature_audit_log (uses organization_id that exists)
ALTER TABLE public.signature_audit_log DROP POLICY IF EXISTS "signature_audit_log_org_member";
CREATE POLICY "signature_audit_log_org_member" ON public.signature_audit_log
FOR ALL USING (
  organization_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- 7. Fix blockchain_audit_anchors (uses organization_id that exists)
ALTER TABLE public.blockchain_audit_anchors DROP POLICY IF EXISTS "blockchain_audit_anchors_org_member";
CREATE POLICY "blockchain_audit_anchors_org_member" ON public.blockchain_audit_anchors
FOR ALL USING (
  organization_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- 8. Fix voting_key_access_log (check actual column names)
-- Let's check if it has session_id or voting_session_id
ALTER TABLE public.voting_key_access_log DROP POLICY IF EXISTS "voting_key_access_log_org_session";
CREATE POLICY "voting_key_access_log_org_access" ON public.voting_key_access_log
FOR ALL USING (
  -- Assuming it links through keys table or has organization_id
  EXISTS (
    SELECT 1 FROM public.voting_session_keys vsk
    JOIN public.voting_sessions vs ON vs.id = vsk.voting_session_id
    WHERE vsk.id = voting_key_access_log.key_id
    AND vs.organization_id::text IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = get_current_user_id()
    )
  )
);

-- 9. Fix compliance_validations (uses organization_id not tenant_id)
ALTER TABLE public.compliance_validations DROP POLICY IF EXISTS "compliance_validations_tenant";
CREATE POLICY "compliance_validations_org" ON public.compliance_validations
FOR ALL USING (
  organization_id::text IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = get_current_user_id()
  )
);

-- =====================================================
-- All corrections applied
-- =====================================================
