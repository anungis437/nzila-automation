-- Rollback: Remove Missing Critical Database Indexes
-- Rollback for: 0081_add_missing_critical_indexes.sql
-- Generated: 2026-02-12

-- WARNING: This rollback will significantly degrade query performance.
-- Only run this if you need to undo the migration for specific reasons.

BEGIN;

-- ============================================================================
-- CLAIMS TABLE INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_claims_organization_id;
DROP INDEX IF EXISTS idx_claims_member_id;
DROP INDEX IF EXISTS idx_claims_status;
DROP INDEX IF EXISTS idx_claims_assigned_to;
DROP INDEX IF EXISTS idx_claims_created_at;
DROP INDEX IF EXISTS idx_claims_org_status;
DROP INDEX IF EXISTS idx_claims_org_member;
DROP INDEX IF EXISTS idx_claims_org_status_created;

-- CLAIM_UPDATES TABLE
DROP INDEX IF EXISTS idx_claim_updates_claim_id;
DROP INDEX IF EXISTS idx_claim_updates_created_at;

-- ============================================================================
-- ORGANIZATION_MEMBERS TABLE INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_organization_members_user_id;
DROP INDEX IF EXISTS idx_organization_members_org_id;
DROP INDEX IF EXISTS idx_organization_members_role;
DROP INDEX IF EXISTS idx_organization_members_status;
DROP INDEX IF EXISTS idx_organization_members_user_org;
DROP INDEX IF EXISTS idx_organization_members_org_role_status;
DROP INDEX IF EXISTS idx_organization_members_unique;

-- ============================================================================
-- NOTIFICATION TABLE INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_in_app_notifications_user_id;
DROP INDEX IF EXISTS idx_in_app_notifications_org_id;
DROP INDEX IF EXISTS idx_in_app_notifications_read;
DROP INDEX IF EXISTS idx_in_app_notifications_created_at;
DROP INDEX IF EXISTS idx_in_app_notifications_user_read_created;

DROP INDEX IF EXISTS idx_notification_tracking_org_id;
DROP INDEX IF EXISTS idx_notification_tracking_recipient_id;
DROP INDEX IF EXISTS idx_notification_tracking_status;
DROP INDEX IF EXISTS idx_notification_tracking_status_created;

DROP INDEX IF EXISTS idx_notification_history_user_id;
DROP INDEX IF EXISTS idx_notification_history_org_id;
DROP INDEX IF EXISTS idx_notification_history_created_at;

-- ============================================================================
-- DEADLINES TABLE INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_deadlines_claim_id;
DROP INDEX IF EXISTS idx_deadlines_org_id;
DROP INDEX IF EXISTS idx_deadlines_due_date;
DROP INDEX IF EXISTS idx_deadlines_status;
DROP INDEX IF EXISTS idx_deadlines_org_due_status;
DROP INDEX IF EXISTS idx_deadlines_status_due;

DROP INDEX IF EXISTS idx_deadline_extensions_deadline_id;
DROP INDEX IF EXISTS idx_deadline_extensions_status;

DROP INDEX IF EXISTS idx_deadline_alerts_deadline_id;
DROP INDEX IF EXISTS idx_deadline_alerts_recipient_id;
DROP INDEX IF EXISTS idx_deadline_alerts_delivery_status;

-- ============================================================================
-- DUES_TRANSACTIONS TABLE INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_dues_transactions_org_id;
DROP INDEX IF EXISTS idx_dues_transactions_member_id;
DROP INDEX IF EXISTS idx_dues_transactions_status;
DROP INDEX IF EXISTS idx_dues_transactions_due_date;
DROP INDEX IF EXISTS idx_dues_transactions_paid_date;
DROP INDEX IF EXISTS idx_dues_transactions_org_member;
DROP INDEX IF EXISTS idx_dues_transactions_member_status_due;

-- ============================================================================
-- DOCUMENT TABLE INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_documents_org_id;
DROP INDEX IF EXISTS idx_documents_folder_id;
DROP INDEX IF EXISTS idx_documents_uploaded_by;
DROP INDEX IF EXISTS idx_documents_deleted_at;
DROP INDEX IF EXISTS idx_documents_org_folder;

