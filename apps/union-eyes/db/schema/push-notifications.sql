-- =============================================
-- Push Notifications Schema
-- =============================================
-- This schema supports push notification functionality with device management,
-- notification templates, campaign delivery, and engagement tracking.
-- Integrates with Firebase Cloud Messaging (FCM) for cross-platform delivery.

-- =============================================
-- ENUMS
-- =============================================

-- Platform types for push notification devices
CREATE TYPE push_platform AS ENUM (
  'ios',
  'android',
  'web'
);

-- Push notification status
CREATE TYPE push_notification_status AS ENUM (
  'draft',
  'scheduled',
  'sending',
  'sent',
  'failed',
  'cancelled'
);

-- Delivery status for individual devices
CREATE TYPE push_delivery_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'failed',
  'clicked',
  'dismissed'
);

-- Notification priority levels
CREATE TYPE push_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- =============================================
-- TABLES
-- =============================================

-- Device tokens for push notifications
CREATE TABLE push_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Device information
  device_token TEXT NOT NULL UNIQUE, -- FCM registration token
  platform push_platform NOT NULL,
  device_name TEXT, -- User-provided name (e.g., "iPhone 14", "Work Laptop")
  device_model TEXT, -- Device model (e.g., "iPhone14,5", "Chrome/119.0")
  os_version TEXT, -- Operating system version
  app_version TEXT, -- Application version
  
  -- Notification preferences
  enabled BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_start TIME, -- Start time for quiet hours (e.g., 22:00)
  quiet_hours_end TIME, -- End time for quiet hours (e.g., 08:00)
  timezone TEXT DEFAULT 'UTC',
  
  -- Metadata
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_device_per_profile UNIQUE(profile_id, device_token)
);

-- Push notification templates
CREATE TABLE push_notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Template information
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- Category for organization (e.g., "alerts", "updates", "promotions")
  
  -- Notification content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon_url TEXT, -- URL to notification icon
  image_url TEXT, -- URL to large image
  badge_count INTEGER, -- Badge number for iOS
  sound TEXT DEFAULT 'default', -- Sound to play
  
  -- Action configuration
  click_action TEXT, -- Deep link or URL to open on click
  action_buttons JSONB, -- Array of action buttons: [{ id, title, action }]
  
  -- Variables and personalization
  variables JSONB, -- Available variables: [{ key, label, example }]
  
  -- Template settings
  priority push_priority DEFAULT 'normal',
  ttl INTEGER DEFAULT 86400, -- Time to live in seconds (default 24 hours)
  is_system BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Push notification campaigns
CREATE TABLE push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Campaign information
  name TEXT NOT NULL,
  template_id UUID REFERENCES push_notification_templates(id) ON DELETE SET NULL,
  
  -- Notification content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon_url TEXT,
  image_url TEXT,
  badge_count INTEGER,
  sound TEXT DEFAULT 'default',
  
  -- Action configuration
  click_action TEXT,
  action_buttons JSONB,
  
  -- Targeting
  target_type TEXT NOT NULL, -- 'all', 'segment', 'devices', 'topics'
  target_criteria JSONB, -- Targeting criteria based on target_type
  device_ids UUID[], -- Specific device IDs (when target_type = 'devices')
  topics TEXT[], -- FCM topics (when target_type = 'topics')
  
  -- Scheduling
  status push_notification_status NOT NULL DEFAULT 'draft',
  priority push_priority DEFAULT 'normal',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  timezone TEXT DEFAULT 'UTC',
  ttl INTEGER DEFAULT 86400,
  
  -- Statistics
  total_targeted INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_dismissed INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Delivery tracking for individual devices
CREATE TABLE push_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES push_notifications(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES push_devices(id) ON DELETE CASCADE,
  
  -- Delivery information
  status push_delivery_status NOT NULL DEFAULT 'pending',
  fcm_message_id TEXT, -- FCM message ID from send response
  
  -- Timeline
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error handling
  error_code TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Engagement data
  event_data JSONB, -- Click action, time to click, etc.
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_delivery UNIQUE(notification_id, device_id)
);

