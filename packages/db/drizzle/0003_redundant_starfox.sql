CREATE TYPE "public"."ml_model_status" AS ENUM('draft', 'active', 'retired');--> statement-breakpoint
CREATE TYPE "public"."ml_run_status" AS ENUM('started', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."api_env" AS ENUM('sandbox', 'production');--> statement-breakpoint
CREATE TYPE "public"."cert_track_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."commission_status" AS ENUM('pending', 'earned', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."deal_stage" AS ENUM('registered', 'submitted', 'approved', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."gtm_request_status" AS ENUM('draft', 'submitted', 'assigned', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."partner_status" AS ENUM('pending', 'active', 'suspended', 'churned');--> statement-breakpoint
CREATE TYPE "public"."partner_tier" AS ENUM('registered', 'select', 'certified', 'professional', 'premier', 'advanced', 'enterprise', 'elite', 'strategic');--> statement-breakpoint
CREATE TYPE "public"."partner_type" AS ENUM('channel', 'isv', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."partner_user_role" AS ENUM('channel:admin', 'channel:sales', 'channel:executive', 'isv:admin', 'isv:technical', 'isv:business', 'enterprise:admin', 'enterprise:user');--> statement-breakpoint
CREATE TYPE "public"."command_status" AS ENUM('pending', 'approved', 'dispatched', 'running', 'succeeded', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."playbook_name" AS ENUM('contract_guardian', 'lint_check', 'typecheck', 'unit_tests', 'full_ci');--> statement-breakpoint
CREATE TABLE "ml_datasets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"dataset_key" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"snapshot_document_id" uuid,
	"schema_json" jsonb,
	"build_config_json" jsonb,
	"sha256" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ml_inference_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"model_id" uuid NOT NULL,
	"status" "ml_run_status" DEFAULT 'started' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"input_period_start" date NOT NULL,
	"input_period_end" date NOT NULL,
	"output_document_id" uuid,
	"summary_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ml_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"model_key" text NOT NULL,
	"algorithm" text DEFAULT 'isolation_forest' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "ml_model_status" DEFAULT 'draft' NOT NULL,
	"training_dataset_id" uuid,
	"artifact_document_id" uuid,
	"metrics_document_id" uuid,
	"hyperparams_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"feature_spec_json" jsonb,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ml_scores_stripe_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"date" date NOT NULL,
	"features_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"score" numeric(12, 6) NOT NULL,
	"is_anomaly" boolean DEFAULT false NOT NULL,
	"threshold" numeric(12, 6) NOT NULL,
	"model_id" uuid NOT NULL,
	"inference_run_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ml_scores_stripe_txn" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"stripe_event_id" text,
	"stripe_charge_id" text,
	"stripe_payment_intent_id" text,
	"stripe_balance_txn_id" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"currency" text DEFAULT 'cad' NOT NULL,
	"amount" numeric(18, 6) NOT NULL,
	"features_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"score" numeric(12, 6) NOT NULL,
	"is_anomaly" boolean DEFAULT false NOT NULL,
	"threshold" numeric(12, 6) NOT NULL,
	"model_id" uuid NOT NULL,
	"inference_run_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ml_scores_ue_cases_priority" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"score" numeric(12, 6) NOT NULL,
	"predicted_priority" text NOT NULL,
	"actual_priority" text,
	"features_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"model_id" uuid NOT NULL,
	"inference_run_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ml_scores_ue_sla_risk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"probability" numeric(12, 6) NOT NULL,
	"predicted_breach" boolean DEFAULT false NOT NULL,
	"actual_breach" boolean,
	"features_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"model_id" uuid NOT NULL,
	"inference_run_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ml_training_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"model_key" text NOT NULL,
	"dataset_id" uuid,
	"status" "ml_run_status" DEFAULT 'started' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"logs_document_id" uuid,
	"metrics_document_id" uuid,
	"artifact_document_id" uuid,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ue_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"category" text,
	"channel" text,
	"status" text,
	"assigned_queue" text,
	"priority" text,
	"sla_breached" boolean,
	"reopen_count" integer DEFAULT 0,
	"message_count" integer DEFAULT 0,
	"attachment_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"env" "api_env" NOT NULL,
	"key_prefix" varchar(12) NOT NULL,
	"key_hash" text NOT NULL,
	"label" varchar(100),
	"is_revoked" boolean DEFAULT false NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text,
	"blob_key" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"tags" jsonb,
	"uploaded_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"track_id" varchar(100) NOT NULL,
	"module_id" varchar(100),
	"status" "cert_track_status" DEFAULT 'not_started' NOT NULL,
	"completed_at" timestamp with time zone,
	"badge_blob_key" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"tier_multiplier" numeric(4, 2) DEFAULT '1.00' NOT NULL,
	"status" "commission_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"stripe_payout_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"account_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_email" varchar(320) NOT NULL,
	"vertical" varchar(100) NOT NULL,
	"estimated_arr" numeric(12, 2) NOT NULL,
	"stage" "deal_stage" DEFAULT 'registered' NOT NULL,
	"expected_close_date" date,
	"locked_until" timestamp with time zone,
	"notes" text,
	"nzila_reviewer_id" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gtm_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"subject" text NOT NULL,
	"payload" jsonb,
	"nzila_owner_id" varchar(255),
	"status" "gtm_request_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"allowed_views" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subsidiary_id" varchar(255),
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"role" "partner_user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" varchar(255) NOT NULL,
	"company_name" text NOT NULL,
	"type" "partner_type" NOT NULL,
	"tier" "partner_tier" DEFAULT 'registered' NOT NULL,
	"status" "partner_status" DEFAULT 'pending' NOT NULL,
	"nzila_owner_id" varchar(255),
	"website" text,
	"logo" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partners_clerk_org_id_unique" UNIQUE("clerk_org_id")
);
--> statement-breakpoint
CREATE TABLE "automation_commands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"correlation_id" uuid NOT NULL,
	"playbook" "playbook_name" NOT NULL,
	"status" "command_status" DEFAULT 'pending' NOT NULL,
	"dry_run" boolean DEFAULT true NOT NULL,
	"requested_by" text NOT NULL,
	"args" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"run_id" text,
	"run_url" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "automation_commands_correlation_id_unique" UNIQUE("correlation_id")
);
--> statement-breakpoint
CREATE TABLE "automation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"command_id" uuid NOT NULL,
	"correlation_id" uuid NOT NULL,
	"event" varchar(50) NOT NULL,
	"actor" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"hash" text NOT NULL,
	"previous_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ml_datasets" ADD CONSTRAINT "ml_datasets_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_datasets" ADD CONSTRAINT "ml_datasets_snapshot_document_id_documents_id_fk" FOREIGN KEY ("snapshot_document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_inference_runs" ADD CONSTRAINT "ml_inference_runs_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_inference_runs" ADD CONSTRAINT "ml_inference_runs_model_id_ml_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ml_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_inference_runs" ADD CONSTRAINT "ml_inference_runs_output_document_id_documents_id_fk" FOREIGN KEY ("output_document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_models" ADD CONSTRAINT "ml_models_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_models" ADD CONSTRAINT "ml_models_training_dataset_id_ml_datasets_id_fk" FOREIGN KEY ("training_dataset_id") REFERENCES "public"."ml_datasets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_models" ADD CONSTRAINT "ml_models_artifact_document_id_documents_id_fk" FOREIGN KEY ("artifact_document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_models" ADD CONSTRAINT "ml_models_metrics_document_id_documents_id_fk" FOREIGN KEY ("metrics_document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_scores_stripe_daily" ADD CONSTRAINT "ml_scores_stripe_daily_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_scores_stripe_daily" ADD CONSTRAINT "ml_scores_stripe_daily_model_id_ml_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ml_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_scores_stripe_daily" ADD CONSTRAINT "ml_scores_stripe_daily_inference_run_id_ml_inference_runs_id_fk" FOREIGN KEY ("inference_run_id") REFERENCES "public"."ml_inference_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_scores_stripe_txn" ADD CONSTRAINT "ml_scores_stripe_txn_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_scores_stripe_txn" ADD CONSTRAINT "ml_scores_stripe_txn_model_id_ml_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ml_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_scores_stripe_txn" ADD CONSTRAINT "ml_scores_stripe_txn_inference_run_id_ml_inference_runs_id_fk" FOREIGN KEY ("inference_run_id") REFERENCES "public"."ml_inference_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_scores_ue_cases_priority" ADD CONSTRAINT "ml_scores_ue_cases_priority_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_scores_ue_cases_priority" ADD CONSTRAINT "ml_scores_ue_cases_priority_model_id_ml_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ml_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_scores_ue_cases_priority" ADD CONSTRAINT "ml_scores_ue_cases_priority_inference_run_id_ml_inference_runs_id_fk" FOREIGN KEY ("inference_run_id") REFERENCES "public"."ml_inference_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_scores_ue_sla_risk" ADD CONSTRAINT "ml_scores_ue_sla_risk_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_scores_ue_sla_risk" ADD CONSTRAINT "ml_scores_ue_sla_risk_model_id_ml_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ml_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_scores_ue_sla_risk" ADD CONSTRAINT "ml_scores_ue_sla_risk_inference_run_id_ml_inference_runs_id_fk" FOREIGN KEY ("inference_run_id") REFERENCES "public"."ml_inference_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_training_runs" ADD CONSTRAINT "ml_training_runs_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_training_runs" ADD CONSTRAINT "ml_training_runs_dataset_id_ml_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."ml_datasets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_training_runs" ADD CONSTRAINT "ml_training_runs_logs_document_id_documents_id_fk" FOREIGN KEY ("logs_document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_training_runs" ADD CONSTRAINT "ml_training_runs_metrics_document_id_documents_id_fk" FOREIGN KEY ("metrics_document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ml_training_runs" ADD CONSTRAINT "ml_training_runs_artifact_document_id_documents_id_fk" FOREIGN KEY ("artifact_document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ue_cases" ADD CONSTRAINT "ue_cases_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_credentials" ADD CONSTRAINT "api_credentials_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gtm_requests" ADD CONSTRAINT "gtm_requests_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_entities" ADD CONSTRAINT "partner_entities_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_users" ADD CONSTRAINT "partner_users_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_events" ADD CONSTRAINT "automation_events_command_id_automation_commands_id_fk" FOREIGN KEY ("command_id") REFERENCES "public"."automation_commands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ml_datasets_entity_key_idx" ON "ml_datasets" USING btree ("entity_id","dataset_key");--> statement-breakpoint
CREATE INDEX "ml_datasets_entity_period_idx" ON "ml_datasets" USING btree ("entity_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "ml_inference_runs_entity_model_idx" ON "ml_inference_runs" USING btree ("entity_id","model_id");--> statement-breakpoint
CREATE INDEX "ml_inference_runs_period_idx" ON "ml_inference_runs" USING btree ("input_period_start","input_period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "ml_models_entity_key_version_idx" ON "ml_models" USING btree ("entity_id","model_key","version");--> statement-breakpoint
CREATE INDEX "ml_models_entity_status_idx" ON "ml_models" USING btree ("entity_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "ml_scores_stripe_daily_entity_date_model_idx" ON "ml_scores_stripe_daily" USING btree ("entity_id","date","model_id");--> statement-breakpoint
CREATE INDEX "ml_scores_stripe_daily_anomaly_idx" ON "ml_scores_stripe_daily" USING btree ("entity_id","is_anomaly");--> statement-breakpoint
CREATE INDEX "ml_scores_stripe_txn_entity_time_idx" ON "ml_scores_stripe_txn" USING btree ("entity_id","occurred_at");--> statement-breakpoint
CREATE INDEX "ml_scores_stripe_txn_anomaly_idx" ON "ml_scores_stripe_txn" USING btree ("entity_id","is_anomaly");--> statement-breakpoint
CREATE INDEX "ml_scores_stripe_txn_pi_idx" ON "ml_scores_stripe_txn" USING btree ("entity_id","stripe_payment_intent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ml_scores_ue_cases_priority_entity_case_model_idx" ON "ml_scores_ue_cases_priority" USING btree ("entity_id","case_id","model_id");--> statement-breakpoint
CREATE INDEX "ml_scores_ue_cases_priority_entity_pred_idx" ON "ml_scores_ue_cases_priority" USING btree ("entity_id","predicted_priority");--> statement-breakpoint
CREATE INDEX "ml_scores_ue_cases_priority_entity_time_idx" ON "ml_scores_ue_cases_priority" USING btree ("entity_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ml_scores_ue_sla_risk_entity_case_model_idx" ON "ml_scores_ue_sla_risk" USING btree ("entity_id","case_id","model_id");--> statement-breakpoint
CREATE INDEX "ml_scores_ue_sla_risk_entity_breach_idx" ON "ml_scores_ue_sla_risk" USING btree ("entity_id","predicted_breach");--> statement-breakpoint
CREATE INDEX "ml_scores_ue_sla_risk_entity_time_idx" ON "ml_scores_ue_sla_risk" USING btree ("entity_id","occurred_at");--> statement-breakpoint
CREATE INDEX "ml_training_runs_entity_key_idx" ON "ml_training_runs" USING btree ("entity_id","model_key");--> statement-breakpoint
CREATE INDEX "ue_cases_entity_id_idx" ON "ue_cases" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "ue_cases_entity_status_idx" ON "ue_cases" USING btree ("entity_id","status");--> statement-breakpoint
CREATE INDEX "ue_cases_entity_created_at_idx" ON "ue_cases" USING btree ("entity_id","created_at");