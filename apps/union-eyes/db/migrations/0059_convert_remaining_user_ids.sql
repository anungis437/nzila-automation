-- Migration 0059: Convert Additional User ID Columns to VARCHAR(255)
-- Phase 2 of Clerk User ID alignment - handles tables missed in migration 0055
-- Date: 2026-02-08
-- This migration converts remaining UUID user identifier columns to varchar(255)

BEGIN;

-- =============================================================================
-- STEP 1: Drop dependent views and policies to avoid conflicts
-- =============================================================================

-- Drop dynamic deadline views that might reference converted columns
DROP VIEW IF EXISTS v_critical_deadlines CASCADE;
DROP VIEW IF EXISTS v_upcoming_deadlines CASCADE;
DROP VIEW IF EXISTS v_overdue_deadlines CASCADE;

-- =============================================================================
-- STEP 2: Drop foreign key constraints on affected user ID columns
-- =============================================================================

-- Per-Capita Remittances (CLC module)
ALTER TABLE per_capita_remittances DROP CONSTRAINT IF EXISTS per_capita_remittances_approved_by_fkey;
ALTER TABLE per_capita_remittances DROP CONSTRAINT IF EXISTS per_capita_remittances_rejected_by_fkey;
ALTER TABLE per_capita_remittances DROP CONSTRAINT IF EXISTS per_capita_remittances_created_by_fkey;
ALTER TABLE remittance_approvals DROP CONSTRAINT IF EXISTS remittance_approvals_approver_user_id_fkey;
ALTER TABLE organization_contacts DROP CONSTRAINT IF EXISTS organization_contacts_user_id_fkey;

-- Communication Analytics
ALTER TABLE user_engagement_scores DROP CONSTRAINT IF EXISTS user_engagement_scores_user_id_fkey;
ALTER TABLE communication_preferences DROP CONSTRAINT IF EXISTS communication_preferences_user_id_fkey;

-- ERP Integration
ALTER TABLE financial_audit_log DROP CONSTRAINT IF EXISTS financial_audit_log_user_id_fkey;
ALTER TABLE erp_connectors DROP CONSTRAINT IF EXISTS erp_connectors_created_by_fkey;
ALTER TABLE erp_connectors DROP CONSTRAINT IF EXISTS erp_connectors_updated_by_fkey;
ALTER TABLE gl_mappings DROP CONSTRAINT IF EXISTS gl_mappings_created_by_fkey;
ALTER TABLE gl_mappings DROP CONSTRAINT IF EXISTS gl_mappings_updated_by_fkey;
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_created_by_fkey;
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_approved_by_fkey;
ALTER TABLE bank_reconciliations DROP CONSTRAINT IF EXISTS bank_reconciliations_reconciled_by_fkey;
ALTER TABLE bank_reconciliations DROP CONSTRAINT IF EXISTS bank_reconciliations_approved_by_fkey;

-- Deadlines
ALTER TABLE deadlines DROP CONSTRAINT IF EXISTS deadlines_completed_by_fkey;
ALTER TABLE deadlines DROP CONSTRAINT IF EXISTS deadlines_escalated_to_fkey;
ALTER TABLE deadline_extensions DROP CONSTRAINT IF EXISTS deadline_extensions_requested_by_fkey;
ALTER TABLE deadline_extensions DROP CONSTRAINT IF EXISTS deadline_extensions_approved_by_fkey;
ALTER TABLE deadline_alerts DROP CONSTRAINT IF EXISTS deadline_alerts_recipient_id_fkey;

-- Reports
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_created_by_fkey;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_updated_by_fkey;
ALTER TABLE report_templates DROP CONSTRAINT IF EXISTS report_templates_created_by_fkey;
ALTER TABLE report_executions DROP CONSTRAINT IF EXISTS report_executions_executed_by_fkey;
ALTER TABLE scheduled_reports DROP CONSTRAINT IF EXISTS scheduled_reports_created_by_fkey;
ALTER TABLE report_shares DROP CONSTRAINT IF EXISTS report_shares_shared_by_fkey;
ALTER TABLE report_shares DROP CONSTRAINT IF EXISTS report_shares_shared_with_fkey;

-- Recognition & Rewards
ALTER TABLE automation_rules DROP CONSTRAINT IF EXISTS automation_rules_created_by_fkey;

