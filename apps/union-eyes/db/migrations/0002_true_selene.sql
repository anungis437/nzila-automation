DO $$ BEGIN
 CREATE TYPE "public"."ca_jurisdiction" AS ENUM('federal', 'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT');
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
CREATE TABLE IF NOT EXISTS "user_uuid_mapping" (
	"user_uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_uuid_mapping_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_org_id" uuid NOT NULL,
	"child_org_id" uuid NOT NULL,
	"relationship_type" "organization_relationship_type" NOT NULL,
	"effective_date" date DEFAULT now() NOT NULL,
	"end_date" date,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
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
	"hierarchy_path" text[] NOT NULL,
	"hierarchy_level" integer DEFAULT 0 NOT NULL,
	"jurisdiction" "ca_jurisdiction",
	"province_territory" text,
	"sectors" labour_sector[] DEFAULT '{}',
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
	"features_enabled" text[] DEFAULT '{}',
	"status" text DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid,
	"legacy_tenant_id" uuid,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
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
CREATE TABLE IF NOT EXISTS "clc_sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"affiliate_code" varchar(50),
	"action" varchar(50) NOT NULL,
	"changes" text,
	"conflicts" text,
	"duration" integer,
	"error" text,
	"synced_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clc_webhook_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_id" varchar(100) NOT NULL,
	"type" varchar(100) NOT NULL,
	"affiliate_code" varchar(50),
	"status" varchar(20) NOT NULL,
	"message" text,
	"payload" text,
	"received_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"remittance_id" uuid,
	"organization_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"priority" varchar(20) NOT NULL,
	"channel" varchar(255),
	"recipients" text,
	"success_count" integer DEFAULT 0,
	"failure_count" integer DEFAULT 0,
	"message_ids" text,
	"errors" text,
	"sent_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid,
	"role" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"is_primary" boolean DEFAULT false,
	"receive_reminders" boolean DEFAULT true,
	"receive_reports" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "per_capita_remittances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
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
	"approval_status" varchar(20) DEFAULT 'draft',
	"submitted_date" timestamp with time zone,
	"approved_date" timestamp with time zone,
	"approved_by" uuid,
	"rejected_date" timestamp with time zone,
	"rejected_by" uuid,
	"rejection_reason" text,
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
CREATE TABLE IF NOT EXISTS "remittance_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"remittance_id" uuid NOT NULL,
	"approver_user_id" uuid NOT NULL,
	"approver_role" varchar(50),
	"approval_level" varchar(20),
	"action" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"reviewed_at" timestamp with time zone,
	"comment" text,
	"rejection_reason" text,
	"flagged_issues" text,
	"requested_changes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DROP POLICY IF EXISTS "arbitration_precedents_org_access" ON public.arbitration_precedents;
--> statement-breakpoint
DROP POLICY IF EXISTS "precedent_tags_accessible_precedent" ON public.precedent_tags;
--> statement-breakpoint
DROP POLICY IF EXISTS "precedent_citations_accessible" ON public.precedent_citations;
--> statement-breakpoint
DROP POLICY IF EXISTS "blockchain_audit_anchors_via_session" ON public.blockchain_audit_anchors;
--> statement-breakpoint
DO $$
DECLARE
	policy_record RECORD;
BEGIN
	FOR policy_record IN
		SELECT schemaname, tablename, policyname
		FROM pg_policies
		WHERE schemaname IN ('public')
	LOOP
		EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
			policy_record.policyname,
			policy_record.schemaname,
			policy_record.tablename
		);
	END LOOP;
