CREATE TYPE "public"."committee_member_role" AS ENUM('chair', 'vice_chair', 'secretary', 'treasurer', 'member', 'alternate', 'advisor', 'ex_officio');--> statement-breakpoint
CREATE TYPE "public"."committee_type" AS ENUM('bargaining', 'grievance', 'health_safety', 'political_action', 'equity', 'education', 'organizing', 'steward', 'executive', 'finance', 'communications', 'social', 'pension_benefits', 'other');--> statement-breakpoint
CREATE TYPE "public"."employer_status" AS ENUM('active', 'inactive', 'contract_expired', 'in_bargaining', 'dispute', 'archived');--> statement-breakpoint
CREATE TYPE "public"."employer_type" AS ENUM('private', 'public', 'non_profit', 'crown_corporation', 'municipal', 'provincial', 'federal', 'educational', 'healthcare');--> statement-breakpoint
CREATE TYPE "public"."steward_type" AS ENUM('chief_steward', 'steward', 'alternate_steward', 'health_safety_rep');--> statement-breakpoint
CREATE TYPE "public"."unit_status" AS ENUM('active', 'under_certification', 'decertified', 'merged', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."unit_type" AS ENUM('full_time', 'part_time', 'casual', 'mixed', 'craft', 'industrial', 'professional');--> statement-breakpoint
CREATE TYPE "public"."worksite_status" AS ENUM('active', 'temporarily_closed', 'permanently_closed', 'seasonal', 'archived');--> statement-breakpoint
CREATE TABLE "bargaining_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employer_id" uuid NOT NULL,
	"worksite_id" uuid,
	"name" varchar(255) NOT NULL,
	"unit_number" varchar(50),
	"unit_type" "unit_type" NOT NULL,
	"status" "unit_status" DEFAULT 'active' NOT NULL,
	"certification_number" varchar(100),
	"certification_date" date,
	"certification_body" varchar(100),
	"certification_expiry_date" date,
	"current_collective_agreement_id" uuid,
	"contract_expiry_date" date,
	"next_bargaining_date" date,
	"member_count" integer DEFAULT 0,
	"classifications" jsonb,
	"chief_steward_id" text,
	"bargaining_chair_id" text,
	"description" text,
	"notes" text,
	"custom_fields" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text,
	"updated_by" text,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "committee_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"committee_id" uuid NOT NULL,
	"member_id" text NOT NULL,
	"role" "committee_member_role" DEFAULT 'member' NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"term_number" integer DEFAULT 1,
	"appointment_method" varchar(50),
	"appointed_by" text,
	"election_date" date,
	"votes_received" integer,
	"meetings_attended" integer DEFAULT 0,
	"meetings_total" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "committees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"committee_type" "committee_type" NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"unit_id" uuid,
	"worksite_id" uuid,
	"is_organization_wide" boolean DEFAULT false,
	"mandate" text,
	"meeting_frequency" varchar(100),
	"meeting_day" varchar(50),
	"meeting_time" varchar(50),
	"meeting_location" text,
	"max_members" integer,
	"current_member_count" integer DEFAULT 0,
	"requires_appointment" boolean DEFAULT false,
	"requires_election" boolean DEFAULT false,
	"term_length" integer,
	"chair_id" text,
	"secretary_id" text,
	"contact_email" varchar(255),
	"description" text,
	"notes" text,
	"custom_fields" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text,
	"updated_by" text,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "employers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"legal_name" varchar(255),
	"dba_name" varchar(255),
	"employer_type" "employer_type" NOT NULL,
	"status" "employer_status" DEFAULT 'active' NOT NULL,
	"business_number" varchar(50),
	"federal_corporation_number" varchar(50),
	"provincial_corporation_number" varchar(50),
	"industry_code" varchar(20),
	"email" varchar(255),
	"phone" varchar(50),
	"website" varchar(500),
	"main_address" jsonb,
	"total_employees" integer,
	"unionized_employees" integer,
	"established_date" date,
	"primary_contact_name" varchar(255),
	"primary_contact_title" varchar(255),
	"primary_contact_email" varchar(255),
	"primary_contact_phone" varchar(50),
	"labour_relations_contact_name" varchar(255),
	"labour_relations_contact_email" varchar(255),
	"labour_relations_contact_phone" varchar(50),
	"parent_company_id" uuid,
	"notes" text,
	"custom_fields" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text,
	"updated_by" text,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "role_tenure_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"member_id" text NOT NULL,
	"role_type" varchar(100) NOT NULL,
	"role_title" varchar(255) NOT NULL,
	"role_level" varchar(50),
	"related_entity_type" varchar(50),
	"related_entity_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_current_role" boolean DEFAULT true,
	"appointment_method" varchar(50),
	"election_date" date,
	"votes_received" integer,
	"vote_total" integer,
	"term_length" integer,
	"term_number" integer DEFAULT 1,
	"end_reason" varchar(100),
	"ended_by" text,
	"notes" text,
	"achievements" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "steward_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"steward_id" text NOT NULL,
	"steward_type" "steward_type" NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"unit_id" uuid,
	"worksite_id" uuid,
	"department" varchar(255),
	"shift" varchar(100),
	"floor" varchar(100),
	"area" varchar(255),
	"start_date" date NOT NULL,
	"end_date" date,
	"is_interim" boolean DEFAULT false,
	"appointed_by" text,
	"elected_date" date,
	"certification_date" date,
	"responsibility_areas" jsonb,
	"members_covered" integer,
	"training_completed" boolean DEFAULT false,
	"training_completion_date" date,
	"certification_expiry" date,
	"work_phone" varchar(50),
	"personal_phone" varchar(50),
	"preferred_contact_method" varchar(50),
	"availability_notes" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "worksites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employer_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"status" "worksite_status" DEFAULT 'active' NOT NULL,
	"address" jsonb,
	"employee_count" integer,
	"shift_count" integer,
	"operates_weekends" boolean DEFAULT false,
	"operates_24_hours" boolean DEFAULT false,
	"site_manager_name" varchar(255),
	"site_manager_email" varchar(255),
	"site_manager_phone" varchar(50),
	"description" text,
	"notes" text,
	"custom_fields" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" text,
	"updated_by" text,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
DROP TABLE "pending_profiles" CASCADE;--> statement-breakpoint
DROP TABLE "user_management"."oauth_providers" CASCADE;--> statement-breakpoint
DROP TABLE "user_management"."organization_users" CASCADE;--> statement-breakpoint
DROP TABLE "user_management"."user_sessions" CASCADE;--> statement-breakpoint
DROP TABLE "user_management"."users" CASCADE;--> statement-breakpoint
DROP TABLE "grievance_deadlines" CASCADE;--> statement-breakpoint
DROP TABLE "claim_updates" CASCADE;--> statement-breakpoint
DROP TABLE "claims" CASCADE;--> statement-breakpoint
DROP TABLE "arbitrations" CASCADE;--> statement-breakpoint
DROP TABLE "grievance_responses" CASCADE;--> statement-breakpoint
DROP TABLE "grievance_timeline" CASCADE;--> statement-breakpoint
DROP TABLE "grievances" CASCADE;--> statement-breakpoint
DROP TABLE "settlements" CASCADE;--> statement-breakpoint
DROP TABLE "deadline_alerts" CASCADE;--> statement-breakpoint
DROP TABLE "deadline_extensions" CASCADE;--> statement-breakpoint
DROP TABLE "deadline_rules" CASCADE;--> statement-breakpoint
DROP TABLE "claim_deadlines" CASCADE;--> statement-breakpoint
DROP TABLE "holidays" CASCADE;--> statement-breakpoint
DROP TABLE "grievance_approvals" CASCADE;--> statement-breakpoint
DROP TABLE "grievance_assignments" CASCADE;--> statement-breakpoint
DROP TABLE "grievance_communications" CASCADE;--> statement-breakpoint
DROP TABLE "grievance_documents" CASCADE;--> statement-breakpoint
DROP TABLE "grievance_settlements" CASCADE;--> statement-breakpoint
DROP TABLE "grievance_stages" CASCADE;--> statement-breakpoint
DROP TABLE "grievance_transitions" CASCADE;--> statement-breakpoint
DROP TABLE "grievance_workflows" CASCADE;--> statement-breakpoint
DROP TABLE "cba_contacts" CASCADE;--> statement-breakpoint
DROP TABLE "cba_version_history" CASCADE;--> statement-breakpoint
DROP TABLE "collective_agreements" CASCADE;--> statement-breakpoint
DROP TABLE "benefit_comparisons" CASCADE;--> statement-breakpoint
DROP TABLE "cba_clauses" CASCADE;--> statement-breakpoint
DROP TABLE "clause_comparisons" CASCADE;--> statement-breakpoint
DROP TABLE "wage_progressions" CASCADE;--> statement-breakpoint
DROP TABLE "arbitration_decisions" CASCADE;--> statement-breakpoint
DROP TABLE "arbitrator_profiles" CASCADE;--> statement-breakpoint
DROP TABLE "bargaining_notes" CASCADE;--> statement-breakpoint
DROP TABLE "cba_footnotes" CASCADE;--> statement-breakpoint
DROP TABLE "claim_precedent_analysis" CASCADE;--> statement-breakpoint
DROP TABLE "clause_comparisons_history" CASCADE;--> statement-breakpoint
DROP TABLE "clause_library_tags" CASCADE;--> statement-breakpoint
DROP TABLE "shared_clause_library" CASCADE;--> statement-breakpoint
DROP TABLE "bargaining_proposals" CASCADE;--> statement-breakpoint
DROP TABLE "bargaining_team_members" CASCADE;--> statement-breakpoint
DROP TABLE "negotiation_sessions" CASCADE;--> statement-breakpoint
DROP TABLE "negotiations" CASCADE;--> statement-breakpoint
DROP TABLE "tentative_agreements" CASCADE;--> statement-breakpoint
DROP TABLE "dues_transactions" CASCADE;--> statement-breakpoint
DROP TABLE "autopay_settings" CASCADE;--> statement-breakpoint
DROP TABLE "bank_reconciliation" CASCADE;--> statement-breakpoint
DROP TABLE "payment_cycles" CASCADE;--> statement-breakpoint
DROP TABLE "payment_disputes" CASCADE;--> statement-breakpoint
DROP TABLE "payment_methods" CASCADE;--> statement-breakpoint
DROP TABLE "payments" CASCADE;--> statement-breakpoint
DROP TABLE "stripe_webhook_events" CASCADE;--> statement-breakpoint
DROP TABLE "chart_of_accounts" CASCADE;--> statement-breakpoint
DROP TABLE "cost_centers" CASCADE;--> statement-breakpoint
DROP TABLE "gl_account_mappings" CASCADE;--> statement-breakpoint
DROP TABLE "gl_transaction_log" CASCADE;--> statement-breakpoint
DROP TABLE "gl_trial_balance" CASCADE;--> statement-breakpoint
DROP TABLE "rl1_tax_slips" CASCADE;--> statement-breakpoint
DROP TABLE "strike_fund_disbursements" CASCADE;--> statement-breakpoint
DROP TABLE "t4a_tax_slips" CASCADE;--> statement-breakpoint
DROP TABLE "tax_year_end_processing" CASCADE;--> statement-breakpoint
DROP TABLE "weekly_threshold_tracking" CASCADE;--> statement-breakpoint
DROP TABLE "bank_of_canada_rates" CASCADE;--> statement-breakpoint
DROP TABLE "cross_border_transactions" CASCADE;--> statement-breakpoint
DROP TABLE "currency_enforcement_audit" CASCADE;--> statement-breakpoint
DROP TABLE "currency_enforcement_policy" CASCADE;--> statement-breakpoint
DROP TABLE "currency_enforcement_violations" CASCADE;--> statement-breakpoint
DROP TABLE "exchange_rates" CASCADE;--> statement-breakpoint
DROP TABLE "fx_rate_audit_log" CASCADE;--> statement-breakpoint
DROP TABLE "t106_filing_tracking" CASCADE;--> statement-breakpoint
DROP TABLE "transaction_currency_conversions" CASCADE;--> statement-breakpoint
DROP TABLE "transfer_pricing_documentation" CASCADE;--> statement-breakpoint
DROP TABLE "council_elections" CASCADE;--> statement-breakpoint
DROP TABLE "golden_shares" CASCADE;--> statement-breakpoint
DROP TABLE "governance_events" CASCADE;--> statement-breakpoint
DROP TABLE "mission_audits" CASCADE;--> statement-breakpoint
DROP TABLE "reserved_matter_votes" CASCADE;--> statement-breakpoint
DROP TABLE "arms_length_verification" CASCADE;--> statement-breakpoint
DROP TABLE "blind_trust_registry" CASCADE;--> statement-breakpoint
DROP TABLE "conflict_audit_log" CASCADE;--> statement-breakpoint
DROP TABLE "conflict_disclosures" CASCADE;--> statement-breakpoint
DROP TABLE "conflict_of_interest_policy" CASCADE;--> statement-breakpoint
DROP TABLE "conflict_review_committee" CASCADE;--> statement-breakpoint
DROP TABLE "conflict_training" CASCADE;--> statement-breakpoint
DROP TABLE "recusal_tracking" CASCADE;--> statement-breakpoint
DROP TABLE "voter_eligibility" CASCADE;--> statement-breakpoint
DROP TABLE "votes" CASCADE;--> statement-breakpoint
DROP TABLE "voting_audit_log" CASCADE;--> statement-breakpoint
DROP TABLE "voting_notifications" CASCADE;--> statement-breakpoint
DROP TABLE "voting_options" CASCADE;--> statement-breakpoint
DROP TABLE "voting_sessions" CASCADE;--> statement-breakpoint
DROP TABLE "message_notifications" CASCADE;--> statement-breakpoint
DROP TABLE "message_participants" CASCADE;--> statement-breakpoint
DROP TABLE "message_read_receipts" CASCADE;--> statement-breakpoint
DROP TABLE "message_threads" CASCADE;--> statement-breakpoint
DROP TABLE "messages" CASCADE;--> statement-breakpoint
DROP TABLE "in_app_notifications" CASCADE;--> statement-breakpoint
DROP TABLE "notification_bounces" CASCADE;--> statement-breakpoint
DROP TABLE "notification_delivery_log" CASCADE;--> statement-breakpoint
DROP TABLE "notification_history" CASCADE;--> statement-breakpoint
DROP TABLE "notification_queue" CASCADE;--> statement-breakpoint
DROP TABLE "notification_templates" CASCADE;--> statement-breakpoint
DROP TABLE "notification_tracking" CASCADE;--> statement-breakpoint
DROP TABLE "notifications" CASCADE;--> statement-breakpoint
DROP TABLE "user_notification_preferences" CASCADE;--> statement-breakpoint
DROP TABLE "newsletter_campaigns" CASCADE;--> statement-breakpoint
DROP TABLE "newsletter_distribution_lists" CASCADE;--> statement-breakpoint
DROP TABLE "newsletter_engagement" CASCADE;--> statement-breakpoint
DROP TABLE "newsletter_list_subscribers" CASCADE;--> statement-breakpoint
DROP TABLE "newsletter_recipients" CASCADE;--> statement-breakpoint
DROP TABLE "newsletter_templates" CASCADE;--> statement-breakpoint
DROP TABLE "sms_campaign_recipients" CASCADE;--> statement-breakpoint
DROP TABLE "sms_campaigns" CASCADE;--> statement-breakpoint
DROP TABLE "sms_conversations" CASCADE;--> statement-breakpoint
DROP TABLE "sms_messages" CASCADE;--> statement-breakpoint
DROP TABLE "sms_opt_outs" CASCADE;--> statement-breakpoint
DROP TABLE "sms_rate_limits" CASCADE;--> statement-breakpoint
DROP TABLE "sms_templates" CASCADE;--> statement-breakpoint
DROP TABLE "poll_votes" CASCADE;--> statement-breakpoint
DROP TABLE "polls" CASCADE;--> statement-breakpoint
DROP TABLE "survey_answers" CASCADE;--> statement-breakpoint
DROP TABLE "survey_questions" CASCADE;--> statement-breakpoint
DROP TABLE "survey_responses" CASCADE;--> statement-breakpoint
DROP TABLE "surveys" CASCADE;--> statement-breakpoint
DROP TABLE "analytics_metrics" CASCADE;--> statement-breakpoint
DROP TABLE "comparative_analyses" CASCADE;--> statement-breakpoint
DROP TABLE "insight_recommendations" CASCADE;--> statement-breakpoint
DROP TABLE "kpi_configurations" CASCADE;--> statement-breakpoint
DROP TABLE "ml_predictions" CASCADE;--> statement-breakpoint
DROP TABLE "trend_analyses" CASCADE;--> statement-breakpoint
DROP TABLE "push_deliveries" CASCADE;--> statement-breakpoint
DROP TABLE "push_devices" CASCADE;--> statement-breakpoint
DROP TABLE "push_notification_templates" CASCADE;--> statement-breakpoint
DROP TABLE "push_notifications" CASCADE;--> statement-breakpoint
DROP TABLE "document_folders" CASCADE;--> statement-breakpoint
DROP TABLE "documents" CASCADE;--> statement-breakpoint
DROP TABLE "member_documents" CASCADE;--> statement-breakpoint
DROP TABLE "document_signers" CASCADE;--> statement-breakpoint
DROP TABLE "signature_audit_trail" CASCADE;--> statement-breakpoint
DROP TABLE "signature_documents" CASCADE;--> statement-breakpoint
DROP TABLE "signature_templates" CASCADE;--> statement-breakpoint
DROP TABLE "signature_webhooks_log" CASCADE;--> statement-breakpoint
DROP TABLE "signature_audit_log" CASCADE;--> statement-breakpoint
DROP TABLE "signature_verification" CASCADE;--> statement-breakpoint
DROP TABLE "signature_workflows" CASCADE;--> statement-breakpoint
DROP TABLE "signers" CASCADE;--> statement-breakpoint
DROP TABLE "calendar_events" CASCADE;--> statement-breakpoint
DROP TABLE "calendar_sharing" CASCADE;--> statement-breakpoint
DROP TABLE "calendars" CASCADE;--> statement-breakpoint
DROP TABLE "event_attendees" CASCADE;--> statement-breakpoint
DROP TABLE "event_reminders" CASCADE;--> statement-breakpoint
DROP TABLE "external_calendar_connections" CASCADE;--> statement-breakpoint
DROP TABLE "meeting_rooms" CASCADE;--> statement-breakpoint
DROP TABLE "room_bookings" CASCADE;--> statement-breakpoint
DROP TABLE "course_registrations" CASCADE;--> statement-breakpoint
DROP TABLE "course_sessions" CASCADE;--> statement-breakpoint
DROP TABLE "member_certifications" CASCADE;--> statement-breakpoint
DROP TABLE "program_enrollments" CASCADE;--> statement-breakpoint
DROP TABLE "training_courses" CASCADE;--> statement-breakpoint
DROP TABLE "training_programs" CASCADE;--> statement-breakpoint
DROP TABLE "data_subject_access_requests" CASCADE;--> statement-breakpoint
DROP TABLE "privacy_breaches" CASCADE;--> statement-breakpoint
DROP TABLE "provincial_consent" CASCADE;--> statement-breakpoint
DROP TABLE "provincial_data_handling" CASCADE;--> statement-breakpoint
DROP TABLE "provincial_privacy_config" CASCADE;--> statement-breakpoint
DROP TABLE "cookie_consents" CASCADE;--> statement-breakpoint
DROP TABLE "data_anonymization_log" CASCADE;--> statement-breakpoint
DROP TABLE "data_processing_records" CASCADE;--> statement-breakpoint
DROP TABLE "data_retention_policies" CASCADE;--> statement-breakpoint
DROP TABLE "gdpr_data_requests" CASCADE;--> statement-breakpoint
DROP TABLE "user_consents" CASCADE;--> statement-breakpoint
DROP TABLE "geofence_events" CASCADE;--> statement-breakpoint
DROP TABLE "geofences" CASCADE;--> statement-breakpoint
DROP TABLE "location_deletion_log" CASCADE;--> statement-breakpoint
DROP TABLE "location_tracking" CASCADE;--> statement-breakpoint
DROP TABLE "location_tracking_audit" CASCADE;--> statement-breakpoint
DROP TABLE "location_tracking_config" CASCADE;--> statement-breakpoint
DROP TABLE "member_location_consent" CASCADE;--> statement-breakpoint
DROP TABLE "band_council_consent" CASCADE;--> statement-breakpoint
DROP TABLE "band_councils" CASCADE;--> statement-breakpoint
DROP TABLE "indigenous_data_access_log" CASCADE;--> statement-breakpoint
DROP TABLE "indigenous_data_sharing_agreements" CASCADE;--> statement-breakpoint
DROP TABLE "indigenous_member_data" CASCADE;--> statement-breakpoint
DROP TABLE "traditional_knowledge_registry" CASCADE;--> statement-breakpoint
DROP TABLE "foreign_workers" CASCADE;--> statement-breakpoint
DROP TABLE "gss_applications" CASCADE;--> statement-breakpoint
DROP TABLE "lmbp_compliance_alerts" CASCADE;--> statement-breakpoint
DROP TABLE "lmbp_compliance_reports" CASCADE;--> statement-breakpoint
DROP TABLE "lmbp_letters" CASCADE;--> statement-breakpoint
DROP TABLE "mentorships" CASCADE;--> statement-breakpoint
DROP TABLE "break_glass_activations" CASCADE;--> statement-breakpoint
DROP TABLE "break_glass_system" CASCADE;--> statement-breakpoint
DROP TABLE "disaster_recovery_drills" CASCADE;--> statement-breakpoint
DROP TABLE "emergency_declarations" CASCADE;--> statement-breakpoint
DROP TABLE "key_holder_registry" CASCADE;--> statement-breakpoint
DROP TABLE "recovery_time_objectives" CASCADE;--> statement-breakpoint
DROP TABLE "swiss_cold_storage" CASCADE;--> statement-breakpoint
DROP TABLE "access_justification_requests" CASCADE;--> statement-breakpoint
DROP TABLE "data_classification_policy" CASCADE;--> statement-breakpoint
DROP TABLE "data_classification_registry" CASCADE;--> statement-breakpoint
DROP TABLE "employer_access_attempts" CASCADE;--> statement-breakpoint
DROP TABLE "firewall_access_rules" CASCADE;--> statement-breakpoint
DROP TABLE "firewall_compliance_audit" CASCADE;--> statement-breakpoint
DROP TABLE "firewall_violations" CASCADE;--> statement-breakpoint
DROP TABLE "union_only_data_tags" CASCADE;--> statement-breakpoint
DROP TABLE "account_balance_reconciliation" CASCADE;--> statement-breakpoint
DROP TABLE "payment_classification_policy" CASCADE;--> statement-breakpoint
DROP TABLE "payment_routing_rules" CASCADE;--> statement-breakpoint
DROP TABLE "separated_payment_transactions" CASCADE;--> statement-breakpoint
DROP TABLE "strike_fund_payment_audit" CASCADE;--> statement-breakpoint
DROP TABLE "stripe_connect_accounts" CASCADE;--> statement-breakpoint
DROP TABLE "whiplash_prevention_audit" CASCADE;--> statement-breakpoint
DROP TABLE "whiplash_violations" CASCADE;--> statement-breakpoint
DROP TABLE "certification_alerts" CASCADE;--> statement-breakpoint
DROP TABLE "certification_audit_log" CASCADE;--> statement-breakpoint
DROP TABLE "certification_compliance_reports" CASCADE;--> statement-breakpoint
DROP TABLE "certification_types" CASCADE;--> statement-breakpoint
DROP TABLE "continuing_education" CASCADE;--> statement-breakpoint
DROP TABLE "license_renewals" CASCADE;--> statement-breakpoint
DROP TABLE "staff_certifications" CASCADE;--> statement-breakpoint
DROP TABLE "contribution_rates" CASCADE;--> statement-breakpoint
DROP TABLE "cost_of_living_data" CASCADE;--> statement-breakpoint
DROP TABLE "external_data_sync_log" CASCADE;--> statement-breakpoint
DROP TABLE "union_density" CASCADE;--> statement-breakpoint
DROP TABLE "wage_benchmarks" CASCADE;--> statement-breakpoint
DROP TABLE "lrb_agreements" CASCADE;--> statement-breakpoint
DROP TABLE "lrb_employers" CASCADE;--> statement-breakpoint
DROP TABLE "lrb_sync_log" CASCADE;--> statement-breakpoint
DROP TABLE "lrb_unions" CASCADE;--> statement-breakpoint
DROP TABLE "arbitration_precedents" CASCADE;--> statement-breakpoint
DROP TABLE "precedent_citations" CASCADE;--> statement-breakpoint
DROP TABLE "precedent_tags" CASCADE;--> statement-breakpoint
DROP TABLE "congress_memberships" CASCADE;--> statement-breakpoint
DROP TABLE "external_departments" CASCADE;--> statement-breakpoint
DROP TABLE "external_employees" CASCADE;--> statement-breakpoint
DROP TABLE "external_positions" CASCADE;--> statement-breakpoint
DROP TABLE "external_accounts" CASCADE;--> statement-breakpoint
DROP TABLE "external_customers" CASCADE;--> statement-breakpoint
DROP TABLE "external_invoices" CASCADE;--> statement-breakpoint
DROP TABLE "external_payments" CASCADE;--> statement-breakpoint
DROP TABLE "external_benefit_coverage" CASCADE;--> statement-breakpoint
DROP TABLE "external_benefit_dependents" CASCADE;--> statement-breakpoint
DROP TABLE "external_benefit_enrollments" CASCADE;--> statement-breakpoint
DROP TABLE "external_benefit_plans" CASCADE;--> statement-breakpoint
DROP TABLE "external_benefit_utilization" CASCADE;--> statement-breakpoint
DROP TABLE "external_insurance_beneficiaries" CASCADE;--> statement-breakpoint
DROP TABLE "external_insurance_claims" CASCADE;--> statement-breakpoint
DROP TABLE "external_insurance_policies" CASCADE;--> statement-breakpoint
DROP TABLE "external_communication_channels" CASCADE;--> statement-breakpoint
DROP TABLE "external_communication_files" CASCADE;--> statement-breakpoint
DROP TABLE "external_communication_messages" CASCADE;--> statement-breakpoint
DROP TABLE "external_communication_users" CASCADE;--> statement-breakpoint
DROP TABLE "external_lms_completions" CASCADE;--> statement-breakpoint
DROP TABLE "external_lms_courses" CASCADE;--> statement-breakpoint
DROP TABLE "external_lms_enrollments" CASCADE;--> statement-breakpoint
DROP TABLE "external_lms_learners" CASCADE;--> statement-breakpoint
DROP TABLE "external_lms_progress" CASCADE;--> statement-breakpoint
DROP TABLE "external_document_files" CASCADE;--> statement-breakpoint
DROP TABLE "external_document_libraries" CASCADE;--> statement-breakpoint
DROP TABLE "external_document_permissions" CASCADE;--> statement-breakpoint
DROP TABLE "external_document_sites" CASCADE;--> statement-breakpoint
DROP TABLE "model_metadata" CASCADE;--> statement-breakpoint
DROP TABLE "ai_safety_filters" CASCADE;--> statement-breakpoint
DROP TABLE "chat_messages" CASCADE;--> statement-breakpoint
DROP TABLE "chat_sessions" CASCADE;--> statement-breakpoint
DROP TABLE "chatbot_analytics" CASCADE;--> statement-breakpoint
DROP TABLE "chatbot_suggestions" CASCADE;--> statement-breakpoint
DROP TABLE "knowledge_base" CASCADE;--> statement-breakpoint
DROP TABLE "analytics_scheduled_reports" CASCADE;--> statement-breakpoint
DROP TABLE "benchmark_categories" CASCADE;--> statement-breakpoint
DROP TABLE "benchmark_data" CASCADE;--> statement-breakpoint
DROP TABLE "organization_benchmark_snapshots" CASCADE;--> statement-breakpoint
DROP TABLE "report_delivery_history" CASCADE;--> statement-breakpoint
DROP TABLE "report_executions" CASCADE;--> statement-breakpoint
DROP TABLE "report_shares" CASCADE;--> statement-breakpoint
DROP TABLE "report_templates" CASCADE;--> statement-breakpoint
DROP TABLE "reports" CASCADE;--> statement-breakpoint
DROP TABLE "scheduled_reports" CASCADE;--> statement-breakpoint
DROP TABLE "automation_rules" CASCADE;--> statement-breakpoint
DROP TABLE "clc_sync_log" CASCADE;--> statement-breakpoint
DROP TABLE "clc_webhook_log" CASCADE;--> statement-breakpoint
DROP TABLE "reward_wallet_ledger" CASCADE;--> statement-breakpoint
DROP TABLE "audit_security"."audit_logs" CASCADE;--> statement-breakpoint
DROP TABLE "audit_security"."failed_login_attempts" CASCADE;--> statement-breakpoint
DROP TABLE "audit_security"."rate_limit_events" CASCADE;--> statement-breakpoint
DROP TABLE "audit_security"."security_events" CASCADE;--> statement-breakpoint
DROP TABLE "feature_flags" CASCADE;--> statement-breakpoint
DROP TABLE "user_uuid_mapping" CASCADE;--> statement-breakpoint
DROP TABLE "alert_actions" CASCADE;--> statement-breakpoint
DROP TABLE "alert_conditions" CASCADE;--> statement-breakpoint
DROP TABLE "alert_escalations" CASCADE;--> statement-breakpoint
DROP TABLE "alert_executions" CASCADE;--> statement-breakpoint
DROP TABLE "alert_recipients" CASCADE;--> statement-breakpoint
DROP TABLE "alert_rules" CASCADE;--> statement-breakpoint
DROP TABLE "workflow_definitions" CASCADE;--> statement-breakpoint
DROP TABLE "workflow_executions" CASCADE;--> statement-breakpoint
DROP TABLE "automation_execution_log" CASCADE;--> statement-breakpoint
DROP TABLE "automation_schedules" CASCADE;--> statement-breakpoint
DROP TABLE "recognition_award_types" CASCADE;--> statement-breakpoint
DROP TABLE "recognition_awards" CASCADE;--> statement-breakpoint
DROP TABLE "recognition_programs" CASCADE;--> statement-breakpoint
DROP TABLE "reward_budget_envelopes" CASCADE;--> statement-breakpoint
DROP TABLE "reward_redemptions" CASCADE;--> statement-breakpoint
DROP TABLE "shopify_config" CASCADE;--> statement-breakpoint
DROP TABLE "webhook_receipts" CASCADE;--> statement-breakpoint
DROP TABLE "award_history" CASCADE;--> statement-breakpoint
DROP TABLE "award_templates" CASCADE;--> statement-breakpoint
DROP TABLE "budget_pool" CASCADE;--> statement-breakpoint
DROP TABLE "budget_reservations" CASCADE;--> statement-breakpoint
DROP TABLE "card_signing_events" CASCADE;--> statement-breakpoint
DROP TABLE "employer_responses" CASCADE;--> statement-breakpoint
DROP TABLE "field_organizer_activities" CASCADE;--> statement-breakpoint
DROP TABLE "nlrb_clrb_filings" CASCADE;--> statement-breakpoint
DROP TABLE "organizing_campaign_milestones" CASCADE;--> statement-breakpoint
DROP TABLE "organizing_campaigns" CASCADE;--> statement-breakpoint
DROP TABLE "organizing_contacts" CASCADE;--> statement-breakpoint
DROP TABLE "union_representation_votes" CASCADE;--> statement-breakpoint
DROP TABLE "cross_org_access_log" CASCADE;--> statement-breakpoint
DROP TABLE "organization_sharing_grants" CASCADE;--> statement-breakpoint
DROP TABLE "organization_sharing_settings" CASCADE;--> statement-breakpoint
DROP TABLE "cms_blocks" CASCADE;--> statement-breakpoint
DROP TABLE "cms_media_library" CASCADE;--> statement-breakpoint
DROP TABLE "cms_navigation_menus" CASCADE;--> statement-breakpoint
DROP TABLE "cms_pages" CASCADE;--> statement-breakpoint
DROP TABLE "cms_templates" CASCADE;--> statement-breakpoint
DROP TABLE "donation_campaigns" CASCADE;--> statement-breakpoint
DROP TABLE "donation_receipts" CASCADE;--> statement-breakpoint
DROP TABLE "donations" CASCADE;--> statement-breakpoint
DROP TABLE "event_check_ins" CASCADE;--> statement-breakpoint
DROP TABLE "event_registrations" CASCADE;--> statement-breakpoint
DROP TABLE "job_applications" CASCADE;--> statement-breakpoint
DROP TABLE "job_postings" CASCADE;--> statement-breakpoint
DROP TABLE "job_saved" CASCADE;--> statement-breakpoint
DROP TABLE "page_analytics" CASCADE;--> statement-breakpoint
DROP TABLE "public_events" CASCADE;--> statement-breakpoint
DROP TABLE "website_settings" CASCADE;--> statement-breakpoint
DROP TABLE "bank_accounts" CASCADE;--> statement-breakpoint
DROP TABLE "bank_reconciliations" CASCADE;--> statement-breakpoint
DROP TABLE "bank_transactions" CASCADE;--> statement-breakpoint
DROP TABLE "currency_exchange_rates" CASCADE;--> statement-breakpoint
DROP TABLE "erp_connectors" CASCADE;--> statement-breakpoint
DROP TABLE "erp_invoices" CASCADE;--> statement-breakpoint
DROP TABLE "financial_audit_log" CASCADE;--> statement-breakpoint
DROP TABLE "journal_entries" CASCADE;--> statement-breakpoint
DROP TABLE "journal_entry_lines" CASCADE;--> statement-breakpoint
DROP TABLE "sync_jobs" CASCADE;--> statement-breakpoint
DROP TABLE "clc_bargaining_trends" CASCADE;--> statement-breakpoint
DROP TABLE "clc_oauth_tokens" CASCADE;--> statement-breakpoint
DROP TABLE "clc_per_capita_benchmarks" CASCADE;--> statement-breakpoint
DROP TABLE "clc_union_density" CASCADE;--> statement-breakpoint
DROP TABLE "clc_api_config" CASCADE;--> statement-breakpoint
DROP TABLE "clc_remittance_mapping" CASCADE;--> statement-breakpoint
DROP TABLE "clc_chart_of_accounts" CASCADE;--> statement-breakpoint
DROP TABLE "notification_log" CASCADE;--> statement-breakpoint
DROP TABLE "organization_contacts" CASCADE;--> statement-breakpoint
DROP TABLE "per_capita_remittances" CASCADE;--> statement-breakpoint
DROP TABLE "remittance_approvals" CASCADE;--> statement-breakpoint
DROP TABLE "clc_organization_sync_log" CASCADE;--> statement-breakpoint
DROP TABLE "address_change_history" CASCADE;--> statement-breakpoint
DROP TABLE "address_validation_cache" CASCADE;--> statement-breakpoint
DROP TABLE "country_address_formats" CASCADE;--> statement-breakpoint
DROP TABLE "international_addresses" CASCADE;--> statement-breakpoint
DROP TABLE "social_accounts" CASCADE;--> statement-breakpoint
DROP TABLE "social_analytics" CASCADE;--> statement-breakpoint
DROP TABLE "social_campaigns" CASCADE;--> statement-breakpoint
DROP TABLE "social_engagement" CASCADE;--> statement-breakpoint
DROP TABLE "social_feeds" CASCADE;--> statement-breakpoint
DROP TABLE "social_posts" CASCADE;--> statement-breakpoint
DROP TABLE "cpi_adjusted_pricing" CASCADE;--> statement-breakpoint
DROP TABLE "cpi_data" CASCADE;--> statement-breakpoint
DROP TABLE "fmv_audit_log" CASCADE;--> statement-breakpoint
DROP TABLE "fmv_benchmarks" CASCADE;--> statement-breakpoint
DROP TABLE "fmv_policy" CASCADE;--> statement-breakpoint
DROP TABLE "fmv_violations" CASCADE;--> statement-breakpoint
DROP TABLE "independent_appraisals" CASCADE;--> statement-breakpoint
DROP TABLE "procurement_bids" CASCADE;--> statement-breakpoint
DROP TABLE "procurement_requests" CASCADE;--> statement-breakpoint
DROP TABLE "defensibility_packs" CASCADE;--> statement-breakpoint
DROP TABLE "pack_download_log" CASCADE;--> statement-breakpoint
DROP TABLE "pack_verification_log" CASCADE;--> statement-breakpoint
DROP TABLE "accessibility_audits" CASCADE;--> statement-breakpoint
DROP TABLE "accessibility_issues" CASCADE;--> statement-breakpoint
DROP TABLE "accessibility_test_suites" CASCADE;--> statement-breakpoint
DROP TABLE "accessibility_user_testing" CASCADE;--> statement-breakpoint
DROP TABLE "wcag_success_criteria" CASCADE;--> statement-breakpoint
DROP TABLE "knowledge_base_articles" CASCADE;--> statement-breakpoint
DROP TABLE "sla_policies" CASCADE;--> statement-breakpoint
DROP TABLE "support_tickets" CASCADE;--> statement-breakpoint
DROP TABLE "ticket_comments" CASCADE;--> statement-breakpoint
DROP TABLE "ticket_history" CASCADE;--> statement-breakpoint
DROP TABLE "integration_configs" CASCADE;--> statement-breakpoint
DROP TABLE "integration_sync_log" CASCADE;--> statement-breakpoint
DROP TABLE "integration_sync_schedules" CASCADE;--> statement-breakpoint
DROP TABLE "webhook_events" CASCADE;--> statement-breakpoint
ALTER TABLE "bargaining_units" ADD CONSTRAINT "bargaining_units_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bargaining_units" ADD CONSTRAINT "bargaining_units_employer_id_employers_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bargaining_units" ADD CONSTRAINT "bargaining_units_worksite_id_worksites_id_fk" FOREIGN KEY ("worksite_id") REFERENCES "public"."worksites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bargaining_units" ADD CONSTRAINT "bargaining_units_chief_steward_id_profiles_user_id_fk" FOREIGN KEY ("chief_steward_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bargaining_units" ADD CONSTRAINT "bargaining_units_bargaining_chair_id_profiles_user_id_fk" FOREIGN KEY ("bargaining_chair_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bargaining_units" ADD CONSTRAINT "bargaining_units_created_by_profiles_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bargaining_units" ADD CONSTRAINT "bargaining_units_updated_by_profiles_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committee_memberships" ADD CONSTRAINT "committee_memberships_committee_id_committees_id_fk" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committee_memberships" ADD CONSTRAINT "committee_memberships_member_id_profiles_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committee_memberships" ADD CONSTRAINT "committee_memberships_appointed_by_profiles_user_id_fk" FOREIGN KEY ("appointed_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committee_memberships" ADD CONSTRAINT "committee_memberships_created_by_profiles_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committee_memberships" ADD CONSTRAINT "committee_memberships_updated_by_profiles_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committees" ADD CONSTRAINT "committees_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committees" ADD CONSTRAINT "committees_unit_id_bargaining_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."bargaining_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committees" ADD CONSTRAINT "committees_worksite_id_worksites_id_fk" FOREIGN KEY ("worksite_id") REFERENCES "public"."worksites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committees" ADD CONSTRAINT "committees_chair_id_profiles_user_id_fk" FOREIGN KEY ("chair_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committees" ADD CONSTRAINT "committees_secretary_id_profiles_user_id_fk" FOREIGN KEY ("secretary_id") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committees" ADD CONSTRAINT "committees_created_by_profiles_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committees" ADD CONSTRAINT "committees_updated_by_profiles_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employers" ADD CONSTRAINT "employers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employers" ADD CONSTRAINT "employers_parent_company_id_employers_id_fk" FOREIGN KEY ("parent_company_id") REFERENCES "public"."employers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employers" ADD CONSTRAINT "employers_created_by_profiles_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employers" ADD CONSTRAINT "employers_updated_by_profiles_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_tenure_history" ADD CONSTRAINT "role_tenure_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_tenure_history" ADD CONSTRAINT "role_tenure_history_member_id_profiles_user_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_tenure_history" ADD CONSTRAINT "role_tenure_history_ended_by_profiles_user_id_fk" FOREIGN KEY ("ended_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_tenure_history" ADD CONSTRAINT "role_tenure_history_created_by_profiles_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_tenure_history" ADD CONSTRAINT "role_tenure_history_updated_by_profiles_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steward_assignments" ADD CONSTRAINT "steward_assignments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steward_assignments" ADD CONSTRAINT "steward_assignments_steward_id_profiles_user_id_fk" FOREIGN KEY ("steward_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steward_assignments" ADD CONSTRAINT "steward_assignments_unit_id_bargaining_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."bargaining_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steward_assignments" ADD CONSTRAINT "steward_assignments_worksite_id_worksites_id_fk" FOREIGN KEY ("worksite_id") REFERENCES "public"."worksites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steward_assignments" ADD CONSTRAINT "steward_assignments_appointed_by_profiles_user_id_fk" FOREIGN KEY ("appointed_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steward_assignments" ADD CONSTRAINT "steward_assignments_created_by_profiles_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steward_assignments" ADD CONSTRAINT "steward_assignments_updated_by_profiles_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksites" ADD CONSTRAINT "worksites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksites" ADD CONSTRAINT "worksites_employer_id_employers_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksites" ADD CONSTRAINT "worksites_created_by_profiles_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksites" ADD CONSTRAINT "worksites_updated_by_profiles_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bargaining_units_organization" ON "bargaining_units" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_bargaining_units_employer" ON "bargaining_units" USING btree ("employer_id");--> statement-breakpoint
CREATE INDEX "idx_bargaining_units_worksite" ON "bargaining_units" USING btree ("worksite_id");--> statement-breakpoint
CREATE INDEX "idx_bargaining_units_status" ON "bargaining_units" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bargaining_units_unit_number" ON "bargaining_units" USING btree ("unit_number");--> statement-breakpoint
CREATE INDEX "idx_bargaining_units_contract_expiry" ON "bargaining_units" USING btree ("contract_expiry_date");--> statement-breakpoint
CREATE INDEX "idx_committee_memberships_committee" ON "committee_memberships" USING btree ("committee_id");--> statement-breakpoint
CREATE INDEX "idx_committee_memberships_member" ON "committee_memberships" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_committee_memberships_status" ON "committee_memberships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_committee_memberships_role" ON "committee_memberships" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_committee_memberships_tenure" ON "committee_memberships" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_committee_memberships_unique" ON "committee_memberships" USING btree ("committee_id","member_id","start_date");--> statement-breakpoint
CREATE INDEX "idx_committees_organization" ON "committees" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_committees_type" ON "committees" USING btree ("committee_type");--> statement-breakpoint
CREATE INDEX "idx_committees_status" ON "committees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_committees_unit" ON "committees" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "idx_committees_worksite" ON "committees" USING btree ("worksite_id");--> statement-breakpoint
CREATE INDEX "idx_committees_chair" ON "committees" USING btree ("chair_id");--> statement-breakpoint
CREATE INDEX "idx_employers_organization" ON "employers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_employers_status" ON "employers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_employers_name" ON "employers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_employers_parent_company" ON "employers" USING btree ("parent_company_id");--> statement-breakpoint
CREATE INDEX "idx_role_tenure_organization" ON "role_tenure_history" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_role_tenure_member" ON "role_tenure_history" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_role_tenure_role_type" ON "role_tenure_history" USING btree ("role_type");--> statement-breakpoint
CREATE INDEX "idx_role_tenure_current" ON "role_tenure_history" USING btree ("is_current_role");--> statement-breakpoint
CREATE INDEX "idx_role_tenure_dates" ON "role_tenure_history" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_role_tenure_entity" ON "role_tenure_history" USING btree ("related_entity_type","related_entity_id");--> statement-breakpoint
CREATE INDEX "idx_steward_assignments_organization" ON "steward_assignments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_steward_assignments_steward" ON "steward_assignments" USING btree ("steward_id");--> statement-breakpoint
CREATE INDEX "idx_steward_assignments_unit" ON "steward_assignments" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "idx_steward_assignments_worksite" ON "steward_assignments" USING btree ("worksite_id");--> statement-breakpoint
CREATE INDEX "idx_steward_assignments_status" ON "steward_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_steward_assignments_type" ON "steward_assignments" USING btree ("steward_type");--> statement-breakpoint
CREATE INDEX "idx_steward_assignments_tenure" ON "steward_assignments" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_worksites_organization" ON "worksites" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_worksites_employer" ON "worksites" USING btree ("employer_id");--> statement-breakpoint
CREATE INDEX "idx_worksites_status" ON "worksites" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_worksites_code" ON "worksites" USING btree ("code");--> statement-breakpoint
DROP TYPE "public"."claim_priority";--> statement-breakpoint
DROP TYPE "public"."claim_status";--> statement-breakpoint
DROP TYPE "public"."claim_type";--> statement-breakpoint
DROP TYPE "public"."visibility_scope";--> statement-breakpoint
DROP TYPE "public"."arbitration_status";--> statement-breakpoint
DROP TYPE "public"."grievance_priority";--> statement-breakpoint
DROP TYPE "public"."grievance_status";--> statement-breakpoint
DROP TYPE "public"."grievance_step";--> statement-breakpoint
DROP TYPE "public"."grievance_type";--> statement-breakpoint
DROP TYPE "public"."settlement_type";--> statement-breakpoint
DROP TYPE "public"."alert_severity";--> statement-breakpoint
DROP TYPE "public"."deadline_priority";--> statement-breakpoint
DROP TYPE "public"."deadline_status";--> statement-breakpoint
DROP TYPE "public"."delivery_method";--> statement-breakpoint
DROP TYPE "public"."delivery_status";--> statement-breakpoint
DROP TYPE "public"."extension_status";--> statement-breakpoint
DROP TYPE "public"."assignment_role";--> statement-breakpoint
DROP TYPE "public"."assignment_status";--> statement-breakpoint
DROP TYPE "public"."document_version_status";--> statement-breakpoint
DROP TYPE "public"."grievance_stage_type";--> statement-breakpoint
DROP TYPE "public"."grievance_workflow_status";--> statement-breakpoint
DROP TYPE "public"."settlement_status";--> statement-breakpoint
DROP TYPE "public"."transition_trigger_type";--> statement-breakpoint
DROP TYPE "public"."cba_language";--> statement-breakpoint
DROP TYPE "public"."cba_status";--> statement-breakpoint
DROP TYPE "public"."cba_jurisdiction";--> statement-breakpoint
DROP TYPE "public"."clause_type";--> statement-breakpoint
DROP TYPE "public"."entity_type";--> statement-breakpoint
DROP TYPE "public"."decision_type";--> statement-breakpoint
DROP TYPE "public"."outcome";--> statement-breakpoint
DROP TYPE "public"."precedent_value";--> statement-breakpoint
DROP TYPE "public"."tribunal_type";--> statement-breakpoint
DROP TYPE "public"."negotiation_session_type";--> statement-breakpoint
DROP TYPE "public"."negotiation_status";--> statement-breakpoint
DROP TYPE "public"."proposal_status";--> statement-breakpoint
DROP TYPE "public"."proposal_type";--> statement-breakpoint
DROP TYPE "public"."bargaining_team_role";--> statement-breakpoint
DROP TYPE "public"."payment_processor";--> statement-breakpoint
DROP TYPE "public"."transaction_status";--> statement-breakpoint
DROP TYPE "public"."transaction_type";--> statement-breakpoint
DROP TYPE "public"."payment_method";--> statement-breakpoint
DROP TYPE "public"."payment_status";--> statement-breakpoint
DROP TYPE "public"."payment_type";--> statement-breakpoint
DROP TYPE "public"."reconciliation_status";--> statement-breakpoint
DROP TYPE "public"."account_status";--> statement-breakpoint
DROP TYPE "public"."account_type";--> statement-breakpoint
DROP TYPE "public"."cost_center_type";--> statement-breakpoint
DROP TYPE "public"."message_status";--> statement-breakpoint
DROP TYPE "public"."message_type";--> statement-breakpoint
DROP TYPE "public"."digest_frequency";--> statement-breakpoint
DROP TYPE "public"."notification_bounce_type";--> statement-breakpoint
DROP TYPE "public"."notification_channel";--> statement-breakpoint
DROP TYPE "public"."notification_priority";--> statement-breakpoint
DROP TYPE "public"."notification_queue_status";--> statement-breakpoint
DROP TYPE "public"."notification_schedule_status";--> statement-breakpoint
DROP TYPE "public"."notification_status";--> statement-breakpoint
DROP TYPE "public"."notification_template_status";--> statement-breakpoint
DROP TYPE "public"."notification_template_type";--> statement-breakpoint
DROP TYPE "public"."notification_type";--> statement-breakpoint
DROP TYPE "public"."newsletter_bounce_type";--> statement-breakpoint
DROP TYPE "public"."newsletter_campaign_status";--> statement-breakpoint
DROP TYPE "public"."newsletter_engagement_event";--> statement-breakpoint
DROP TYPE "public"."newsletter_list_type";--> statement-breakpoint
DROP TYPE "public"."newsletter_recipient_status";--> statement-breakpoint
DROP TYPE "public"."newsletter_subscriber_status";--> statement-breakpoint
DROP TYPE "public"."template_category";--> statement-breakpoint
DROP TYPE "public"."push_delivery_status";--> statement-breakpoint
DROP TYPE "public"."push_notification_status";--> statement-breakpoint
DROP TYPE "public"."push_platform";--> statement-breakpoint
DROP TYPE "public"."push_priority";--> statement-breakpoint
DROP TYPE "public"."signature_provider";--> statement-breakpoint
DROP TYPE "public"."signer_status";--> statement-breakpoint
DROP TYPE "public"."authentication_method";--> statement-breakpoint
DROP TYPE "public"."signature_document_status";--> statement-breakpoint
DROP TYPE "public"."signature_type";--> statement-breakpoint
DROP TYPE "public"."signature_workflow_status";--> statement-breakpoint
DROP TYPE "public"."attendee_status";--> statement-breakpoint
DROP TYPE "public"."calendar_permission";--> statement-breakpoint
DROP TYPE "public"."event_status";--> statement-breakpoint
DROP TYPE "public"."event_type";--> statement-breakpoint
DROP TYPE "public"."room_status";--> statement-breakpoint
DROP TYPE "public"."sync_status";--> statement-breakpoint
DROP TYPE "public"."consent_status";--> statement-breakpoint
DROP TYPE "public"."consent_type";--> statement-breakpoint
DROP TYPE "public"."gdpr_request_status";--> statement-breakpoint
DROP TYPE "public"."gdpr_request_type";--> statement-breakpoint
DROP TYPE "public"."processing_purpose";--> statement-breakpoint
DROP TYPE "public"."congress_membership_status";--> statement-breakpoint
DROP TYPE "public"."employment_status";--> statement-breakpoint
DROP TYPE "public"."external_hris_provider";--> statement-breakpoint
DROP TYPE "public"."ai_provider";--> statement-breakpoint
DROP TYPE "public"."chat_session_status";--> statement-breakpoint
DROP TYPE "public"."knowledge_document_type";--> statement-breakpoint
DROP TYPE "public"."message_role";--> statement-breakpoint
DROP TYPE "public"."report_category";--> statement-breakpoint
DROP TYPE "public"."report_format";--> statement-breakpoint
DROP TYPE "public"."report_type";--> statement-breakpoint
DROP TYPE "public"."schedule_frequency";--> statement-breakpoint
DROP TYPE "public"."alert_action_type";--> statement-breakpoint
DROP TYPE "public"."alert_condition_operator";--> statement-breakpoint
DROP TYPE "public"."alert_execution_status";--> statement-breakpoint
DROP TYPE "public"."alert_frequency";--> statement-breakpoint
DROP TYPE "public"."alert_trigger_type";--> statement-breakpoint
DROP TYPE "public"."escalation_status";--> statement-breakpoint
DROP TYPE "public"."workflow_action_type";--> statement-breakpoint
DROP TYPE "public"."workflow_execution_status";--> statement-breakpoint
DROP TYPE "public"."workflow_trigger_type";--> statement-breakpoint
DROP TYPE "public"."award_kind";--> statement-breakpoint
DROP TYPE "public"."budget_period";--> statement-breakpoint
DROP TYPE "public"."budget_scope_type";--> statement-breakpoint
DROP TYPE "public"."program_status";--> statement-breakpoint
DROP TYPE "public"."redemption_provider";--> statement-breakpoint
DROP TYPE "public"."redemption_status";--> statement-breakpoint
DROP TYPE "public"."wallet_event_type";--> statement-breakpoint
DROP TYPE "public"."wallet_source_type";--> statement-breakpoint
DROP TYPE "public"."webhook_provider";--> statement-breakpoint
DROP TYPE "public"."audit_action";--> statement-breakpoint
DROP TYPE "public"."erp_system";--> statement-breakpoint
DROP TYPE "public"."sync_direction";--> statement-breakpoint
DROP TYPE "public"."clc_sync_type";--> statement-breakpoint
DROP TYPE "public"."clc_webhook_status";--> statement-breakpoint
DROP TYPE "public"."address_status";--> statement-breakpoint
DROP TYPE "public"."address_type";--> statement-breakpoint
DROP TYPE "public"."engagement_type";--> statement-breakpoint
DROP TYPE "public"."social_account_status";--> statement-breakpoint
DROP TYPE "public"."social_platform";--> statement-breakpoint
DROP TYPE "public"."social_post_status";--> statement-breakpoint
DROP TYPE "public"."social_post_type";--> statement-breakpoint
DROP TYPE "public"."a11y_issue_severity";--> statement-breakpoint
DROP TYPE "public"."a11y_issue_status";--> statement-breakpoint
DROP TYPE "public"."audit_status";--> statement-breakpoint
DROP TYPE "public"."wcag_level";--> statement-breakpoint
DROP TYPE "public"."ticket_category";--> statement-breakpoint
DROP TYPE "public"."ticket_priority";--> statement-breakpoint
DROP TYPE "public"."ticket_source";--> statement-breakpoint
DROP TYPE "public"."ticket_status";--> statement-breakpoint
DROP TYPE "public"."integration_provider";--> statement-breakpoint
DROP TYPE "public"."integration_type";--> statement-breakpoint
DROP TYPE "public"."sync_type";--> statement-breakpoint
DROP TYPE "public"."webhook_status";--> statement-breakpoint
DROP SCHEMA "user_management";
--> statement-breakpoint
DROP SCHEMA "audit_security";
