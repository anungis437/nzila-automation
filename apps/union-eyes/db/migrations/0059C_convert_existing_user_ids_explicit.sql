-- Migration 0059C: Convert User ID Columns to VARCHAR(255) (Explicit Version)
-- Date: 2026-02-08
-- Targets only the 54 tables that actually exist in staging

BEGIN;

-- =============================================================================
-- STEP 1: Drop dependent views
-- =============================================================================

DROP VIEW IF EXISTS v_critical_deadlines CASCADE;

-- =============================================================================
-- STEP 2: Drop all FK constraints first
-- =============================================================================

-- Per-Capita Remittances
ALTER TABLE per_capita_remittances DROP CONSTRAINT IF EXISTS per_capita_remittances_approved_by_fkey;
ALTER TABLE per_capita_remittances DROP CONSTRAINT IF EXISTS per_capita_remittances_rejected_by_fkey;
ALTER TABLE per_capita_remittances DROP CONSTRAINT IF EXISTS per_capita_remittances_created_by_fkey;

-- Deadlines
ALTER TABLE claim_deadlines DROP CONSTRAINT IF EXISTS claim_deadlines_completed_by_fkey;
ALTER TABLE claim_deadlines DROP CONSTRAINT IF EXISTS claim_deadlines_escalated_to_fkey;
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

-- Course registrations
ALTER TABLE course_registrations DROP CONSTRAINT IF EXISTS course_registrations_approved_by_fkey;

-- Organizations
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_created_by_fkey;

-- Voting
ALTER TABLE voting_notifications DROP CONSTRAINT IF EXISTS voting_notifications_recipient_id_fkey;

-- Arbitration & Bargaining
ALTER TABLE arbitration_precedents DROP CONSTRAINT IF EXISTS arbitration_precedents_created_by_fkey;
ALTER TABLE attestation_templates DROP CONSTRAINT IF EXISTS attestation_templates_created_by_fkey;
ALTER TABLE bargaining_notes DROP CONSTRAINT IF EXISTS bargaining_notes_created_by_fkey;
ALTER TABLE cba_footnotes DROP CONSTRAINT IF EXISTS cba_footnotes_created_by_fkey;
ALTER TABLE cba_version_history DROP CONSTRAINT IF EXISTS cba_version_history_created_by_fkey;
ALTER TABLE certification_applications DROP CONSTRAINT IF EXISTS certification_applications_created_by_fkey;
ALTER TABLE clause_comparisons DROP CONSTRAINT IF EXISTS clause_comparisons_created_by_fkey;
ALTER TABLE clause_comparisons_history DROP CONSTRAINT IF EXISTS clause_comparisons_history_created_by_fkey;
ALTER TABLE clause_library_tags DROP CONSTRAINT IF EXISTS clause_library_tags_created_by_fkey;
ALTER TABLE collective_agreements DROP CONSTRAINT IF EXISTS collective_agreements_created_by_fkey;

-- Courses
ALTER TABLE course_sessions DROP CONSTRAINT IF EXISTS course_sessions_created_by_fkey;
ALTER TABLE training_courses DROP CONSTRAINT IF EXISTS training_courses_created_by_fkey;
ALTER TABLE training_programs DROP CONSTRAINT IF EXISTS training_programs_created_by_fkey;

-- Equity & Benefits
ALTER TABLE equity_snapshots DROP CONSTRAINT IF EXISTS equity_snapshots_created_by_fkey;
ALTER TABLE hw_benefit_plans DROP CONSTRAINT IF EXISTS hw_benefit_plans_created_by_fkey;
ALTER TABLE jurisdiction_rules DROP CONSTRAINT IF EXISTS jurisdiction_rules_created_by_fkey;

-- Members
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_created_by_fkey;
-- members_with_pii is a VIEW - skip constraint drop
ALTER TABLE notification_queue DROP CONSTRAINT IF EXISTS notification_queue_recipient_id_fkey;

-- Organization relationships
ALTER TABLE organization_relationships DROP CONSTRAINT IF EXISTS organization_relationships_created_by_fkey;
ALTER TABLE organization_relationships DROP CONSTRAINT IF EXISTS organization_relationships_approved_by_fkey;

