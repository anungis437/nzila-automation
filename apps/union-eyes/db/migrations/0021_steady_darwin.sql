CREATE TABLE "member_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"filters" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_executed_at" timestamp,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "segment_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"segment_id" uuid NOT NULL,
	"executed_by" text NOT NULL,
	"executed_at" timestamp DEFAULT now() NOT NULL,
	"result_count" integer NOT NULL,
	"execution_time_ms" integer,
	"filters_snapshot" jsonb
);
--> statement-breakpoint
CREATE TABLE "segment_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"segment_id" uuid,
	"exported_by" text NOT NULL,
	"exported_at" timestamp DEFAULT now() NOT NULL,
	"format" text NOT NULL,
	"include_fields" jsonb,
	"member_count" integer NOT NULL,
	"filters_used" jsonb,
	"watermark" text,
	"export_hash" text,
	"purpose" text,
	"approved_by" text,
	"file_url" text,
	"file_size" integer,
	"data_retention_days" integer DEFAULT 90,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "segment_executions" ADD CONSTRAINT "segment_executions_segment_id_member_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."member_segments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segment_exports" ADD CONSTRAINT "segment_exports_segment_id_member_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."member_segments"("id") ON DELETE set null ON UPDATE no action;