DROP INDEX IF EXISTS idx_document_folders_org_id;
DROP INDEX IF EXISTS idx_document_folders_parent_id;
DROP INDEX IF EXISTS idx_document_folders_org_parent;

-- ============================================================================
-- AUDIT & SECURITY TABLE INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_audit_logs_org_id;
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_created_at;
DROP INDEX IF EXISTS idx_audit_logs_action;
DROP INDEX IF EXISTS idx_audit_logs_severity;
DROP INDEX IF EXISTS idx_audit_logs_org_created;
DROP INDEX IF EXISTS idx_audit_logs_user_created;
DROP INDEX IF EXISTS idx_audit_logs_resource;
DROP INDEX IF EXISTS idx_audit_logs_archived;

DROP INDEX IF EXISTS idx_security_events_org_id;
DROP INDEX IF EXISTS idx_security_events_user_id;
DROP INDEX IF EXISTS idx_security_events_created_at;
DROP INDEX IF EXISTS idx_security_events_is_resolved;
DROP INDEX IF EXISTS idx_security_events_severity;
DROP INDEX IF EXISTS idx_security_events_unresolved_severe;

DROP INDEX IF EXISTS idx_failed_login_attempts_email;
DROP INDEX IF EXISTS idx_failed_login_attempts_ip_address;
DROP INDEX IF EXISTS idx_failed_login_attempts_attempted_at;
DROP INDEX IF EXISTS idx_failed_login_attempts_email_time;
DROP INDEX IF EXISTS idx_failed_login_attempts_ip_time;

-- ============================================================================
-- USER MANAGEMENT TABLE INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_organization_users_org_id;
DROP INDEX IF EXISTS idx_organization_users_user_id;
DROP INDEX IF EXISTS idx_organization_users_is_active;
DROP INDEX IF EXISTS idx_organization_users_role;
DROP INDEX IF EXISTS idx_organization_users_unique;

DROP INDEX IF EXISTS idx_user_sessions_user_id;
DROP INDEX IF EXISTS idx_user_sessions_org_id;
DROP INDEX IF EXISTS idx_user_sessions_is_active;
DROP INDEX IF EXISTS idx_user_sessions_expires_at;
DROP INDEX IF EXISTS idx_user_sessions_user_active;
DROP INDEX IF EXISTS idx_user_sessions_expired;

-- ============================================================================
-- MESSAGING TABLE INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_message_threads_member_id;
DROP INDEX IF EXISTS idx_message_threads_staff_id;
DROP INDEX IF EXISTS idx_message_threads_org_id;
DROP INDEX IF EXISTS idx_message_threads_status;
DROP INDEX IF EXISTS idx_message_threads_last_message_at;
DROP INDEX IF EXISTS idx_message_threads_org_member;
DROP INDEX IF EXISTS idx_message_threads_org_staff_status;

DROP INDEX IF EXISTS idx_messages_thread_id;
DROP INDEX IF EXISTS idx_messages_sender_id;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_messages_thread_created;

DROP INDEX IF EXISTS idx_message_notifications_user_id;
DROP INDEX IF EXISTS idx_message_notifications_is_read;
DROP INDEX IF EXISTS idx_message_notifications_user_unread;

-- ============================================================================
-- MEMBER DOCUMENTS & MISCELLANEOUS INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_member_documents_user_id;
DROP INDEX IF EXISTS idx_member_documents_category;
DROP INDEX IF EXISTS idx_member_documents_uploaded_at;
DROP INDEX IF EXISTS idx_member_documents_user_category;

DROP INDEX IF EXISTS idx_profiles_organization_id;
DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_profiles_status;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all indexes were dropped:
-- SELECT indexname 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND indexname LIKE 'idx_claims%'
--   OR indexname LIKE 'idx_organization_members%'
--   OR indexname LIKE 'idx_in_app_notifications%'
--   OR indexname LIKE 'idx_deadlines%'
--   OR indexname LIKE 'idx_dues_transactions%';
