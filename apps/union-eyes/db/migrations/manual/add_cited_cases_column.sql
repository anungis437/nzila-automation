-- Add cited_cases column to arbitration_precedents table
-- This migration adds the missing column that was defined in Phase 5B but never applied

ALTER TABLE arbitration_precedents 
ADD COLUMN IF NOT EXISTS cited_cases UUID[];

-- Add comment for documentation
COMMENT ON COLUMN arbitration_precedents.cited_cases IS 'Array of precedent IDs that this case cites';
