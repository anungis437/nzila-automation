-- CBA Intelligence Schema Migration
-- Created: 2025-11-12
-- Purpose: Add Collective Bargaining Agreement Intelligence tables to UnionEyes platform

-- Step 1: Create ENUM types for CBA Intelligence
DO $$ BEGIN
 CREATE TYPE "public"."cba_language" AS ENUM('en', 'fr', 'bilingual');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."cba_status" AS ENUM('active', 'expired', 'under_negotiation', 'ratified_pending', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."cba_jurisdiction" AS ENUM('federal', 'ontario', 'bc', 'alberta', 'quebec', 'manitoba', 'saskatchewan', 'nova_scotia', 'new_brunswick', 'pei', 'newfoundland', 'northwest_territories', 'yukon', 'nunavut');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."clause_type" AS ENUM('wages_compensation', 'benefits_insurance', 'working_conditions', 'grievance_arbitration', 'seniority_promotion', 'health_safety', 'union_rights', 'management_rights', 'duration_renewal', 'vacation_leave', 'hours_scheduling', 'disciplinary_procedures', 'training_development', 'pension_retirement', 'overtime', 'job_security', 'technological_change', 'workplace_rights', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."entity_type" AS ENUM('monetary_amount', 'percentage', 'date', 'time_period', 'job_position', 'location', 'person', 'organization', 'legal_reference', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."decision_type" AS ENUM('grievance', 'unfair_practice', 'certification', 'judicial_review', 'interpretation', 'scope_bargaining', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."outcome" AS ENUM('grievance_upheld', 'grievance_denied', 'partial_success', 'dismissed', 'withdrawn', 'settled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."precedent_value" AS ENUM('high', 'medium', 'low');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."tribunal_type" AS ENUM('fpslreb', 'provincial_labour_board', 'private_arbitrator', 'court_federal', 'court_provincial', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create main Collective Agreements table
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

-- Step 3: Create CBA Clauses table
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

-- Step 4: Create supporting tables
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

-- Step 5: Create Arbitration and Legal tables
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
	"analyzed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"analyzed_by" varchar(50) DEFAULT 'ai_system' NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL
);

-- Step 6: Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "cba_contacts" ADD CONSTRAINT "cba_contacts_cba_id_collective_agreements_id_fk" FOREIGN KEY ("cba_id") REFERENCES "public"."collective_agreements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "cba_version_history" ADD CONSTRAINT "cba_version_history_cba_id_collective_agreements_id_fk" FOREIGN KEY ("cba_id") REFERENCES "public"."collective_agreements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "benefit_comparisons" ADD CONSTRAINT "benefit_comparisons_cba_id_collective_agreements_id_fk" FOREIGN KEY ("cba_id") REFERENCES "public"."collective_agreements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "benefit_comparisons" ADD CONSTRAINT "benefit_comparisons_clause_id_cba_clauses_id_fk" FOREIGN KEY ("clause_id") REFERENCES "public"."cba_clauses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "cba_clauses" ADD CONSTRAINT "cba_clauses_cba_id_collective_agreements_id_fk" FOREIGN KEY ("cba_id") REFERENCES "public"."collective_agreements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "wage_progressions" ADD CONSTRAINT "wage_progressions_cba_id_collective_agreements_id_fk" FOREIGN KEY ("cba_id") REFERENCES "public"."collective_agreements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "wage_progressions" ADD CONSTRAINT "wage_progressions_clause_id_cba_clauses_id_fk" FOREIGN KEY ("clause_id") REFERENCES "public"."cba_clauses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bargaining_notes" ADD CONSTRAINT "bargaining_notes_cba_id_collective_agreements_id_fk" FOREIGN KEY ("cba_id") REFERENCES "public"."collective_agreements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "cba_footnotes" ADD CONSTRAINT "cba_footnotes_source_clause_id_cba_clauses_id_fk" FOREIGN KEY ("source_clause_id") REFERENCES "public"."cba_clauses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "cba_footnotes" ADD CONSTRAINT "cba_footnotes_target_clause_id_cba_clauses_id_fk" FOREIGN KEY ("target_clause_id") REFERENCES "public"."cba_clauses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "cba_footnotes" ADD CONSTRAINT "cba_footnotes_target_decision_id_arbitration_decisions_id_fk" FOREIGN KEY ("target_decision_id") REFERENCES "public"."arbitration_decisions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Step 7: Create indexes for optimized queries
CREATE INDEX IF NOT EXISTS "cba_contacts_cba_idx" ON "cba_contacts" USING btree ("cba_id");
CREATE INDEX IF NOT EXISTS "cba_contacts_type_idx" ON "cba_contacts" USING btree ("contact_type");
CREATE INDEX IF NOT EXISTS "cba_version_cba_idx" ON "cba_version_history" USING btree ("cba_id");
CREATE INDEX IF NOT EXISTS "cba_version_number_idx" ON "cba_version_history" USING btree ("version");
CREATE INDEX IF NOT EXISTS "cba_tenant_idx" ON "collective_agreements" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "cba_jurisdiction_idx" ON "collective_agreements" USING btree ("jurisdiction");
CREATE INDEX IF NOT EXISTS "cba_employer_idx" ON "collective_agreements" USING btree ("employer_name");
CREATE INDEX IF NOT EXISTS "cba_union_idx" ON "collective_agreements" USING btree ("union_name");
CREATE INDEX IF NOT EXISTS "cba_expiry_idx" ON "collective_agreements" USING btree ("expiry_date");
CREATE INDEX IF NOT EXISTS "cba_status_idx" ON "collective_agreements" USING btree ("status");
CREATE INDEX IF NOT EXISTS "cba_effective_date_idx" ON "collective_agreements" USING btree ("effective_date");
CREATE INDEX IF NOT EXISTS "cba_sector_idx" ON "collective_agreements" USING btree ("industry_sector");
CREATE INDEX IF NOT EXISTS "benefit_comparisons_cba_idx" ON "benefit_comparisons" USING btree ("cba_id");
CREATE INDEX IF NOT EXISTS "benefit_comparisons_type_idx" ON "benefit_comparisons" USING btree ("benefit_type");
CREATE INDEX IF NOT EXISTS "cba_clauses_cba_idx" ON "cba_clauses" USING btree ("cba_id");
CREATE INDEX IF NOT EXISTS "cba_clauses_type_idx" ON "cba_clauses" USING btree ("clause_type");
CREATE INDEX IF NOT EXISTS "cba_clauses_number_idx" ON "cba_clauses" USING btree ("clause_number");
CREATE INDEX IF NOT EXISTS "cba_clauses_parent_idx" ON "cba_clauses" USING btree ("parent_clause_id");
CREATE INDEX IF NOT EXISTS "cba_clauses_confidence_idx" ON "cba_clauses" USING btree ("confidence_score");
CREATE INDEX IF NOT EXISTS "clause_comparisons_tenant_idx" ON "clause_comparisons" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "clause_comparisons_type_idx" ON "clause_comparisons" USING btree ("clause_type");
CREATE INDEX IF NOT EXISTS "wage_progressions_cba_idx" ON "wage_progressions" USING btree ("cba_id");
CREATE INDEX IF NOT EXISTS "wage_progressions_clause_idx" ON "wage_progressions" USING btree ("clause_id");
CREATE INDEX IF NOT EXISTS "wage_progressions_classification_idx" ON "wage_progressions" USING btree ("classification");
CREATE INDEX IF NOT EXISTS "wage_progressions_effective_date_idx" ON "wage_progressions" USING btree ("effective_date");
CREATE INDEX IF NOT EXISTS "arbitration_tribunal_idx" ON "arbitration_decisions" USING btree ("tribunal");
CREATE INDEX IF NOT EXISTS "arbitration_decision_date_idx" ON "arbitration_decisions" USING btree ("decision_date");
CREATE INDEX IF NOT EXISTS "arbitration_arbitrator_idx" ON "arbitration_decisions" USING btree ("arbitrator");
CREATE INDEX IF NOT EXISTS "arbitration_outcome_idx" ON "arbitration_decisions" USING btree ("outcome");
CREATE INDEX IF NOT EXISTS "arbitration_precedent_idx" ON "arbitration_decisions" USING btree ("precedent_value");
CREATE INDEX IF NOT EXISTS "arbitration_jurisdiction_idx" ON "arbitration_decisions" USING btree ("jurisdiction");
CREATE INDEX IF NOT EXISTS "arbitration_case_number_idx" ON "arbitration_decisions" USING btree ("case_number");
CREATE INDEX IF NOT EXISTS "arbitrator_profiles_name_idx" ON "arbitrator_profiles" USING btree ("name");
CREATE INDEX IF NOT EXISTS "arbitrator_profiles_active_idx" ON "arbitrator_profiles" USING btree ("is_active");
CREATE INDEX IF NOT EXISTS "bargaining_notes_cba_idx" ON "bargaining_notes" USING btree ("cba_id");
CREATE INDEX IF NOT EXISTS "bargaining_notes_tenant_idx" ON "bargaining_notes" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "bargaining_notes_session_date_idx" ON "bargaining_notes" USING btree ("session_date");
CREATE INDEX IF NOT EXISTS "bargaining_notes_session_type_idx" ON "bargaining_notes" USING btree ("session_type");
CREATE INDEX IF NOT EXISTS "cba_footnotes_source_idx" ON "cba_footnotes" USING btree ("source_clause_id");
CREATE INDEX IF NOT EXISTS "cba_footnotes_target_clause_idx" ON "cba_footnotes" USING btree ("target_clause_id");
CREATE INDEX IF NOT EXISTS "cba_footnotes_target_decision_idx" ON "cba_footnotes" USING btree ("target_decision_id");
CREATE INDEX IF NOT EXISTS "claim_precedent_claim_idx" ON "claim_precedent_analysis" USING btree ("claim_id");

-- Migration complete
-- Tables created: 11
-- Enums created: 9
-- Foreign keys: 11
-- Indexes: 47