-- =============================================
-- INDEXES
-- =============================================

-- Push devices indexes
CREATE INDEX idx_push_devices_tenant ON push_devices(tenant_id);
CREATE INDEX idx_push_devices_profile ON push_devices(profile_id);
CREATE INDEX idx_push_devices_token ON push_devices(device_token);
CREATE INDEX idx_push_devices_platform ON push_devices(platform);
CREATE INDEX idx_push_devices_enabled ON push_devices(enabled);
CREATE INDEX idx_push_devices_last_active ON push_devices(last_active_at DESC);

-- Push notification templates indexes
CREATE INDEX idx_push_templates_tenant ON push_notification_templates(tenant_id);
CREATE INDEX idx_push_templates_category ON push_notification_templates(category);
CREATE INDEX idx_push_templates_system ON push_notification_templates(is_system);
CREATE INDEX idx_push_templates_created ON push_notification_templates(created_at DESC);

-- Push notifications indexes
CREATE INDEX idx_push_notifications_tenant ON push_notifications(tenant_id);
CREATE INDEX idx_push_notifications_template ON push_notifications(template_id);
CREATE INDEX idx_push_notifications_status ON push_notifications(status);
CREATE INDEX idx_push_notifications_scheduled ON push_notifications(scheduled_at);
CREATE INDEX idx_push_notifications_target_type ON push_notifications(target_type);
CREATE INDEX idx_push_notifications_created ON push_notifications(created_at DESC);
CREATE INDEX idx_push_notifications_device_ids ON push_notifications USING GIN(device_ids);
CREATE INDEX idx_push_notifications_topics ON push_notifications USING GIN(topics);

-- Push deliveries indexes
CREATE INDEX idx_push_deliveries_notification ON push_deliveries(notification_id);
CREATE INDEX idx_push_deliveries_device ON push_deliveries(device_id);
CREATE INDEX idx_push_deliveries_status ON push_deliveries(status);
CREATE INDEX idx_push_deliveries_sent ON push_deliveries(sent_at DESC);
CREATE INDEX idx_push_deliveries_clicked ON push_deliveries(clicked_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE push_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_deliveries ENABLE ROW LEVEL SECURITY;

-- Push devices policies
CREATE POLICY push_devices_tenant_isolation ON push_devices
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY push_devices_profile_access ON push_devices
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    AND (
      profile_id = current_setting('app.current_user_id')::UUID
      OR current_setting('app.current_user_role') IN ('admin', 'manager')
    )
  );

-- Push notification templates policies
CREATE POLICY push_templates_tenant_isolation ON push_notification_templates
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY push_templates_read_all ON push_notification_templates
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY push_templates_write_admin ON push_notification_templates
  FOR INSERT
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    AND current_setting('app.current_user_role') IN ('admin', 'manager')
  );

CREATE POLICY push_templates_update_admin ON push_notification_templates
  FOR UPDATE
  USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    AND current_setting('app.current_user_role') IN ('admin', 'manager')
    AND is_system = false
  );

CREATE POLICY push_templates_delete_admin ON push_notification_templates
  FOR DELETE
  USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    AND current_setting('app.current_user_role') IN ('admin', 'manager')
    AND is_system = false
  );

-- Push notifications policies
CREATE POLICY push_notifications_tenant_isolation ON push_notifications
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY push_notifications_read_all ON push_notifications
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY push_notifications_write_admin ON push_notifications
  FOR INSERT
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    AND current_setting('app.current_user_role') IN ('admin', 'manager')
  );

CREATE POLICY push_notifications_update_admin ON push_notifications
  FOR UPDATE
  USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    AND current_setting('app.current_user_role') IN ('admin', 'manager')
  );

