-- Migration: Add pilot onboarding tables
-- Supports: pilot_checklist_items + pilot_demo_seeds
-- Date: 2026-02-14

-- ─── Pilot Checklist Items ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pilot_checklist_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  item_id       VARCHAR(100) NOT NULL,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  completed_by  VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pilot_checklist_org_item
  ON pilot_checklist_items (organization_id, item_id);

CREATE INDEX IF NOT EXISTS idx_pilot_checklist_org
  ON pilot_checklist_items (organization_id);

-- ─── Pilot Demo Seeds ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pilot_demo_seeds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  seeded_by       VARCHAR(255),
  seeded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  purged_at       TIMESTAMPTZ,
  member_count    INTEGER NOT NULL DEFAULT 0,
  employer_count  INTEGER NOT NULL DEFAULT 0,
  grievance_count INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pilot_demo_seeds_org
  ON pilot_demo_seeds (organization_id);

-- ─── RLS Policies (match existing pattern) ──────────────────────────────────

ALTER TABLE pilot_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_demo_seeds      ENABLE ROW LEVEL SECURITY;

CREATE POLICY pilot_checklist_items_org_isolation ON pilot_checklist_items
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

CREATE POLICY pilot_demo_seeds_org_isolation ON pilot_demo_seeds
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);
