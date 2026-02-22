-- Migration: 0066_drop_obsolete_search_vector_trigger
-- Purpose: Remove obsolete search_vector trigger and function
-- 
-- Background:
-- Migration 0002 dropped the search_vector column from organization_members,
-- but the trigger and function that populate it were not removed.
-- This causes INSERT failures when the trigger tries to set the non-existent column.
--
-- This migration cleans up:
-- 1. The trigger on organization_members table
-- 2. The function that the trigger calls

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS organization_members_search_vector_update ON organization_members;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS organization_members_search_vector();

-- Verify cleanup (for documentation purposes)
-- After this migration:
-- - Inserts to organization_members will no longer fail with "record has no field search_vector"
-- - Tests in __tests__/integration/tenant-isolation.test.ts will no longer skip