-- Organizing & Politics
ALTER TABLE organizing_activities DROP CONSTRAINT IF EXISTS organizing_activities_created_by_fkey;
ALTER TABLE organizing_campaigns DROP CONSTRAINT IF EXISTS organizing_campaigns_created_by_fkey;
ALTER TABLE organizing_contacts DROP CONSTRAINT IF EXISTS organizing_contacts_created_by_fkey;
ALTER TABLE political_activities DROP CONSTRAINT IF EXISTS political_activities_created_by_fkey;
ALTER TABLE political_campaigns DROP CONSTRAINT IF EXISTS political_campaigns_created_by_fkey;

-- Pay Equity
ALTER TABLE pay_equity_complaints DROP CONSTRAINT IF EXISTS pay_equity_complaints_created_by_fkey;

-- Pensions
ALTER TABLE pension_actuarial_valuations DROP CONSTRAINT IF EXISTS pension_actuarial_valuations_created_by_fkey;
ALTER TABLE pension_benefit_claims DROP CONSTRAINT IF EXISTS pension_benefit_claims_created_by_fkey;
ALTER TABLE pension_plans DROP CONSTRAINT IF EXISTS pension_plans_created_by_fkey;
ALTER TABLE pension_trustee_meetings DROP CONSTRAINT IF EXISTS pension_trustee_meetings_created_by_fkey;
ALTER TABLE pension_trustees DROP CONSTRAINT IF EXISTS pension_trustees_created_by_fkey;

-- Precedents
ALTER TABLE precedent_citations DROP CONSTRAINT IF EXISTS precedent_citations_created_by_fkey;

-- Shared Library
ALTER TABLE shared_clause_library DROP CONSTRAINT IF EXISTS shared_clause_library_created_by_fkey;
ALTER TABLE signature_workflows DROP CONSTRAINT IF EXISTS signature_workflows_created_by_fkey;
ALTER TABLE signature_workflows DROP CONSTRAINT IF EXISTS signature_workflows_approver_user_id_fkey;

-- Tax
ALTER TABLE tax_slips DROP CONSTRAINT IF EXISTS tax_slips_created_by_fkey;

-- Transactions
ALTER TABLE transaction_clc_mappings DROP CONSTRAINT IF EXISTS transaction_clc_mappings_created_by_fkey;

-- Certificates
ALTER TABLE trusted_certificate_authorities DROP CONSTRAINT IF EXISTS trusted_certificate_authorities_created_by_fkey;

-- Cross-org
ALTER TABLE cross_org_access_log DROP CONSTRAINT IF EXISTS cross_org_access_log_user_id_fkey;

-- Voting auditors
ALTER TABLE voting_auditors DROP CONSTRAINT IF EXISTS voting_auditors_created_by_fkey;
ALTER TABLE voting_sessions DROP CONSTRAINT IF EXISTS voting_sessions_created_by_fkey;

-- User preferences
ALTER TABLE user_notification_preferences DROP CONSTRAINT IF EXISTS user_notification_preferences_user_id_fkey;

-- =============================================================================
-- STEP 3: Convert all UUID user ID columns to VARCHAR(255)
-- =============================================================================

-- Per-Capita Remittances
ALTER TABLE per_capita_remittances 
  ALTER COLUMN approved_by TYPE varchar(255),
  ALTER COLUMN rejected_by TYPE varchar(255),
  ALTER COLUMN created_by TYPE varchar(255);

-- Deadlines
ALTER TABLE claim_deadlines 
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

-- Course registrations
ALTER TABLE course_registrations 
  ALTER COLUMN approved_by TYPE varchar(255);

-- Organizations
ALTER TABLE organizations 
  ALTER COLUMN created_by TYPE varchar(255);

-- Voting
ALTER TABLE voting_notifications 
  ALTER COLUMN recipient_id TYPE varchar(255);

-- Arbitration & Bargaining
ALTER TABLE arbitration_precedents ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE attestation_templates ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE bargaining_notes ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE cba_footnotes ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE cba_version_history ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE certification_applications ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE clause_comparisons ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE clause_comparisons_history ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE clause_library_tags ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE collective_agreements ALTER COLUMN created_by TYPE varchar(255);

-- Courses
ALTER TABLE course_sessions ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE training_courses ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE training_programs ALTER COLUMN created_by TYPE varchar(255);

-- Equity & Benefits
ALTER TABLE equity_snapshots ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE hw_benefit_plans ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE jurisdiction_rules ALTER COLUMN created_by TYPE varchar(255);

-- Members
ALTER TABLE members ALTER COLUMN created_by TYPE varchar(255);
-- members_with_pii is a VIEW - cannot alter, it will inherit from members table
ALTER TABLE notification_queue ALTER COLUMN recipient_id TYPE varchar(255);

