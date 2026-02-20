CREATE TYPE "public"."stripe_subscription_status" AS ENUM('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused');--> statement-breakpoint
CREATE TABLE "stripe_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"stripe_product_id" text,
	"plan_name" text,
	"plan_interval" text,
	"amount_cents" bigint,
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"status" "stripe_subscription_status" DEFAULT 'incomplete' NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp with time zone,
	"trial_start" timestamp with time zone,
	"trial_end" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "indirect_tax_accounts" CASCADE;--> statement-breakpoint
DROP TABLE "indirect_tax_periods" CASCADE;--> statement-breakpoint
DROP TABLE "indirect_tax_summary" CASCADE;--> statement-breakpoint
DROP TABLE "tax_filings" CASCADE;--> statement-breakpoint
DROP TABLE "tax_installments" CASCADE;--> statement-breakpoint
DROP TABLE "tax_notices" CASCADE;--> statement-breakpoint
DROP TABLE "tax_profiles" CASCADE;--> statement-breakpoint
DROP TABLE "tax_years" CASCADE;--> statement-breakpoint
DROP TABLE "api_credentials" CASCADE;--> statement-breakpoint
DROP TABLE "assets" CASCADE;--> statement-breakpoint
DROP TABLE "certifications" CASCADE;--> statement-breakpoint
DROP TABLE "commissions" CASCADE;--> statement-breakpoint
DROP TABLE "deals" CASCADE;--> statement-breakpoint
DROP TABLE "gtm_requests" CASCADE;--> statement-breakpoint
DROP TABLE "partner_users" CASCADE;--> statement-breakpoint
DROP TABLE "partners" CASCADE;--> statement-breakpoint
DROP TABLE "ai_action_runs" CASCADE;--> statement-breakpoint
DROP TABLE "ai_actions" CASCADE;--> statement-breakpoint
DROP TABLE "ai_apps" CASCADE;--> statement-breakpoint
DROP TABLE "ai_capability_profiles" CASCADE;--> statement-breakpoint
DROP TABLE "ai_embeddings" CASCADE;--> statement-breakpoint
DROP TABLE "ai_knowledge_ingestion_runs" CASCADE;--> statement-breakpoint
DROP TABLE "ai_knowledge_sources" CASCADE;--> statement-breakpoint
DROP TABLE "ai_prompt_versions" CASCADE;--> statement-breakpoint
DROP TABLE "ai_prompts" CASCADE;--> statement-breakpoint
DROP TABLE "ai_request_payloads" CASCADE;--> statement-breakpoint
DROP TABLE "ai_requests" CASCADE;--> statement-breakpoint
DROP TABLE "ai_usage_budgets" CASCADE;--> statement-breakpoint
DROP TABLE "ai_deployment_routes" CASCADE;--> statement-breakpoint
DROP TABLE "ai_deployments" CASCADE;--> statement-breakpoint
DROP TABLE "ai_models" CASCADE;--> statement-breakpoint
ALTER TABLE "stripe_subscriptions" ADD CONSTRAINT "stripe_subscriptions_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "stripe_subscriptions_stripe_id_idx" ON "stripe_subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
ALTER TABLE "shareholders" DROP COLUMN "holder_subtype";--> statement-breakpoint
ALTER TABLE "public"."documents" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."document_category";--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('minute_book', 'filing', 'resolution', 'minutes', 'certificate', 'year_end', 'export', 'other');--> statement-breakpoint
ALTER TABLE "public"."documents" ALTER COLUMN "category" SET DATA TYPE "public"."document_category" USING "category"::"public"."document_category";--> statement-breakpoint
DROP TYPE "public"."holder_subtype";--> statement-breakpoint
DROP TYPE "public"."indirect_tax_filing_frequency";--> statement-breakpoint
DROP TYPE "public"."indirect_tax_period_status";--> statement-breakpoint
DROP TYPE "public"."indirect_tax_type";--> statement-breakpoint
DROP TYPE "public"."tax_filing_type";--> statement-breakpoint
DROP TYPE "public"."tax_installment_status";--> statement-breakpoint
DROP TYPE "public"."tax_notice_authority";--> statement-breakpoint
DROP TYPE "public"."tax_notice_type";--> statement-breakpoint
DROP TYPE "public"."tax_year_status";--> statement-breakpoint
DROP TYPE "public"."api_env";--> statement-breakpoint
DROP TYPE "public"."cert_track_status";--> statement-breakpoint
DROP TYPE "public"."commission_status";--> statement-breakpoint
DROP TYPE "public"."deal_stage";--> statement-breakpoint
DROP TYPE "public"."gtm_request_status";--> statement-breakpoint
DROP TYPE "public"."partner_status";--> statement-breakpoint
DROP TYPE "public"."partner_tier";--> statement-breakpoint
DROP TYPE "public"."partner_type";--> statement-breakpoint
DROP TYPE "public"."partner_user_role";--> statement-breakpoint
DROP TYPE "public"."ai_action_run_status";--> statement-breakpoint
DROP TYPE "public"."ai_action_status";--> statement-breakpoint
DROP TYPE "public"."ai_app_status";--> statement-breakpoint
DROP TYPE "public"."ai_budget_status";--> statement-breakpoint
DROP TYPE "public"."ai_environment";--> statement-breakpoint
DROP TYPE "public"."ai_knowledge_ingestion_status";--> statement-breakpoint
DROP TYPE "public"."ai_knowledge_source_status";--> statement-breakpoint
DROP TYPE "public"."ai_knowledge_source_type";--> statement-breakpoint
DROP TYPE "public"."ai_prompt_status";--> statement-breakpoint
DROP TYPE "public"."ai_redaction_mode";--> statement-breakpoint
DROP TYPE "public"."ai_request_feature";--> statement-breakpoint
DROP TYPE "public"."ai_request_status";--> statement-breakpoint
DROP TYPE "public"."ai_risk_tier";--> statement-breakpoint
DROP TYPE "public"."ai_deployment_feature";--> statement-breakpoint
DROP TYPE "public"."ai_model_modality";