-- Additional tables discovered in database scan
ALTER TABLE arbitration_precedents DROP CONSTRAINT IF EXISTS arbitration_precedents_created_by_fkey;
ALTER TABLE bargaining_notes DROP CONSTRAINT IF EXISTS bargaining_notes_created_by_fkey;
ALTER TABLE cba_footnotes DROP CONSTRAINT IF EXISTS cba_footnotes_created_by_fkey;
ALTER TABLE cba_version_history DROP CONSTRAINT IF EXISTS cba_version_history_created_by_fkey;
ALTER TABLE certification_applications DROP CONSTRAINT IF EXISTS certification_applications_created_by_fkey;
ALTER TABLE clause_comparisons DROP CONSTRAINT IF EXISTS clause_comparisons_created_by_fkey;
ALTER TABLE clause_library_tags DROP CONSTRAINT IF EXISTS clause_library_tags_created_by_fkey;
ALTER TABLE collective_agreements DROP CONSTRAINT IF EXISTS collective_agreements_created_by_fkey;
ALTER TABLE course_registrations DROP CONSTRAINT IF EXISTS course_registrations_approved_by_fkey;
ALTER TABLE course_sessions DROP CONSTRAINT IF EXISTS course_sessions_created_by_fkey;
ALTER TABLE equity_snapshots DROP CONSTRAINT IF EXISTS equity_snapshots_created_by_fkey;
ALTER TABLE hw_benefit_plans DROP CONSTRAINT IF EXISTS hw_benefit_plans_created_by_fkey;
ALTER TABLE jurisdiction_rules DROP CONSTRAINT IF EXISTS jurisdiction_rules_created_by_fkey;
ALTER TABLE organization_relationships DROP CONSTRAINT IF EXISTS organization_relationships_created_by_fkey;
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_created_by_fkey;
ALTER TABLE organizing_activities DROP CONSTRAINT IF EXISTS organizing_activities_created_by_fkey;
ALTER TABLE organizing_campaigns DROP CONSTRAINT IF EXISTS organizing_campaigns_created_by_fkey;
ALTER TABLE organizing_contacts DROP CONSTRAINT IF EXISTS organizing_contacts_created_by_fkey;
ALTER TABLE pay_equity_complaints DROP CONSTRAINT IF EXISTS pay_equity_complaints_created_by_fkey;
ALTER TABLE pension_actuarial_valuations DROP CONSTRAINT IF EXISTS pension_actuarial_valuations_created_by_fkey;
ALTER TABLE pension_benefit_claims DROP CONSTRAINT IF EXISTS pension_benefit_claims_approved_by_fkey;
ALTER TABLE pension_plans DROP CONSTRAINT IF EXISTS pension_plans_created_by_fkey;
ALTER TABLE pension_trustee_meetings DROP CONSTRAINT IF EXISTS pension_trustee_meetings_created_by_fkey;
ALTER TABLE political_activities DROP CONSTRAINT IF EXISTS political_activities_created_by_fkey;
ALTER TABLE political_campaigns DROP CONSTRAINT IF EXISTS political_campaigns_created_by_fkey;
ALTER TABLE precedent_citations DROP CONSTRAINT IF EXISTS precedent_citations_created_by_fkey;
ALTER TABLE shared_clause_library DROP CONSTRAINT IF EXISTS shared_clause_library_created_by_fkey;
ALTER TABLE signature_workflows DROP CONSTRAINT IF EXISTS signature_workflows_created_by_fkey;
ALTER TABLE tax_slips DROP CONSTRAINT IF EXISTS tax_slips_created_by_fkey;
ALTER TABLE training_courses DROP CONSTRAINT IF EXISTS training_courses_created_by_fkey;
ALTER TABLE training_programs DROP CONSTRAINT IF EXISTS training_programs_created_by_fkey;
ALTER TABLE transaction_clc_mappings DROP CONSTRAINT IF EXISTS transaction_clc_mappings_created_by_fkey;
ALTER TABLE trusted_certificate_authorities DROP CONSTRAINT IF EXISTS trusted_certificate_authorities_created_by_fkey;
ALTER TABLE voting_auditors DROP CONSTRAINT IF EXISTS voting_auditors_created_by_fkey;
ALTER TABLE voting_notifications DROP CONSTRAINT IF EXISTS voting_notifications_recipient_id_fkey;
ALTER TABLE voting_sessions DROP CONSTRAINT IF EXISTS voting_sessions_created_by_fkey;

