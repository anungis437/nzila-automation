CREATE TYPE "public"."entity_member_role" AS ENUM('entity_admin', 'entity_secretary', 'entity_viewer');--> statement-breakpoint
CREATE TYPE "public"."entity_member_status" AS ENUM('active', 'suspended', 'removed');--> statement-breakpoint
CREATE TYPE "public"."entity_role_kind" AS ENUM('director', 'officer', 'shareholder', 'counsel', 'auditor');--> statement-breakpoint
CREATE TYPE "public"."entity_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."person_type" AS ENUM('individual', 'entity');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."approval_subject_type" AS ENUM('resolution', 'governance_action');--> statement-breakpoint
CREATE TYPE "public"."approval_type" AS ENUM('board', 'shareholder');--> statement-breakpoint
CREATE TYPE "public"."meeting_kind" AS ENUM('board', 'shareholder', 'committee');--> statement-breakpoint
CREATE TYPE "public"."meeting_status" AS ENUM('scheduled', 'held', 'archived');--> statement-breakpoint
CREATE TYPE "public"."resolution_kind" AS ENUM('board', 'shareholder', 'special');--> statement-breakpoint
CREATE TYPE "public"."resolution_status" AS ENUM('draft', 'pending_approval', 'approved', 'pending_signature', 'signed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."vote_choice" AS ENUM('yes', 'no', 'abstain');--> statement-breakpoint
CREATE TYPE "public"."holder_type" AS ENUM('individual', 'entity');--> statement-breakpoint
CREATE TYPE "public"."ledger_entry_type" AS ENUM('issuance', 'transfer', 'conversion', 'repurchase', 'cancellation', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."chain_integrity" AS ENUM('VERIFIED', 'UNVERIFIED', 'BROKEN');--> statement-breakpoint
CREATE TYPE "public"."compliance_task_kind" AS ENUM('year_end', 'month_close', 'governance');--> statement-breakpoint
CREATE TYPE "public"."compliance_task_status" AS ENUM('open', 'done', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."control_family" AS ENUM('access', 'change-mgmt', 'incident-response', 'dr-bcp', 'integrity', 'sdlc', 'retention');--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('minute_book', 'filing', 'resolution', 'minutes', 'certificate', 'year_end', 'export', 'other');--> statement-breakpoint
CREATE TYPE "public"."document_classification" AS ENUM('public', 'internal', 'confidential');--> statement-breakpoint
CREATE TYPE "public"."evidence_event_type" AS ENUM('incident', 'dr-test', 'access-review', 'period-close', 'release', 'restore-test', 'control-test', 'audit-request');--> statement-breakpoint
CREATE TYPE "public"."evidence_pack_status" AS ENUM('draft', 'sealed', 'verified', 'expired');--> statement-breakpoint
CREATE TYPE "public"."filing_kind" AS ENUM('annual_return', 'director_change', 'address_change', 'articles_amendment', 'other');--> statement-breakpoint
CREATE TYPE "public"."filing_status" AS ENUM('pending', 'submitted', 'accepted');--> statement-breakpoint
CREATE TYPE "public"."governance_action_status" AS ENUM('draft', 'pending_approval', 'approved', 'executed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."governance_action_type" AS ENUM('issue_shares', 'transfer_shares', 'convert_shares', 'borrow_funds', 'amend_rights', 'create_class', 'repurchase_shares', 'dividend', 'merger_acquisition', 'elect_directors', 'amend_constitution');--> statement-breakpoint
CREATE TYPE "public"."retention_class" AS ENUM('PERMANENT', '7_YEARS', '3_YEARS', '1_YEAR');--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legal_name" text NOT NULL,
	"jurisdiction" varchar(10) NOT NULL,
	"incorporation_number" text,
	"registered_office_address" jsonb,
	"fiscal_year_end" varchar(5),
	"policy_config" jsonb DEFAULT '{}'::jsonb,
	"status" "entity_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"clerk_user_id" text NOT NULL,
	"role" "entity_member_role" NOT NULL,
	"status" "entity_member_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"role" "entity_role_kind" NOT NULL,
	"title" text,
	"start_date" date NOT NULL,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "person_type" NOT NULL,
	"legal_name" text NOT NULL,
	"email" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"subject_type" "approval_subject_type" NOT NULL,
	"subject_id" uuid NOT NULL,
	"approval_type" "approval_type" NOT NULL,
	"threshold" numeric,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"decided_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"kind" "meeting_kind" NOT NULL,
	"meeting_date" timestamp with time zone NOT NULL,
	"location" text,
	"minutes_document_id" uuid,
	"status" "meeting_status" DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resolutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"kind" "resolution_kind" NOT NULL,
	"title" text NOT NULL,
	"body_markdown" text,
	"status" "resolution_status" DEFAULT 'draft' NOT NULL,
	"meeting_id" uuid,
	"effective_date" date,
	"requires_special_resolution" boolean DEFAULT false NOT NULL,
	"required_approval_threshold" numeric,
	"artifact_document_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"approval_id" uuid NOT NULL,
	"voter_person_id" uuid NOT NULL,
	"weight" numeric DEFAULT '1',
	"choice" "vote_choice" NOT NULL,
	"cast_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cap_table_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"as_of_date" date NOT NULL,
	"snapshot_json" jsonb NOT NULL,
	"generated_by" text NOT NULL,
	"document_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"shareholder_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"certificate_number" text NOT NULL,
	"issued_date" date NOT NULL,
	"quantity" bigint NOT NULL,
	"document_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"code" varchar(30) NOT NULL,
	"display_name" text NOT NULL,
	"votes_per_share" numeric DEFAULT '1' NOT NULL,
	"dividend_rank" integer DEFAULT 0 NOT NULL,
	"liquidation_rank" integer DEFAULT 0 NOT NULL,
	"is_convertible" boolean DEFAULT false NOT NULL,
	"conversion_to_class_id" uuid,
	"conversion_ratio" numeric,
	"transfer_restricted" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"entry_type" "ledger_entry_type" NOT NULL,
	"class_id" uuid NOT NULL,
	"from_shareholder_id" uuid,
	"to_shareholder_id" uuid,
	"quantity" bigint NOT NULL,
	"price_per_share" numeric,
	"currency" varchar(3) DEFAULT 'CAD',
	"effective_date" date NOT NULL,
	"reference_resolution_id" uuid,
	"reference_document_id" uuid,
	"notes" text,
	"hash" text NOT NULL,
	"previous_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shareholders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"holder_person_id" uuid NOT NULL,
	"holder_type" "holder_type" NOT NULL,
	"contact_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"actor_clerk_user_id" text NOT NULL,
	"actor_role" text,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid,
	"before_json" jsonb,
	"after_json" jsonb,
	"hash" text NOT NULL,
	"previous_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"kind" "compliance_task_kind" NOT NULL,
	"title" text NOT NULL,
	"due_date" date NOT NULL,
	"status" "compliance_task_status" DEFAULT 'open' NOT NULL,
	"evidence_document_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"category" "document_category" NOT NULL,
	"title" text NOT NULL,
	"blob_container" text NOT NULL,
	"blob_path" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" bigint,
	"sha256" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"classification" "document_classification" DEFAULT 'internal' NOT NULL,
	"linked_type" text,
	"linked_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_pack_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pack_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"artifact_id" text NOT NULL,
	"artifact_type" text NOT NULL,
	"retention_class" "retention_class" NOT NULL,
	"audit_event_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_packs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pack_id" varchar(120) NOT NULL,
	"entity_id" uuid NOT NULL,
	"control_family" "control_family" NOT NULL,
	"event_type" "evidence_event_type" NOT NULL,
	"event_id" text NOT NULL,
	"run_id" uuid NOT NULL,
	"blob_container" varchar(30) NOT NULL,
	"base_path" text NOT NULL,
	"summary" text,
	"controls_covered" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"artifact_count" integer DEFAULT 0 NOT NULL,
	"all_hashes_verified" boolean DEFAULT false NOT NULL,
	"chain_integrity" "chain_integrity" DEFAULT 'UNVERIFIED' NOT NULL,
	"hash_chain_start" uuid,
	"hash_chain_end" uuid,
	"verified_at" timestamp with time zone,
	"verified_by" text,
	"status" "evidence_pack_status" DEFAULT 'draft' NOT NULL,
	"index_document_id" uuid,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evidence_packs_pack_id_unique" UNIQUE("pack_id")
);
--> statement-breakpoint
CREATE TABLE "filings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"kind" "filing_kind" NOT NULL,
	"due_date" date NOT NULL,
	"status" "filing_status" DEFAULT 'pending' NOT NULL,
	"document_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"action_type" "governance_action_type" NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "governance_action_status" DEFAULT 'draft' NOT NULL,
	"requirements" jsonb DEFAULT '{}'::jsonb,
	"created_by" text NOT NULL,
	"executed_at" timestamp with time zone,
	"reference_resolution_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entity_members" ADD CONSTRAINT "entity_members_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_roles" ADD CONSTRAINT "entity_roles_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_roles" ADD CONSTRAINT "entity_roles_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_approval_id_approvals_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."approvals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_voter_person_id_people_id_fk" FOREIGN KEY ("voter_person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cap_table_snapshots" ADD CONSTRAINT "cap_table_snapshots_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_certificates" ADD CONSTRAINT "share_certificates_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_certificates" ADD CONSTRAINT "share_certificates_shareholder_id_shareholders_id_fk" FOREIGN KEY ("shareholder_id") REFERENCES "public"."shareholders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_certificates" ADD CONSTRAINT "share_certificates_class_id_share_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."share_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_classes" ADD CONSTRAINT "share_classes_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_ledger_entries" ADD CONSTRAINT "share_ledger_entries_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_ledger_entries" ADD CONSTRAINT "share_ledger_entries_class_id_share_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."share_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_ledger_entries" ADD CONSTRAINT "share_ledger_entries_from_shareholder_id_shareholders_id_fk" FOREIGN KEY ("from_shareholder_id") REFERENCES "public"."shareholders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_ledger_entries" ADD CONSTRAINT "share_ledger_entries_to_shareholder_id_shareholders_id_fk" FOREIGN KEY ("to_shareholder_id") REFERENCES "public"."shareholders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shareholders" ADD CONSTRAINT "shareholders_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shareholders" ADD CONSTRAINT "shareholders_holder_person_id_people_id_fk" FOREIGN KEY ("holder_person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_tasks" ADD CONSTRAINT "compliance_tasks_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_tasks" ADD CONSTRAINT "compliance_tasks_evidence_document_id_documents_id_fk" FOREIGN KEY ("evidence_document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_pack_artifacts" ADD CONSTRAINT "evidence_pack_artifacts_pack_id_evidence_packs_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."evidence_packs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_pack_artifacts" ADD CONSTRAINT "evidence_pack_artifacts_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_pack_artifacts" ADD CONSTRAINT "evidence_pack_artifacts_audit_event_id_audit_events_id_fk" FOREIGN KEY ("audit_event_id") REFERENCES "public"."audit_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_packs" ADD CONSTRAINT "evidence_packs_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_packs" ADD CONSTRAINT "evidence_packs_index_document_id_documents_id_fk" FOREIGN KEY ("index_document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filings" ADD CONSTRAINT "filings_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_actions" ADD CONSTRAINT "governance_actions_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;