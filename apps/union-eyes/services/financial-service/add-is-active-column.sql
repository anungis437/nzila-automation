-- Add is_active column to strike_funds table
ALTER TABLE strike_funds 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index for the is_active column
CREATE INDEX IF NOT EXISTS strike_funds_active_idx ON strike_funds(is_active);

-- Add target_amount and created_by columns if they don't exist
ALTER TABLE strike_funds 
ADD COLUMN IF NOT EXISTS target_amount NUMERIC(12, 2);

ALTER TABLE strike_funds 
ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Update existing records to have is_active = true if they don't have a value
UPDATE strike_funds SET is_active = true WHERE is_active IS NULL;
