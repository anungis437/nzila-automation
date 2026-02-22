-- Date: 2026-02-12
-- Migration: No-op - organization terminology already in use, no user_management schema
-- This migration is intentionally empty as we maintain consistency with organization terminology
-- All tables use organization_id (not tenant_id) and exist in the public schema (not user_management schema)

-- No operations needed - already using organization terminology consistently
SELECT 1;

