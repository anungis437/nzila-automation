-- Seed compliance demo data
-- Organization IDs:
--   CLC  = 873cf59b-cef5-4d51-9a62-151512810449
--   CAPE = c09173ad-5ba4-498e-a483-b371fb5e248e

-- ─── Employers ────────────────────────────────────────────────────────────

INSERT INTO employers (id, org_id, name, industry, contact_email, contact_phone) VALUES
  ('a1b2c3d4-1111-4000-a000-000000000001', '873cf59b-cef5-4d51-9a62-151512810449',
   'Treasury Board of Canada Secretariat', 'federal_government', 'compliance@tbs-sct.gc.ca', '613-957-2400'),
  ('a1b2c3d4-1111-4000-a000-000000000002', '873cf59b-cef5-4d51-9a62-151512810449',
   'Canada Revenue Agency', 'federal_government', 'hr-relations@cra-arc.gc.ca', '613-952-0340'),
  ('a1b2c3d4-1111-4000-a000-000000000003', 'c09173ad-5ba4-498e-a483-b371fb5e248e',
   'Innovation, Science and Economic Development', 'federal_government', 'labour@ised-isde.gc.ca', '343-291-2600'),
  ('a1b2c3d4-1111-4000-a000-000000000004', 'c09173ad-5ba4-498e-a483-b371fb5e248e',
   'Public Services and Procurement Canada', 'federal_government', 'hr@tpsgc-pwgsc.gc.ca', '819-997-6363')
ON CONFLICT (id) DO NOTHING;

-- ─── Compliance Alerts (CLC) ─────────────────────────────────────────────

INSERT INTO compliance_alerts (org_id, employer_id, alert_type, severity, message, resolved_at, created_at) VALUES
  -- Active alerts
  ('873cf59b-cef5-4d51-9a62-151512810449', 'a1b2c3d4-1111-4000-a000-000000000001',
   'contract_violation', 'critical',
   'Treasury Board failed to provide mandatory 48-hour notice for shift changes in EC classification',
   NULL, now() - interval '2 days'),
  ('873cf59b-cef5-4d51-9a62-151512810449', 'a1b2c3d4-1111-4000-a000-000000000002',
   'dues_non_remittance', 'high',
   'CRA has outstanding union dues remittance for March 2026 — 15 days overdue',
   NULL, now() - interval '5 days'),
  ('873cf59b-cef5-4d51-9a62-151512810449', 'a1b2c3d4-1111-4000-a000-000000000001',
   'reporting_overdue', 'medium',
   'Quarterly workplace safety report for Q1 2026 not received from TBS',
   NULL, now() - interval '10 days'),
  ('873cf59b-cef5-4d51-9a62-151512810449', 'a1b2c3d4-1111-4000-a000-000000000002',
   'grievance_spike', 'high',
   'CRA grievance rate increased 40% in last 30 days — workload redistribution concerns',
   NULL, now() - interval '3 days'),
  -- Resolved alerts
  ('873cf59b-cef5-4d51-9a62-151512810449', 'a1b2c3d4-1111-4000-a000-000000000001',
   'safety_violation', 'medium',
   'Ergonomic assessment overdue for 12 remote workers at TBS',
   now() - interval '1 day', now() - interval '14 days'),
  ('873cf59b-cef5-4d51-9a62-151512810449', 'a1b2c3d4-1111-4000-a000-000000000002',
   'dispatch_non_compliance', 'low',
   'CRA dispatch scheduling did not follow seniority order for overtime assignments',
   now() - interval '7 days', now() - interval '20 days');

-- ─── Compliance Alerts (CAPE) ────────────────────────────────────────────

INSERT INTO compliance_alerts (org_id, employer_id, alert_type, severity, message, resolved_at, created_at) VALUES
  ('c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-1111-4000-a000-000000000003',
   'contract_violation', 'high',
   'ISED not honouring telework provisions in Article 23 of collective agreement',
   NULL, now() - interval '4 days'),
  ('c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-1111-4000-a000-000000000004',
   'reporting_overdue', 'medium',
   'PSPC annual workplace harassment report 60 days overdue',
   NULL, now() - interval '8 days'),
  ('c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-1111-4000-a000-000000000003',
   'dues_non_remittance', 'critical',
   'ISED union dues remittance suspended for 2 pay periods — escalation required',
   NULL, now() - interval '1 day'),
  -- Resolved
  ('c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-1111-4000-a000-000000000004',
   'safety_violation', 'low',
   'PSPC fire drill compliance completed after follow-up',
   now() - interval '3 days', now() - interval '15 days');

-- ─── Employer Reports (CLC) ─────────────────────────────────────────────

INSERT INTO employer_reports (employer_id, report_type, data_json, created_at) VALUES
  ('a1b2c3d4-1111-4000-a000-000000000001', 'quarterly_review',
   '{"period": "Q1-2026", "employer": "Treasury Board", "compliance_score": 72, "issues_found": 3, "recommendations": ["Improve shift notice process", "Update telework policy tracking"]}',
   now() - interval '5 days'),
  ('a1b2c3d4-1111-4000-a000-000000000002', 'annual_audit',
   '{"year": 2025, "employer": "CRA", "overall_rating": "satisfactory", "areas_of_concern": ["Dues remittance delays", "Overtime scheduling"], "corrective_actions": 2}',
   now() - interval '30 days'),
  ('a1b2c3d4-1111-4000-a000-000000000001', 'safety_inspection',
   '{"date": "2026-02-15", "employer": "Treasury Board", "locations_inspected": 4, "violations_found": 1, "status": "follow_up_required"}',
   now() - interval '20 days'),
  ('a1b2c3d4-1111-4000-a000-000000000002', 'grievance_summary',
   '{"period": "Q4-2025", "employer": "CRA", "total_grievances": 8, "resolved": 5, "pending": 3, "avg_resolution_days": 22}',
   now() - interval '45 days');

-- ─── Employer Reports (CAPE) ─────────────────────────────────────────────

INSERT INTO employer_reports (employer_id, report_type, data_json, created_at) VALUES
  ('a1b2c3d4-1111-4000-a000-000000000003', 'quarterly_review',
   '{"period": "Q1-2026", "employer": "ISED", "compliance_score": 58, "issues_found": 5, "recommendations": ["Enforce telework provisions", "Review dues remittance process"]}',
   now() - interval '3 days'),
  ('a1b2c3d4-1111-4000-a000-000000000004', 'incident_report',
   '{"date": "2026-03-01", "employer": "PSPC", "type": "workplace_harassment_complaint", "status": "under_investigation", "union_rep_assigned": true}',
   now() - interval '10 days'),
  ('a1b2c3d4-1111-4000-a000-000000000003', 'dispatch_fulfillment',
   '{"period": "Feb-2026", "employer": "ISED", "positions_requested": 15, "positions_filled": 12, "fulfillment_rate": 0.80}',
   now() - interval '15 days');