-- Organization relationships
ALTER TABLE organization_relationships 
  ALTER COLUMN created_by TYPE varchar(255),
  ALTER COLUMN approved_by TYPE varchar(255);

-- Organizing & Politics
ALTER TABLE organizing_activities ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE organizing_campaigns ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE organizing_contacts ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE political_activities ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE political_campaigns ALTER COLUMN created_by TYPE varchar(255);

-- Pay Equity
ALTER TABLE pay_equity_complaints ALTER COLUMN created_by TYPE varchar(255);

-- Pensions
ALTER TABLE pension_actuarial_valuations ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE pension_benefit_claims ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE pension_plans ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE pension_trustee_meetings ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE pension_trustees ALTER COLUMN created_by TYPE varchar(255);

-- Precedents
ALTER TABLE precedent_citations ALTER COLUMN created_by TYPE varchar(255);

-- Shared Library
ALTER TABLE shared_clause_library ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE signature_workflows 
  ALTER COLUMN created_by TYPE varchar(255),
  ALTER COLUMN approver_user_id TYPE varchar(255);

-- Tax
ALTER TABLE tax_slips ALTER COLUMN created_by TYPE varchar(255);

-- Transactions
ALTER TABLE transaction_clc_mappings ALTER COLUMN created_by TYPE varchar(255);

-- Certificates
ALTER TABLE trusted_certificate_authorities ALTER COLUMN created_by TYPE varchar(255);

-- Cross-org
ALTER TABLE cross_org_access_log ALTER COLUMN user_id TYPE varchar(255);

-- Voting auditors
ALTER TABLE voting_auditors ALTER COLUMN created_by TYPE varchar(255);
ALTER TABLE voting_sessions ALTER COLUMN created_by TYPE varchar(255);

-- User preferences
ALTER TABLE user_notification_preferences ALTER COLUMN user_id TYPE varchar(255);

-- =============================================================================
-- STEP 4: Recreate FK constraints to public.users
-- =============================================================================

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

-- Deadlines
ALTER TABLE claim_deadlines
  ADD CONSTRAINT claim_deadlines_completed_by_fkey
  FOREIGN KEY (completed_by) REFERENCES public.users(user_id) ON DELETE SET NULL;
ALTER TABLE claim_deadlines
  ADD CONSTRAINT claim_deadlines_escalated_to_fkey
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

-- Organizations
ALTER TABLE organizations
  ADD CONSTRAINT organizations_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

-- Voting
ALTER TABLE voting_notifications
  ADD CONSTRAINT voting_notifications_recipient_id_fkey
  FOREIGN KEY (recipient_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- Cross-org
ALTER TABLE cross_org_access_log
  ADD CONSTRAINT cross_org_access_log_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- User preferences
ALTER TABLE user_notification_preferences
  ADD CONSTRAINT user_notification_preferences_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- Signature workflows
ALTER TABLE signature_workflows
  ADD CONSTRAINT signature_workflows_approver_user_id_fkey
  FOREIGN KEY (approver_user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;

-- Organization relationships
ALTER TABLE organization_relationships
  ADD CONSTRAINT organization_relationships_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES public.users(user_id) ON DELETE SET NULL;

-- =============================================================================
-- STEP 5: Validation
-- =============================================================================

DO $$
DECLARE
  varchar_count int;
  uuid_count int;
BEGIN
  SELECT COUNT(*) INTO varchar_count
  FROM information_schema.columns
  WHERE column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by', 
                        'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                        'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
    AND data_type = 'character varying'
    AND character_maximum_length = 255
    AND table_schema = 'public';
  
  SELECT COUNT(*) INTO uuid_count
  FROM information_schema.columns
  WHERE column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by', 
                        'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                        'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
    AND data_type = 'uuid'
    AND table_schema = 'public';
  
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Migration 0059C Complete:';
  RAISE NOTICE '  - VARCHAR(255) columns: %', varchar_count;
  RAISE NOTICE '  - Remaining UUID columns: %', uuid_count;
  RAISE NOTICE '=============================================================================';
  
  IF uuid_count > 0 THEN
    RAISE WARNING 'Some UUID columns remain - see list below';
  END IF;
END $$;

-- Show any remaining UUID columns for review
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE column_name IN ('user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by', 
                      'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
                      'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by')
  AND data_type = 'uuid'
  AND table_schema = 'public'
ORDER BY table_name, column_name;

COMMIT;