CREATE POLICY push_notifications_delete_admin ON push_notifications
  FOR DELETE
  USING (
    tenant_id = current_setting('app.current_tenant_id')::UUID
    AND current_setting('app.current_user_role') IN ('admin', 'manager')
  );

-- Push deliveries policies
CREATE POLICY push_deliveries_tenant_isolation ON push_deliveries
  FOR ALL
  USING (
    notification_id IN (
      SELECT id FROM push_notifications 
      WHERE tenant_id = current_setting('app.current_tenant_id')::UUID
    )
  );

CREATE POLICY push_deliveries_profile_access ON push_deliveries
  FOR SELECT
  USING (
    device_id IN (
      SELECT id FROM push_devices 
      WHERE profile_id = current_setting('app.current_user_id')::UUID
    )
    OR current_setting('app.current_user_role') IN ('admin', 'manager')
  );

-- =============================================
-- TRIGGERS
-- =============================================

-- Update updated_at timestamp on push_devices
CREATE OR REPLACE FUNCTION update_push_devices_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_devices_update_timestamp
  BEFORE UPDATE ON push_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_push_devices_timestamp();

-- Update updated_at timestamp on push_notification_templates
CREATE OR REPLACE FUNCTION update_push_templates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_templates_update_timestamp
  BEFORE UPDATE ON push_notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_push_templates_timestamp();

-- Update updated_at timestamp on push_notifications
CREATE OR REPLACE FUNCTION update_push_notifications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_notifications_update_timestamp
  BEFORE UPDATE ON push_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_push_notifications_timestamp();

-- Update push notification statistics when deliveries change
CREATE OR REPLACE FUNCTION update_push_notification_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update statistics for the notification
  UPDATE push_notifications
  SET
    total_sent = (
      SELECT COUNT(*) FROM push_deliveries 
      WHERE notification_id = COALESCE(NEW.notification_id, OLD.notification_id)
      AND status != 'pending'
    ),
    total_delivered = (
      SELECT COUNT(*) FROM push_deliveries 
      WHERE notification_id = COALESCE(NEW.notification_id, OLD.notification_id)
      AND status = 'delivered'
    ),
    total_failed = (
      SELECT COUNT(*) FROM push_deliveries 
      WHERE notification_id = COALESCE(NEW.notification_id, OLD.notification_id)
      AND status = 'failed'
    ),
    total_clicked = (
      SELECT COUNT(*) FROM push_deliveries 
      WHERE notification_id = COALESCE(NEW.notification_id, OLD.notification_id)
      AND status = 'clicked'
    ),
    total_dismissed = (
      SELECT COUNT(*) FROM push_deliveries 
      WHERE notification_id = COALESCE(NEW.notification_id, OLD.notification_id)
      AND status = 'dismissed'
    )
  WHERE id = COALESCE(NEW.notification_id, OLD.notification_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_deliveries_update_stats
  AFTER INSERT OR UPDATE OR DELETE ON push_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_push_notification_stats();

-- Update updated_at timestamp on push_deliveries
CREATE OR REPLACE FUNCTION update_push_deliveries_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_deliveries_update_timestamp
  BEFORE UPDATE ON push_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_push_deliveries_timestamp();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE push_devices IS 'Device tokens for push notification delivery via FCM';
COMMENT ON TABLE push_notification_templates IS 'Reusable templates for push notifications';
COMMENT ON TABLE push_notifications IS 'Push notification campaigns with targeting and scheduling';
COMMENT ON TABLE push_deliveries IS 'Delivery tracking for individual devices';

COMMENT ON COLUMN push_devices.device_token IS 'FCM registration token for the device';
COMMENT ON COLUMN push_devices.quiet_hours_start IS 'Do not send notifications during this period';
COMMENT ON COLUMN push_notifications.target_type IS 'Targeting strategy: all, segment, devices, topics';
COMMENT ON COLUMN push_notifications.ttl IS 'Time to live in seconds for FCM message';
COMMENT ON COLUMN push_deliveries.fcm_message_id IS 'Message ID returned by FCM for tracking';
