-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
DO $$ BEGIN
 CREATE TYPE "public"."alert_severity" AS ENUM('info', 'warning', 'urgent', 'critical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."assignment_role" AS ENUM('primary_officer', 'secondary_officer', 'legal_counsel', 'external_arbitrator', 'management_rep', 'witness', 'observer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."assignment_status" AS ENUM('assigned', 'accepted', 'in_progress', 'completed', 'reassigned', 'declined');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."attendee_status" AS ENUM('invited', 'accepted', 'declined', 'tentative', 'no_response');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."bill_status" AS ENUM('introduced', 'first_reading', 'second_reading', 'committee_review', 'third_reading', 'passed_house', 'senate_review', 'royal_assent', 'enacted', 'defeated', 'withdrawn');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."ca_jurisdiction" AS ENUM('CA-FED', 'CA-ON', 'CA-QC', 'CA-BC', 'CA-AB', 'CA-SK', 'CA-MB', 'CA-NB', 'CA-NS', 'CA-PE', 'CA-NL', 'CA-YT', 'CA-NT', 'CA-NU', 'federal', 'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."calendar_permission" AS ENUM('owner', 'editor', 'viewer', 'none');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."cba_jurisdiction" AS ENUM('federal', 'ontario', 'bc', 'alberta', 'quebec', 'manitoba', 'saskatchewan', 'nova_scotia', 'new_brunswick', 'pei', 'newfoundland', 'northwest_territories', 'yukon', 'nunavut');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."cba_language" AS ENUM('en', 'fr', 'bilingual');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."cba_status" AS ENUM('active', 'expired', 'under_negotiation', 'ratified_pending', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."certification_application_status" AS ENUM('draft', 'filed', 'under_review', 'hearing_scheduled', 'vote_ordered', 'vote_completed', 'decision_pending', 'certified', 'dismissed', 'withdrawn');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."certification_method" AS ENUM('automatic', 'vote_required', 'mandatory_vote');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."certification_status" AS ENUM('active', 'expiring_soon', 'expired', 'revoked', 'suspended');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."claim_priority" AS ENUM('low', 'medium', 'high', 'critical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."claim_status" AS ENUM('submitted', 'under_review', 'assigned', 'investigation', 'pending_documentation', 'resolved', 'rejected', 'closed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."claim_type" AS ENUM('grievance_discipline', 'grievance_schedule', 'grievance_pay', 'workplace_safety', 'discrimination_age', 'discrimination_gender', 'discrimination_race', 'discrimination_disability', 'discrimination_other', 'harassment_sexual', 'harassment_workplace', 'wage_dispute', 'contract_dispute', 'retaliation', 'wrongful_termination', 'other', 'harassment_verbal', 'harassment_physical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."clause_type" AS ENUM('wages_compensation', 'benefits_insurance', 'working_conditions', 'grievance_arbitration', 'seniority_promotion', 'health_safety', 'union_rights', 'management_rights', 'duration_renewal', 'vacation_leave', 'hours_scheduling', 'disciplinary_procedures', 'training_development', 'pension_retirement', 'overtime', 'job_security', 'technological_change', 'workplace_rights', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."communication_channel" AS ENUM('email', 'sms', 'push', 'newsletter', 'in_app');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."contact_support_level" AS ENUM('strong_supporter', 'supporter', 'undecided', 'soft_opposition', 'strong_opposition', 'unknown');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."course_category" AS ENUM('steward_training', 'leadership_development', 'health_and_safety', 'collective_bargaining', 'grievance_handling', 'labor_law', 'political_action', 'organizing', 'equity_and_inclusion', 'financial_literacy', 'workplace_rights', 'public_speaking', 'conflict_resolution', 'meeting_facilitation', 'member_engagement', 'general');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."course_delivery_method" AS ENUM('in_person', 'virtual_live', 'self_paced_online', 'hybrid', 'webinar', 'workshop', 'conference_session');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."course_difficulty" AS ENUM('beginner', 'intermediate', 'advanced', 'all_levels');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."deadline_priority" AS ENUM('low', 'medium', 'high', 'critical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."deadline_status" AS ENUM('pending', 'completed', 'missed', 'extended', 'waived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."decision_type" AS ENUM('grievance', 'unfair_practice', 'certification', 'judicial_review', 'interpretation', 'scope_bargaining', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."delivery_method" AS ENUM('email', 'sms', 'push', 'in_app');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."delivery_status" AS ENUM('pending', 'sent', 'delivered', 'failed', 'bounced');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."digest_frequency" AS ENUM('immediate', 'daily', 'weekly', 'never');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."document_version_status" AS ENUM('draft', 'pending_review', 'approved', 'rejected', 'superseded');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."entity_type" AS ENUM('monetary_amount', 'percentage', 'date', 'time_period', 'job_position', 'location', 'person', 'organization', 'legal_reference', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."equity_group_type" AS ENUM('women', 'visible_minority', 'indigenous', 'persons_with_disabilities', 'lgbtq2plus', 'newcomer', 'youth', 'prefer_not_to_say');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."essential_service_designation" AS ENUM('prohibited', 'restricted', 'minimum_service');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."event_status" AS ENUM('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."event_type" AS ENUM('meeting', 'appointment', 'deadline', 'reminder', 'task', 'hearing', 'mediation', 'negotiation', 'training', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."extension_status" AS ENUM('pending', 'approved', 'denied', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."gender_identity_type" AS ENUM('man', 'woman', 'non_binary', 'two_spirit', 'gender_fluid', 'agender', 'other', 'prefer_not_to_say');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."government_level" AS ENUM('federal', 'provincial_territorial', 'municipal', 'school_board', 'regional');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."grievance_stage_type" AS ENUM('filed', 'intake', 'investigation', 'step_1', 'step_2', 'step_3', 'mediation', 'pre_arbitration', 'arbitration', 'resolved', 'withdrawn', 'denied', 'settled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."grievance_step_type" AS ENUM('informal', 'formal_written', 'mediation', 'arbitration');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."grievance_workflow_status" AS ENUM('active', 'draft', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."hw_claim_status" AS ENUM('submitted', 'received', 'pending_review', 'under_investigation', 'approved', 'partially_approved', 'denied', 'paid', 'appealed', 'appeal_denied', 'appeal_approved');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."hw_plan_type" AS ENUM('health_medical', 'dental', 'vision', 'prescription', 'disability_short_term', 'disability_long_term', 'life_insurance', 'accidental_death', 'critical_illness', 'employee_assistance');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."indigenous_identity_type" AS ENUM('first_nations_status', 'first_nations_non_status', 'inuit', 'metis', 'multiple_indigenous_identities', 'prefer_not_to_say');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."jurisdiction_rule_type" AS ENUM('certification', 'strike_vote', 'grievance_arbitration', 'essential_services', 'replacement_workers', 'collective_agreement', 'unfair_labour_practice', 'bargaining_rights', 'union_security', 'dues_checkoff');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."labour_sector" AS ENUM('healthcare', 'education', 'public_service', 'trades', 'manufacturing', 'transportation', 'retail', 'hospitality', 'technology', 'construction', 'utilities', 'telecommunications', 'financial_services', 'agriculture', 'arts_culture', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."member_role" AS ENUM('member', 'steward', 'officer', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."member_status" AS ENUM('active', 'inactive', 'on-leave');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."membership" AS ENUM('free', 'pro');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."message_status" AS ENUM('sent', 'delivered', 'read');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."message_type" AS ENUM('text', 'file', 'system');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."newsletter_bounce_type" AS ENUM('hard', 'soft', 'technical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."newsletter_campaign_status" AS ENUM('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."newsletter_engagement_event" AS ENUM('open', 'click', 'unsubscribe', 'spam_report');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."newsletter_list_type" AS ENUM('manual', 'dynamic', 'segment');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."newsletter_recipient_status" AS ENUM('pending', 'sent', 'delivered', 'bounced', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."newsletter_subscriber_status" AS ENUM('subscribed', 'unsubscribed', 'bounced');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_channel" AS ENUM('email', 'sms', 'push', 'in_app', 'in-app', 'multi');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_schedule_status" AS ENUM('scheduled', 'sent', 'cancelled', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed', 'partial');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_type" AS ENUM('payment_confirmation', 'payment_failed', 'payment_reminder', 'donation_received', 'stipend_approved', 'stipend_disbursed', 'low_balance_alert', 'arrears_warning', 'strike_announcement', 'picket_reminder');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."organization_relationship_type" AS ENUM('affiliate', 'federation', 'local', 'chapter', 'region', 'district', 'joint_council', 'merged_from', 'split_from');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."organization_status" AS ENUM('active', 'inactive', 'suspended', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."organization_type" AS ENUM('congress', 'federation', 'union', 'local', 'region', 'district');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."organizing_activity_type" AS ENUM('house_visit', 'phone_call', 'text_message', 'workplace_conversation', 'organizing_meeting', 'blitz', 'workplace_action', 'card_signing_session', 'community_event', 'rally', 'picket', 'press_conference', 'social_media_campaign');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."organizing_campaign_status" AS ENUM('research', 'pre_campaign', 'active', 'card_check', 'certification_pending', 'certification_vote', 'won', 'lost', 'suspended', 'abandoned');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."organizing_campaign_type" AS ENUM('new_workplace', 'raid', 'expansion', 'decertification_defense', 'voluntary_recognition', 'card_check_majority');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."outcome" AS ENUM('grievance_upheld', 'grievance_denied', 'partial_success', 'dismissed', 'withdrawn', 'settled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."pay_equity_status" AS ENUM('intake', 'under_review', 'investigation', 'mediation', 'arbitration', 'resolved', 'dismissed', 'withdrawn', 'appealed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payment_provider" AS ENUM('stripe', 'whop');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."pension_claim_type" AS ENUM('retirement_pension', 'early_retirement', 'disability_pension', 'survivor_benefit', 'death_benefit', 'lump_sum_withdrawal', 'pension_transfer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."pension_plan_status" AS ENUM('active', 'frozen', 'closed', 'under_review');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."pension_plan_type" AS ENUM('defined_benefit', 'defined_contribution', 'hybrid', 'target_benefit', 'multi_employer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."political_activity_type" AS ENUM('meeting_with_mp', 'meeting_with_staff', 'phone_call', 'letter_writing', 'email_campaign', 'petition_drive', 'lobby_day', 'town_hall', 'press_conference', 'rally', 'canvassing', 'phone_banking', 'door_knocking', 'social_media_campaign', 'committee_presentation', 'delegation');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."political_campaign_status" AS ENUM('planning', 'active', 'paused', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."political_campaign_type" AS ENUM('electoral', 'legislative', 'issue_advocacy', 'ballot_initiative', 'get_out_the_vote', 'voter_registration', 'political_education', 'coalition_building');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."political_party" AS ENUM('liberal', 'conservative', 'ndp', 'green', 'bloc_quebecois', 'peoples_party', 'independent', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."precedent_value" AS ENUM('high', 'medium', 'low');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."push_delivery_status" AS ENUM('pending', 'sent', 'delivered', 'failed', 'clicked', 'dismissed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."push_notification_status" AS ENUM('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."push_platform" AS ENUM('ios', 'android', 'web');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."push_priority" AS ENUM('low', 'normal', 'high', 'urgent');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."registration_status" AS ENUM('registered', 'waitlisted', 'confirmed', 'attended', 'completed', 'incomplete', 'no_show', 'cancelled', 'withdrawn');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."report_category" AS ENUM('claims', 'members', 'financial', 'compliance', 'performance', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."report_format" AS ENUM('pdf', 'excel', 'csv', 'json', 'html');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."report_type" AS ENUM('custom', 'template', 'system', 'scheduled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('super_admin', 'org_admin', 'manager', 'member', 'free_user');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."room_status" AS ENUM('available', 'booked', 'maintenance', 'unavailable');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."schedule_frequency" AS ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."session_status" AS ENUM('scheduled', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."settlement_status" AS ENUM('proposed', 'under_review', 'accepted', 'rejected', 'finalized');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."signature_status" AS ENUM('pending', 'signed', 'rejected', 'expired', 'revoked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."signature_type" AS ENUM('financial_attestation', 'document_approval', 'meeting_minutes', 'contract_signing', 'policy_approval', 'election_certification', 'grievance_settlement', 'collective_agreement');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."strike_vote_requirement" AS ENUM('simple_majority', 'secret_ballot', 'membership_quorum');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."sync_status" AS ENUM('synced', 'pending', 'failed', 'disconnected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tax_slip_type" AS ENUM('t4a', 't4a_box_016', 't4a_box_018', 't4a_box_048', 'cope_receipt', 'rl_1', 'rl_24');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."template_category" AS ENUM('general', 'announcement', 'event', 'update', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."transition_trigger_type" AS ENUM('manual', 'automatic', 'deadline', 'approval', 'rejection');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tribunal_type" AS ENUM('fpslreb', 'provincial_labour_board', 'private_arbitrator', 'court_federal', 'court_provincial', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."union_position" AS ENUM('strong_support', 'support', 'neutral', 'oppose', 'strong_oppose', 'monitoring');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voter_eligibility" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"is_eligible" boolean DEFAULT true,
	"eligibility_reason" text,
	"voting_weight" numeric(5, 2) DEFAULT 1.0,
	"can_delegate" boolean DEFAULT false,
	"delegated_to" uuid,
	"restrictions" text[],
	"verification_status" varchar(20) DEFAULT 'pending',
	"voter_metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voting_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"text" varchar(500) NOT NULL,
	"description" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voting_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"recipient_id" uuid NOT NULL,
	"priority" varchar(20) DEFAULT 'medium',
	"delivery_method" text[] DEFAULT '{"RAY['push'::tex"}',
	"is_read" boolean DEFAULT false,
	"sent_at" timestamp with time zone DEFAULT now(),
	"read_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "collective_agreements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cba_number" varchar(100) NOT NULL,
	"title" varchar(500) NOT NULL,
	"jurisdiction" "cba_jurisdiction" NOT NULL,
	"language" "cba_language" DEFAULT 'en' NOT NULL,
	"employer_name" varchar(300) NOT NULL,
	"employer_id" varchar(100),
	"union_name" varchar(300) NOT NULL,
	"union_local" varchar(100),
	"union_id" varchar(100),
	"effective_date" timestamp with time zone NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"signed_date" timestamp with time zone,
	"ratification_date" timestamp with time zone,
	"industry_sector" varchar(200) NOT NULL,
	"employee_coverage" integer,
	"bargaining_unit_description" text,
	"document_url" text,
	"document_hash" varchar(64),
	"raw_text" text,
	"structured_data" jsonb,
	"embedding" text,
	"summary_generated" text,
	"key_terms" jsonb,
	"status" "cba_status" DEFAULT 'active' NOT NULL,
	"is_public" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"last_modified_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"superseded_by" uuid,
	"precedes_id" uuid,
	CONSTRAINT "collective_agreements_cba_number_unique" UNIQUE("cba_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cba_clauses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cba_id" uuid NOT NULL,
	"clause_number" varchar(50) NOT NULL,
	"clause_type" "clause_type" NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"content_plain_text" text,
	"page_number" integer,
	"article_number" varchar(50),
	"section_hierarchy" jsonb,
	"parent_clause_id" uuid,
	"order_index" integer DEFAULT 0 NOT NULL,
	"embedding" text,
	"confidence_score" numeric(5, 4),
	"entities" jsonb,
	"key_terms" jsonb,
	"related_clause_ids" jsonb,
	"interpretation_notes" text,
	"view_count" integer DEFAULT 0,
	"citation_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cba_version_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cba_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"change_description" text NOT NULL,
	"change_type" varchar(50) NOT NULL,
	"previous_data" jsonb,
	"new_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "benefit_comparisons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cba_id" uuid NOT NULL,
	"clause_id" uuid,
	"benefit_type" varchar(100) NOT NULL,
	"benefit_name" varchar(200) NOT NULL,
	"coverage_details" jsonb,
	"monthly_premium" numeric(10, 2),
	"annual_cost" numeric(12, 2),
	"industry_benchmark" varchar(50),
	"effective_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clause_comparisons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comparison_name" varchar(200) NOT NULL,
	"clause_type" "clause_type" NOT NULL,
	"tenant_id" uuid NOT NULL,
	"clause_ids" jsonb NOT NULL,
	"analysis_results" jsonb,
	"industry_average" jsonb,
	"market_position" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "arbitrator_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"total_decisions" integer DEFAULT 0 NOT NULL,
	"grievor_success_rate" numeric(5, 2),
	"employer_success_rate" numeric(5, 2),
	"average_award_amount" numeric(12, 2),
	"median_award_amount" numeric(12, 2),
	"highest_award_amount" numeric(12, 2),
	"common_remedies" jsonb,
	"specializations" jsonb,
	"primary_sectors" jsonb,
	"jurisdictions" jsonb,
	"avg_decision_days" integer,
	"median_decision_days" integer,
	"decision_range_min" integer,
	"decision_range_max" integer,
	"decision_patterns" jsonb,
	"contact_info" jsonb,
	"biography" text,
	"credentials" jsonb,
	"is_active" boolean DEFAULT true,
	"last_decision_date" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "arbitrator_profiles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "insight_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"insight_type" text NOT NULL,
	"category" text NOT NULL,
	"priority" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"data_source" jsonb,
	"metrics" jsonb,
	"trend" text,
	"impact" text,
	"recommendations" jsonb,
	"action_required" boolean DEFAULT false,
	"action_deadline" timestamp,
	"estimated_benefit" text,
	"confidence_score" numeric,
	"related_entities" jsonb,
	"status" text DEFAULT 'new',
	"acknowledged_by" text,
	"acknowledged_at" timestamp,
	"dismissed_by" text,
	"dismissed_at" timestamp,
	"dismissal_reason" text,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"email" text,
	"membership" "membership" DEFAULT 'free' NOT NULL,
	"payment_provider" "payment_provider" DEFAULT 'whop',
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"whop_user_id" text,
	"whop_membership_id" text,
	"plan_duration" text,
	"billing_cycle_start" timestamp,
	"billing_cycle_end" timestamp,
	"next_credit_renewal" timestamp,
	"usage_credits" integer DEFAULT 0,
	"used_credits" integer DEFAULT 0,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" "role" DEFAULT 'member',
	"is_system_admin" boolean DEFAULT false,
	"organization_id" text,
	"permissions" text[]
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pending_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token" text,
	"membership" "membership" DEFAULT 'pro' NOT NULL,
	"payment_provider" "payment_provider" DEFAULT 'whop',
	"whop_user_id" text,
	"whop_membership_id" text,
	"plan_duration" text,
	"billing_cycle_start" timestamp,
	"billing_cycle_end" timestamp,
	"next_credit_renewal" timestamp,
	"usage_credits" integer DEFAULT 0,
	"used_credits" integer DEFAULT 0,
	"claimed" boolean DEFAULT false,
	"claimed_by_user_id" text,
	"claimed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pending_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "digital_signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"document_id" uuid NOT NULL,
	"document_hash" varchar(128) NOT NULL,
	"document_url" text,
	"signature_type" "signature_type" NOT NULL,
	"signature_status" "signature_status" DEFAULT 'pending',
	"signer_user_id" uuid NOT NULL,
	"signer_name" varchar(200) NOT NULL,
	"signer_title" varchar(100),
	"signer_email" varchar(255),
	"certificate_subject" varchar(500),
	"certificate_issuer" varchar(500),
	"certificate_serial_number" varchar(100),
	"certificate_thumbprint" varchar(128),
	"certificate_not_before" timestamp with time zone,
	"certificate_not_after" timestamp with time zone,
	"signature_algorithm" varchar(50),
	"signature_value" text,
	"public_key" text,
	"timestamp_token" text,
	"timestamp_authority" varchar(200),
	"timestamp_value" timestamp with time zone,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp with time zone,
	"verification_method" varchar(100),
	"signed_at" timestamp with time zone,
	"ip_address" "inet",
	"user_agent" text,
	"geolocation" jsonb,
	"rejection_reason" text,
	"rejected_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"revocation_reason" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_document_signer" UNIQUE("document_type","document_id","signer_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "signature_workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workflow_name" varchar(200) NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"signature_type" "signature_type" NOT NULL,
	"required_signatures" integer DEFAULT 1,
	"required_roles" jsonb,
	"sequential_signing" boolean DEFAULT false,
	"expiration_hours" integer DEFAULT 168,
	"approval_threshold" integer,
	"allow_delegation" boolean DEFAULT false,
	"notify_on_pending" boolean DEFAULT true,
	"notify_on_signed" boolean DEFAULT true,
	"reminder_interval_hours" integer DEFAULT 24,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "unique_workflow_doc_type" UNIQUE("organization_id","document_type","signature_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wage_progressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cba_id" uuid NOT NULL,
	"clause_id" uuid,
	"classification" varchar(200) NOT NULL,
	"classification_code" varchar(50),
	"step" integer NOT NULL,
	"hourly_rate" numeric(10, 2),
	"annual_salary" numeric(12, 2),
	"effective_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"premiums" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "arbitration_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_number" varchar(100) NOT NULL,
	"case_title" varchar(500) NOT NULL,
	"tribunal" "tribunal_type" NOT NULL,
	"decision_type" "decision_type" NOT NULL,
	"decision_date" timestamp with time zone NOT NULL,
	"filing_date" timestamp with time zone,
	"hearing_date" timestamp with time zone,
	"arbitrator" varchar(200) NOT NULL,
	"panel_members" jsonb,
	"grievor" varchar(300),
	"union" varchar(300) NOT NULL,
	"employer" varchar(300) NOT NULL,
	"outcome" "outcome" NOT NULL,
	"remedy" jsonb,
	"key_findings" jsonb,
	"issue_types" jsonb,
	"precedent_value" "precedent_value" NOT NULL,
	"legal_citations" jsonb,
	"related_decisions" jsonb,
	"cba_references" jsonb,
	"full_text" text NOT NULL,
	"summary" text,
	"headnote" text,
	"sector" varchar(100),
	"jurisdiction" varchar(50),
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"citation_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"embedding" text,
	"is_public" boolean DEFAULT true,
	"access_restrictions" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"imported_from" varchar(200),
	CONSTRAINT "arbitration_decisions_case_number_unique" UNIQUE("case_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bargaining_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cba_id" uuid,
	"tenant_id" uuid NOT NULL,
	"session_date" timestamp with time zone NOT NULL,
	"session_type" varchar(100) NOT NULL,
	"session_number" integer,
	"title" varchar(300) NOT NULL,
	"content" text NOT NULL,
	"attendees" jsonb,
	"related_clause_ids" jsonb,
	"related_decision_ids" jsonb,
	"tags" jsonb,
	"confidentiality_level" varchar(50) DEFAULT 'internal',
	"embedding" text,
	"key_insights" jsonb,
	"attachments" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_modified_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cba_footnotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_clause_id" uuid NOT NULL,
	"target_clause_id" uuid,
	"target_decision_id" uuid,
	"footnote_number" integer NOT NULL,
	"footnote_text" text NOT NULL,
	"context" text,
	"link_type" varchar(50) NOT NULL,
	"start_offset" integer,
	"end_offset" integer,
	"click_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "claim_precedent_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"precedent_matches" jsonb,
	"success_probability" numeric(5, 2),
	"confidence_level" varchar(50),
	"suggested_strategy" text,
	"potential_remedies" jsonb,
	"arbitrator_tendencies" jsonb,
	"relevant_cba_clause_ids" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"analyzed_by" varchar(50) DEFAULT 'ai_system' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cba_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cba_id" uuid NOT NULL,
	"contact_type" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"title" varchar(200),
	"organization" varchar(300),
	"email" varchar(255),
	"phone" varchar(50),
	"is_primary" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"claim_id" uuid,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"source_type" text NOT NULL,
	"license_notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"tenant_id" text NOT NULL,
	"content" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"embedding" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ai_chunks_document_id_chunk_index_key" UNIQUE("document_id","chunk_index")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"query_text" text NOT NULL,
	"query_hash" text NOT NULL,
	"answer" text,
	"sources" jsonb DEFAULT '[]'::jsonb,
	"status" text NOT NULL,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_query_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"input_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"latency_ms" integer,
	"status" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query_id" uuid NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"rating" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_usage_by_tenant" (
	"tenant_id" text,
	"total_queries" bigint,
	"successful_queries" bigint,
	"failed_queries" bigint,
	"avg_latency_ms" numeric,
	"last_query_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_feedback_summary" (
	"tenant_id" text,
	"total_feedback" bigint,
	"positive_feedback" bigint,
	"negative_feedback" bigint,
	"positive_rate_pct" numeric
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"status" "member_status" DEFAULT 'active' NOT NULL,
	"department" text,
	"position" text,
	"hire_date" timestamp with time zone,
	"membership_number" text,
	"seniority" integer DEFAULT 0,
	"union_join_date" timestamp with time zone,
	"preferred_contact_method" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"tenant_id" uuid NOT NULL,
	"search_vector" "tsvector",
	"joined_at" timestamp with time zone DEFAULT now(),
	"is_primary" boolean DEFAULT false,
	CONSTRAINT "organization_members_tenant_user_unique" UNIQUE("user_id","tenant_id"),
	CONSTRAINT "organization_members_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "case_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"tenant_id" text NOT NULL,
	"summary_text" text NOT NULL,
	"created_by" varchar(50) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "claim_updates" (
	"update_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"update_type" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"created_by" uuid NOT NULL,
	"is_internal" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member_dues_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"rule_id" uuid NOT NULL,
	"effective_date" date DEFAULT CURRENT_DATE NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true,
	"override_amount" numeric(10, 2),
	"override_reason" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_active_assignment" UNIQUE("tenant_id","member_id","rule_id","effective_date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employer_remittances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employer_name" varchar(255) NOT NULL,
	"employer_id" varchar(100),
	"remittance_period_start" date NOT NULL,
	"remittance_period_end" date NOT NULL,
	"remittance_date" date NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"member_count" integer NOT NULL,
	"file_url" text,
	"file_hash" varchar(64),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"reconciliation_status" varchar(50),
	"reconciliation_date" timestamp with time zone,
	"reconciled_by" text,
	"variance_amount" numeric(10, 2) DEFAULT 0.00,
	"variance_reason" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dues_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"rule_name" varchar(255) NOT NULL,
	"rule_code" varchar(50) NOT NULL,
	"description" text,
	"calculation_type" varchar(50) NOT NULL,
	"percentage_rate" numeric(5, 2),
	"base_field" varchar(100),
	"flat_amount" numeric(10, 2),
	"hourly_rate" numeric(10, 2),
	"hours_per_period" integer,
	"tier_structure" jsonb,
	"custom_formula" text,
	"billing_frequency" varchar(20) DEFAULT 'monthly' NOT NULL,
	"is_active" boolean DEFAULT true,
	"effective_date" date DEFAULT CURRENT_DATE NOT NULL,
	"end_date" date,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_rule_code" UNIQUE("tenant_id","rule_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "strike_funds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"fund_name" varchar(255) NOT NULL,
	"fund_code" varchar(50) NOT NULL,
	"description" text,
	"fund_type" varchar(50) NOT NULL,
	"current_balance" numeric(12, 2) DEFAULT 0.00 NOT NULL,
	"target_amount" numeric(12, 2),
	"minimum_threshold" numeric(12, 2),
	"contribution_rate" numeric(10, 2),
	"contribution_frequency" varchar(20),
	"strike_status" varchar(50) DEFAULT 'inactive' NOT NULL,
	"strike_start_date" date,
	"strike_end_date" date,
	"weekly_stipend_amount" numeric(10, 2),
	"daily_picket_bonus" numeric(8, 2),
	"minimum_attendance_hours" numeric(4, 2) DEFAULT 4.0,
	"estimated_burn_rate" numeric(10, 2),
	"estimated_duration_weeks" integer,
	"fund_depletion_date" date,
	"last_prediction_update" timestamp with time zone,
	"accepts_public_donations" boolean DEFAULT false,
	"donation_page_url" text,
	"fundraising_goal" numeric(12, 2),
	"status" varchar(20) DEFAULT 'active',
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"organization_id" uuid,
	CONSTRAINT "unique_fund_code" UNIQUE("tenant_id","fund_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fund_eligibility" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"strike_fund_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"is_eligible" boolean DEFAULT false,
	"eligibility_reason" text,
	"months_in_good_standing" integer,
	"has_paid_dues" boolean DEFAULT false,
	"no_arrears" boolean DEFAULT false,
	"is_in_bargaining_unit" boolean DEFAULT false,
	"approval_status" varchar(50) DEFAULT 'pending',
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_member_fund_eligibility" UNIQUE("tenant_id","strike_fund_id","member_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "picket_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"strike_fund_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"check_in_time" timestamp with time zone NOT NULL,
	"check_out_time" timestamp with time zone,
	"check_in_latitude" numeric(10, 8),
	"check_in_longitude" numeric(11, 8),
	"check_out_latitude" numeric(10, 8),
	"check_out_longitude" numeric(11, 8),
	"location_verified" boolean DEFAULT false,
	"check_in_method" varchar(50),
	"nfc_tag_uid" varchar(100),
	"qr_code_data" varchar(255),
	"device_id" text,
	"duration_minutes" integer,
	"hours_worked" numeric(4, 2),
	"coordinator_override" boolean DEFAULT false,
	"override_reason" text,
	"verified_by" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stipend_disbursements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"strike_fund_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"week_start_date" date NOT NULL,
	"week_end_date" date NOT NULL,
	"hours_worked" numeric(6, 2) NOT NULL,
	"base_stipend_amount" numeric(10, 2) NOT NULL,
	"bonus_amount" numeric(10, 2) DEFAULT 0.00,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'calculated' NOT NULL,
	"payment_date" timestamp with time zone,
	"payment_method" varchar(50),
	"payment_reference" varchar(255),
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_member_week_stipend" UNIQUE("tenant_id","strike_fund_id","member_id","week_start_date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public_donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"strike_fund_id" uuid NOT NULL,
	"donor_name" varchar(255),
	"donor_email" varchar(255),
	"is_anonymous" boolean DEFAULT false,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"payment_provider" varchar(50) DEFAULT 'stripe',
	"payment_intent_id" varchar(255),
	"transaction_id" varchar(255),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"message" text,
	"processed_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hardship_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"strike_fund_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"application_date" date DEFAULT CURRENT_DATE NOT NULL,
	"hardship_type" varchar(50) NOT NULL,
	"amount_requested" numeric(10, 2) NOT NULL,
	"amount_approved" numeric(10, 2),
	"description" text NOT NULL,
	"supporting_documents" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(50) DEFAULT 'submitted' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"paid_date" timestamp with time zone,
	"payment_reference" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "arrears_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"case_number" varchar(100),
	"total_owed" numeric(10, 2) NOT NULL,
	"oldest_debt_date" date,
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"payment_plan_id" uuid,
	"payment_plan_amount" numeric(10, 2),
	"payment_plan_frequency" varchar(20),
	"last_contact_date" timestamp with time zone,
	"last_contact_method" varchar(50),
	"next_followup_date" date,
	"escalation_level" integer DEFAULT 0,
	"escalation_history" jsonb DEFAULT '[]'::jsonb,
	"resolution_date" timestamp with time zone,
	"resolution_type" varchar(50),
	"resolution_notes" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"transaction_ids" uuid[] DEFAULT '{""}',
	"remaining_balance" numeric(10, 2),
	"days_overdue" integer,
	"contact_history" jsonb DEFAULT '[]'::jsonb,
	"payment_schedule" jsonb DEFAULT '[]'::jsonb,
	"payment_plan_active" boolean DEFAULT false,
	"payment_plan_start_date" date,
	"installment_amount" numeric(10, 2),
	"number_of_installments" integer,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "arrears_cases_case_number_key" UNIQUE("case_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"channels" text[] NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"data" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"attempts" numeric(2, 0) DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" text NOT NULL,
	"channel" text NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"variables" text DEFAULT '[]' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"preferences" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"strike_fund_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'usd',
	"donor_name" text,
	"donor_email" text,
	"is_anonymous" boolean DEFAULT false,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"stripe_payment_intent_id" text,
	"payment_method" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "picket_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"strike_fund_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"check_in_time" timestamp with time zone NOT NULL,
	"check_out_time" timestamp with time zone,
	"check_in_latitude" numeric(10, 8),
	"check_in_longitude" numeric(11, 8),
	"check_out_latitude" numeric(10, 8),
	"check_out_longitude" numeric(11, 8),
	"location_verified" boolean DEFAULT false,
	"check_in_method" text,
	"nfc_tag_uid" text,
	"qr_code_data" text,
	"device_id" text,
	"duration_minutes" integer,
	"hours_worked" numeric(4, 2),
	"coordinator_override" boolean DEFAULT false,
	"override_reason" text,
	"verified_by" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jurisdiction_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jurisdiction" "ca_jurisdiction" NOT NULL,
	"template_type" text NOT NULL,
	"template_name" text NOT NULL,
	"template_content" text NOT NULL,
	"required_fields" text[] DEFAULT '{""}' NOT NULL,
	"optional_fields" text[] DEFAULT '{""}' NOT NULL,
	"legal_reference" text,
	"form_number" text,
	"version" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_jurisdiction_template" UNIQUE("jurisdiction","template_type","version")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jurisdiction_rules_summary" (
	"jurisdiction" "ca_jurisdiction",
	"rule_type" "jurisdiction_rule_type",
	"rule_count" bigint,
	"category_count" bigint,
	"earliest_effective" date,
	"latest_effective" date
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "arrears" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"total_owed" numeric(10, 2) DEFAULT 0.00 NOT NULL,
	"oldest_debt_date" date,
	"months_overdue" integer DEFAULT 0,
	"arrears_status" text DEFAULT 'active' NOT NULL,
	"payment_plan_active" boolean DEFAULT false,
	"payment_plan_amount" numeric(10, 2),
	"payment_plan_frequency" text,
	"payment_plan_start_date" date,
	"payment_plan_end_date" date,
	"suspension_effective_date" date,
	"suspension_reason" text,
	"collection_agency" text,
	"legal_action_date" date,
	"legal_reference" text,
	"notes" text,
	"last_contact_date" date,
	"next_follow_up_date" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_member_arrears" UNIQUE("tenant_id","member_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clause_comparisons_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"clause_ids" uuid[] NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"organization_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "arbitration_precedents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_organization_id" uuid NOT NULL,
	"source_decision_id" uuid,
	"case_number" varchar(100),
	"case_title" varchar(500) NOT NULL,
	"decision_date" date NOT NULL,
	"is_parties_anonymized" boolean DEFAULT false,
	"union_name" varchar(200),
	"employer_name" varchar(200),
	"arbitrator_name" varchar(200) NOT NULL,
	"tribunal" varchar(200),
	"jurisdiction" varchar(50) NOT NULL,
	"grievance_type" varchar(100) NOT NULL,
	"issue_summary" text NOT NULL,
	"union_position" text,
	"employer_position" text,
	"outcome" varchar(50) NOT NULL,
	"decision_summary" text NOT NULL,
	"reasoning" text,
	"precedential_value" varchar(20) DEFAULT 'medium',
	"key_principles" text[],
	"related_legislation" text,
	"document_url" varchar(500),
	"document_path" varchar(500),
	"sharing_level" varchar(50) DEFAULT 'private' NOT NULL,
	"shared_with_org_ids" uuid[],
	"sector" varchar(100),
	"province" varchar(2),
	"view_count" integer DEFAULT 0,
	"citation_count" integer DEFAULT 0,
	"download_count" integer DEFAULT 0,
	"has_redacted_version" boolean DEFAULT false,
	"redacted_document_url" varchar(500),
	"redacted_document_path" varchar(500),
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shared_clause_library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_organization_id" uuid NOT NULL,
	"source_cba_id" uuid,
	"original_clause_id" uuid,
	"clause_number" varchar(50),
	"clause_title" varchar(500) NOT NULL,
	"clause_text" text NOT NULL,
	"clause_type" varchar(100) NOT NULL,
	"is_anonymized" boolean DEFAULT false,
	"original_employer_name" varchar(200),
	"anonymized_employer_name" varchar(200),
	"sharing_level" varchar(50) DEFAULT 'private' NOT NULL,
	"shared_with_org_ids" uuid[],
	"effective_date" date,
	"expiry_date" date,
	"sector" varchar(100),
	"province" varchar(2),
	"view_count" integer DEFAULT 0,
	"citation_count" integer DEFAULT 0,
	"comparison_count" integer DEFAULT 0,
	"version" integer DEFAULT 1,
	"previous_version_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "precedent_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"precedent_id" uuid NOT NULL,
	"tag_name" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "precedent_citations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"precedent_id" uuid NOT NULL,
	"cited_by_precedent_id" uuid,
	"citing_claim_id" uuid,
	"citation_context" text,
	"citation_weight" varchar(20) DEFAULT 'supporting',
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_sharing_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"allow_federation_sharing" boolean DEFAULT false,
	"allow_sector_sharing" boolean DEFAULT false,
	"allow_province_sharing" boolean DEFAULT false,
	"allow_congress_sharing" boolean DEFAULT false,
	"auto_share_clauses" boolean DEFAULT false,
	"auto_share_precedents" boolean DEFAULT false,
	"require_anonymization" boolean DEFAULT true,
	"default_sharing_level" varchar(50) DEFAULT 'private',
	"allowed_sharing_levels" varchar(50)[],
	"sharing_approval_required" boolean DEFAULT true,
	"sharing_approver_role" varchar(50) DEFAULT 'admin',
	"max_shared_clauses" integer,
	"max_shared_precedents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_sharing_settings_organization_id_key" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_sharing_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"granter_org_id" uuid NOT NULL,
	"grantee_org_id" uuid NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" uuid NOT NULL,
	"access_level" varchar(50) NOT NULL,
	"expires_at" timestamp with time zone,
	"can_reshare" boolean DEFAULT false,
	"granted_by" uuid NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_by" uuid,
	"access_count" integer DEFAULT 0,
	"last_accessed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cross_org_access_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_organization_id" uuid NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" uuid NOT NULL,
	"resource_organization_id" uuid NOT NULL,
	"access_type" varchar(50) NOT NULL,
	"access_granted_via" varchar(50),
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_org_id" uuid NOT NULL,
	"child_org_id" uuid NOT NULL,
	"relationship_type" text NOT NULL,
	"effective_date" date DEFAULT CURRENT_DATE NOT NULL,
	"end_date" date,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "organization_relationships_parent_org_id_child_org_id_relat_key" UNIQUE("parent_org_id","child_org_id","relationship_type","effective_date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenant_management_view" (
	"tenant_id" uuid,
	"tenant_slug" text,
	"tenant_name" text,
	"tenant_display_name" text,
	"tenant_status" text,
	"tenant_settings" jsonb,
	"tenant_created_at" timestamp with time zone,
	"tenant_updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_tree" (
	"id" uuid,
	"parent_id" uuid,
	"name" text,
	"slug" text,
	"organization_type" "organization_type",
	"hierarchy_level" integer,
	"hierarchy_path" text[],
	"display_path" text[],
	"full_path" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attestation_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_name" varchar(200) NOT NULL,
	"template_type" varchar(100) NOT NULL,
	"signature_type" "signature_type" NOT NULL,
	"attestation_text" text NOT NULL,
	"legal_disclaimer" text,
	"jurisdictions" jsonb,
	"clc_required" boolean DEFAULT false,
	"sox_compliance" boolean DEFAULT false,
	"version" integer DEFAULT 1,
	"effective_date" date,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clause_library_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clause_id" uuid NOT NULL,
	"tag_name" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_uuid_mapping" (
	"user_uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_uuid_mapping_clerk_user_id_key" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voting_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"meeting_type" varchar(50) NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"start_time" timestamp with time zone,
	"end_time" timestamp with time zone,
	"scheduled_end_time" timestamp with time zone,
	"allow_anonymous" boolean DEFAULT true,
	"requires_quorum" boolean DEFAULT true,
	"quorum_threshold" integer DEFAULT 50,
	"total_eligible_voters" integer DEFAULT 0,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"encryption_enabled" boolean DEFAULT false,
	"encryption_algorithm" varchar(50) DEFAULT 'AES-256-GCM',
	"public_key" text,
	"key_fingerprint" varchar(128),
	"escrow_key_shares" jsonb,
	"audit_hash" varchar(128),
	"blockchain_anchor_tx" varchar(200),
	"blockchain_network" varchar(50),
	"third_party_auditor_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"voter_id" varchar(100) NOT NULL,
	"voter_hash" varchar(100),
	"cast_at" timestamp with time zone DEFAULT now(),
	"is_anonymous" boolean DEFAULT true,
	"voter_type" varchar(20) DEFAULT 'member',
	"voter_metadata" jsonb DEFAULT '{}'::jsonb,
	"encrypted_ballot" text,
	"encryption_iv" varchar(64),
	"encryption_tag" varchar(64),
	"ballot_hash" varchar(128),
	"vote_sequence" integer,
	"merkle_proof" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "claims" (
	"claim_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_number" varchar(50) NOT NULL,
	"member_id" uuid NOT NULL,
	"is_anonymous" boolean DEFAULT true,
	"claim_type" "claim_type" NOT NULL,
	"status" "claim_status" DEFAULT 'submitted',
	"priority" "claim_priority" DEFAULT 'medium',
	"incident_date" date NOT NULL,
	"location" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"desired_outcome" text NOT NULL,
	"witnesses_present" boolean DEFAULT false,
	"witness_details" text,
	"previously_reported" boolean DEFAULT false,
	"previous_report_details" text,
	"assigned_to" uuid,
	"assigned_at" timestamp with time zone,
	"ai_score" integer,
	"ai_analysis" jsonb,
	"merit_confidence" integer,
	"precedent_match" integer,
	"complexity_score" integer,
	"progress" integer DEFAULT 0,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"voice_transcriptions" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"closed_at" timestamp with time zone,
	"organization_id" uuid,
	"claim_amount" varchar(20),
	"settlement_amount" varchar(20),
	"legal_costs" varchar(20),
	"court_costs" varchar(20),
	"resolution_outcome" varchar(100),
	"filed_date" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "claims_claim_number_key" UNIQUE("claim_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"display_name" text,
	"short_name" text,
	"organization_type" "organization_type" NOT NULL,
	"parent_id" uuid,
	"hierarchy_path" text[],
	"hierarchy_level" integer DEFAULT 0 NOT NULL,
	"province_territory" text,
	"sectors" labour_sector[] DEFAULT '{""}',
	"email" text,
	"phone" text,
	"website" text,
	"address" jsonb,
	"clc_affiliated" boolean DEFAULT false,
	"affiliation_date" date,
	"charter_number" text,
	"member_count" integer DEFAULT 0,
	"active_member_count" integer DEFAULT 0,
	"last_member_count_update" timestamp with time zone,
	"subscription_tier" text,
	"billing_contact_id" uuid,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"features_enabled" text[] DEFAULT '{""}',
	"status" text DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"legacy_tenant_id" uuid,
	"clc_affiliate_code" varchar(20),
	"per_capita_rate" numeric(10, 2),
	"remittance_day" integer DEFAULT 15,
	"last_remittance_date" timestamp with time zone,
	"fiscal_year_end" date DEFAULT '2024-12-31',
	"legal_name" varchar(255),
	"business_number" text,
	CONSTRAINT "organizations_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comparative_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"analysis_name" text NOT NULL,
	"comparison_type" text NOT NULL,
	"organization_ids" jsonb,
	"metrics" jsonb NOT NULL,
	"time_range" jsonb NOT NULL,
	"results" jsonb NOT NULL,
	"benchmarks" jsonb,
	"organization_ranking" jsonb,
	"gaps" jsonb,
	"strengths" jsonb,
	"recommendations" jsonb,
	"visualization_data" jsonb,
	"is_public" boolean DEFAULT false,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "per_capita_remittances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_organization_id" uuid NOT NULL,
	"to_organization_id" uuid NOT NULL,
	"remittance_month" integer NOT NULL,
	"remittance_year" integer NOT NULL,
	"due_date" date NOT NULL,
	"total_members" integer NOT NULL,
	"good_standing_members" integer NOT NULL,
	"remittable_members" integer NOT NULL,
	"per_capita_rate" numeric(10, 2) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD',
	"clc_account_code" varchar(50),
	"gl_account" varchar(50),
	"status" varchar(20) DEFAULT 'pending',
	"submitted_date" timestamp with time zone,
	"paid_date" timestamp with time zone,
	"payment_method" varchar(50),
	"payment_reference" varchar(100),
	"remittance_file_url" text,
	"receipt_file_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "unique_org_remittance_period" UNIQUE("from_organization_id","to_organization_id","remittance_month","remittance_year")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clc_chart_of_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_code" varchar(50) NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"account_type" varchar(50) NOT NULL,
	"parent_account_code" varchar(50),
	"is_active" boolean DEFAULT true,
	"description" text,
	"financial_statement_line" varchar(100),
	"statistics_canada_code" varchar(50),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "clc_chart_of_accounts_account_code_key" UNIQUE("account_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transaction_clc_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"transaction_id" uuid NOT NULL,
	"transaction_date" date NOT NULL,
	"clc_account_code" varchar(50) NOT NULL,
	"gl_account" varchar(50),
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "unique_transaction_mapping" UNIQUE("transaction_type","transaction_id","clc_account_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" text NOT NULL,
	"member_id" text NOT NULL,
	"staff_id" text,
	"organization_id" uuid NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'normal',
	"category" text,
	"is_archived" boolean DEFAULT false,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voting_auditors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auditor_name" varchar(200) NOT NULL,
	"auditor_type" varchar(50) NOT NULL,
	"organization_name" varchar(200),
	"organization_website" varchar(500),
	"registration_number" varchar(100),
	"contact_person" varchar(200),
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(50),
	"public_key" text NOT NULL,
	"key_fingerprint" varchar(128) NOT NULL,
	"certificate" text,
	"is_clc_certified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"certification_expires_at" date,
	"api_key_hash" varchar(128),
	"api_rate_limit" integer DEFAULT 1000,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "voting_auditors_key_fingerprint_key" UNIQUE("key_fingerprint")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trusted_certificate_authorities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ca_name" varchar(200) NOT NULL,
	"ca_type" varchar(50) NOT NULL,
	"issuer_dn" varchar(500) NOT NULL,
	"root_certificate" text NOT NULL,
	"root_certificate_thumbprint" varchar(128) NOT NULL,
	"is_trusted" boolean DEFAULT true,
	"trust_level" varchar(50) DEFAULT 'high',
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"crl_url" text,
	"crl_last_updated" timestamp with time zone,
	"ocsp_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "trusted_certificate_authorities_issuer_dn_key" UNIQUE("issuer_dn"),
	CONSTRAINT "trusted_certificate_authorities_root_certificate_thumbprint_key" UNIQUE("root_certificate_thumbprint")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "signature_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"signature_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_timestamp" timestamp with time zone DEFAULT now(),
	"actor_user_id" uuid,
	"actor_name" varchar(200),
	"actor_role" varchar(100),
	"ip_address" "inet",
	"user_agent" text,
	"event_data" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voting_session_auditors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"voting_session_id" uuid NOT NULL,
	"auditor_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now(),
	"assigned_by" uuid,
	"auditor_public_key" text NOT NULL,
	"access_level" varchar(50) DEFAULT 'observer',
	"verification_status" varchar(50),
	"verification_started_at" timestamp with time zone,
	"verification_completed_at" timestamp with time zone,
	"verification_report_url" text,
	"issues_found" integer DEFAULT 0,
	"severity" varchar(50),
	"findings_summary" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_session_auditor" UNIQUE("voting_session_id","auditor_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blockchain_audit_anchors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"voting_session_id" uuid NOT NULL,
	"blockchain_network" varchar(50) NOT NULL,
	"network_type" varchar(50) DEFAULT 'mainnet',
	"transaction_hash" varchar(200) NOT NULL,
	"block_number" bigint,
	"block_hash" varchar(200),
	"block_timestamp" timestamp with time zone,
	"merkle_root_hash" varchar(128) NOT NULL,
	"metadata_hash" varchar(128),
	"total_votes_count" integer,
	"contract_address" varchar(200),
	"contract_method" varchar(100),
	"gas_used" bigint,
	"gas_price_gwei" numeric(20, 9),
	"transaction_fee_eth" numeric(20, 18),
	"transaction_fee_usd" numeric(12, 2),
	"is_confirmed" boolean DEFAULT false,
	"confirmations_required" integer DEFAULT 6,
	"current_confirmations" integer DEFAULT 0,
	"explorer_url" text,
	"proof_url" text,
	"status" varchar(50) DEFAULT 'pending',
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"anchored_by" uuid,
	CONSTRAINT "blockchain_audit_anchors_transaction_hash_key" UNIQUE("transaction_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vote_merkle_tree" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"voting_session_id" uuid NOT NULL,
	"tree_level" integer NOT NULL,
	"node_index" integer NOT NULL,
	"node_hash" varchar(128) NOT NULL,
	"parent_node_id" uuid,
	"left_child_id" uuid,
	"right_child_id" uuid,
	"vote_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_tree_position" UNIQUE("voting_session_id","tree_level","node_index")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_pending_remittances" (
	"organization_id" uuid,
	"organization_name" text,
	"clc_affiliate_code" varchar(20),
	"pending_count" bigint,
	"total_pending" numeric,
	"earliest_due_date" date,
	"latest_due_date" date
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_annual_remittance_summary" (
	"organization_id" uuid,
	"organization_name" text,
	"clc_affiliate_code" varchar(20),
	"hierarchy_level" integer,
	"remittance_year" integer,
	"remittance_count" bigint,
	"total_remitted" numeric,
	"total_members" bigint,
	"avg_per_capita_rate" numeric
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voting_session_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"voting_session_id" uuid NOT NULL,
	"public_key" text NOT NULL,
	"private_key_encrypted" text NOT NULL,
	"encryption_algorithm" varchar(50) DEFAULT 'RSA-4096',
	"key_derivation_function" varchar(50) DEFAULT 'PBKDF2',
	"kdf_iterations" integer DEFAULT 100000,
	"kdf_salt" varchar(64),
	"secret_shares_total" integer DEFAULT 5,
	"secret_shares_threshold" integer DEFAULT 3,
	"secret_share_1_encrypted" text,
	"secret_share_2_encrypted" text,
	"secret_share_3_encrypted" text,
	"secret_share_4_encrypted" text,
	"secret_share_5_encrypted" text,
	"custodian_1_user_id" uuid,
	"custodian_2_user_id" uuid,
	"custodian_3_user_id" uuid,
	"custodian_4_user_id" uuid,
	"custodian_5_user_id" uuid,
	"generated_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"encryption_count" integer DEFAULT 0,
	"decryption_count" integer DEFAULT 0,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "voting_session_keys_voting_session_id_key" UNIQUE("voting_session_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"sender_role" text NOT NULL,
	"message_type" "message_type" DEFAULT 'text' NOT NULL,
	"content" text,
	"file_url" text,
	"file_name" text,
	"file_size" text,
	"status" "message_status" DEFAULT 'sent' NOT NULL,
	"read_at" timestamp,
	"is_edited" boolean DEFAULT false,
	"edited_at" timestamp,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_hierarchy_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"change_type" varchar(50) NOT NULL,
	"old_parent_id" uuid,
	"new_parent_id" uuid,
	"old_hierarchy_level" integer,
	"new_hierarchy_level" integer,
	"old_clc_code" varchar(20),
	"new_clc_code" varchar(20),
	"changed_at" timestamp with time zone DEFAULT now(),
	"changed_by" uuid,
	"reason" text,
	"old_hierarchy_path" uuid[],
	"new_hierarchy_path" uuid[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voting_key_access_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_key_id" uuid NOT NULL,
	"access_type" varchar(50) NOT NULL,
	"accessed_by" uuid NOT NULL,
	"access_reason" text,
	"ip_address" "inet",
	"user_agent" text,
	"success" boolean,
	"error_message" text,
	"accessed_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_read_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_read_at" timestamp,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jurisdiction_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jurisdiction" "ca_jurisdiction" NOT NULL,
	"rule_type" "jurisdiction_rule_type" NOT NULL,
	"rule_category" text NOT NULL,
	"rule_name" text NOT NULL,
	"description" text,
	"legal_reference" text NOT NULL,
	"rule_parameters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"applies_to_sectors" text[],
	"version" integer DEFAULT 1 NOT NULL,
	"effective_date" date DEFAULT CURRENT_DATE NOT NULL,
	"expiry_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "statutory_holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jurisdiction" "ca_jurisdiction" NOT NULL,
	"holiday_date" date NOT NULL,
	"holiday_name" text NOT NULL,
	"holiday_name_fr" text,
	"affects_deadlines" boolean DEFAULT true NOT NULL,
	"is_optional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	CONSTRAINT "unique_jurisdiction_holiday" UNIQUE("jurisdiction","holiday_date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compliance_validations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"reference_type" text NOT NULL,
	"reference_id" uuid NOT NULL,
	"rule_id" uuid NOT NULL,
	"validation_date" timestamp with time zone DEFAULT now() NOT NULL,
	"is_compliant" boolean NOT NULL,
	"validation_message" text,
	"requires_action" boolean DEFAULT false NOT NULL,
	"action_deadline" date,
	"action_taken" text,
	"validated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"message_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"notified_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "encryption_keys" (
	"key_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key_name" varchar(100) NOT NULL,
	"key_value" "bytea" NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"rotated_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_by" text NOT NULL,
	CONSTRAINT "encryption_keys_key_name_key" UNIQUE("key_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"email" varchar(255),
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"encrypted_sin" text,
	"encrypted_ssn" text,
	"encrypted_bank_account" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "members_with_pii" (
	"id" uuid,
	"organization_id" uuid,
	"user_id" uuid,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"email" varchar(255),
	"status" varchar(50),
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"encrypted_sin" text,
	"encrypted_ssn" text,
	"encrypted_bank_account" text,
	"decrypted_sin" text,
	"decrypted_ssn" text,
	"decrypted_bank_account" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pii_access_log" (
	"log_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" uuid,
	"column_name" varchar(100) NOT NULL,
	"accessed_by" text NOT NULL,
	"accessed_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"access_type" varchar(20) NOT NULL,
	"ip_address" "inet",
	"application" varchar(100)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"report_type" "report_type" DEFAULT 'custom' NOT NULL,
	"category" "report_category" DEFAULT 'custom' NOT NULL,
	"config" jsonb NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"template_id" uuid,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"last_run_at" timestamp,
	"run_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar(255),
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "report_category" NOT NULL,
	"config" jsonb NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"thumbnail" varchar(500),
	"tags" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"executed_by" uuid NOT NULL,
	"executed_at" timestamp DEFAULT now() NOT NULL,
	"format" "report_format" DEFAULT 'pdf' NOT NULL,
	"parameters" jsonb,
	"result_count" varchar(50),
	"execution_time_ms" varchar(50),
	"file_url" varchar(500),
	"file_size" varchar(50),
	"status" varchar(50) DEFAULT 'completed' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scheduled_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"frequency" "schedule_frequency" NOT NULL,
	"day_of_week" varchar(20),
	"day_of_month" varchar(20),
	"time_of_day" varchar(10) NOT NULL,
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"format" "report_format" DEFAULT 'pdf' NOT NULL,
	"recipients" jsonb NOT NULL,
	"parameters" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_executed_at" timestamp,
	"next_execution_at" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"shared_by" uuid NOT NULL,
	"shared_with" uuid,
	"shared_with_email" varchar(255),
	"permission" varchar(50) DEFAULT 'viewer' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deadline_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"rule_name" varchar(255) NOT NULL,
	"rule_code" varchar(100) NOT NULL,
	"description" text,
	"claim_type" varchar(100),
	"priority_level" varchar(50),
	"step_number" integer,
	"days_from_event" integer NOT NULL,
	"event_type" varchar(100) DEFAULT 'claim_filed' NOT NULL,
	"business_days_only" boolean DEFAULT true NOT NULL,
	"allows_extension" boolean DEFAULT true NOT NULL,
	"max_extension_days" integer DEFAULT 30 NOT NULL,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"escalate_to_role" varchar(100),
	"escalation_delay_days" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system_rule" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "claim_deadlines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"deadline_rule_id" uuid,
	"deadline_name" varchar(255) NOT NULL,
	"deadline_type" varchar(100) NOT NULL,
	"event_date" timestamp NOT NULL,
	"original_deadline" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"completed_at" timestamp,
	"status" "deadline_status" DEFAULT 'pending' NOT NULL,
	"priority" "deadline_priority" DEFAULT 'medium' NOT NULL,
	"extension_count" integer DEFAULT 0 NOT NULL,
	"total_extension_days" integer DEFAULT 0 NOT NULL,
	"last_extension_date" timestamp,
	"last_extension_reason" text,
	"completed_by" uuid,
	"completion_notes" text,
	"is_overdue" boolean DEFAULT false NOT NULL,
	"days_until_due" integer,
	"days_overdue" integer DEFAULT 0 NOT NULL,
	"escalated_at" timestamp,
	"escalated_to" uuid,
	"alert_count" integer DEFAULT 0 NOT NULL,
	"last_alert_sent" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deadline_extensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deadline_id" uuid NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"requested_by" uuid NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"requested_days" integer NOT NULL,
	"request_reason" text NOT NULL,
	"status" "extension_status" DEFAULT 'pending' NOT NULL,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"approved_by" uuid,
	"approval_decision_at" timestamp,
	"approval_notes" text,
	"new_deadline" timestamp,
	"days_granted" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deadline_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deadline_id" uuid NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"alert_type" varchar(100) NOT NULL,
	"alert_severity" "alert_severity" NOT NULL,
	"alert_trigger" varchar(100) NOT NULL,
	"recipient_id" uuid NOT NULL,
	"recipient_role" varchar(100),
	"delivery_method" "delivery_method" NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"delivered_at" timestamp,
	"delivery_status" "delivery_status" DEFAULT 'pending' NOT NULL,
	"delivery_error" text,
	"viewed_at" timestamp,
	"acknowledged_at" timestamp,
	"action_taken" varchar(255),
	"action_taken_at" timestamp,
	"subject" varchar(500),
	"message" text,
	"action_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar(255),
	"holiday_date" timestamp NOT NULL,
	"holiday_name" varchar(255) NOT NULL,
	"holiday_type" varchar(100) NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"applies_to" varchar(100) DEFAULT 'all' NOT NULL,
	"is_observed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" varchar(7) DEFAULT '#3B82F6',
	"icon" varchar(50),
	"owner_id" text NOT NULL,
	"is_personal" boolean DEFAULT true,
	"is_shared" boolean DEFAULT false,
	"is_public" boolean DEFAULT false,
	"external_provider" varchar(50),
	"external_calendar_id" text,
	"sync_enabled" boolean DEFAULT false,
	"last_sync_at" timestamp,
	"sync_status" "sync_status" DEFAULT 'disconnected',
	"sync_token" text,
	"timezone" varchar(100) DEFAULT 'America/New_York',
	"default_event_duration" integer DEFAULT 60,
	"reminder_default_minutes" integer DEFAULT 15,
	"allow_overlap" boolean DEFAULT true,
	"require_approval" boolean DEFAULT false,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_id" uuid NOT NULL,
	"tenant_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"location_url" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"timezone" varchar(100) DEFAULT 'America/New_York',
	"is_all_day" boolean DEFAULT false,
	"is_recurring" boolean DEFAULT false,
	"recurrence_rule" text,
	"recurrence_exceptions" jsonb,
	"parent_event_id" uuid,
	"event_type" "event_type" DEFAULT 'meeting',
	"status" "event_status" DEFAULT 'scheduled',
	"priority" varchar(20) DEFAULT 'normal',
	"claim_id" text,
	"case_number" text,
	"member_id" text,
	"meeting_room_id" uuid,
	"meeting_url" text,
	"meeting_password" text,
	"agenda" text,
	"organizer_id" text NOT NULL,
	"reminders" jsonb DEFAULT '[15]'::jsonb,
	"external_event_id" text,
	"external_provider" varchar(50),
	"external_html_link" text,
	"last_sync_at" timestamp,
	"is_private" boolean DEFAULT false,
	"visibility" varchar(20) DEFAULT 'default',
	"metadata" jsonb,
	"attachments" jsonb,
	"created_by" text NOT NULL,
	"cancelled_at" timestamp,
	"cancelled_by" text,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_attendees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text,
	"email" text NOT NULL,
	"name" text,
	"status" "attendee_status" DEFAULT 'invited',
	"is_optional" boolean DEFAULT false,
	"is_organizer" boolean DEFAULT false,
	"responded_at" timestamp,
	"response_comment" text,
	"notification_sent" boolean DEFAULT false,
	"last_notification_at" timestamp,
	"external_attendee_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meeting_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"display_name" text,
	"description" text,
	"building_name" varchar(200),
	"floor" varchar(50),
	"room_number" varchar(50),
	"address" text,
	"capacity" integer DEFAULT 10,
	"features" jsonb,
	"equipment" jsonb,
	"status" "room_status" DEFAULT 'available',
	"is_active" boolean DEFAULT true,
	"requires_approval" boolean DEFAULT false,
	"min_booking_duration" integer DEFAULT 30,
	"max_booking_duration" integer DEFAULT 480,
	"advance_booking_days" integer DEFAULT 90,
	"operating_hours" jsonb,
	"allowed_user_roles" jsonb,
	"blocked_dates" jsonb,
	"contact_person_id" text,
	"contact_email" text,
	"contact_phone" varchar(20),
	"image_url" text,
	"floor_plan_url" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "room_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"event_id" uuid,
	"tenant_id" text NOT NULL,
	"booked_by" text NOT NULL,
	"booked_for" text,
	"purpose" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"setup_required" boolean DEFAULT false,
	"setup_time" integer DEFAULT 0,
	"catering_required" boolean DEFAULT false,
	"catering_notes" text,
	"special_requests" text,
	"status" "event_status" DEFAULT 'scheduled',
	"requires_approval" boolean DEFAULT false,
	"approved_by" text,
	"approved_at" timestamp,
	"approval_notes" text,
	"checked_in_at" timestamp,
	"checked_in_by" text,
	"checked_out_at" timestamp,
	"actual_end_time" timestamp,
	"cancelled_at" timestamp,
	"cancelled_by" text,
	"cancellation_reason" text,
	"attendee_count" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar_sharing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_id" uuid NOT NULL,
	"tenant_id" text NOT NULL,
	"shared_with_user_id" text,
	"shared_with_email" text,
	"shared_with_role" varchar(50),
	"permission" "calendar_permission" DEFAULT 'viewer',
	"can_create_events" boolean DEFAULT false,
	"can_edit_events" boolean DEFAULT false,
	"can_delete_events" boolean DEFAULT false,
	"can_share" boolean DEFAULT false,
	"invited_by" text NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "external_calendar_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_account_id" text NOT NULL,
	"provider_email" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"scope" text,
	"sync_enabled" boolean DEFAULT true,
	"sync_direction" varchar(20) DEFAULT 'both',
	"last_sync_at" timestamp,
	"next_sync_at" timestamp,
	"sync_status" "sync_status" DEFAULT 'synced',
	"sync_error" text,
	"sync_past_days" integer DEFAULT 30,
	"sync_future_days" integer DEFAULT 365,
	"sync_only_free_time" boolean DEFAULT false,
	"calendar_mappings" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"reminder_minutes" integer NOT NULL,
	"reminder_type" varchar(20) DEFAULT 'notification',
	"scheduled_for" timestamp NOT NULL,
	"sent_at" timestamp,
	"status" varchar(20) DEFAULT 'pending',
	"error" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"tenant_id" text,
	"recipient" text NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"subject" text,
	"template" text,
	"status" "notification_status" NOT NULL,
	"error" text,
	"sent_at" timestamp NOT NULL,
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" text NOT NULL,
	"category" text DEFAULT 'General',
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member_political_participation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"cope_member" boolean DEFAULT false,
	"cope_enrollment_date" date,
	"cope_contributions_total" numeric(10, 2) DEFAULT 0.00,
	"engagement_level" varchar(50),
	"campaigns_participated" jsonb,
	"activities_count" integer DEFAULT 0,
	"meetings_attended" integer DEFAULT 0,
	"letters_written" integer DEFAULT 0,
	"calls_made" integer DEFAULT 0,
	"hours_volunteered" integer DEFAULT 0,
	"political_skills" jsonb,
	"issue_interests" jsonb,
	"preferred_engagement" jsonb,
	"available_weekdays" boolean DEFAULT false,
	"available_evenings" boolean DEFAULT true,
	"available_weekends" boolean DEFAULT true,
	"federal_riding" varchar(200),
	"provincial_riding" varchar(200),
	"municipal_ward" varchar(200),
	"registered_to_vote" boolean,
	"voter_registration_verified_date" date,
	"political_training_completed" boolean DEFAULT false,
	"training_completion_date" date,
	"contact_for_campaigns" boolean DEFAULT true,
	"contact_method_preference" varchar(50),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "elected_officials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"full_name" varchar(200),
	"preferred_name" varchar(200),
	"honorific" varchar(50),
	"office_title" varchar(200),
	"government_level" "government_level" NOT NULL,
	"jurisdiction" varchar(200),
	"electoral_district" varchar(200),
	"district_number" varchar(50),
	"political_party" "political_party",
	"party_caucus_role" varchar(100),
	"parliament_hill_office_phone" varchar(50),
	"parliament_hill_office_address" text,
	"constituency_office_phone" varchar(50),
	"constituency_office_address" text,
	"email" varchar(255),
	"website_url" text,
	"twitter_handle" varchar(100),
	"facebook_url" text,
	"linkedin_url" text,
	"chief_of_staff_name" varchar(200),
	"chief_of_staff_email" varchar(255),
	"chief_of_staff_phone" varchar(50),
	"legislative_assistant_name" varchar(200),
	"legislative_assistant_email" varchar(255),
	"committee_memberships" jsonb,
	"cabinet_position" varchar(200),
	"critic_portfolios" jsonb,
	"first_elected_date" date,
	"current_term_start_date" date,
	"current_term_end_date" date,
	"previous_terms_count" integer DEFAULT 0,
	"labor_friendly_rating" integer,
	"previous_union_member" boolean DEFAULT false,
	"previous_union_name" varchar(200),
	"voted_for_labor_bills" integer DEFAULT 0,
	"voted_against_labor_bills" integer DEFAULT 0,
	"last_contact_date" date,
	"total_meetings_held" integer DEFAULT 0,
	"total_letters_sent" integer DEFAULT 0,
	"responsive" boolean,
	"responsiveness_notes" text,
	"union_endorsed" boolean DEFAULT false,
	"union_contribution_amount" numeric(10, 2),
	"volunteers_provided" integer DEFAULT 0,
	"is_current" boolean DEFAULT true,
	"defeat_date" date,
	"retirement_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "legislation_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"bill_number" varchar(50) NOT NULL,
	"bill_title" varchar(500) NOT NULL,
	"short_title" varchar(200),
	"government_level" "government_level" NOT NULL,
	"jurisdiction" varchar(200),
	"legislative_session" varchar(100),
	"bill_type" varchar(50),
	"sponsor_name" varchar(200),
	"sponsor_party" "political_party",
	"sponsor_official_id" uuid,
	"bill_summary" text,
	"impact_on_labor" text,
	"key_provisions" text,
	"current_status" "bill_status" DEFAULT 'introduced',
	"introduction_date" date,
	"first_reading_date" date,
	"second_reading_date" date,
	"committee_referral_date" date,
	"committee_name" varchar(200),
	"third_reading_date" date,
	"passed_date" date,
	"royal_assent_date" date,
	"union_position" "union_position" DEFAULT 'monitoring',
	"position_rationale" text,
	"active_campaign" boolean DEFAULT false,
	"campaign_id" uuid,
	"committee_presentation_scheduled" boolean DEFAULT false,
	"committee_presentation_date" date,
	"written_submission_filed" boolean DEFAULT false,
	"written_submission_url" text,
	"members_contacted_mp" integer DEFAULT 0,
	"letters_sent_to_mps" integer DEFAULT 0,
	"petition_signatures" integer DEFAULT 0,
	"amendments_proposed" jsonb,
	"amendments_adopted" integer DEFAULT 0,
	"coalition_partners" jsonb,
	"final_outcome" varchar(100),
	"outcome_date" date,
	"outcome_impact_assessment" text,
	"bill_text_url" text,
	"legislative_summary_url" text,
	"committee_report_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "political_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"campaign_id" uuid,
	"activity_type" "political_activity_type" NOT NULL,
	"activity_name" varchar(200),
	"activity_date" date NOT NULL,
	"activity_time" time,
	"elected_official_id" uuid,
	"elected_official_name" varchar(200),
	"legislation_id" uuid,
	"bill_number" varchar(50),
	"location" varchar(300),
	"is_virtual" boolean DEFAULT false,
	"meeting_link" text,
	"members_participated" jsonb,
	"members_count" integer DEFAULT 0,
	"volunteers_count" integer DEFAULT 0,
	"doors_knocked" integer DEFAULT 0,
	"calls_made" integer DEFAULT 0,
	"contacts_reached" integer DEFAULT 0,
	"petition_signatures_collected" integer DEFAULT 0,
	"outcome_summary" text,
	"commitments_received" text,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" date,
	"meeting_notes_url" text,
	"photos_urls" jsonb,
	"media_coverage_urls" jsonb,
	"activity_cost" numeric(10, 2) DEFAULT 0.00,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_political_campaign_dashboard" (
	"campaign_id" uuid,
	"organization_id" uuid,
	"campaign_name" varchar(300),
	"campaign_type" "political_campaign_type",
	"campaign_status" "political_campaign_status",
	"jurisdiction_level" varchar(50),
	"start_date" date,
	"end_date" date,
	"election_date" date,
	"members_participated" integer,
	"member_participation_goal" integer,
	"participation_percentage" numeric,
	"doors_knocked" integer,
	"phone_calls_made" integer,
	"petition_signatures_collected" integer,
	"budget_allocated" numeric(12, 2),
	"expenses_to_date" numeric(12, 2),
	"budget_used_percentage" numeric,
	"total_activities" bigint,
	"activities_last_week" bigint,
	"total_doors_knocked" bigint,
	"total_calls_made" bigint
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_elected_official_engagement" (
	"official_id" uuid,
	"organization_id" uuid,
	"full_name" varchar(200),
	"office_title" varchar(200),
	"government_level" "government_level",
	"electoral_district" varchar(200),
	"political_party" "political_party",
	"labor_friendly_rating" integer,
	"total_meetings_held" integer,
	"last_contact_date" date,
	"total_activities" bigint,
	"activities_last_90_days" bigint,
	"voted_for_labor_bills" integer,
	"voted_against_labor_bills" integer,
	"labor_support_percentage" numeric
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_legislative_priorities" (
	"legislation_id" uuid,
	"organization_id" uuid,
	"bill_number" varchar(50),
	"bill_title" varchar(500),
	"government_level" "government_level",
	"current_status" "bill_status",
	"union_position" "union_position",
	"active_campaign" boolean,
	"introduction_date" date,
	"members_contacted_mp" integer,
	"letters_sent_to_mps" integer,
	"petition_signatures" integer,
	"campaign_name" varchar(300),
	"campaign_status" "political_campaign_status",
	"total_activities" bigint,
	"last_activity_date" date
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"course_code" varchar(50) NOT NULL,
	"course_name" varchar(300) NOT NULL,
	"course_description" text,
	"course_category" "course_category" NOT NULL,
	"delivery_method" "course_delivery_method" NOT NULL,
	"course_difficulty" "course_difficulty" DEFAULT 'all_levels',
	"duration_hours" numeric(5, 2),
	"duration_days" integer,
	"has_prerequisites" boolean DEFAULT false,
	"prerequisite_courses" jsonb,
	"prerequisite_certifications" jsonb,
	"learning_objectives" text,
	"course_outline" jsonb,
	"course_materials_url" text,
	"presentation_slides_url" text,
	"workbook_url" text,
	"additional_resources" jsonb,
	"primary_instructor_name" varchar(200),
	"instructor_ids" jsonb,
	"min_enrollment" integer DEFAULT 5,
	"max_enrollment" integer DEFAULT 30,
	"provides_certification" boolean DEFAULT false,
	"certification_name" varchar(200),
	"certification_valid_years" integer,
	"clc_approved" boolean DEFAULT false,
	"clc_approval_date" date,
	"clc_course_code" varchar(50),
	"course_fee" numeric(10, 2) DEFAULT 0.00,
	"materials_fee" numeric(10, 2) DEFAULT 0.00,
	"travel_subsidy_available" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_mandatory" boolean DEFAULT false,
	"mandatory_for_roles" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "training_courses_course_code_key" UNIQUE("course_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "in_app_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"action_label" text,
	"action_url" text,
	"data" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"session_code" varchar(50) NOT NULL,
	"session_name" varchar(300),
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"session_times" jsonb,
	"delivery_method" "course_delivery_method" NOT NULL,
	"venue_name" varchar(200),
	"venue_address" text,
	"room_number" varchar(50),
	"virtual_meeting_url" text,
	"virtual_meeting_access_code" varchar(50),
	"lead_instructor_id" uuid,
	"lead_instructor_name" varchar(200),
	"co_instructors" jsonb,
	"registration_open_date" date,
	"registration_close_date" date,
	"registration_count" integer DEFAULT 0,
	"waitlist_count" integer DEFAULT 0,
	"max_enrollment" integer,
	"session_status" "session_status" DEFAULT 'scheduled',
	"attendees_count" integer DEFAULT 0,
	"completions_count" integer DEFAULT 0,
	"completion_rate" numeric(5, 2),
	"average_rating" numeric(3, 2),
	"evaluation_responses_count" integer DEFAULT 0,
	"session_budget" numeric(10, 2),
	"actual_cost" numeric(10, 2),
	"travel_subsidy_offered" boolean DEFAULT false,
	"accommodation_arranged" boolean DEFAULT false,
	"accommodation_hotel" varchar(200),
	"materials_prepared" boolean DEFAULT false,
	"materials_distributed_count" integer DEFAULT 0,
	"cancellation_reason" text,
	"cancelled_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "course_sessions_session_code_key" UNIQUE("session_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"registration_date" timestamp with time zone DEFAULT now(),
	"registration_status" "registration_status" DEFAULT 'registered',
	"requires_approval" boolean DEFAULT false,
	"approved_by" uuid,
	"approved_date" date,
	"approval_notes" text,
	"attended" boolean DEFAULT false,
	"attendance_dates" jsonb,
	"attendance_hours" numeric(5, 2),
	"completed" boolean DEFAULT false,
	"completion_date" date,
	"completion_percentage" numeric(5, 2) DEFAULT 0.00,
	"pre_test_score" numeric(5, 2),
	"post_test_score" numeric(5, 2),
	"final_grade" varchar(10),
	"passed" boolean,
	"certificate_issued" boolean DEFAULT false,
	"certificate_number" varchar(100),
	"certificate_issue_date" date,
	"certificate_url" text,
	"evaluation_completed" boolean DEFAULT false,
	"evaluation_rating" numeric(3, 2),
	"evaluation_comments" text,
	"evaluation_submitted_date" date,
	"travel_required" boolean DEFAULT false,
	"travel_subsidy_requested" boolean DEFAULT false,
	"travel_subsidy_approved" boolean DEFAULT false,
	"travel_subsidy_amount" numeric(10, 2),
	"accommodation_required" boolean DEFAULT false,
	"course_fee" numeric(10, 2) DEFAULT 0.00,
	"fee_paid" boolean DEFAULT false,
	"fee_payment_date" date,
	"fee_waived" boolean DEFAULT false,
	"fee_waiver_reason" text,
	"cancellation_date" date,
	"cancellation_reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pension_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"plan_name" varchar(200) NOT NULL,
	"plan_number" varchar(50),
	"plan_type" "pension_plan_type" NOT NULL,
	"plan_status" "pension_plan_status" DEFAULT 'active',
	"is_taft_hartley" boolean DEFAULT false,
	"is_multi_employer" boolean DEFAULT false,
	"participating_employers_count" integer,
	"cra_registration_number" varchar(50),
	"irs_ein" varchar(20),
	"form_5500_required" boolean DEFAULT false,
	"t3_filing_required" boolean DEFAULT true,
	"benefit_formula" text,
	"contribution_rate" numeric(5, 2),
	"normal_retirement_age" integer DEFAULT 65,
	"early_retirement_age" integer DEFAULT 55,
	"vesting_period_years" integer DEFAULT 2,
	"current_assets" numeric(15, 2),
	"current_liabilities" numeric(15, 2),
	"funded_ratio" numeric(5, 2),
	"solvency_ratio" numeric(5, 2),
	"last_valuation_date" date,
	"next_valuation_date" date,
	"valuation_frequency_months" integer DEFAULT 36,
	"actuary_firm" varchar(200),
	"actuary_contact" varchar(200),
	"plan_effective_date" date NOT NULL,
	"plan_year_end" date NOT NULL,
	"fiscal_year_end" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pension_hours_banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pension_plan_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"reporting_period_start" date NOT NULL,
	"reporting_period_end" date NOT NULL,
	"total_hours_worked" numeric(10, 2) DEFAULT 0 NOT NULL,
	"pensionable_hours" numeric(10, 2) DEFAULT 0 NOT NULL,
	"overtime_hours" numeric(10, 2) DEFAULT 0,
	"primary_employer_id" uuid,
	"secondary_employer_ids" jsonb,
	"reciprocal_hours" numeric(10, 2) DEFAULT 0,
	"reciprocal_plan_ids" jsonb,
	"contribution_credits" numeric(10, 2),
	"status" varchar(50) DEFAULT 'active',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_member_period" UNIQUE("pension_plan_id","member_id","reporting_period_start")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ml_predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"prediction_type" varchar(50) NOT NULL,
	"prediction_date" date NOT NULL,
	"predicted_value" numeric NOT NULL,
	"lower_bound" numeric,
	"upper_bound" numeric,
	"confidence" numeric,
	"horizon" integer,
	"granularity" varchar(20),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "unique_prediction" UNIQUE("organization_id","prediction_type","prediction_date","horizon")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pension_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pension_plan_id" uuid NOT NULL,
	"employer_id" uuid,
	"employer_name" varchar(200) NOT NULL,
	"employer_registration_number" varchar(50),
	"contribution_period_start" date NOT NULL,
	"contribution_period_end" date NOT NULL,
	"due_date" date NOT NULL,
	"total_members_covered" integer NOT NULL,
	"member_contributions" jsonb,
	"total_contribution_amount" numeric(12, 2) NOT NULL,
	"employer_portion" numeric(12, 2),
	"employee_portion" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'CAD',
	"expected_amount" numeric(12, 2),
	"variance_amount" numeric(12, 2),
	"variance_percentage" numeric(5, 2),
	"reconciliation_status" varchar(50) DEFAULT 'pending',
	"payment_status" varchar(50) DEFAULT 'pending',
	"payment_date" date,
	"payment_method" varchar(50),
	"payment_reference" varchar(100),
	"is_late" boolean DEFAULT false,
	"days_late" integer,
	"late_fee_amount" numeric(10, 2),
	"interest_charged" numeric(10, 2),
	"remittance_file_url" text,
	"reconciliation_report_url" text,
	"contribution_hash" varchar(128),
	"blockchain_tx_hash" varchar(200),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"processed_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pension_trustee_boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pension_plan_id" uuid NOT NULL,
	"board_name" varchar(200) NOT NULL,
	"is_joint_board" boolean DEFAULT true,
	"total_trustees" integer NOT NULL,
	"labor_trustees_required" integer,
	"management_trustees_required" integer,
	"independent_trustees_required" integer DEFAULT 0,
	"meeting_frequency" varchar(50),
	"quorum_requirement" integer,
	"bylaws_url" text,
	"trust_agreement_url" text,
	"investment_policy_url" text,
	"established_date" date,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "model_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"model_type" varchar(50) NOT NULL,
	"version" varchar(20) NOT NULL,
	"accuracy" numeric,
	"trained_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"parameters" jsonb,
	CONSTRAINT "unique_model" UNIQUE("organization_id","model_type","version")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pension_trustees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trustee_board_id" uuid NOT NULL,
	"user_id" uuid,
	"trustee_name" varchar(200) NOT NULL,
	"trustee_type" varchar(50) NOT NULL,
	"position" varchar(100),
	"is_voting_member" boolean DEFAULT true,
	"term_start_date" date NOT NULL,
	"term_end_date" date,
	"term_length_years" integer DEFAULT 3,
	"is_current" boolean DEFAULT true,
	"representing_organization" varchar(200),
	"representing_organization_id" uuid,
	"email" varchar(255),
	"phone" varchar(50),
	"notes" text,
	"appointed_at" timestamp with time zone DEFAULT now(),
	"appointed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"metric_type" text NOT NULL,
	"metric_name" text NOT NULL,
	"metric_value" numeric NOT NULL,
	"metric_unit" text,
	"period_type" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"metadata" jsonb,
	"comparison_value" numeric,
	"trend" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pension_trustee_meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trustee_board_id" uuid NOT NULL,
	"meeting_title" varchar(200) NOT NULL,
	"meeting_type" varchar(50) DEFAULT 'regular',
	"meeting_date" date NOT NULL,
	"meeting_start_time" time,
	"meeting_end_time" time,
	"meeting_location" varchar(200),
	"is_virtual" boolean DEFAULT false,
	"meeting_link" text,
	"trustees_present" jsonb,
	"trustees_absent" jsonb,
	"guests_present" jsonb,
	"quorum_met" boolean,
	"agenda_url" text,
	"minutes_url" text,
	"minutes_approved" boolean DEFAULT false,
	"minutes_approved_date" date,
	"motions" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pension_benefit_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pension_plan_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"claim_type" "pension_claim_type" NOT NULL,
	"claim_number" varchar(50),
	"claim_status" varchar(50) DEFAULT 'pending',
	"claim_date" date DEFAULT CURRENT_DATE NOT NULL,
	"benefit_start_date" date,
	"benefit_end_date" date,
	"monthly_benefit_amount" numeric(10, 2),
	"annual_benefit_amount" numeric(10, 2),
	"lump_sum_amount" numeric(12, 2),
	"years_of_service" numeric(8, 2),
	"final_average_earnings" numeric(10, 2),
	"benefit_formula_used" text,
	"reduction_percentage" numeric(5, 2),
	"submitted_by" uuid,
	"reviewed_by" uuid,
	"approved_by" uuid,
	"review_date" date,
	"approval_date" date,
	"denial_reason" text,
	"payment_frequency" varchar(50),
	"payment_method" varchar(50),
	"bank_account_info_encrypted" text,
	"tax_withholding_rate" numeric(5, 2),
	"tax_withholding_amount" numeric(10, 2),
	"application_form_url" text,
	"supporting_documents_urls" jsonb,
	"approval_letter_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "pension_benefit_claims_claim_number_key" UNIQUE("claim_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pension_actuarial_valuations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pension_plan_id" uuid NOT NULL,
	"valuation_date" date NOT NULL,
	"valuation_type" varchar(50) NOT NULL,
	"actuary_firm" varchar(200) NOT NULL,
	"actuary_name" varchar(200),
	"actuary_designation" varchar(50),
	"market_value_assets" numeric(15, 2) NOT NULL,
	"smoothed_value_assets" numeric(15, 2),
	"going_concern_liabilities" numeric(15, 2),
	"solvency_liabilities" numeric(15, 2),
	"wind_up_liabilities" numeric(15, 2),
	"going_concern_surplus_deficit" numeric(15, 2),
	"going_concern_funded_ratio" numeric(5, 2),
	"solvency_surplus_deficit" numeric(15, 2),
	"solvency_funded_ratio" numeric(5, 2),
	"discount_rate" numeric(5, 2),
	"inflation_rate" numeric(5, 2),
	"salary_increase_rate" numeric(5, 2),
	"mortality_table" varchar(100),
	"recommended_employer_contribution" numeric(12, 2),
	"recommended_contribution_rate" numeric(5, 2),
	"special_payment_required" numeric(12, 2),
	"valuation_report_url" text NOT NULL,
	"summary_report_url" text,
	"filed_with_regulator" boolean DEFAULT false,
	"filing_date" date,
	"regulator_response_url" text,
	"next_valuation_required_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hw_benefit_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"plan_name" varchar(200) NOT NULL,
	"plan_type" "hw_plan_type" NOT NULL,
	"plan_number" varchar(50),
	"carrier_name" varchar(200),
	"carrier_policy_number" varchar(100),
	"tpa_name" varchar(200),
	"tpa_contact" varchar(200),
	"coverage_type" varchar(50),
	"coverage_tier_structure" jsonb,
	"monthly_premium_amount" numeric(10, 2),
	"employer_contribution_percentage" numeric(5, 2),
	"employee_contribution_percentage" numeric(5, 2),
	"annual_maximum" numeric(10, 2),
	"lifetime_maximum" numeric(12, 2),
	"deductible" numeric(8, 2),
	"coinsurance_percentage" numeric(5, 2),
	"out_of_pocket_maximum" numeric(10, 2),
	"waiting_period_days" integer DEFAULT 0,
	"hours_required_per_month" integer,
	"plan_year_start" date,
	"plan_year_end" date,
	"renewal_date" date,
	"is_active" boolean DEFAULT true,
	"is_self_insured" boolean DEFAULT false,
	"plan_booklet_url" text,
	"summary_plan_description_url" text,
	"benefits_at_a_glance_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hw_benefit_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hw_plan_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"enrollment_date" date NOT NULL,
	"effective_date" date NOT NULL,
	"termination_date" date,
	"coverage_tier" varchar(50),
	"dependents" jsonb,
	"total_dependents" integer DEFAULT 0,
	"monthly_premium" numeric(10, 2),
	"employer_contribution" numeric(10, 2),
	"employee_contribution" numeric(10, 2),
	"enrollment_status" varchar(50) DEFAULT 'active',
	"qualifying_event" varchar(100),
	"qualifying_event_date" date,
	"waived_coverage" boolean DEFAULT false,
	"waiver_reason" text,
	"enrollment_form_url" text,
	"beneficiary_designation_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_member_plan_period" UNIQUE("hw_plan_id","member_id","effective_date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hw_benefit_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hw_plan_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"claim_number" varchar(50) NOT NULL,
	"carrier_claim_number" varchar(100),
	"service_date" date NOT NULL,
	"service_type" varchar(100),
	"diagnosis_codes" jsonb,
	"procedure_codes" jsonb,
	"provider_name" varchar(200),
	"provider_npi" varchar(20),
	"provider_type" varchar(100),
	"provider_tax_id" varchar(20),
	"patient_name" varchar(200),
	"patient_relationship" varchar(50),
	"total_billed_amount" numeric(10, 2) NOT NULL,
	"eligible_amount" numeric(10, 2),
	"deductible_applied" numeric(10, 2) DEFAULT 0,
	"coinsurance_amount" numeric(10, 2) DEFAULT 0,
	"copay_amount" numeric(10, 2) DEFAULT 0,
	"plan_paid_amount" numeric(10, 2),
	"member_responsibility" numeric(10, 2),
	"is_cob" boolean DEFAULT false,
	"primary_payer" varchar(200),
	"primary_payer_amount" numeric(10, 2),
	"claim_status" "hw_claim_status" DEFAULT 'submitted',
	"submission_date" date DEFAULT CURRENT_DATE NOT NULL,
	"received_date" date,
	"processed_date" date,
	"paid_date" date,
	"denial_reason" text,
	"denial_code" varchar(50),
	"appeal_deadline" date,
	"appeal_submitted_date" date,
	"appeal_decision_date" date,
	"appeal_notes" text,
	"edi_837_file_url" text,
	"edi_835_file_url" text,
	"edi_277_status_url" text,
	"payment_method" varchar(50),
	"payment_reference" varchar(100),
	"eob_url" text,
	"flagged_for_review" boolean DEFAULT false,
	"fraud_score" integer,
	"fraud_indicators" jsonb,
	"claim_form_url" text,
	"supporting_documents_urls" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"submitted_by" uuid,
	"processed_by" uuid,
	CONSTRAINT "hw_benefit_claims_claim_number_key" UNIQUE("claim_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trust_compliance_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pension_plan_id" uuid,
	"hw_plan_id" uuid,
	"organization_id" uuid NOT NULL,
	"report_type" varchar(100) NOT NULL,
	"report_year" integer NOT NULL,
	"report_period_start" date NOT NULL,
	"report_period_end" date NOT NULL,
	"due_date" date NOT NULL,
	"filed_date" date,
	"filing_status" varchar(50) DEFAULT 'pending',
	"regulator" varchar(100),
	"filing_confirmation_number" varchar(100),
	"total_plan_assets" numeric(15, 2),
	"total_plan_liabilities" numeric(15, 2),
	"total_contributions_received" numeric(12, 2),
	"total_benefits_paid" numeric(12, 2),
	"administrative_expenses" numeric(10, 2),
	"audit_required" boolean DEFAULT false,
	"auditor_name" varchar(200),
	"auditor_opinion" varchar(50),
	"audit_report_url" text,
	"is_late" boolean DEFAULT false,
	"days_late" integer,
	"late_filing_penalty" numeric(10, 2),
	"penalty_paid" boolean DEFAULT false,
	"report_file_url" text NOT NULL,
	"schedules_urls" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"prepared_by" uuid,
	"filed_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_pension_funding_summary" (
	"plan_id" uuid,
	"organization_id" uuid,
	"plan_name" varchar(200),
	"plan_type" "pension_plan_type",
	"is_multi_employer" boolean,
	"current_assets" numeric(15, 2),
	"current_liabilities" numeric(15, 2),
	"funded_ratio" numeric(5, 2),
	"latest_gc_funded_ratio" numeric(5, 2),
	"latest_solvency_funded_ratio" numeric(5, 2),
	"latest_valuation_date" date,
	"total_active_members" bigint,
	"total_pensionable_hours" numeric,
	"total_benefit_claims" bigint,
	"total_annual_benefits_approved" numeric
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_hw_claims_aging" (
	"plan_id" uuid,
	"organization_id" uuid,
	"plan_name" varchar(200),
	"plan_type" "hw_plan_type",
	"total_claims" bigint,
	"total_billed" numeric,
	"total_paid" numeric,
	"pending_count" bigint,
	"pending_amount" numeric,
	"aged_30_days_count" bigint,
	"aged_60_days_count" bigint,
	"aged_90_days_count" bigint,
	"avg_processing_days" numeric
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_member_benefit_eligibility" (
	"member_id" uuid,
	"organization_id" uuid,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"membership_status" varchar(50),
	"pension_plans_enrolled" bigint,
	"total_pension_hours" numeric,
	"last_pension_contribution_date" date,
	"hw_plans_enrolled" bigint,
	"active_hw_enrollments" bigint,
	"latest_hw_enrollment_date" date,
	"total_pension_claims" bigint,
	"total_hw_claims" bigint,
	"total_pension_benefits_claimed" numeric,
	"total_hw_benefits_paid" numeric
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tax_year_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"tax_year" integer NOT NULL,
	"t4a_filing_deadline" date NOT NULL,
	"cope_receipt_deadline" date NOT NULL,
	"rl_1_filing_deadline" date,
	"cra_transmitter_number" varchar(8),
	"cra_web_access_code" varchar(16),
	"cra_business_number" varchar(15),
	"rq_identification_number" varchar(10),
	"rq_file_number" varchar(6),
	"elections_canada_agent_id" varchar(50),
	"elections_canada_recipient_number" varchar(20),
	"organization_contact_name" varchar(200),
	"organization_contact_phone" varchar(50),
	"organization_contact_email" varchar(255),
	"organization_mailing_address" text,
	"is_finalized" boolean DEFAULT false,
	"finalized_at" timestamp with time zone,
	"finalized_by" uuid,
	"xml_file_generated" boolean DEFAULT false,
	"xml_generated_at" timestamp with time zone,
	"submitted_to_cra" boolean DEFAULT false,
	"cra_submission_date" date,
	"cra_confirmation_number" varchar(100),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_org_tax_year" UNIQUE("organization_id","tax_year")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trend_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"analysis_type" text NOT NULL,
	"data_source" text NOT NULL,
	"time_range" jsonb NOT NULL,
	"detected_trend" text,
	"trend_strength" numeric,
	"anomalies_detected" jsonb,
	"anomaly_count" integer DEFAULT 0,
	"seasonal_pattern" jsonb,
	"correlations" jsonb,
	"insights" text,
	"recommendations" jsonb,
	"statistical_tests" jsonb,
	"visualization_data" jsonb,
	"confidence" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tax_slips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"tax_year_config_id" uuid NOT NULL,
	"member_id" uuid,
	"recipient_name" varchar(200) NOT NULL,
	"recipient_sin" varchar(11),
	"recipient_address_line1" varchar(200),
	"recipient_address_line2" varchar(200),
	"recipient_city" varchar(100),
	"recipient_province" varchar(2),
	"recipient_postal_code" varchar(7),
	"slip_type" "tax_slip_type" NOT NULL,
	"tax_year" integer NOT NULL,
	"slip_number" varchar(50) NOT NULL,
	"box_016_pension_amount" integer DEFAULT 0,
	"box_018_lump_sum_amount" integer DEFAULT 0,
	"box_020_self_employed_commissions" integer DEFAULT 0,
	"box_022_income_tax_deducted" integer DEFAULT 0,
	"box_024_annuities" integer DEFAULT 0,
	"box_048_fees_for_services" integer DEFAULT 0,
	"box_101_resp_accumulated_income" integer DEFAULT 0,
	"box_102_resp_educational_assistance" integer DEFAULT 0,
	"box_105_other_income" integer DEFAULT 0,
	"cope_contribution_amount" integer DEFAULT 0,
	"cope_eligible_amount" integer DEFAULT 0,
	"cope_ineligible_amount" integer DEFAULT 0,
	"rl_1_box_o_pension_amount" integer DEFAULT 0,
	"quebec_provincial_tax_withheld" integer DEFAULT 0,
	"source_transaction_ids" jsonb,
	"is_amended" boolean DEFAULT false,
	"original_slip_id" uuid,
	"amendment_number" integer DEFAULT 0,
	"amendment_reason" text,
	"slip_status" varchar(50) DEFAULT 'draft',
	"finalized_at" timestamp with time zone,
	"issued_at" timestamp with time zone,
	"delivery_method" varchar(50),
	"email_sent_at" timestamp with time zone,
	"email_opened_at" timestamp with time zone,
	"downloaded_at" timestamp with time zone,
	"pdf_url" text,
	"pdf_generated_at" timestamp with time zone,
	"included_in_xml_batch" boolean DEFAULT false,
	"xml_batch_id" uuid,
	"slip_hash" varchar(128),
	"digital_signature" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "tax_slips_slip_number_key" UNIQUE("slip_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cra_xml_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"tax_year_config_id" uuid NOT NULL,
	"batch_number" varchar(50) NOT NULL,
	"tax_year" integer NOT NULL,
	"return_type" varchar(20) NOT NULL,
	"transmitter_number" varchar(8) NOT NULL,
	"transmitter_name" varchar(200),
	"transmitter_type" varchar(10) DEFAULT 'E',
	"total_slips_count" integer NOT NULL,
	"total_amount_reported" integer NOT NULL,
	"total_tax_withheld" integer NOT NULL,
	"xml_filename" varchar(255),
	"xml_file_size_bytes" bigint,
	"xml_schema_version" varchar(20),
	"xml_content" text,
	"xml_file_url" text,
	"generated_at" timestamp with time zone,
	"generated_by" uuid,
	"submission_method" varchar(50),
	"submitted_at" timestamp with time zone,
	"submitted_by" uuid,
	"cra_confirmation_number" varchar(100),
	"cra_accepted" boolean,
	"cra_response_date" date,
	"cra_response_details" jsonb,
	"cra_errors" jsonb,
	"batch_status" varchar(50) DEFAULT 'draft',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "cra_xml_batches_batch_number_key" UNIQUE("batch_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cope_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"contribution_date" date NOT NULL,
	"contribution_type" varchar(50) DEFAULT 'payroll_deduction',
	"total_amount" integer NOT NULL,
	"political_portion" integer NOT NULL,
	"administrative_portion" integer NOT NULL,
	"is_eligible_for_credit" boolean DEFAULT true,
	"ineligible_reason" text,
	"payment_method" varchar(50),
	"payment_reference" varchar(100),
	"dues_transaction_id" uuid,
	"financial_transaction_id" uuid,
	"receipt_issued" boolean DEFAULT false,
	"receipt_issued_date" date,
	"tax_slip_id" uuid,
	"reported_to_elections_canada" boolean DEFAULT false,
	"elections_canada_report_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_tax_slip_summary" (
	"organization_id" uuid,
	"tax_year" integer,
	"slip_type" "tax_slip_type",
	"slip_status" varchar(50),
	"total_slips" bigint,
	"total_amount_cents" bigint,
	"total_amount_dollars" numeric,
	"total_tax_withheld_cents" bigint,
	"total_tax_withheld_dollars" numeric,
	"slips_emailed" bigint,
	"slips_downloaded" bigint
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_cope_member_summary" (
	"organization_id" uuid,
	"member_id" uuid,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"email" varchar(255),
	"total_contributions" bigint,
	"first_contribution_date" date,
	"latest_contribution_date" date,
	"lifetime_total_cents" bigint,
	"lifetime_total_dollars" numeric,
	"lifetime_political_cents" bigint,
	"lifetime_political_dollars" numeric,
	"receipts_issued" bigint,
	"receipts_pending" bigint
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member_demographics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"data_collection_consent" boolean DEFAULT false NOT NULL,
	"consent_date" timestamp with time zone,
	"consent_withdrawn_date" timestamp with time zone,
	"consent_type" varchar(50),
	"consent_purpose" text,
	"data_retention_years" integer DEFAULT 7,
	"data_expiry_date" date,
	"equity_groups" jsonb DEFAULT '[]'::jsonb,
	"gender_identity" "gender_identity_type",
	"gender_identity_other" text,
	"is_indigenous" boolean,
	"indigenous_identity" "indigenous_identity_type",
	"indigenous_nation" varchar(200),
	"indigenous_treaty_number" varchar(50),
	"indigenous_data_governance_consent" boolean DEFAULT false,
	"is_visible_minority" boolean,
	"visible_minority_groups" jsonb,
	"has_disability" boolean,
	"disability_types" jsonb,
	"requires_accommodation" boolean,
	"accommodation_details_encrypted" text,
	"is_lgbtq2plus" boolean,
	"lgbtq2plus_identity" jsonb,
	"date_of_birth" date,
	"age_range" varchar(20),
	"is_newcomer" boolean,
	"immigration_year" integer,
	"country_of_origin" varchar(100),
	"primary_language" varchar(50),
	"speaks_french" boolean,
	"speaks_indigenous_language" boolean,
	"indigenous_language_name" varchar(100),
	"intersectionality_count" integer,
	"needs_interpretation" boolean DEFAULT false,
	"interpretation_language" varchar(100),
	"needs_translation" boolean DEFAULT false,
	"translation_language" varchar(100),
	"needs_mobility_accommodation" boolean DEFAULT false,
	"allow_aggregate_reporting" boolean DEFAULT true,
	"allow_research_participation" boolean DEFAULT false,
	"allow_external_reporting" boolean DEFAULT false,
	"data_access_log" jsonb DEFAULT '[]'::jsonb,
	"last_updated_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "member_demographics_member_id_key" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_critical_deadlines" (
	"id" uuid,
	"claim_id" uuid,
	"tenant_id" varchar(255),
	"deadline_rule_id" uuid,
	"deadline_name" varchar(255),
	"deadline_type" varchar(100),
	"event_date" timestamp,
	"original_deadline" timestamp,
	"due_date" timestamp,
	"completed_at" timestamp,
	"status" "deadline_status",
	"priority" "deadline_priority",
	"extension_count" integer,
	"total_extension_days" integer,
	"last_extension_date" timestamp,
	"last_extension_reason" text,
	"completed_by" uuid,
	"completion_notes" text,
	"is_overdue" boolean,
	"days_until_due" integer,
	"days_overdue" integer,
	"escalated_at" timestamp,
	"escalated_to" uuid,
	"alert_count" integer,
	"last_alert_sent" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp,
	"is_overdue_calc" boolean,
	"days_overdue_calc" integer,
	"days_until_due_calc" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pay_equity_complaints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"complainant_member_id" uuid,
	"complainant_name" varchar(200),
	"is_anonymous" boolean DEFAULT false,
	"is_group_complaint" boolean DEFAULT false,
	"group_member_count" integer,
	"group_member_ids" jsonb,
	"complaint_number" varchar(50) NOT NULL,
	"filed_date" date DEFAULT CURRENT_DATE NOT NULL,
	"job_class_complainant" varchar(200) NOT NULL,
	"job_class_comparator" varchar(200) NOT NULL,
	"complainant_hourly_rate" numeric(10, 2),
	"comparator_hourly_rate" numeric(10, 2),
	"estimated_pay_gap_percentage" numeric(5, 2),
	"estimated_annual_loss" numeric(10, 2),
	"skill_comparison" text,
	"effort_comparison" text,
	"responsibility_comparison" text,
	"working_conditions_comparison" text,
	"jurisdiction" varchar(50),
	"legislation_cited" varchar(200),
	"complaint_status" "pay_equity_status" DEFAULT 'intake',
	"assigned_investigator" uuid,
	"investigation_start_date" date,
	"investigation_completion_date" date,
	"employer_response_date" date,
	"employer_position" text,
	"employer_supporting_documents_urls" jsonb,
	"union_representative_id" uuid,
	"union_position" text,
	"union_supporting_documents_urls" jsonb,
	"mediation_scheduled_date" date,
	"mediator_name" varchar(200),
	"mediation_outcome" varchar(50),
	"resolution_date" date,
	"resolution_type" varchar(50),
	"settlement_amount" numeric(12, 2),
	"retroactive_payment_amount" numeric(12, 2),
	"retroactive_period_start" date,
	"retroactive_period_end" date,
	"ongoing_pay_adjustment" numeric(10, 2),
	"appeal_filed" boolean DEFAULT false,
	"appeal_filed_date" date,
	"appeal_decision_date" date,
	"appeal_outcome" text,
	"reported_to_statcan" boolean DEFAULT false,
	"statcan_report_date" date,
	"complaint_form_url" text,
	"investigation_report_url" text,
	"settlement_agreement_url" text,
	"is_confidential" boolean DEFAULT true,
	"confidentiality_restrictions" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "pay_equity_complaints_complaint_number_key" UNIQUE("complaint_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "equity_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"snapshot_date" date DEFAULT CURRENT_DATE NOT NULL,
	"snapshot_type" varchar(50) DEFAULT 'annual',
	"total_members" integer NOT NULL,
	"total_active_members" integer,
	"women_count" integer DEFAULT 0,
	"men_count" integer DEFAULT 0,
	"non_binary_count" integer DEFAULT 0,
	"gender_not_disclosed" integer DEFAULT 0,
	"visible_minority_count" integer DEFAULT 0,
	"indigenous_count" integer DEFAULT 0,
	"persons_with_disabilities_count" integer DEFAULT 0,
	"lgbtq2plus_count" integer DEFAULT 0,
	"first_nations_count" integer DEFAULT 0,
	"inuit_count" integer DEFAULT 0,
	"metis_count" integer DEFAULT 0,
	"multiple_equity_groups_count" integer DEFAULT 0,
	"avg_intersectionality_score" numeric(5, 2),
	"executive_board_total" integer,
	"executive_board_women" integer DEFAULT 0,
	"executive_board_visible_minority" integer DEFAULT 0,
	"executive_board_indigenous" integer DEFAULT 0,
	"stewards_total" integer,
	"stewards_women" integer DEFAULT 0,
	"stewards_visible_minority" integer DEFAULT 0,
	"avg_hourly_rate_all" numeric(10, 2),
	"avg_hourly_rate_women" numeric(10, 2),
	"avg_hourly_rate_men" numeric(10, 2),
	"gender_pay_gap_percentage" numeric(5, 2),
	"total_consent_given" integer,
	"consent_rate_percentage" numeric(5, 2),
	"reported_to_statcan" boolean DEFAULT false,
	"statcan_report_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "unique_org_snapshot_date" UNIQUE("organization_id","snapshot_date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "statcan_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"survey_code" varchar(50) NOT NULL,
	"survey_name" varchar(200),
	"reference_period_start" date NOT NULL,
	"reference_period_end" date NOT NULL,
	"submission_date" date,
	"submitted_by" uuid,
	"data_payload" jsonb NOT NULL,
	"validation_status" varchar(50) DEFAULT 'pending',
	"validation_errors" jsonb,
	"statcan_confirmation_number" varchar(100),
	"statcan_accepted" boolean,
	"statcan_response_date" date,
	"statcan_response_details" jsonb,
	"export_file_url" text,
	"export_file_format" varchar(20),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_equity_statistics_anonymized" (
	"organization_id" uuid,
	"snapshot_date" date,
	"total_members" integer,
	"women_percentage" numeric,
	"visible_minority_percentage" numeric,
	"indigenous_percentage" numeric,
	"disability_percentage" numeric,
	"lgbtq2plus_percentage" numeric,
	"gender_pay_gap_percentage" numeric(5, 2),
	"consent_rate_percentage" numeric(5, 2)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_pay_equity_pipeline" (
	"organization_id" uuid,
	"complaint_status" "pay_equity_status",
	"jurisdiction" varchar(50),
	"total_complaints" bigint,
	"avg_pay_gap_percentage" numeric,
	"total_settlements" numeric,
	"avg_days_to_resolution" numeric,
	"pay_adjustments_granted" bigint,
	"appeals_filed" bigint
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizing_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"campaign_name" varchar(200) NOT NULL,
	"campaign_code" varchar(50) NOT NULL,
	"campaign_type" "organizing_campaign_type" NOT NULL,
	"campaign_status" "organizing_campaign_status" DEFAULT 'research',
	"target_employer_name" varchar(300) NOT NULL,
	"target_employer_address" text,
	"target_industry" varchar(200),
	"target_naics_code" varchar(10),
	"proposed_bargaining_unit_name" varchar(300),
	"proposed_bargaining_unit_description" text,
	"excluded_positions" text,
	"estimated_eligible_workers" integer,
	"estimated_total_workforce" integer,
	"workplace_city" varchar(100),
	"workplace_province" varchar(2),
	"workplace_postal_code" varchar(7),
	"workplace_coordinates" "point",
	"is_multi_location" boolean DEFAULT false,
	"labor_board_jurisdiction" varchar(50),
	"labor_board_name" varchar(200),
	"labor_relations_act" varchar(200),
	"research_start_date" date,
	"campaign_launch_date" date,
	"card_check_start_date" date,
	"card_check_deadline" date,
	"certification_application_date" date,
	"certification_vote_date" date,
	"certification_decision_date" date,
	"first_contract_deadline" date,
	"card_signing_goal" integer,
	"card_signing_threshold_percentage" numeric(5, 2) DEFAULT 40.00,
	"super_majority_goal" integer,
	"super_majority_threshold_percentage" numeric(5, 2) DEFAULT 65.00,
	"cards_signed_count" integer DEFAULT 0,
	"cards_signed_percentage" numeric(5, 2) DEFAULT 0.00,
	"last_card_signed_date" date,
	"lead_organizer_id" uuid,
	"lead_organizer_name" varchar(200),
	"organizing_committee_size" integer DEFAULT 0,
	"employer_resistance_level" varchar(50),
	"anti_union_consultant_involved" boolean DEFAULT false,
	"anti_union_consultant_name" varchar(200),
	"captive_audience_meetings_count" integer DEFAULT 0,
	"incumbent_union_name" varchar(200),
	"incumbent_contract_expiry_date" date,
	"outcome_type" varchar(50),
	"certification_vote_yes_count" integer,
	"certification_vote_no_count" integer,
	"certification_vote_eligible_voters" integer,
	"certification_vote_turnout_percentage" numeric(5, 2),
	"certification_number" varchar(100),
	"certification_date" date,
	"first_contract_ratified_date" date,
	"first_contract_campaign_required" boolean DEFAULT false,
	"campaign_budget" numeric(12, 2),
	"campaign_expenses_to_date" numeric(12, 2) DEFAULT 0.00,
	"full_time_organizers_assigned" integer DEFAULT 0,
	"volunteer_organizers_count" integer DEFAULT 0,
	"campaign_plan_url" text,
	"workplace_map_url" text,
	"authorization_cards_template_url" text,
	"certification_application_url" text,
	"labor_board_decision_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "organizing_campaigns_campaign_code_key" UNIQUE("campaign_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizing_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"contact_number" varchar(50) NOT NULL,
	"first_name_encrypted" text,
	"last_name_encrypted" text,
	"personal_email_encrypted" text,
	"personal_phone_encrypted" text,
	"work_email_encrypted" text,
	"work_phone_encrypted" text,
	"job_title" varchar(200),
	"department" varchar(200),
	"shift" varchar(50),
	"hire_date" date,
	"seniority_years" numeric(5, 2),
	"hourly_rate" numeric(10, 2),
	"age_range" varchar(20),
	"primary_language" varchar(50),
	"requires_interpretation" boolean DEFAULT false,
	"building_location" varchar(100),
	"floor_number" integer,
	"workstation_area" varchar(100),
	"support_level" "contact_support_level" DEFAULT 'unknown',
	"organizing_committee_member" boolean DEFAULT false,
	"organizing_committee_role" varchar(100),
	"natural_leader" boolean DEFAULT false,
	"card_signed" boolean DEFAULT false,
	"card_signed_date" date,
	"card_witnessed_by" varchar(200),
	"card_revoked" boolean DEFAULT false,
	"card_revoked_date" date,
	"house_visit_attempted" boolean DEFAULT false,
	"house_visit_completed" boolean DEFAULT false,
	"house_visit_date" date,
	"house_visit_notes" text,
	"last_contact_date" date,
	"last_contact_method" varchar(50),
	"contact_attempts_count" integer DEFAULT 0,
	"primary_issues" jsonb,
	"workplace_concerns" text,
	"personal_story" text,
	"close_coworkers" jsonb,
	"influenced_by" jsonb,
	"fear_level" varchar(50),
	"barriers_to_support" text,
	"targeted_by_employer" boolean DEFAULT false,
	"targeted_date" date,
	"targeted_method" text,
	"voted_in_certification" boolean,
	"became_member" boolean DEFAULT false,
	"member_id" uuid,
	"data_retention_deadline" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "organizing_contacts_contact_number_key" UNIQUE("contact_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenants" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizing_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"activity_type" "organizing_activity_type" NOT NULL,
	"activity_name" varchar(200),
	"activity_date" date NOT NULL,
	"activity_start_time" time,
	"activity_end_time" time,
	"activity_location" varchar(300),
	"location_address" text,
	"is_virtual" boolean DEFAULT false,
	"meeting_link" text,
	"contacts_targeted" jsonb,
	"contacts_attended" jsonb,
	"contacts_attended_count" integer DEFAULT 0,
	"organizers_assigned" jsonb,
	"volunteers_attended" integer DEFAULT 0,
	"cards_signed_at_event" integer DEFAULT 0,
	"outcome_summary" text,
	"contacts_moved_to_supporter" integer DEFAULT 0,
	"new_organizing_committee_recruits" integer DEFAULT 0,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_completed" boolean DEFAULT false,
	"follow_up_notes" text,
	"activity_cost" numeric(10, 2) DEFAULT 0.00,
	"photos_urls" jsonb,
	"videos_urls" jsonb,
	"social_media_posts" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_organizing_campaign_dashboard" (
	"campaign_id" uuid,
	"organization_id" uuid,
	"campaign_name" varchar(200),
	"campaign_code" varchar(50),
	"campaign_type" "organizing_campaign_type",
	"campaign_status" "organizing_campaign_status",
	"target_employer_name" varchar(300),
	"labor_board_jurisdiction" varchar(50),
	"estimated_eligible_workers" integer,
	"cards_signed_count" integer,
	"cards_signed_percentage" numeric(5, 2),
	"card_signing_goal" integer,
	"card_signing_threshold_percentage" numeric(5, 2),
	"organizing_committee_size" integer,
	"campaign_launch_date" date,
	"card_check_deadline" date,
	"total_contacts" bigint,
	"supporters" bigint,
	"committee_members" bigint,
	"cards_signed" bigint,
	"activities_last_7_days" bigint,
	"activities_last_30_days" bigint,
	"days_until_deadline" integer,
	"campaign_strength" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "certification_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"application_number" varchar(100) NOT NULL,
	"application_status" "certification_application_status" DEFAULT 'draft',
	"labor_board_jurisdiction" varchar(50) NOT NULL,
	"labor_board_name" varchar(200),
	"filed_date" date,
	"filed_by_name" varchar(200),
	"proposed_bargaining_unit_description" text,
	"number_of_employees_claimed" integer,
	"authorization_cards_submitted" integer,
	"authorization_cards_percentage" numeric(5, 2),
	"employer_response_filed" boolean DEFAULT false,
	"employer_response_date" date,
	"employer_contested" boolean DEFAULT false,
	"employer_objections" text,
	"employer_proposed_unit_changes" text,
	"incumbent_union_response_filed" boolean DEFAULT false,
	"incumbent_union_response_date" date,
	"incumbent_union_objections" text,
	"pre_hearing_scheduled" boolean DEFAULT false,
	"pre_hearing_date" date,
	"hearing_scheduled" boolean DEFAULT false,
	"hearing_date" date,
	"hearing_location" varchar(300),
	"hearing_outcome" text,
	"voter_list_received" boolean DEFAULT false,
	"voter_list_received_date" date,
	"voter_list_dispute_filed" boolean DEFAULT false,
	"voter_list_dispute_outcome" text,
	"vote_ordered" boolean DEFAULT false,
	"vote_ordered_date" date,
	"vote_method" varchar(50),
	"vote_date" date,
	"vote_location" varchar(300),
	"votes_yes" integer,
	"votes_no" integer,
	"votes_spoiled" integer,
	"votes_challenged" integer,
	"eligible_voters" integer,
	"voter_turnout_percentage" numeric(5, 2),
	"decision_date" date,
	"decision_outcome" varchar(50),
	"decision_summary" text,
	"decision_document_url" text,
	"certification_order_number" varchar(100),
	"certification_date" date,
	"certification_document_url" text,
	"bargaining_unit_certified_description" text,
	"number_of_employees_certified" integer,
	"appeal_filed" boolean DEFAULT false,
	"appeal_filed_by" varchar(100),
	"appeal_filed_date" date,
	"appeal_outcome" text,
	"first_contract_arbitration_eligible" boolean DEFAULT false,
	"first_contract_arbitration_applied" boolean DEFAULT false,
	"first_contract_arbitration_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "certification_applications_application_number_key" UNIQUE("application_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizing_volunteers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"member_id" uuid,
	"volunteer_name" varchar(200),
	"email" varchar(255),
	"phone" varchar(50),
	"organizing_experience_level" varchar(50),
	"previous_campaigns_count" integer DEFAULT 0,
	"special_skills" jsonb,
	"available_weekdays" boolean DEFAULT true,
	"available_evenings" boolean DEFAULT true,
	"available_weekends" boolean DEFAULT true,
	"hours_per_week_available" integer,
	"organizing_training_completed" boolean DEFAULT false,
	"training_completion_date" date,
	"current_campaigns" jsonb,
	"total_house_visits_completed" integer DEFAULT 0,
	"total_cards_signed_witnessed" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_workplace_contact_map" (
	"contact_id" uuid,
	"campaign_id" uuid,
	"contact_number" varchar(50),
	"department" varchar(200),
	"shift" varchar(50),
	"support_level" "contact_support_level",
	"organizing_committee_member" boolean,
	"card_signed" boolean,
	"natural_leader" boolean,
	"building_location" varchar(100),
	"floor_number" integer,
	"workstation_area" varchar(100),
	"primary_issues" jsonb,
	"campaign_name" varchar(200),
	"target_employer_name" varchar(300)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "political_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"campaign_name" varchar(300) NOT NULL,
	"campaign_code" varchar(50) NOT NULL,
	"campaign_type" "political_campaign_type" NOT NULL,
	"campaign_status" "political_campaign_status" DEFAULT 'planning',
	"campaign_description" text,
	"campaign_goals" text,
	"start_date" date,
	"end_date" date,
	"election_date" date,
	"jurisdiction_level" varchar(50),
	"jurisdiction_name" varchar(200),
	"electoral_district" varchar(200),
	"bill_number" varchar(50),
	"bill_name" varchar(300),
	"bill_status" varchar(100),
	"bill_url" text,
	"primary_issue" varchar(200),
	"secondary_issues" jsonb,
	"member_participation_goal" integer,
	"volunteer_hours_goal" integer,
	"doors_knocked_goal" integer,
	"phone_calls_goal" integer,
	"petition_signatures_goal" integer,
	"members_participated" integer DEFAULT 0,
	"volunteer_hours_logged" integer DEFAULT 0,
	"doors_knocked" integer DEFAULT 0,
	"phone_calls_made" integer DEFAULT 0,
	"petition_signatures_collected" integer DEFAULT 0,
	"budget_allocated" numeric(12, 2),
	"expenses_to_date" numeric(12, 2) DEFAULT 0.00,
	"funded_by_cope" boolean DEFAULT false,
	"cope_contribution_amount" numeric(12, 2),
	"coalition_partners" jsonb,
	"outcome_type" varchar(100),
	"outcome_date" date,
	"outcome_notes" text,
	"campaign_plan_url" text,
	"campaign_materials_urls" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "political_campaigns_campaign_code_key" UNIQUE("campaign_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member_certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"certification_name" varchar(200) NOT NULL,
	"certification_type" varchar(100),
	"issued_by_organization" varchar(200),
	"certification_number" varchar(100),
	"issue_date" date NOT NULL,
	"expiry_date" date,
	"valid_years" integer,
	"certification_status" "certification_status" DEFAULT 'active',
	"course_id" uuid,
	"session_id" uuid,
	"registration_id" uuid,
	"renewal_required" boolean DEFAULT false,
	"renewal_date" date,
	"renewal_course_id" uuid,
	"verified" boolean DEFAULT true,
	"verification_date" date,
	"verified_by" uuid,
	"certificate_url" text,
	"digital_badge_url" text,
	"clc_registered" boolean DEFAULT false,
	"clc_registration_number" varchar(100),
	"clc_registration_date" date,
	"revoked" boolean DEFAULT false,
	"revocation_date" date,
	"revocation_reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "member_certifications_certification_number_key" UNIQUE("certification_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"program_name" varchar(300) NOT NULL,
	"program_code" varchar(50) NOT NULL,
	"program_description" text,
	"program_category" varchar(100),
	"required_courses" jsonb,
	"elective_courses" jsonb,
	"electives_required_count" integer DEFAULT 0,
	"total_hours_required" numeric(6, 2),
	"program_duration_months" integer,
	"provides_certification" boolean DEFAULT false,
	"certification_name" varchar(200),
	"entry_requirements" text,
	"time_commitment" text,
	"clc_approved" boolean DEFAULT false,
	"clc_approval_date" date,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	CONSTRAINT "training_programs_program_code_key" UNIQUE("program_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dues_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"assignment_id" uuid,
	"rule_id" uuid,
	"transaction_type" varchar(50) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"due_date" date NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"payment_date" timestamp with time zone,
	"payment_method" varchar(50),
	"payment_reference" varchar(255),
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"dues_amount" numeric(10, 2) NOT NULL,
	"cope_amount" numeric(10, 2) DEFAULT 0.00,
	"pac_amount" numeric(10, 2) DEFAULT 0.00,
	"strike_fund_amount" numeric(10, 2) DEFAULT 0.00,
	"late_fee_amount" numeric(10, 2) DEFAULT 0.00,
	"adjustment_amount" numeric(10, 2) DEFAULT 0.00,
	"total_amount" numeric(10, 2) NOT NULL,
	"paid_date" timestamp with time zone,
	"receipt_url" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "program_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"enrollment_date" date DEFAULT CURRENT_DATE NOT NULL,
	"enrollment_status" varchar(50) DEFAULT 'active',
	"courses_completed" integer DEFAULT 0,
	"courses_required" integer,
	"hours_completed" numeric(6, 2) DEFAULT 0.00,
	"hours_required" numeric(6, 2),
	"progress_percentage" numeric(5, 2) DEFAULT 0.00,
	"completed" boolean DEFAULT false,
	"completion_date" date,
	"certification_issued" boolean DEFAULT false,
	"certification_id" uuid,
	"expected_completion_date" date,
	"extension_granted" boolean DEFAULT false,
	"extended_completion_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_member_training_transcript" (
	"member_id" uuid,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"organization_id" uuid,
	"course_name" varchar(300),
	"course_category" "course_category",
	"session_code" varchar(50),
	"start_date" date,
	"end_date" date,
	"registration_status" "registration_status",
	"attended" boolean,
	"completed" boolean,
	"completion_date" date,
	"attendance_hours" numeric(5, 2),
	"final_grade" varchar(10),
	"certificate_issued" boolean,
	"certificate_number" varchar(100),
	"duration_hours" numeric(5, 2),
	"provides_certification" boolean
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_course_session_dashboard" (
	"session_id" uuid,
	"organization_id" uuid,
	"course_name" varchar(300),
	"course_category" "course_category",
	"session_code" varchar(50),
	"start_date" date,
	"end_date" date,
	"session_status" "session_status",
	"max_enrollment" integer,
	"total_registrations" bigint,
	"confirmed_registrations" bigint,
	"waitlist_count" bigint,
	"attendees" bigint,
	"no_shows" bigint,
	"completions" bigint,
	"completion_rate" numeric,
	"avg_rating" numeric,
	"evaluation_count" bigint,
	"enrollment_percentage" numeric
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_certification_expiry_tracking" (
	"organization_id" uuid,
	"member_id" uuid,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"certification_name" varchar(200),
	"certification_type" varchar(100),
	"issue_date" date,
	"expiry_date" date,
	"certification_status" "certification_status",
	"expiry_alert" text,
	"days_until_expiry" integer,
	"renewal_required" boolean,
	"renewal_course_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "v_training_program_progress" (
	"enrollment_id" uuid,
	"organization_id" uuid,
	"member_id" uuid,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"program_name" varchar(300),
	"program_category" varchar(100),
	"enrollment_date" date,
	"enrollment_status" varchar(50),
	"courses_completed" integer,
	"courses_required" integer,
	"hours_completed" numeric(6, 2),
	"hours_required" numeric(6, 2),
	"progress_percentage" numeric(5, 2),
	"expected_completion_date" date,
	"completed" boolean,
	"completion_date" date
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kpi_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"metric_type" text NOT NULL,
	"data_source" text NOT NULL,
	"calculation" jsonb NOT NULL,
	"visualization_type" text NOT NULL,
	"target_value" numeric,
	"warning_threshold" numeric,
	"critical_threshold" numeric,
	"alert_enabled" boolean DEFAULT false,
	"alert_recipients" jsonb,
	"refresh_interval" integer DEFAULT 3600,
	"is_active" boolean DEFAULT true,
	"display_order" integer,
	"dashboard_layout" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voter_eligibility" ADD CONSTRAINT "voter_eligibility_session_id_voting_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."voting_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voting_options" ADD CONSTRAINT "voting_options_session_id_voting_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."voting_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voting_notifications" ADD CONSTRAINT "voting_notifications_session_id_voting_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."voting_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cba_clauses" ADD CONSTRAINT "cba_clauses_cba_id_collective_agreements_id_fk" FOREIGN KEY ("cba_id") REFERENCES "public"."collective_agreements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cba_version_history" ADD CONSTRAINT "cba_version_history_cba_id_collective_agreements_id_fk" FOREIGN KEY ("cba_id") REFERENCES "public"."collective_agreements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "benefit_comparisons" ADD CONSTRAINT "benefit_comparisons_cba_id_collective_agreements_id_fk" FOREIGN KEY ("cba_id") REFERENCES "public"."collective_agreements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "benefit_comparisons" ADD CONSTRAINT "benefit_comparisons_clause_id_cba_clauses_id_fk" FOREIGN KEY ("clause_id") REFERENCES "public"."cba_clauses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "insight_recommendations" ADD CONSTRAINT "insight_recommendations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "digital_signatures" ADD CONSTRAINT "digital_signatures_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "signature_workflows" ADD CONSTRAINT "signature_workflows_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wage_progressions" ADD CONSTRAINT "wage_progressions_cba_id_collective_agreements_id_fk" FOREIGN KEY ("cba_id") REFERENCES "public"."collective_agreements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wage_progressions" ADD CONSTRAINT "wage_progressions_clause_id_cba_clauses_id_fk" FOREIGN KEY ("clause_id") REFERENCES "public"."cba_clauses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bargaining_notes" ADD CONSTRAINT "bargaining_notes_cba_id_collective_agreements_id_fk" FOREIGN KEY ("cba_id") REFERENCES "public"."collective_agreements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cba_footnotes" ADD CONSTRAINT "cba_footnotes_source_clause_id_cba_clauses_id_fk" FOREIGN KEY ("source_clause_id") REFERENCES "public"."cba_clauses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cba_footnotes" ADD CONSTRAINT "cba_footnotes_target_clause_id_cba_clauses_id_fk" FOREIGN KEY ("target_clause_id") REFERENCES "public"."cba_clauses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cba_footnotes" ADD CONSTRAINT "cba_footnotes_target_decision_id_arbitration_decisions_id_fk" FOREIGN KEY ("target_decision_id") REFERENCES "public"."arbitration_decisions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cba_contacts" ADD CONSTRAINT "cba_contacts_cba_id_collective_agreements_id_fk" FOREIGN KEY ("cba_id") REFERENCES "public"."collective_agreements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_chunks" ADD CONSTRAINT "ai_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."ai_documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_query_id_fkey" FOREIGN KEY ("query_id") REFERENCES "public"."ai_queries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant_management"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "claim_updates" ADD CONSTRAINT "fk_claim_updates_claim" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("claim_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "claim_updates" ADD CONSTRAINT "fk_claim_updates_user" FOREIGN KEY ("created_by") REFERENCES "user_management"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_dues_assignments" ADD CONSTRAINT "member_dues_assignments_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "public"."dues_rules"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_dues_assignments" ADD CONSTRAINT "member_dues_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant_management"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "employer_remittances" ADD CONSTRAINT "employer_remittances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant_management"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dues_rules" ADD CONSTRAINT "dues_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant_management"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "strike_funds" ADD CONSTRAINT "strike_funds_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "strike_funds" ADD CONSTRAINT "strike_funds_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant_management"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fund_eligibility" ADD CONSTRAINT "fund_eligibility_strike_fund_id_fkey" FOREIGN KEY ("strike_fund_id") REFERENCES "public"."strike_funds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fund_eligibility" ADD CONSTRAINT "fund_eligibility_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant_management"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "picket_attendance" ADD CONSTRAINT "picket_attendance_strike_fund_id_fkey" FOREIGN KEY ("strike_fund_id") REFERENCES "public"."strike_funds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "picket_attendance" ADD CONSTRAINT "picket_attendance_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant_management"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stipend_disbursements" ADD CONSTRAINT "stipend_disbursements_strike_fund_id_fkey" FOREIGN KEY ("strike_fund_id") REFERENCES "public"."strike_funds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stipend_disbursements" ADD CONSTRAINT "stipend_disbursements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant_management"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "public_donations" ADD CONSTRAINT "public_donations_strike_fund_id_fkey" FOREIGN KEY ("strike_fund_id") REFERENCES "public"."strike_funds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "public_donations" ADD CONSTRAINT "public_donations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant_management"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hardship_applications" ADD CONSTRAINT "hardship_applications_strike_fund_id_fkey" FOREIGN KEY ("strike_fund_id") REFERENCES "public"."strike_funds"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hardship_applications" ADD CONSTRAINT "hardship_applications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant_management"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "arrears_cases" ADD CONSTRAINT "arrears_cases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant_management"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clause_comparisons_history" ADD CONSTRAINT "clause_comparisons_history_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shared_clause_library" ADD CONSTRAINT "shared_clause_library_previous_version_id_shared_clause_library" FOREIGN KEY ("previous_version_id") REFERENCES "public"."shared_clause_library"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "precedent_tags" ADD CONSTRAINT "precedent_tags_precedent_id_arbitration_precedents_id_fk" FOREIGN KEY ("precedent_id") REFERENCES "public"."arbitration_precedents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "precedent_citations" ADD CONSTRAINT "precedent_citations_cited_by_precedent_id_arbitration_precedent" FOREIGN KEY ("cited_by_precedent_id") REFERENCES "public"."arbitration_precedents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "precedent_citations" ADD CONSTRAINT "precedent_citations_precedent_id_arbitration_precedents_id_fk" FOREIGN KEY ("precedent_id") REFERENCES "public"."arbitration_precedents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_relationships" ADD CONSTRAINT "organization_relationships_child_org_id_fkey" FOREIGN KEY ("child_org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_relationships" ADD CONSTRAINT "organization_relationships_parent_org_id_fkey" FOREIGN KEY ("parent_org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clause_library_tags" ADD CONSTRAINT "clause_library_tags_clause_id_shared_clause_library_id_fk" FOREIGN KEY ("clause_id") REFERENCES "public"."shared_clause_library"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "votes" ADD CONSTRAINT "votes_option_id_voting_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."voting_options"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "votes" ADD CONSTRAINT "votes_session_id_voting_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."voting_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "claims" ADD CONSTRAINT "claims_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "claims" ADD CONSTRAINT "fk_claims_assigned_to" FOREIGN KEY ("assigned_to") REFERENCES "user_management"."users"("user_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "claims" ADD CONSTRAINT "fk_claims_member" FOREIGN KEY ("member_id") REFERENCES "user_management"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comparative_analyses" ADD CONSTRAINT "comparative_analyses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "per_capita_remittances" ADD CONSTRAINT "per_capita_remittances_from_organization_id_fkey" FOREIGN KEY ("from_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "per_capita_remittances" ADD CONSTRAINT "per_capita_remittances_to_organization_id_fkey" FOREIGN KEY ("to_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction_clc_mappings" ADD CONSTRAINT "transaction_clc_mappings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voting_session_auditors" ADD CONSTRAINT "voting_session_auditors_auditor_id_fkey" FOREIGN KEY ("auditor_id") REFERENCES "public"."voting_auditors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voting_session_auditors" ADD CONSTRAINT "voting_session_auditors_voting_session_id_fkey" FOREIGN KEY ("voting_session_id") REFERENCES "public"."voting_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blockchain_audit_anchors" ADD CONSTRAINT "blockchain_audit_anchors_voting_session_id_fkey" FOREIGN KEY ("voting_session_id") REFERENCES "public"."voting_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote_merkle_tree" ADD CONSTRAINT "vote_merkle_tree_left_child_id_fkey" FOREIGN KEY ("left_child_id") REFERENCES "public"."vote_merkle_tree"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote_merkle_tree" ADD CONSTRAINT "vote_merkle_tree_parent_node_id_fkey" FOREIGN KEY ("parent_node_id") REFERENCES "public"."vote_merkle_tree"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote_merkle_tree" ADD CONSTRAINT "vote_merkle_tree_right_child_id_fkey" FOREIGN KEY ("right_child_id") REFERENCES "public"."vote_merkle_tree"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote_merkle_tree" ADD CONSTRAINT "vote_merkle_tree_vote_id_fkey" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote_merkle_tree" ADD CONSTRAINT "vote_merkle_tree_voting_session_id_fkey" FOREIGN KEY ("voting_session_id") REFERENCES "public"."voting_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voting_session_keys" ADD CONSTRAINT "voting_session_keys_voting_session_id_fkey" FOREIGN KEY ("voting_session_id") REFERENCES "public"."voting_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_message_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."message_threads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_hierarchy_audit" ADD CONSTRAINT "organization_hierarchy_audit_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voting_key_access_log" ADD CONSTRAINT "voting_key_access_log_session_key_id_fkey" FOREIGN KEY ("session_key_id") REFERENCES "public"."voting_session_keys"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_read_receipts" ADD CONSTRAINT "message_read_receipts_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_participants" ADD CONSTRAINT "message_participants_thread_id_message_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."message_threads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_validations" ADD CONSTRAINT "compliance_validations_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "public"."jurisdiction_rules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_validations" ADD CONSTRAINT "fk_rule" FOREIGN KEY ("rule_id") REFERENCES "public"."jurisdiction_rules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_notifications" ADD CONSTRAINT "message_notifications_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_notifications" ADD CONSTRAINT "message_notifications_thread_id_message_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."message_threads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "members" ADD CONSTRAINT "members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_calendar_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."meeting_rooms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar_sharing" ADD CONSTRAINT "calendar_sharing_calendar_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."calendars"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_reminders" ADD CONSTRAINT "event_reminders_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_political_participation" ADD CONSTRAINT "member_political_participation_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_political_participation" ADD CONSTRAINT "member_political_participation_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "elected_officials" ADD CONSTRAINT "elected_officials_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "legislation_tracking" ADD CONSTRAINT "legislation_tracking_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."political_campaigns"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "legislation_tracking" ADD CONSTRAINT "legislation_tracking_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "legislation_tracking" ADD CONSTRAINT "legislation_tracking_sponsor_official_id_fkey" FOREIGN KEY ("sponsor_official_id") REFERENCES "public"."elected_officials"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "political_activities" ADD CONSTRAINT "political_activities_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."political_campaigns"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "political_activities" ADD CONSTRAINT "political_activities_elected_official_id_fkey" FOREIGN KEY ("elected_official_id") REFERENCES "public"."elected_officials"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "political_activities" ADD CONSTRAINT "political_activities_legislation_id_fkey" FOREIGN KEY ("legislation_id") REFERENCES "public"."legislation_tracking"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "political_activities" ADD CONSTRAINT "political_activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_registrations" ADD CONSTRAINT "course_registrations_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_registrations" ADD CONSTRAINT "course_registrations_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_registrations" ADD CONSTRAINT "course_registrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_registrations" ADD CONSTRAINT "course_registrations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."course_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pension_plans" ADD CONSTRAINT "pension_plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pension_hours_banks" ADD CONSTRAINT "pension_hours_banks_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pension_hours_banks" ADD CONSTRAINT "pension_hours_banks_pension_plan_id_fkey" FOREIGN KEY ("pension_plan_id") REFERENCES "public"."pension_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pension_contributions" ADD CONSTRAINT "pension_contributions_pension_plan_id_fkey" FOREIGN KEY ("pension_plan_id") REFERENCES "public"."pension_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pension_trustee_boards" ADD CONSTRAINT "pension_trustee_boards_pension_plan_id_fkey" FOREIGN KEY ("pension_plan_id") REFERENCES "public"."pension_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pension_trustees" ADD CONSTRAINT "pension_trustees_trustee_board_id_fkey" FOREIGN KEY ("trustee_board_id") REFERENCES "public"."pension_trustee_boards"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_metrics" ADD CONSTRAINT "analytics_metrics_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pension_trustee_meetings" ADD CONSTRAINT "pension_trustee_meetings_trustee_board_id_fkey" FOREIGN KEY ("trustee_board_id") REFERENCES "public"."pension_trustee_boards"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pension_benefit_claims" ADD CONSTRAINT "pension_benefit_claims_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pension_benefit_claims" ADD CONSTRAINT "pension_benefit_claims_pension_plan_id_fkey" FOREIGN KEY ("pension_plan_id") REFERENCES "public"."pension_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pension_actuarial_valuations" ADD CONSTRAINT "pension_actuarial_valuations_pension_plan_id_fkey" FOREIGN KEY ("pension_plan_id") REFERENCES "public"."pension_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hw_benefit_plans" ADD CONSTRAINT "hw_benefit_plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hw_benefit_enrollments" ADD CONSTRAINT "hw_benefit_enrollments_hw_plan_id_fkey" FOREIGN KEY ("hw_plan_id") REFERENCES "public"."hw_benefit_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hw_benefit_enrollments" ADD CONSTRAINT "hw_benefit_enrollments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hw_benefit_claims" ADD CONSTRAINT "hw_benefit_claims_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."hw_benefit_enrollments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hw_benefit_claims" ADD CONSTRAINT "hw_benefit_claims_hw_plan_id_fkey" FOREIGN KEY ("hw_plan_id") REFERENCES "public"."hw_benefit_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hw_benefit_claims" ADD CONSTRAINT "hw_benefit_claims_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trust_compliance_reports" ADD CONSTRAINT "trust_compliance_reports_hw_plan_id_fkey" FOREIGN KEY ("hw_plan_id") REFERENCES "public"."hw_benefit_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trust_compliance_reports" ADD CONSTRAINT "trust_compliance_reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trust_compliance_reports" ADD CONSTRAINT "trust_compliance_reports_pension_plan_id_fkey" FOREIGN KEY ("pension_plan_id") REFERENCES "public"."pension_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tax_year_configurations" ADD CONSTRAINT "tax_year_configurations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trend_analyses" ADD CONSTRAINT "trend_analyses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tax_slips" ADD CONSTRAINT "tax_slips_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tax_slips" ADD CONSTRAINT "tax_slips_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tax_slips" ADD CONSTRAINT "tax_slips_original_slip_id_fkey" FOREIGN KEY ("original_slip_id") REFERENCES "public"."tax_slips"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tax_slips" ADD CONSTRAINT "tax_slips_tax_year_config_id_fkey" FOREIGN KEY ("tax_year_config_id") REFERENCES "public"."tax_year_configurations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cra_xml_batches" ADD CONSTRAINT "cra_xml_batches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cra_xml_batches" ADD CONSTRAINT "cra_xml_batches_tax_year_config_id_fkey" FOREIGN KEY ("tax_year_config_id") REFERENCES "public"."tax_year_configurations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cope_contributions" ADD CONSTRAINT "cope_contributions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cope_contributions" ADD CONSTRAINT "cope_contributions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cope_contributions" ADD CONSTRAINT "cope_contributions_tax_slip_id_fkey" FOREIGN KEY ("tax_slip_id") REFERENCES "public"."tax_slips"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_demographics" ADD CONSTRAINT "member_demographics_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_demographics" ADD CONSTRAINT "member_demographics_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pay_equity_complaints" ADD CONSTRAINT "pay_equity_complaints_complainant_member_id_fkey" FOREIGN KEY ("complainant_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pay_equity_complaints" ADD CONSTRAINT "pay_equity_complaints_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "equity_snapshots" ADD CONSTRAINT "equity_snapshots_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "statcan_submissions" ADD CONSTRAINT "statcan_submissions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizing_campaigns" ADD CONSTRAINT "organizing_campaigns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizing_contacts" ADD CONSTRAINT "organizing_contacts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."organizing_campaigns"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizing_contacts" ADD CONSTRAINT "organizing_contacts_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizing_contacts" ADD CONSTRAINT "organizing_contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizing_activities" ADD CONSTRAINT "organizing_activities_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."organizing_campaigns"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizing_activities" ADD CONSTRAINT "organizing_activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "certification_applications" ADD CONSTRAINT "certification_applications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."organizing_campaigns"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "certification_applications" ADD CONSTRAINT "certification_applications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizing_volunteers" ADD CONSTRAINT "organizing_volunteers_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizing_volunteers" ADD CONSTRAINT "organizing_volunteers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "political_campaigns" ADD CONSTRAINT "political_campaigns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_certifications" ADD CONSTRAINT "member_certifications_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_certifications" ADD CONSTRAINT "member_certifications_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_certifications" ADD CONSTRAINT "member_certifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_certifications" ADD CONSTRAINT "member_certifications_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."course_registrations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_certifications" ADD CONSTRAINT "member_certifications_renewal_course_id_fkey" FOREIGN KEY ("renewal_course_id") REFERENCES "public"."training_courses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_certifications" ADD CONSTRAINT "member_certifications_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."course_sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_programs" ADD CONSTRAINT "training_programs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dues_transactions" ADD CONSTRAINT "dues_transactions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."member_dues_assignments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dues_transactions" ADD CONSTRAINT "dues_transactions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "public"."dues_rules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dues_transactions" ADD CONSTRAINT "dues_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant_management"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_certification_id_fkey" FOREIGN KEY ("certification_id") REFERENCES "public"."member_certifications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kpi_configurations" ADD CONSTRAINT "kpi_configurations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_voting_notifications_created_at" ON "voting_notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_voting_notifications_updated_at" ON "voting_notifications" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_effective_date_idx" ON "collective_agreements" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_employer_idx" ON "collective_agreements" USING btree ("employer_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_expiry_idx" ON "collective_agreements" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_jurisdiction_idx" ON "collective_agreements" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_sector_idx" ON "collective_agreements" USING btree ("industry_sector");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_status_idx" ON "collective_agreements" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_tenant_idx" ON "collective_agreements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_union_idx" ON "collective_agreements" USING btree ("union_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_clauses_cba_idx" ON "cba_clauses" USING btree ("cba_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_clauses_confidence_idx" ON "cba_clauses" USING btree ("confidence_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_clauses_number_idx" ON "cba_clauses" USING btree ("clause_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_clauses_parent_idx" ON "cba_clauses" USING btree ("parent_clause_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_clauses_type_idx" ON "cba_clauses" USING btree ("clause_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_version_cba_idx" ON "cba_version_history" USING btree ("cba_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_version_number_idx" ON "cba_version_history" USING btree ("version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "benefit_comparisons_cba_idx" ON "benefit_comparisons" USING btree ("cba_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "benefit_comparisons_type_idx" ON "benefit_comparisons" USING btree ("benefit_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clause_comparisons_tenant_idx" ON "clause_comparisons" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clause_comparisons_type_idx" ON "clause_comparisons" USING btree ("clause_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arbitrator_profiles_active_idx" ON "arbitrator_profiles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arbitrator_profiles_name_idx" ON "arbitrator_profiles" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "insight_recommendations_category_idx" ON "insight_recommendations" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "insight_recommendations_created_idx" ON "insight_recommendations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "insight_recommendations_org_idx" ON "insight_recommendations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "insight_recommendations_priority_idx" ON "insight_recommendations" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "insight_recommendations_status_idx" ON "insight_recommendations" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_digital_signatures_document" ON "digital_signatures" USING btree ("document_type","document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_digital_signatures_hash" ON "digital_signatures" USING btree ("document_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_digital_signatures_org" ON "digital_signatures" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_digital_signatures_signed_at" ON "digital_signatures" USING btree ("signed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_digital_signatures_signer" ON "digital_signatures" USING btree ("signer_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_digital_signatures_status" ON "digital_signatures" USING btree ("signature_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_digital_signatures_type" ON "digital_signatures" USING btree ("signature_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_signature_workflows_doc_type" ON "signature_workflows" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_signature_workflows_org" ON "signature_workflows" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wage_progressions_cba_idx" ON "wage_progressions" USING btree ("cba_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wage_progressions_classification_idx" ON "wage_progressions" USING btree ("classification");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wage_progressions_clause_idx" ON "wage_progressions" USING btree ("clause_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wage_progressions_effective_date_idx" ON "wage_progressions" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arbitration_arbitrator_idx" ON "arbitration_decisions" USING btree ("arbitrator");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arbitration_case_number_idx" ON "arbitration_decisions" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arbitration_decision_date_idx" ON "arbitration_decisions" USING btree ("decision_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arbitration_jurisdiction_idx" ON "arbitration_decisions" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arbitration_outcome_idx" ON "arbitration_decisions" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arbitration_precedent_idx" ON "arbitration_decisions" USING btree ("precedent_value");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arbitration_tribunal_idx" ON "arbitration_decisions" USING btree ("tribunal");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bargaining_notes_cba_idx" ON "bargaining_notes" USING btree ("cba_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bargaining_notes_session_date_idx" ON "bargaining_notes" USING btree ("session_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bargaining_notes_session_type_idx" ON "bargaining_notes" USING btree ("session_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bargaining_notes_tenant_idx" ON "bargaining_notes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_footnotes_source_idx" ON "cba_footnotes" USING btree ("source_clause_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_footnotes_target_clause_idx" ON "cba_footnotes" USING btree ("target_clause_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_footnotes_target_decision_idx" ON "cba_footnotes" USING btree ("target_decision_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "claim_precedent_claim_idx" ON "claim_precedent_analysis" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claim_precedent_analysis_created_at" ON "claim_precedent_analysis" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claim_precedent_analysis_updated_at" ON "claim_precedent_analysis" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_contacts_cba_idx" ON "cba_contacts" USING btree ("cba_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cba_contacts_type_idx" ON "cba_contacts" USING btree ("contact_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_documents_claim" ON "ai_documents" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_documents_metadata" ON "ai_documents" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_documents_source_type" ON "ai_documents" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_documents_tenant" ON "ai_documents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_chunks_document" ON "ai_chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_chunks_tenant" ON "ai_chunks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_queries_created" ON "ai_queries" USING btree ("created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_queries_hash" ON "ai_queries" USING btree ("query_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_queries_tenant" ON "ai_queries" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_queries_user" ON "ai_queries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_query_logs_created_at" ON "ai_query_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_query_logs_tenant" ON "ai_query_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_query_logs_timestamp" ON "ai_query_logs" USING btree ("created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_query_logs_updated_at" ON "ai_query_logs" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_feedback_query" ON "ai_feedback" USING btree ("query_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_feedback_tenant" ON "ai_feedback" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_members_deleted_at" ON "organization_members" USING btree ("deleted_at") WHERE (deleted_at IS NULL);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_members_department" ON "organization_members" USING btree ("department");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_members_email" ON "organization_members" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_members_org_id" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_members_role" ON "organization_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_members_search_vector" ON "organization_members" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_members_status" ON "organization_members" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_members_tenant_id" ON "organization_members" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_members_user_id" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organization_members_is_primary" ON "organization_members" USING btree ("user_id","is_primary") WHERE (is_primary = true);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organization_members_org_id" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_case_summaries_claim" ON "case_summaries" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_case_summaries_created_at" ON "case_summaries" USING btree ("created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_case_summaries_created_by" ON "case_summaries" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_case_summaries_tenant" ON "case_summaries" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claim_updates_claim_id" ON "claim_updates" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claim_updates_created_at" ON "claim_updates" USING btree ("created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_assignments_active" ON "member_dues_assignments" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_assignments_member" ON "member_dues_assignments" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_assignments_tenant" ON "member_dues_assignments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_remittances_period" ON "employer_remittances" USING btree ("remittance_period_start","remittance_period_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_remittances_status" ON "employer_remittances" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_remittances_tenant" ON "employer_remittances" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dues_rules_active" ON "dues_rules" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dues_rules_tenant" ON "dues_rules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_strike_funds_active" ON "strike_funds" USING btree ("tenant_id") WHERE ((strike_status)::text = 'active'::text);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_strike_funds_organization_id" ON "strike_funds" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_strike_funds_status" ON "strike_funds" USING btree ("tenant_id","strike_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_strike_funds_tenant" ON "strike_funds" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_eligibility_fund" ON "fund_eligibility" USING btree ("strike_fund_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_eligibility_member" ON "fund_eligibility" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_eligibility_tenant" ON "fund_eligibility" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attendance_date" ON "picket_attendance" USING btree ("check_in_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attendance_fund" ON "picket_attendance" USING btree ("strike_fund_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attendance_member" ON "picket_attendance" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attendance_method" ON "picket_attendance" USING btree ("check_in_method");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attendance_tenant" ON "picket_attendance" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stipends_fund" ON "stipend_disbursements" USING btree ("strike_fund_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stipends_member" ON "stipend_disbursements" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stipends_status" ON "stipend_disbursements" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stipends_tenant" ON "stipend_disbursements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stipends_week" ON "stipend_disbursements" USING btree ("week_start_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_donations_created" ON "public_donations" USING btree ("created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_donations_fund" ON "public_donations" USING btree ("strike_fund_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_donations_payment_intent" ON "public_donations" USING btree ("payment_intent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_donations_status" ON "public_donations" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_donations_tenant" ON "public_donations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hardship_fund" ON "hardship_applications" USING btree ("strike_fund_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hardship_member" ON "hardship_applications" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hardship_status" ON "hardship_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hardship_tenant" ON "hardship_applications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_arrears_followup" ON "arrears_cases" USING btree ("next_followup_date") WHERE ((status)::text = 'open'::text);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_arrears_member" ON "arrears_cases" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_arrears_status" ON "arrears_cases" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_arrears_tenant" ON "arrears_cases" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_arrears_transaction_ids" ON "arrears_cases" USING gin ("transaction_ids");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_queue_scheduled_idx" ON "notification_queue" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_queue_status_idx" ON "notification_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_queue_tenant_idx" ON "notification_queue" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_queue_user_idx" ON "notification_queue" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "notification_templates_unique_idx" ON "notification_templates" USING btree ("tenant_id","type","channel");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_log_notification_idx" ON "notification_log" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_log_status_idx" ON "notification_log" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_notification_preferences_unique_idx" ON "user_notification_preferences" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "donations_fund_idx" ON "donations" USING btree ("strike_fund_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "donations_status_idx" ON "donations" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "donations_stripe_idx" ON "donations" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "donations_tenant_idx" ON "donations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "picket_tracking_date_idx" ON "picket_tracking" USING btree ("check_in_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "picket_tracking_fund_idx" ON "picket_tracking" USING btree ("strike_fund_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "picket_tracking_member_idx" ON "picket_tracking" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "picket_tracking_tenant_idx" ON "picket_tracking" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jurisdiction_templates_active" ON "jurisdiction_templates" USING btree ("jurisdiction","template_type") WHERE (active = true);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jurisdiction_templates_jurisdiction" ON "jurisdiction_templates" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jurisdiction_templates_metadata" ON "jurisdiction_templates" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jurisdiction_templates_type" ON "jurisdiction_templates" USING btree ("template_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arrears_member_idx" ON "arrears" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arrears_status_idx" ON "arrears" USING btree ("arrears_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "arrears_tenant_idx" ON "arrears" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clause_comparisons_created" ON "clause_comparisons_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clause_comparisons_org" ON "clause_comparisons_history" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clause_comparisons_user" ON "clause_comparisons_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_precedents_date" ON "arbitration_precedents" USING btree ("decision_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_precedents_jurisdiction" ON "arbitration_precedents" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_precedents_org" ON "arbitration_precedents" USING btree ("source_organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_precedents_outcome" ON "arbitration_precedents" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_precedents_province" ON "arbitration_precedents" USING btree ("province");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_precedents_sector" ON "arbitration_precedents" USING btree ("sector");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_precedents_sharing" ON "arbitration_precedents" USING btree ("sharing_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_precedents_type" ON "arbitration_precedents" USING btree ("grievance_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shared_clauses_org" ON "shared_clause_library" USING btree ("source_organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shared_clauses_province" ON "shared_clause_library" USING btree ("province");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shared_clauses_sector" ON "shared_clause_library" USING btree ("sector");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shared_clauses_sharing" ON "shared_clause_library" USING btree ("sharing_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shared_clauses_type" ON "shared_clause_library" USING btree ("clause_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_precedent_tags_precedent" ON "precedent_tags" USING btree ("precedent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_precedent_tags_tag" ON "precedent_tags" USING btree ("tag_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_precedent_citations_cited_by" ON "precedent_citations" USING btree ("cited_by_precedent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_precedent_citations_claim" ON "precedent_citations" USING btree ("citing_claim_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_precedent_citations_precedent" ON "precedent_citations" USING btree ("precedent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sharing_settings_org" ON "organization_sharing_settings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sharing_grants_expires" ON "organization_sharing_grants" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sharing_grants_grantee" ON "organization_sharing_grants" USING btree ("grantee_org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sharing_grants_granter" ON "organization_sharing_grants" USING btree ("granter_org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sharing_grants_resource" ON "organization_sharing_grants" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_access_log_created" ON "cross_org_access_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_access_log_resource" ON "cross_org_access_log" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_access_log_resource_org" ON "cross_org_access_log" USING btree ("resource_organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_access_log_user" ON "cross_org_access_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_access_log_user_org" ON "cross_org_access_log" USING btree ("user_organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_relationships_active" ON "organization_relationships" USING btree ("effective_date","end_date") WHERE (end_date IS NULL);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_relationships_child" ON "organization_relationships" USING btree ("child_org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_relationships_parent" ON "organization_relationships" USING btree ("parent_org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_relationships_type" ON "organization_relationships" USING btree ("relationship_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clause_tags_clause" ON "clause_library_tags" USING btree ("clause_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clause_tags_tag" ON "clause_library_tags" USING btree ("tag_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_uuid_mapping_clerk_id" ON "user_uuid_mapping" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_voting_sessions_audit_hash" ON "voting_sessions" USING btree ("audit_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_voting_sessions_blockchain_tx" ON "voting_sessions" USING btree ("blockchain_anchor_tx");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_votes_ballot_hash" ON "votes" USING btree ("ballot_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_votes_created_at" ON "votes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_votes_sequence" ON "votes" USING btree ("vote_sequence");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_votes_updated_at" ON "votes" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claims_assigned_to" ON "claims" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claims_claim_amount" ON "claims" USING btree ("claim_amount") WHERE (claim_amount IS NOT NULL);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claims_claim_number" ON "claims" USING btree ("claim_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claims_created_at" ON "claims" USING btree ("created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claims_filed_date" ON "claims" USING btree ("filed_date" DESC NULLS FIRST) WHERE (filed_date IS NOT NULL);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claims_financial_tracking" ON "claims" USING btree ("organization_id","status","claim_amount") WHERE (claim_amount IS NOT NULL);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claims_incident_date" ON "claims" USING btree ("incident_date" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claims_member_id" ON "claims" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claims_organization_id" ON "claims" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claims_priority" ON "claims" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claims_resolution_outcome" ON "claims" USING btree ("resolution_outcome") WHERE (resolution_outcome IS NOT NULL);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claims_resolved_at" ON "claims" USING btree ("resolved_at" DESC NULLS FIRST) WHERE (resolved_at IS NOT NULL);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claims_settlement_amount" ON "claims" USING btree ("settlement_amount") WHERE (settlement_amount IS NOT NULL);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claims_status" ON "claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizations_clc_affiliated" ON "organizations" USING btree ("clc_affiliated") WHERE (clc_affiliated = true);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizations_clc_code" ON "organizations" USING btree ("clc_affiliate_code") WHERE (clc_affiliate_code IS NOT NULL);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizations_hierarchy_level" ON "organizations" USING btree ("hierarchy_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizations_hierarchy_path" ON "organizations" USING gin ("hierarchy_path");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizations_legacy_tenant" ON "organizations" USING btree ("legacy_tenant_id") WHERE (legacy_tenant_id IS NOT NULL);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizations_parent" ON "organizations" USING btree ("parent_id") WHERE (parent_id IS NOT NULL);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizations_sectors" ON "organizations" USING gin ("sectors");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizations_slug" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizations_status" ON "organizations" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizations_type" ON "organizations" USING btree ("organization_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comparative_analyses_created_by_idx" ON "comparative_analyses" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comparative_analyses_created_idx" ON "comparative_analyses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comparative_analyses_org_idx" ON "comparative_analyses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comparative_analyses_type_idx" ON "comparative_analyses" USING btree ("comparison_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_remittances_due_date" ON "per_capita_remittances" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_remittances_from_org" ON "per_capita_remittances" USING btree ("from_organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_remittances_to_org" ON "per_capita_remittances" USING btree ("to_organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clc_accounts_code" ON "clc_chart_of_accounts" USING btree ("account_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clc_accounts_parent" ON "clc_chart_of_accounts" USING btree ("parent_account_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clc_accounts_type" ON "clc_chart_of_accounts" USING btree ("account_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_coa_code" ON "clc_chart_of_accounts" USING btree ("account_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_coa_parent" ON "clc_chart_of_accounts" USING btree ("parent_account_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_coa_type" ON "clc_chart_of_accounts" USING btree ("account_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clc_mappings_account" ON "transaction_clc_mappings" USING btree ("clc_account_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clc_mappings_date" ON "transaction_clc_mappings" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clc_mappings_org" ON "transaction_clc_mappings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clc_mappings_transaction" ON "transaction_clc_mappings" USING btree ("transaction_type","transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mappings_account" ON "transaction_clc_mappings" USING btree ("clc_account_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mappings_transaction" ON "transaction_clc_mappings" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_message_threads_member_id" ON "message_threads" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_message_threads_organization_id" ON "message_threads" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_message_threads_staff_id" ON "message_threads" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_voting_auditors_active" ON "voting_auditors" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_voting_auditors_clc" ON "voting_auditors" USING btree ("is_clc_certified");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trusted_cas_issuer" ON "trusted_certificate_authorities" USING btree ("issuer_dn");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trusted_cas_thumbprint" ON "trusted_certificate_authorities" USING btree ("root_certificate_thumbprint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_signature_audit_log_created_at" ON "signature_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_signature_audit_log_updated_at" ON "signature_audit_log" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_signature_audit_signature" ON "signature_audit_log" USING btree ("signature_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_signature_audit_timestamp" ON "signature_audit_log" USING btree ("event_timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_session_auditors_auditor" ON "voting_session_auditors" USING btree ("auditor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_session_auditors_session" ON "voting_session_auditors" USING btree ("voting_session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_session_auditors_status" ON "voting_session_auditors" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blockchain_anchors_block" ON "blockchain_audit_anchors" USING btree ("block_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blockchain_anchors_session" ON "blockchain_audit_anchors" USING btree ("voting_session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blockchain_anchors_status" ON "blockchain_audit_anchors" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_blockchain_anchors_tx" ON "blockchain_audit_anchors" USING btree ("transaction_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_merkle_tree_level" ON "vote_merkle_tree" USING btree ("tree_level","node_index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_merkle_tree_parent" ON "vote_merkle_tree" USING btree ("parent_node_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_merkle_tree_session" ON "vote_merkle_tree" USING btree ("voting_session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_merkle_tree_vote" ON "vote_merkle_tree" USING btree ("vote_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_session_keys_active" ON "voting_session_keys" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_session_keys_session" ON "voting_session_keys" USING btree ("voting_session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_messages_created_at" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_messages_thread_id" ON "messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_date" ON "organization_hierarchy_audit" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_org" ON "organization_hierarchy_audit" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_type" ON "organization_hierarchy_audit" USING btree ("change_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hierarchy_audit_date" ON "organization_hierarchy_audit" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hierarchy_audit_org" ON "organization_hierarchy_audit" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hierarchy_audit_type" ON "organization_hierarchy_audit" USING btree ("change_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organization_hierarchy_audit_created_at" ON "organization_hierarchy_audit" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organization_hierarchy_audit_updated_at" ON "organization_hierarchy_audit" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_key_access_log_key" ON "voting_key_access_log" USING btree ("session_key_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_key_access_log_time" ON "voting_key_access_log" USING btree ("accessed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_key_access_log_user" ON "voting_key_access_log" USING btree ("accessed_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_voting_key_access_log_created_at" ON "voting_key_access_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_voting_key_access_log_updated_at" ON "voting_key_access_log" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jurisdiction_rules_active" ON "jurisdiction_rules" USING btree ("jurisdiction","rule_category","version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jurisdiction_rules_category" ON "jurisdiction_rules" USING btree ("rule_category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jurisdiction_rules_effective" ON "jurisdiction_rules" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jurisdiction_rules_jurisdiction" ON "jurisdiction_rules" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jurisdiction_rules_params" ON "jurisdiction_rules" USING gin ("rule_parameters");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jurisdiction_rules_sectors" ON "jurisdiction_rules" USING gin ("applies_to_sectors") WHERE (applies_to_sectors IS NOT NULL);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jurisdiction_rules_type" ON "jurisdiction_rules" USING btree ("rule_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_statutory_holidays_affects" ON "statutory_holidays" USING btree ("jurisdiction","affects_deadlines") WHERE (affects_deadlines = true);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_statutory_holidays_date" ON "statutory_holidays" USING btree ("holiday_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_statutory_holidays_jurisdiction" ON "statutory_holidays" USING btree ("jurisdiction");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_statutory_holidays_year" ON "statutory_holidays" USING btree (EXTRACT(year FROM holiday_date));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compliance_validations_action" ON "compliance_validations" USING btree ("organization_id","requires_action") WHERE (requires_action = true);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compliance_validations_date" ON "compliance_validations" USING btree ("validation_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compliance_validations_org" ON "compliance_validations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compliance_validations_reference" ON "compliance_validations" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compliance_validations_rule" ON "compliance_validations" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_message_notifications_is_read" ON "message_notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_message_notifications_user_id" ON "message_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_members_organization" ON "members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_members_status" ON "members" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_members_user" ON "members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pii_access_log_accessed_at" ON "pii_access_log" USING btree ("accessed_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pii_access_log_accessed_by" ON "pii_access_log" USING btree ("accessed_by","accessed_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reports_created_by" ON "reports" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reports_tenant_id" ON "reports" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_report_executions_report_id" ON "report_executions" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_scheduled_reports_next_execution" ON "scheduled_reports" USING btree ("next_execution_at") WHERE (is_active = true);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_deadline_rules_tenant_id" ON "deadline_rules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claim_deadlines_claim_id" ON "claim_deadlines" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claim_deadlines_due_date" ON "claim_deadlines" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_claim_deadlines_status" ON "claim_deadlines" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_deadline_extensions_deadline_id" ON "deadline_extensions" USING btree ("deadline_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_deadline_alerts_deadline_id" ON "deadline_alerts" USING btree ("deadline_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_calendars_owner_id" ON "calendars" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_calendar_events_calendar_id" ON "calendar_events" USING btree ("calendar_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_calendar_events_organizer_id" ON "calendar_events" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_calendar_events_start_time" ON "calendar_events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_attendees_event_id" ON "event_attendees" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_attendees_user_id" ON "event_attendees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_room_bookings_room_id" ON "room_bookings" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_room_bookings_start_time" ON "room_bookings" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_history_user_id" ON "notification_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_documents_category" ON "member_documents" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_documents_user_id" ON "member_documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_political_participation_cope" ON "member_political_participation" USING btree ("cope_member");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_political_participation_engagement" ON "member_political_participation" USING btree ("engagement_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_political_participation_member" ON "member_political_participation" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_political_participation_org" ON "member_political_participation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_elected_officials_current" ON "elected_officials" USING btree ("is_current");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_elected_officials_district" ON "elected_officials" USING btree ("electoral_district");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_elected_officials_level" ON "elected_officials" USING btree ("government_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_elected_officials_org" ON "elected_officials" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_elected_officials_party" ON "elected_officials" USING btree ("political_party");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_legislation_tracking_bill" ON "legislation_tracking" USING btree ("bill_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_legislation_tracking_campaign" ON "legislation_tracking" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_legislation_tracking_org" ON "legislation_tracking" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_legislation_tracking_position" ON "legislation_tracking" USING btree ("union_position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_legislation_tracking_status" ON "legislation_tracking" USING btree ("current_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_political_activities_campaign" ON "political_activities" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_political_activities_date" ON "political_activities" USING btree ("activity_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_political_activities_legislation" ON "political_activities" USING btree ("legislation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_political_activities_official" ON "political_activities" USING btree ("elected_official_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_political_activities_org" ON "political_activities" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_courses_active" ON "training_courses" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_courses_category" ON "training_courses" USING btree ("course_category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_courses_clc" ON "training_courses" USING btree ("clc_approved");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_courses_org" ON "training_courses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_in_app_notifications_read" ON "in_app_notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_in_app_notifications_user_id" ON "in_app_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_sessions_course" ON "course_sessions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_sessions_dates" ON "course_sessions" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_sessions_instructor" ON "course_sessions" USING btree ("lead_instructor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_sessions_org" ON "course_sessions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_sessions_status" ON "course_sessions" USING btree ("session_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_registrations_completed" ON "course_registrations" USING btree ("completed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_registrations_course" ON "course_registrations" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_registrations_member" ON "course_registrations" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_registrations_org" ON "course_registrations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_registrations_session" ON "course_registrations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_course_registrations_status" ON "course_registrations" USING btree ("registration_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pension_plans_org" ON "pension_plans" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pension_plans_registration" ON "pension_plans" USING btree ("cra_registration_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pension_plans_status" ON "pension_plans" USING btree ("plan_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pension_plans_type" ON "pension_plans" USING btree ("plan_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hours_banks_employer" ON "pension_hours_banks" USING btree ("primary_employer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hours_banks_member" ON "pension_hours_banks" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hours_banks_period" ON "pension_hours_banks" USING btree ("reporting_period_start","reporting_period_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hours_banks_plan" ON "pension_hours_banks" USING btree ("pension_plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ml_predictions_date" ON "ml_predictions" USING btree ("prediction_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ml_predictions_organization" ON "ml_predictions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ml_predictions_type" ON "ml_predictions" USING btree ("prediction_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ml_predictions_org_idx" ON "ml_predictions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ml_predictions_type_idx" ON "ml_predictions" USING btree ("prediction_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pension_contributions_due_date" ON "pension_contributions" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pension_contributions_employer" ON "pension_contributions" USING btree ("employer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pension_contributions_hash" ON "pension_contributions" USING btree ("contribution_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pension_contributions_period" ON "pension_contributions" USING btree ("contribution_period_start","contribution_period_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pension_contributions_plan" ON "pension_contributions" USING btree ("pension_plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pension_contributions_status" ON "pension_contributions" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trustee_boards_plan" ON "pension_trustee_boards" USING btree ("pension_plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_model_metadata_organization" ON "model_metadata" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_model_metadata_type" ON "model_metadata" USING btree ("model_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trustees_board" ON "pension_trustees" USING btree ("trustee_board_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trustees_current" ON "pension_trustees" USING btree ("is_current");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trustees_type" ON "pension_trustees" USING btree ("trustee_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trustees_user" ON "pension_trustees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_metrics_org_idx" ON "analytics_metrics" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_metrics_period_idx" ON "analytics_metrics" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_metrics_type_idx" ON "analytics_metrics" USING btree ("metric_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trustee_meetings_board" ON "pension_trustee_meetings" USING btree ("trustee_board_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trustee_meetings_date" ON "pension_trustee_meetings" USING btree ("meeting_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trustee_meetings_type" ON "pension_trustee_meetings" USING btree ("meeting_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pension_claims_member" ON "pension_benefit_claims" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pension_claims_plan" ON "pension_benefit_claims" USING btree ("pension_plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pension_claims_start_date" ON "pension_benefit_claims" USING btree ("benefit_start_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pension_claims_status" ON "pension_benefit_claims" USING btree ("claim_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pension_claims_type" ON "pension_benefit_claims" USING btree ("claim_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_actuarial_valuations_date" ON "pension_actuarial_valuations" USING btree ("valuation_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_actuarial_valuations_plan" ON "pension_actuarial_valuations" USING btree ("pension_plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_actuarial_valuations_type" ON "pension_actuarial_valuations" USING btree ("valuation_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hw_plans_carrier" ON "hw_benefit_plans" USING btree ("carrier_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hw_plans_org" ON "hw_benefit_plans" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hw_plans_type" ON "hw_benefit_plans" USING btree ("plan_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hw_enrollments_effective" ON "hw_benefit_enrollments" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hw_enrollments_member" ON "hw_benefit_enrollments" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hw_enrollments_plan" ON "hw_benefit_enrollments" USING btree ("hw_plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hw_enrollments_status" ON "hw_benefit_enrollments" USING btree ("enrollment_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hw_claims_carrier_number" ON "hw_benefit_claims" USING btree ("carrier_claim_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hw_claims_enrollment" ON "hw_benefit_claims" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hw_claims_fraud" ON "hw_benefit_claims" USING btree ("flagged_for_review","fraud_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hw_claims_member" ON "hw_benefit_claims" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hw_claims_plan" ON "hw_benefit_claims" USING btree ("hw_plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hw_claims_service_date" ON "hw_benefit_claims" USING btree ("service_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hw_claims_status" ON "hw_benefit_claims" USING btree ("claim_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compliance_reports_due_date" ON "trust_compliance_reports" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compliance_reports_hw" ON "trust_compliance_reports" USING btree ("hw_plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compliance_reports_org" ON "trust_compliance_reports" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compliance_reports_pension" ON "trust_compliance_reports" USING btree ("pension_plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compliance_reports_status" ON "trust_compliance_reports" USING btree ("filing_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_compliance_reports_type_year" ON "trust_compliance_reports" USING btree ("report_type","report_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tax_year_config_org" ON "tax_year_configurations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tax_year_config_year" ON "tax_year_configurations" USING btree ("tax_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trend_analyses_created_idx" ON "trend_analyses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trend_analyses_data_source_idx" ON "trend_analyses" USING btree ("data_source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trend_analyses_org_idx" ON "trend_analyses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trend_analyses_type_idx" ON "trend_analyses" USING btree ("analysis_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tax_slips_config" ON "tax_slips" USING btree ("tax_year_config_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tax_slips_hash" ON "tax_slips" USING btree ("slip_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tax_slips_member" ON "tax_slips" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tax_slips_org" ON "tax_slips" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tax_slips_sin" ON "tax_slips" USING btree ("recipient_sin");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tax_slips_status" ON "tax_slips" USING btree ("slip_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tax_slips_type" ON "tax_slips" USING btree ("slip_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tax_slips_year" ON "tax_slips" USING btree ("tax_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cra_batches_config" ON "cra_xml_batches" USING btree ("tax_year_config_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cra_batches_confirmation" ON "cra_xml_batches" USING btree ("cra_confirmation_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cra_batches_org" ON "cra_xml_batches" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cra_batches_status" ON "cra_xml_batches" USING btree ("batch_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cra_batches_year" ON "cra_xml_batches" USING btree ("tax_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cope_contributions_date" ON "cope_contributions" USING btree ("contribution_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cope_contributions_dues_txn" ON "cope_contributions" USING btree ("dues_transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cope_contributions_member" ON "cope_contributions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cope_contributions_org" ON "cope_contributions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cope_contributions_slip" ON "cope_contributions" USING btree ("tax_slip_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_demographics_consent" ON "member_demographics" USING btree ("data_collection_consent");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_demographics_expiry" ON "member_demographics" USING btree ("data_expiry_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_demographics_indigenous" ON "member_demographics" USING btree ("is_indigenous");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_demographics_member" ON "member_demographics" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_demographics_org" ON "member_demographics" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pay_equity_complaints_filed_date" ON "pay_equity_complaints" USING btree ("filed_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pay_equity_complaints_investigator" ON "pay_equity_complaints" USING btree ("assigned_investigator");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pay_equity_complaints_member" ON "pay_equity_complaints" USING btree ("complainant_member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pay_equity_complaints_org" ON "pay_equity_complaints" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pay_equity_complaints_status" ON "pay_equity_complaints" USING btree ("complaint_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_equity_snapshots_date" ON "equity_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_equity_snapshots_org" ON "equity_snapshots" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_statcan_submissions_org" ON "statcan_submissions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_statcan_submissions_period" ON "statcan_submissions" USING btree ("reference_period_start","reference_period_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_statcan_submissions_survey" ON "statcan_submissions" USING btree ("survey_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_campaigns_dates" ON "organizing_campaigns" USING btree ("campaign_launch_date","card_check_deadline");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_campaigns_employer" ON "organizing_campaigns" USING btree ("target_employer_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_campaigns_jurisdiction" ON "organizing_campaigns" USING btree ("labor_board_jurisdiction");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_campaigns_lead_organizer" ON "organizing_campaigns" USING btree ("lead_organizer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_campaigns_org" ON "organizing_campaigns" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_campaigns_status" ON "organizing_campaigns" USING btree ("campaign_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_contacts_campaign" ON "organizing_contacts" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_contacts_card_signed" ON "organizing_contacts" USING btree ("card_signed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_contacts_committee" ON "organizing_contacts" USING btree ("organizing_committee_member");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_contacts_department" ON "organizing_contacts" USING btree ("department");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_contacts_shift" ON "organizing_contacts" USING btree ("shift");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_contacts_support_level" ON "organizing_contacts" USING btree ("support_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_activities_campaign" ON "organizing_activities" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_activities_date" ON "organizing_activities" USING btree ("activity_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_activities_type" ON "organizing_activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_certification_applications_campaign" ON "certification_applications" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_certification_applications_filed_date" ON "certification_applications" USING btree ("filed_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_certification_applications_jurisdiction" ON "certification_applications" USING btree ("labor_board_jurisdiction");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_certification_applications_status" ON "certification_applications" USING btree ("application_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_volunteers_active" ON "organizing_volunteers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_volunteers_member" ON "organizing_volunteers" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizing_volunteers_org" ON "organizing_volunteers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_political_campaigns_jurisdiction" ON "political_campaigns" USING btree ("jurisdiction_level","jurisdiction_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_political_campaigns_org" ON "political_campaigns" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_political_campaigns_status" ON "political_campaigns" USING btree ("campaign_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_political_campaigns_type" ON "political_campaigns" USING btree ("campaign_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_certifications_expiry" ON "member_certifications" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_certifications_member" ON "member_certifications" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_certifications_org" ON "member_certifications" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_certifications_status" ON "member_certifications" USING btree ("certification_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_member_certifications_type" ON "member_certifications" USING btree ("certification_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_programs_active" ON "training_programs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_programs_org" ON "training_programs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dues_trans_amounts" ON "dues_transactions" USING btree ("tenant_id","total_amount");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dues_trans_paid_date" ON "dues_transactions" USING btree ("paid_date") WHERE (paid_date IS NOT NULL);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transactions_due_date" ON "dues_transactions" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transactions_member" ON "dues_transactions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transactions_period" ON "dues_transactions" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transactions_status" ON "dues_transactions" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transactions_tenant" ON "dues_transactions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_program_enrollments_member" ON "program_enrollments" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_program_enrollments_org" ON "program_enrollments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_program_enrollments_program" ON "program_enrollments" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_program_enrollments_status" ON "program_enrollments" USING btree ("enrollment_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kpi_configurations_active_idx" ON "kpi_configurations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kpi_configurations_created_by_idx" ON "kpi_configurations" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kpi_configurations_org_idx" ON "kpi_configurations" USING btree ("organization_id");
*/