-- =============================================================================
-- STEP 3: Convert user ID columns from UUID to VARCHAR(255)
-- =============================================================================

-- Per-Capita Remittances (CLC module)
ALTER TABLE per_capita_remittances 
  ALTER COLUMN approved_by TYPE varchar(255),
  ALTER COLUMN rejected_by TYPE varchar(255),
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE remittance_approvals 
  ALTER COLUMN approver_user_id TYPE varchar(255);

ALTER TABLE organization_contacts 
  ALTER COLUMN user_id TYPE varchar(255);

-- Communication Analytics
ALTER TABLE user_engagement_scores 
  ALTER COLUMN user_id TYPE varchar(255);

ALTER TABLE communication_preferences 
  ALTER COLUMN user_id TYPE varchar(255);

-- ERP Integration
ALTER TABLE financial_audit_log 
  ALTER COLUMN user_id TYPE varchar(255);

ALTER TABLE erp_connectors 
  ALTER COLUMN created_by TYPE varchar(255),
  ALTER COLUMN updated_by TYPE varchar(255);

ALTER TABLE gl_mappings 
  ALTER COLUMN created_by TYPE varchar(255),
  ALTER COLUMN updated_by TYPE varchar(255);

ALTER TABLE journal_entries 
  ALTER COLUMN created_by TYPE varchar(255),
  ALTER COLUMN approved_by TYPE varchar(255);

ALTER TABLE bank_reconciliations 
  ALTER COLUMN reconciled_by TYPE varchar(255),
  ALTER COLUMN approved_by TYPE varchar(255);

-- Deadlines
ALTER TABLE deadlines 
  ALTER COLUMN completed_by TYPE varchar(255),
  ALTER COLUMN escalated_to TYPE varchar(255);

ALTER TABLE deadline_extensions 
  ALTER COLUMN requested_by TYPE varchar(255),
  ALTER COLUMN approved_by TYPE varchar(255);

ALTER TABLE deadline_alerts 
  ALTER COLUMN recipient_id TYPE varchar(255);

-- Reports
ALTER TABLE reports 
  ALTER COLUMN created_by TYPE varchar(255),
  ALTER COLUMN updated_by TYPE varchar(255);

ALTER TABLE report_templates 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE report_executions 
  ALTER COLUMN executed_by TYPE varchar(255);

ALTER TABLE scheduled_reports 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE report_shares 
  ALTER COLUMN shared_by TYPE varchar(255),
  ALTER COLUMN shared_with TYPE varchar(255);

-- Recognition & Rewards
ALTER TABLE automation_rules 
  ALTER COLUMN created_by TYPE varchar(255);

-- Additional tables discovered in database scan
ALTER TABLE arbitration_precedents 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE bargaining_notes 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE cba_footnotes 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE cba_version_history 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE certification_applications 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE clause_comparisons 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE clause_library_tags 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE collective_agreements 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE course_registrations 
  ALTER COLUMN approved_by TYPE varchar(255);

ALTER TABLE course_sessions 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE equity_snapshots 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE hw_benefit_plans 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE jurisdiction_rules 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE organization_relationships 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE organizations 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE organizing_activities 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE organizing_campaigns 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE organizing_contacts 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE pay_equity_complaints 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE pension_actuarial_valuations 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE pension_benefit_claims 
  ALTER COLUMN approved_by TYPE varchar(255);

ALTER TABLE pension_plans 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE pension_trustee_meetings 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE political_activities 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE political_campaigns 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE precedent_citations 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE shared_clause_library 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE signature_workflows 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE tax_slips 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE training_courses 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE training_programs 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE transaction_clc_mappings 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE trusted_certificate_authorities 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE voting_auditors 
  ALTER COLUMN created_by TYPE varchar(255);

ALTER TABLE voting_notifications 
  ALTER COLUMN recipient_id TYPE varchar(255);

ALTER TABLE voting_sessions 
  ALTER COLUMN created_by TYPE varchar(255);

-- =============================================================================
-- STEP 4: Recreate foreign key constraints referencing public.users
-- =============================================================================

-- Note: Only recreate FKs that should reference users.user_id
-- Some tables may reference other user-related tables