END $$;
--> statement-breakpoint
ALTER TABLE "organization_members" ALTER COLUMN "organization_id" SET DATA TYPE uuid USING "organization_id"::uuid;--> statement-breakpoint
ALTER TABLE "organization_members" ALTER COLUMN "tenant_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_members" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "organization_members" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "organization_members" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "organization_members" ALTER COLUMN "membership_number" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "organization_members" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organization_members" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
-- Removed user_management.tenant_users reference - using organization terminology in public schema
--> statement-breakpoint
ALTER TABLE "organization_members" ADD COLUMN IF NOT EXISTS "joined_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_relationships" ADD CONSTRAINT "organization_relationships_parent_org_id_organizations_id_fk" FOREIGN KEY ("parent_org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_relationships" ADD CONSTRAINT "organization_relationships_child_org_id_organizations_id_fk" FOREIGN KEY ("child_org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_id_organizations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clc_sync_log" ADD CONSTRAINT "clc_sync_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF EXISTS (
	SELECT 1
	FROM information_schema.columns
	WHERE table_schema = 'public'
		AND table_name = 'notification_log'
		AND column_name = 'remittance_id'
 ) THEN
	ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_remittance_id_fkey" FOREIGN KEY ("remittance_id") REFERENCES "public"."per_capita_remittances"("id") ON DELETE no action ON UPDATE no action;
 END IF;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF EXISTS (
	SELECT 1
	FROM information_schema.columns
	WHERE table_schema = 'public'
		AND table_name = 'notification_log'
		AND column_name = 'organization_id'
 ) THEN
	ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
 END IF;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_contacts" ADD CONSTRAINT "organization_contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF EXISTS (
	SELECT 1
	FROM information_schema.columns
	WHERE table_schema = 'public'
		AND table_name = 'per_capita_remittances'
		AND column_name = 'organization_id'
 ) THEN
	ALTER TABLE "per_capita_remittances" ADD CONSTRAINT "per_capita_remittances_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
 END IF;
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
 ALTER TABLE "remittance_approvals" ADD CONSTRAINT "remittance_approvals_remittance_id_fkey" FOREIGN KEY ("remittance_id") REFERENCES "public"."per_capita_remittances"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_uuid_mapping_clerk_id" ON "user_uuid_mapping" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_relationships_parent" ON "organization_relationships" USING btree ("parent_org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_relationships_child" ON "organization_relationships" USING btree ("child_org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_org_relationships_type" ON "organization_relationships" USING btree ("relationship_type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_org_relationship" ON "organization_relationships" USING btree ("parent_org_id","child_org_id","relationship_type","effective_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizations_parent" ON "organizations" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizations_type" ON "organizations" USING btree ("organization_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizations_slug" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizations_hierarchy_level" ON "organizations" USING btree ("hierarchy_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizations_status" ON "organizations" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizations_clc_affiliated" ON "organizations" USING btree ("clc_affiliated");--> statement-breakpoint
DO $$ BEGIN
 IF EXISTS (
	SELECT 1
	FROM information_schema.columns
	WHERE table_schema = 'public'
		AND table_name = 'organizations'
		AND column_name = 'jurisdiction'
 ) THEN
	CREATE INDEX IF NOT EXISTS "idx_organizations_jurisdiction" ON "organizations" USING btree ("jurisdiction");
 END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organizations_legacy_tenant" ON "organizations" USING btree ("legacy_tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clc_accounts_code" ON "clc_chart_of_accounts" USING btree ("account_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clc_accounts_parent" ON "clc_chart_of_accounts" USING btree ("parent_account_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clc_accounts_type" ON "clc_chart_of_accounts" USING btree ("account_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sync_log_org" ON "clc_sync_log" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sync_log_affiliate" ON "clc_sync_log" USING btree ("affiliate_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sync_log_synced_at" ON "clc_sync_log" USING btree ("synced_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_webhook_log_type" ON "clc_webhook_log" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_webhook_log_affiliate" ON "clc_webhook_log" USING btree ("affiliate_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_webhook_log_received_at" ON "clc_webhook_log" USING btree ("received_at");--> statement-breakpoint
DO $$ BEGIN
 IF EXISTS (
	SELECT 1
	FROM information_schema.columns
	WHERE table_schema = 'public'
		AND table_name = 'notification_log'
		AND column_name = 'remittance_id'
 ) THEN
	CREATE INDEX IF NOT EXISTS "idx_notification_log_remittance" ON "notification_log" USING btree ("remittance_id");
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF EXISTS (
	SELECT 1
	FROM information_schema.columns
	WHERE table_schema = 'public'
		AND table_name = 'notification_log'
		AND column_name = 'organization_id'
 ) THEN
	CREATE INDEX IF NOT EXISTS "idx_notification_log_org" ON "notification_log" USING btree ("organization_id");
 END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 IF EXISTS (
	SELECT 1
	FROM information_schema.columns
	WHERE table_schema = 'public'
		AND table_name = 'notification_log'
		AND column_name = 'sent_at'
 ) THEN
	CREATE INDEX IF NOT EXISTS "idx_notification_log_sent_at" ON "notification_log" USING btree ("sent_at");
 END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contacts_org" ON "organization_contacts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contacts_email" ON "organization_contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contacts_user" ON "organization_contacts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_remittances_due_date" ON "per_capita_remittances" USING btree ("due_date");--> statement-breakpoint
DO $$ BEGIN
 IF EXISTS (
	SELECT 1
	FROM information_schema.columns
	WHERE table_schema = 'public'
		AND table_name = 'per_capita_remittances'
		AND column_name = 'organization_id'
 ) THEN
	CREATE INDEX IF NOT EXISTS "idx_remittances_org" ON "per_capita_remittances" USING btree ("organization_id");
 END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_remittances_from_org" ON "per_capita_remittances" USING btree ("from_organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_remittances_to_org" ON "per_capita_remittances" USING btree ("to_organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_approvals_remittance" ON "remittance_approvals" USING btree ("remittance_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_approvals_approver" ON "remittance_approvals" USING btree ("approver_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_approvals_status" ON "remittance_approvals" USING btree ("status");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organization_members_org_id" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_organization_members_user_id" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_org_membership" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "name";--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "email";--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "phone";--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "department";--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "position";--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "hire_date";--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "seniority";--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "union_join_date";--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "preferred_contact_method";--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "metadata";--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "search_vector";--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "organization_members" DROP COLUMN IF EXISTS "deleted_at";