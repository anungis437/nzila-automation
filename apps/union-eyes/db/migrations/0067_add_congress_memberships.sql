-- ============================================================================
-- Migration 0067: Congress Memberships
-- Adds congress membership tracking for cross-federation sharing
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "public"."congress_membership_status" AS ENUM('active', 'suspended', 'expired', 'pending');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS congress_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  organization_id uuid NOT NULL,
  congress_id uuid NOT NULL,
  status congress_membership_status DEFAULT 'active' NOT NULL,
  joined_at timestamp with time zone DEFAULT now() NOT NULL,
  ended_at timestamp with time zone,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT congress_memberships_org_congress_unique UNIQUE(organization_id, congress_id),
  CONSTRAINT congress_memberships_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT congress_memberships_congress_id_fkey FOREIGN KEY (congress_id) REFERENCES organizations(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_congress_memberships_org_id ON congress_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_congress_memberships_congress_id ON congress_memberships(congress_id);
CREATE INDEX IF NOT EXISTS idx_congress_memberships_status ON congress_memberships(status);
CREATE INDEX IF NOT EXISTS idx_congress_memberships_joined_at ON congress_memberships(joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_congress_memberships_congress_status ON congress_memberships(congress_id, status);
