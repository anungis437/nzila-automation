CREATE TYPE "public"."employment_status" AS ENUM('active', 'on_leave', 'layoff', 'suspended', 'terminated', 'retired', 'deceased');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'part_time', 'casual', 'seasonal', 'temporary', 'contract', 'probationary');--> statement-breakpoint
CREATE TYPE "public"."leave_type" AS ENUM('vacation', 'sick', 'maternity', 'paternity', 'parental', 'bereavement', 'medical', 'disability', 'union_business', 'unpaid', 'lwop', 'other');--> statement-breakpoint
CREATE TYPE "public"."pay_frequency" AS ENUM('hourly', 'weekly', 'bi_weekly', 'semi_monthly', 'monthly', 'annual', 'per_diem');--> statement-breakpoint
CREATE TYPE "public"."shift_type" AS ENUM('day', 'evening', 'night', 'rotating', 'split', 'on_call');--> statement-breakpoint
CREATE TABLE "employment_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"member_employment_id" uuid,
	"change_type" varchar(100) NOT NULL,
	"effective_date" date NOT NULL,
	"previous_values" jsonb,
	"new_values" jsonb,
	"reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "job_classifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"bargaining_unit_id" uuid,
	"job_code" varchar(100) NOT NULL,
	"job_title" varchar(255) NOT NULL,
	"job_family" varchar(255),
	"job_level" integer,
	"minimum_rate" numeric(10, 2),
	"maximum_rate" numeric(10, 2),
	"standard_rate" numeric(10, 2),
	"description" text,
	"requirements" jsonb,
	"is_active" boolean DEFAULT true,
	"effective_date" date,
	"expiry_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "member_employment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"employer_id" uuid,
	"worksite_id" uuid,
	"bargaining_unit_id" uuid,
	"employment_status" "employment_status" DEFAULT 'active' NOT NULL,
	"employment_type" "employment_type" DEFAULT 'full_time' NOT NULL,
	"hire_date" date NOT NULL,
	"seniority_date" date NOT NULL,
	"termination_date" date,
	"expected_return_date" date,
	"seniority_years" numeric(10, 2),
	"adjusted_seniority_date" date,
	"seniority_adjustment_reason" text,
	"job_title" varchar(255) NOT NULL,
	"job_code" varchar(100),
	"job_classification" varchar(255),
	"job_level" integer,
	"department" varchar(255),
	"division" varchar(255),
	"pay_frequency" "pay_frequency" DEFAULT 'hourly' NOT NULL,
	"hourly_rate" numeric(10, 2),
	"base_salary" numeric(12, 2),
	"gross_wages" numeric(12, 2),
	"regular_hours_per_week" numeric(5, 2) DEFAULT '40.00',
	"regular_hours_per_period" numeric(7, 2),
	"shift_type" "shift_type",
	"shift_start_time" varchar(10),
	"shift_end_time" varchar(10),
	"operates_weekends" boolean DEFAULT false,
	"operates_24_hours" boolean DEFAULT false,
	"supervisor_name" varchar(255),
	"supervisor_id" uuid,
	"is_probationary" boolean DEFAULT false,
	"probation_end_date" date,
	"checkoff_authorized" boolean DEFAULT true,
	"checkoff_date" date,
	"rand_exempt" boolean DEFAULT false,
	"custom_fields" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(255),
	"updated_by" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "member_leaves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"member_employment_id" uuid,
	"leave_type" "leave_type" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"expected_return_date" date,
	"actual_return_date" date,
	"is_approved" boolean DEFAULT false,
	"approved_by" varchar(255),
	"approved_at" timestamp with time zone,
	"affects_seniority" boolean DEFAULT false,
	"seniority_adjustment_days" integer,
	"affects_dues" boolean DEFAULT true,
	"dues_waiver_approved" boolean DEFAULT false,
	"reason" text,
	"notes" text,
	"documents" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "employment_history" ADD CONSTRAINT "employment_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employment_history" ADD CONSTRAINT "employment_history_member_id_organization_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."organization_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employment_history" ADD CONSTRAINT "employment_history_member_employment_id_member_employment_id_fk" FOREIGN KEY ("member_employment_id") REFERENCES "public"."member_employment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_classifications" ADD CONSTRAINT "job_classifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_classifications" ADD CONSTRAINT "job_classifications_bargaining_unit_id_bargaining_units_id_fk" FOREIGN KEY ("bargaining_unit_id") REFERENCES "public"."bargaining_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_employment" ADD CONSTRAINT "member_employment_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_employment" ADD CONSTRAINT "member_employment_member_id_organization_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."organization_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_employment" ADD CONSTRAINT "member_employment_employer_id_employers_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_employment" ADD CONSTRAINT "member_employment_worksite_id_worksites_id_fk" FOREIGN KEY ("worksite_id") REFERENCES "public"."worksites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_employment" ADD CONSTRAINT "member_employment_bargaining_unit_id_bargaining_units_id_fk" FOREIGN KEY ("bargaining_unit_id") REFERENCES "public"."bargaining_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_leaves" ADD CONSTRAINT "member_leaves_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_leaves" ADD CONSTRAINT "member_leaves_member_id_organization_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."organization_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_leaves" ADD CONSTRAINT "member_leaves_member_employment_id_member_employment_id_fk" FOREIGN KEY ("member_employment_id") REFERENCES "public"."member_employment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_employment_history_member" ON "employment_history" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_employment_history_effective_date" ON "employment_history" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "idx_employment_history_change_type" ON "employment_history" USING btree ("change_type");--> statement-breakpoint
CREATE INDEX "idx_job_classifications_code" ON "job_classifications" USING btree ("job_code");--> statement-breakpoint
CREATE INDEX "idx_job_classifications_unit" ON "job_classifications" USING btree ("bargaining_unit_id");--> statement-breakpoint
CREATE INDEX "idx_job_classifications_active" ON "job_classifications" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_member_employment_member" ON "member_employment" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_member_employment_employer" ON "member_employment" USING btree ("employer_id");--> statement-breakpoint
CREATE INDEX "idx_member_employment_worksite" ON "member_employment" USING btree ("worksite_id");--> statement-breakpoint
CREATE INDEX "idx_member_employment_bargaining_unit" ON "member_employment" USING btree ("bargaining_unit_id");--> statement-breakpoint
CREATE INDEX "idx_member_employment_status" ON "member_employment" USING btree ("employment_status");--> statement-breakpoint
CREATE INDEX "idx_member_employment_seniority_date" ON "member_employment" USING btree ("seniority_date");--> statement-breakpoint
CREATE INDEX "idx_member_employment_job_code" ON "member_employment" USING btree ("job_code");--> statement-breakpoint
CREATE INDEX "idx_member_leaves_member" ON "member_leaves" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_member_leaves_type" ON "member_leaves" USING btree ("leave_type");--> statement-breakpoint
CREATE INDEX "idx_member_leaves_start_date" ON "member_leaves" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "idx_member_leaves_approved" ON "member_leaves" USING btree ("is_approved");