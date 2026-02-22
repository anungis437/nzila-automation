-- Add notification preferences table for training notifications
CREATE TABLE IF NOT EXISTS training_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  
  -- Individual notification preferences (default: true)
  registration_confirmations BOOLEAN DEFAULT true,
  session_reminders BOOLEAN DEFAULT true,
  completion_certificates BOOLEAN DEFAULT true,
  certification_expiry BOOLEAN DEFAULT true,
  program_milestones BOOLEAN DEFAULT true,
  
  -- Global unsubscribe token
  unsubscribe_token UUID UNIQUE DEFAULT gen_random_uuid(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one preference record per member
  UNIQUE(member_id)
);

-- Index for fast member lookups
CREATE INDEX idx_notification_prefs_member ON training_notification_preferences(member_id);

-- Index for unsubscribe token lookups
CREATE INDEX idx_notification_prefs_token ON training_notification_preferences(unsubscribe_token);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_prefs_updated_at
BEFORE UPDATE ON training_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_notification_prefs_updated_at();