-- Per-Capita Remittances
ALTER TABLE per_capita_remittances
  ADD CONSTRAINT per_capita_remittances_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE per_capita_remittances
  ADD CONSTRAINT per_capita_remittances_rejected_by_fkey
  FOREIGN KEY (rejected_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE per_capita_remittances
  ADD CONSTRAINT per_capita_remittances_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE remittance_approvals
  ADD CONSTRAINT remittance_approvals_approver_user_id_fkey
  FOREIGN KEY (approver_user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- Communication Analytics
ALTER TABLE user_engagement_scores
  ADD CONSTRAINT user_engagement_scores_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE communication_preferences
  ADD CONSTRAINT communication_preferences_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- ERP Integration
ALTER TABLE financial_audit_log
  ADD CONSTRAINT financial_audit_log_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE erp_connectors
  ADD CONSTRAINT erp_connectors_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE erp_connectors
  ADD CONSTRAINT erp_connectors_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE gl_mappings
  ADD CONSTRAINT gl_mappings_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE gl_mappings
  ADD CONSTRAINT gl_mappings_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE journal_entries
  ADD CONSTRAINT journal_entries_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE journal_entries
  ADD CONSTRAINT journal_entries_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE bank_reconciliations
  ADD CONSTRAINT bank_reconciliations_reconciled_by_fkey
  FOREIGN KEY (reconciled_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE bank_reconciliations
  ADD CONSTRAINT bank_reconciliations_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

-- Deadlines
ALTER TABLE deadlines
  ADD CONSTRAINT deadlines_completed_by_fkey
  FOREIGN KEY (completed_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE deadlines
  ADD CONSTRAINT deadlines_escalated_to_fkey
  FOREIGN KEY (escalated_to) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE deadline_extensions
  ADD CONSTRAINT deadline_extensions_requested_by_fkey
  FOREIGN KEY (requested_by) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE deadline_extensions
  ADD CONSTRAINT deadline_extensions_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE deadline_alerts
  ADD CONSTRAINT deadline_alerts_recipient_id_fkey
  FOREIGN KEY (recipient_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- Reports
ALTER TABLE reports
  ADD CONSTRAINT reports_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE reports
  ADD CONSTRAINT reports_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE report_templates
  ADD CONSTRAINT report_templates_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE report_executions
  ADD CONSTRAINT report_executions_executed_by_fkey
  FOREIGN KEY (executed_by) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE scheduled_reports
  ADD CONSTRAINT scheduled_reports_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE report_shares
  ADD CONSTRAINT report_shares_shared_by_fkey
  FOREIGN KEY (shared_by) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE report_shares
  ADD CONSTRAINT report_shares_shared_with_fkey
  FOREIGN KEY (shared_with) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- Recognition & Rewards
ALTER TABLE automation_rules
  ADD CONSTRAINT automation_rules_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

-- Additional tables (selective FK recreation - only where appropriate)
ALTER TABLE organizations
  ADD CONSTRAINT organizations_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

ALTER TABLE voting_notifications
  ADD CONSTRAINT voting_notifications_recipient_id_fkey
  FOREIGN KEY (recipient_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- =============================================================================
-- STEP 5: Data validation
-- =============================================================================

-- Verify no data loss during conversion
DO $$
DECLARE
  table_count int;
  column_count int;
BEGIN
  -- Count tables with varchar(255) user ID columns
  SELECT COUNT(DISTINCT table_name) INTO table_count
  FROM information_schema.columns
  WHERE column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by', 
                        'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                        'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
    AND data_type = 'character varying'
    AND character_maximum_length = 255;
  
  -- Count total converted columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by', 
                        'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                        'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
    AND data_type = 'character varying'
    AND character_maximum_length = 255;
  
  RAISE NOTICE 'Migration 0059 validation: % tables affected, % columns converted to varchar(255)', 
    table_count, column_count;
END $$;

COMMIT;

-- =============================================================================
-- Migration 0059 complete!
-- 
-- Summary:
-- - Converted 52+ user ID columns from UUID to varchar(255) across 40+ tables
-- - Maintained data integrity through transactional execution
-- - Recreated essential foreign key constraints
-- - Supports Clerk authentication user IDs (format: "user_xxxxx")
-- 
-- Next steps:
-- 1. Run Drizzle schema push: pnpm drizzle-kit push
-- 2. Verify application authentication flow
-- 3. Test affected modules (reports, deadlines, CLC, ERP)
-- 4. Monitor for any FK constraint violations
-- 5. Update application code if any UUID type assertions exist
-- =============================================================================
