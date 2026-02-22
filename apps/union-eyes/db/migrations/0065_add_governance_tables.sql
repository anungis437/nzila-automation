CREATE TABLE IF NOT EXISTS "golden_shares" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "share_class" text NOT NULL DEFAULT 'B',
  "certificate_number" text NOT NULL,
  "issue_date" date NOT NULL,
  "holder_type" text NOT NULL DEFAULT 'council',
  "council_members" jsonb NOT NULL,
  "voting_power_reserved_matters" integer NOT NULL DEFAULT 51,
  "voting_power_ordinary_matters" integer NOT NULL DEFAULT 1,
  "redemption_value" integer NOT NULL DEFAULT 1,
  "dividend_rights" boolean NOT NULL DEFAULT false,
  "sunset_clause_active" boolean NOT NULL DEFAULT true,
  "sunset_clause_duration" integer NOT NULL DEFAULT 5,
  "consecutive_compliance_years" integer NOT NULL DEFAULT 0,
  "sunset_triggered_date" date,
  "conversion_date" date,
  "status" text NOT NULL DEFAULT 'active',
  "transferable" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "golden_shares_certificate_number_unique" UNIQUE("certificate_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reserved_matter_votes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "matter_type" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "proposed_by" varchar(255) NOT NULL,
  "proposed_date" timestamp NOT NULL,
  "voting_deadline" timestamp NOT NULL,
  "matter_details" jsonb NOT NULL,
  "class_a_votes_for" integer DEFAULT 0,
  "class_a_votes_against" integer DEFAULT 0,
  "class_a_abstain" integer DEFAULT 0,
  "class_a_total_votes" integer NOT NULL,
  "class_a_percent_for" integer DEFAULT 0,
  "class_b_vote" text,
  "class_b_vote_date" timestamp,
  "class_b_vote_rationale" text,
  "class_b_council_members_voting" jsonb,
  "status" text NOT NULL DEFAULT 'pending',
  "final_decision" text,
  "decision_date" timestamp,
  "implemented" boolean DEFAULT false,
  "implementation_date" timestamp,
  "implementation_notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mission_audits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "audit_year" integer NOT NULL,
  "audit_period_start" date NOT NULL,
  "audit_period_end" date NOT NULL,
  "auditor_firm" text NOT NULL,
  "auditor_name" text NOT NULL,
  "auditor_certification" text,
  "audit_date" date NOT NULL,
  "union_revenue_percent" integer NOT NULL,
  "member_satisfaction_percent" integer NOT NULL,
  "data_violations" integer NOT NULL DEFAULT 0,
  "union_revenue_threshold" integer NOT NULL DEFAULT 90,
  "member_satisfaction_threshold" integer NOT NULL DEFAULT 80,
  "data_violations_threshold" integer NOT NULL DEFAULT 0,
  "union_revenue_pass" boolean NOT NULL,
  "member_satisfaction_pass" boolean NOT NULL,
  "data_violations_pass" boolean NOT NULL,
  "overall_pass" boolean NOT NULL,
  "total_revenue" integer,
  "union_revenue" integer,
  "member_survey_sample_size" integer,
  "member_survey_responses" integer,
  "data_violation_details" jsonb,
  "auditor_opinion" text NOT NULL,
  "auditor_notes" text,
  "corrective_actions" jsonb,
  "impacts_consecutive_compliance" boolean NOT NULL,
  "consecutive_years_after_audit" integer,
  "audit_report_pdf_url" text,
  "supporting_documents_urls" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "governance_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_type" text NOT NULL,
  "event_date" timestamp NOT NULL,
  "golden_share_id" uuid,
  "reserved_matter_vote_id" uuid,
  "mission_audit_id" uuid,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "impact" text,
  "impact_description" text,
  "stakeholders" jsonb,
  "notifications_sent" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "council_elections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "election_year" integer NOT NULL,
  "election_date" date NOT NULL,
  "positions_available" integer NOT NULL,
  "candidates" jsonb NOT NULL,
  "winners" jsonb NOT NULL,
  "total_votes" integer NOT NULL,
  "participation_rate" integer,
  "verified_by" text,
  "verification_date" date,
  "contested_results" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN IF NOT EXISTS "signature" text;
ALTER TABLE "votes" ADD COLUMN IF NOT EXISTS "receipt_id" varchar(255);
ALTER TABLE "votes" ADD COLUMN IF NOT EXISTS "verification_code" varchar(100);
ALTER TABLE "votes" ADD COLUMN IF NOT EXISTS "audit_hash" varchar(255);
