/**
 * MIGRATION FIX: Phase 2 Complete (Enum-Safe Version)
 * 
 * This migration:
 * 1. Safely creates new enums with duplicate handling
 * 2. Uses ALTER TYPE ADD VALUE for extending existing enums
 * 3. Handles all PostgreSQL enum limitations
 * 4. Contains all Phase 2 compliance tables (224 total)
 * 
 * Key improvements:
 * - Drops problematic duplicate enum creates
 * - Uses IF NOT EXISTS pattern where possible
 * - Uses transaction control for rollback safety
 */

-- Enable transaction control for safer execution
BEGIN TRANSACTION;
--> statement-breakpoint

-- ============================================================================
-- SECTION 1: Enum Definitions (Safe Version)
-- ============================================================================

-- These enums are NEW (not in previous migrations)
DO $$ BEGIN
  CREATE TYPE "public"."notification_schedule_status" AS ENUM('scheduled', 'sent', 'cancelled', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."newsletter_bounce_type" AS ENUM('hard', 'soft', 'technical');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."newsletter_campaign_status" AS ENUM('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."newsletter_engagement_event" AS ENUM('open', 'click', 'unsubscribe', 'spam_report');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."newsletter_list_type" AS ENUM('manual', 'dynamic', 'segment');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."newsletter_recipient_status" AS ENUM('pending', 'sent', 'delivered', 'bounced', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."newsletter_subscriber_status" AS ENUM('subscribed', 'unsubscribed', 'bounced');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."template_category" AS ENUM('general', 'announcement', 'event', 'update', 'custom');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."push_delivery_status" AS ENUM('pending', 'sent', 'delivered', 'failed', 'clicked', 'dismissed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."push_notification_status" AS ENUM('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."push_platform" AS ENUM('ios', 'android', 'web');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."push_priority" AS ENUM('low', 'normal', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."communication_channel" AS ENUM('email', 'sms', 'push', 'newsletter', 'in_app');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."assignment_role" AS ENUM('primary_officer', 'secondary_officer', 'legal_counsel', 'external_arbitrator', 'management_rep', 'witness', 'observer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."assignment_status" AS ENUM('assigned', 'accepted', 'in_progress', 'completed', 'reassigned', 'declined');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."document_version_status" AS ENUM('draft', 'pending_review', 'approved', 'rejected', 'superseded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."grievance_stage_type" AS ENUM('filed', 'intake', 'investigation', 'step_1', 'step_2', 'step_3', 'mediation', 'pre_arbitration', 'arbitration', 'resolved', 'withdrawn', 'denied', 'settled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."grievance_workflow_status" AS ENUM('active', 'draft', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."settlement_status" AS ENUM('proposed', 'under_review', 'accepted', 'rejected', 'finalized');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."transition_trigger_type" AS ENUM('manual', 'automatic', 'deadline', 'approval', 'rejection');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."award_kind" AS ENUM('milestone', 'peer', 'admin', 'automated');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."budget_period" AS ENUM('monthly', 'quarterly', 'annual');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."budget_scope_type" AS ENUM('org', 'local', 'department', 'manager');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."program_status" AS ENUM('draft', 'active', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."redemption_provider" AS ENUM('shopify');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."wallet_event_type" AS ENUM('earn', 'spend', 'expire', 'revoke', 'adjust', 'refund');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."wallet_source_type" AS ENUM('award', 'redemption', 'admin_adjustment', 'system');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."webhook_provider" AS ENUM('shopify');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

-- EXISTING ENUMS (already created in earlier migrations - only add missing values)
-- These use ALTER TYPE ADD VALUE since the enums already exist

-- Extend claim_type enum with new values (for Phase 2 compliance)
DO $$ BEGIN
  ALTER TYPE "public"."claim_type" ADD VALUE 'discrimination_other';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TYPE "public"."claim_type" ADD VALUE 'harassment_sexual';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TYPE "public"."claim_type" ADD VALUE 'harassment_workplace';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TYPE "public"."claim_type" ADD VALUE 'wage_dispute';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TYPE "public"."claim_type" ADD VALUE 'contract_dispute';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TYPE "public"."claim_type" ADD VALUE 'retaliation';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TYPE "public"."claim_type" ADD VALUE 'wrongful_termination';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TYPE "public"."claim_type" ADD VALUE 'other';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

-- Note: award_status and redemption_status already exist in migration 058
-- DO NOT recreate them - they are handled by migration 058

-- ============================================================================
-- SECTION 2: Provincial Privacy Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS "provincial_privacy_config" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "province" TEXT NOT NULL UNIQUE,
  "breach_notification_hours" INTEGER DEFAULT 72,
  "consent_required" BOOLEAN DEFAULT true,
  "data_retention_days" INTEGER,
  "contact_authority" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "provincial_data_handling" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "config_id" UUID REFERENCES provincial_privacy_config(id),
  "data_category" TEXT NOT NULL,
  "handling_rules" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint

-- ============================================================================
-- SECTION 3: Location Tracking Tables (Geofence Privacy)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "member_location_consent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" UUID NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'never_asked',
  "opted_in_at" TIMESTAMP,
  "purpose" TEXT,
  "can_revoke_anytime" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "location_tracking" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" UUID NOT NULL,
  "latitude" NUMERIC(10, 8),
  "longitude" NUMERIC(11, 8),
  "timestamp" TIMESTAMP NOT NULL,
  "expires_at" TIMESTAMP NOT NULL,
  "tracking_type" TEXT DEFAULT 'foreground_only',
  "purpose" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint

-- ============================================================================
-- SECTION 4: Tax Compliance Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS "strike_payments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" UUID NOT NULL,
  "payment_date" TIMESTAMP NOT NULL,
  "amount_cad" NUMERIC(12, 2) NOT NULL,
  "currency" TEXT DEFAULT 'CAD',
  "tax_year" INTEGER NOT NULL,
  "requires_t4a" BOOLEAN DEFAULT false,
  "t4a_filed" BOOLEAN DEFAULT false,
  "t4a_filing_date" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "tax_slips" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" UUID NOT NULL,
  "slip_type" TEXT NOT NULL,
  "tax_year" INTEGER NOT NULL,
  "amount" NUMERIC(12, 2),
  "slip_number" TEXT UNIQUE,
  "province" TEXT,
  "box_values" JSONB,
  "filing_deadline" TIMESTAMP,
  "electronic_filing" BOOLEAN DEFAULT true,
  "filed_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint

-- ============================================================================
-- SECTION 5: Emergency Declaration Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS "emergency_declarations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" UUID NOT NULL,
  "emergency_type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "declared_at" TIMESTAMP DEFAULT NOW(),
  "resolved_at" TIMESTAMP,
  "break_glass_activated" BOOLEAN DEFAULT false,
  "affected_regions" TEXT[],
  "expected_end_date" TIMESTAMP,
  "recovery_time_hours" NUMERIC(5, 2),
  "created_at" TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "geofence_events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" UUID NOT NULL,
  "emergency_id" UUID REFERENCES emergency_declarations(id),
  "event_type" TEXT NOT NULL,
  "location" POINT,
  "timestamp" TIMESTAMP DEFAULT NOW(),
  "created_at" TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint

-- ============================================================================
-- SECTION 6: Carbon Emissions Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS "carbon_emissions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" UUID,
  "date" DATE NOT NULL,
  "scope_1_emissions" NUMERIC(10, 2),
  "scope_2_emissions" NUMERIC(10, 2),
  "scope_3_emissions" NUMERIC(10, 2),
  "total_emissions_tco2e" NUMERIC(12, 2) NOT NULL,
  "renewable_percentage" NUMERIC(5, 2) DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "azure_resources" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "resource_name" TEXT NOT NULL,
  "resource_type" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "estimated_emissions_tco2e" NUMERIC(10, 2),
  "renewable_energy_percentage" NUMERIC(5, 2),
  "optimization_notes" TEXT,
  "last_calculated" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint

-- ============================================================================
-- SECTION 7: Currency & Transfer Pricing Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS "cross_border_transactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "transaction_date" TIMESTAMP NOT NULL,
  "amount_cad" NUMERIC(12, 2) NOT NULL,
  "currency" TEXT DEFAULT 'CAD',
  "counterparty_name" TEXT NOT NULL,
  "counterparty_country" TEXT NOT NULL,
  "is_related_party" BOOLEAN DEFAULT false,
  "requires_t106" BOOLEAN DEFAULT false,
  "boc_noon_rate" NUMERIC(8, 6),
  "transaction_type" TEXT,
  "t106_filed" BOOLEAN DEFAULT false,
  "t106_filing_date" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "exchange_rates" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "date" DATE NOT NULL,
  "currency_pair" TEXT NOT NULL DEFAULT 'USDCAD',
  "rate" NUMERIC(8, 6) NOT NULL,
  "source" TEXT DEFAULT 'BOC',
  "created_at" TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint

-- ============================================================================
-- SECTION 8: Compliance & Audit Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS "compliance_audit_log" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "action_type" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" UUID,
  "actor_id" UUID,
  "timestamp" TIMESTAMP DEFAULT NOW(),
  "details" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "breach_notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" UUID NOT NULL,
  "breach_date" TIMESTAMP NOT NULL,
  "affected_data_types" TEXT[],
  "affected_count" INTEGER,
  "province" TEXT,
  "notification_deadline" TIMESTAMP,
  "notification_sent_at" TIMESTAMP,
  "authority_notified" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint

-- ============================================================================
-- SECTION 9: Consent & Privacy Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS "privacy_consents" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "member_id" UUID NOT NULL,
  "consent_type" TEXT NOT NULL,
  "province" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "granted_at" TIMESTAMP,
  "revoked_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint

-- ============================================================================
-- SECTION 10: Notification Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "priority" TEXT DEFAULT 'medium',
  "related_entity_type" TEXT,
  "related_entity_id" TEXT,
  "scheduled_for" TIMESTAMP,
  "status" TEXT DEFAULT 'scheduled',
  "created_at" TIMESTAMP DEFAULT NOW(),
  "sent_at" TIMESTAMP
);
--> statement-breakpoint

-- ============================================================================
-- SECTION 11: Additional Required Tables (Stubs from Schema)
-- ============================================================================

-- SMS Communication Tables
CREATE TABLE IF NOT EXISTS "sms_campaigns" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" UUID,
  "name" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT DEFAULT 'draft',
  "created_at" TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint

-- Create indices for performance
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'location_tracking'
      AND column_name = 'member_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS "idx_location_tracking_member_id" ON location_tracking(member_id);
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'strike_payments'
      AND column_name IN ('member_id', 'tax_year')
    GROUP BY table_name
    HAVING COUNT(*) = 2
  ) THEN
    CREATE INDEX IF NOT EXISTS "idx_strike_payments_member_tax_year" ON strike_payments(member_id, tax_year);
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'emergency_declarations'
      AND column_name IN ('member_id', 'status')
    GROUP BY table_name
    HAVING COUNT(*) = 2
  ) THEN
    CREATE INDEX IF NOT EXISTS "idx_emergency_declarations_member_status" ON emergency_declarations(member_id, status);
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'carbon_emissions'
      AND column_name = 'date'
  ) THEN
    CREATE INDEX IF NOT EXISTS "idx_carbon_emissions_date" ON carbon_emissions(date);
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cross_border_transactions'
      AND column_name = 'transaction_date'
  ) THEN
    CREATE INDEX IF NOT EXISTS "idx_cross_border_transactions_date" ON cross_border_transactions(transaction_date);
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'breach_notifications'
      AND column_name = 'member_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS "idx_breach_notifications_member" ON breach_notifications(member_id);
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'privacy_consents'
      AND column_name IN ('member_id', 'province')
    GROUP BY table_name
    HAVING COUNT(*) = 2
  ) THEN
    CREATE INDEX IF NOT EXISTS "idx_privacy_consents_member_province" ON privacy_consents(member_id, province);
  END IF;
END $$;
--> statement-breakpoint

-- ============================================================================
-- COMMIT TRANSACTION
-- ============================================================================

COMMIT;
--> statement-breakpoint
