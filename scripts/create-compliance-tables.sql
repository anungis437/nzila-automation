-- Create compliance enums and tables
-- Run against native PostgreSQL (port 5433)

DO $block$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_alert_severity') THEN
    CREATE TYPE compliance_alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_alert_type') THEN
    CREATE TYPE compliance_alert_type AS ENUM ('contract_violation', 'safety_violation', 'dispatch_non_compliance', 'reporting_overdue', 'grievance_spike', 'dues_non_remittance');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_report_type') THEN
    CREATE TYPE compliance_report_type AS ENUM ('quarterly_review', 'annual_audit', 'incident_report', 'dispatch_fulfillment', 'grievance_summary', 'safety_inspection');
  END IF;
END $block$;

-- Employers table
CREATE TABLE IF NOT EXISTS employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name VARCHAR(500) NOT NULL,
  industry VARCHAR(255),
  contact_email VARCHAR(320),
  contact_phone VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_employers_org ON employers(org_id);
CREATE INDEX IF NOT EXISTS idx_employers_name ON employers(name);
CREATE INDEX IF NOT EXISTS idx_employers_industry ON employers(industry);

-- Employer reports table
CREATE TABLE IF NOT EXISTS employer_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  report_type compliance_report_type NOT NULL,
  data_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_employer_reports_employer ON employer_reports(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_reports_type ON employer_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_employer_reports_created ON employer_reports(created_at);

-- Compliance alerts table
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  alert_type compliance_alert_type NOT NULL,
  severity compliance_alert_severity NOT NULL,
  message TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_org ON compliance_alerts(org_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_employer ON compliance_alerts(employer_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_severity ON compliance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_type ON compliance_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_created ON compliance_alerts(created_at);
