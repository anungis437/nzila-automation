-- ============================================================
-- Seed: Demo members, grievances, CBAs, and settlements
-- for CLC and CAPE-ACEP organizations
-- ============================================================
-- CLC:       873cf59b-cef5-4d51-9a62-151512810449 (congress, root)
-- CAPE-ACEP: c09173ad-5ba4-498e-a483-b371fb5e248e (union, child of CLC)

BEGIN;

-- ============================================================
-- CLC Members (congress leadership & staff)
-- ============================================================
INSERT INTO organization_members (user_id, organization_id, name, email, role, status, department, position, hire_date)
VALUES
  ('clc-user-001', '873cf59b-cef5-4d51-9a62-151512810449', 'Hassan Yussuff', 'h.yussuff@clc-ctc.ca', 'admin', 'active', 'Executive', 'National President', '2014-05-01'),
  ('clc-user-002', '873cf59b-cef5-4d51-9a62-151512810449', 'Marie Clarke Walker', 'm.walker@clc-ctc.ca', 'admin', 'active', 'Executive', 'Executive Vice-President', '2017-06-15'),
  ('clc-user-003', '873cf59b-cef5-4d51-9a62-151512810449', 'Denis Bolduc', 'd.bolduc@clc-ctc.ca', 'member', 'active', 'Policy', 'Secretary-Treasurer', '2019-09-01'),
  ('clc-user-004', '873cf59b-cef5-4d51-9a62-151512810449', 'Sophie Tremblay', 's.tremblay@clc-ctc.ca', 'member', 'active', 'Legal', 'Director of Legal Affairs', '2020-01-10'),
  ('clc-user-005', '873cf59b-cef5-4d51-9a62-151512810449', 'James Nguyen', 'j.nguyen@clc-ctc.ca', 'member', 'active', 'Research', 'Senior Research Analyst', '2018-03-20'),
  ('clc-user-006', '873cf59b-cef5-4d51-9a62-151512810449', 'Rebecca Martin', 'r.martin@clc-ctc.ca', 'member', 'active', 'Communications', 'Media Relations Officer', '2021-07-01'),
  ('clc-user-007', '873cf59b-cef5-4d51-9a62-151512810449', 'Louis Picard', 'l.picard@clc-ctc.ca', 'member', 'active', 'Policy', 'Policy Advisor', '2016-11-20'),
  ('clc-user-008', '873cf59b-cef5-4d51-9a62-151512810449', 'Angela Varga', 'a.varga@clc-ctc.ca', 'member', 'active', 'International', 'International Liaison', '2022-02-14'),
  ('clc-user-009', '873cf59b-cef5-4d51-9a62-151512810449', 'Patrick O''Connor', 'p.oconnor@clc-ctc.ca', 'member', 'active', 'Education', 'Education Coordinator', '2019-08-05'),
  ('clc-user-010', '873cf59b-cef5-4d51-9a62-151512810449', 'Fatima Al-Rashid', 'f.alrashid@clc-ctc.ca', 'member', 'active', 'Organizing', 'National Organizer', '2023-01-15')
ON CONFLICT DO NOTHING;

-- ============================================================
-- CAPE-ACEP Members (federal professional employees union)
-- ============================================================
INSERT INTO organization_members (user_id, organization_id, name, email, role, status, department, position, membership_number, union_join_date, seniority)
VALUES
  ('cape-user-001', 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'Greg Phillips', 'g.phillips@acep-cape.ca', 'admin', 'active', 'Executive', 'National President', 'CAPE-2018-001', '2018-04-01', 6),
  ('cape-user-002', 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'Emmanuelle Tremblay', 'e.tremblay@acep-cape.ca', 'admin', 'active', 'Executive', 'Vice-President', 'CAPE-2019-002', '2019-06-01', 5),
  ('cape-user-003', 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'Brian Faulkner', 'b.faulkner@acep-cape.ca', 'member', 'active', 'Bargaining', 'Chief Negotiator', 'CAPE-2015-003', '2015-01-15', 9),
  ('cape-user-004', 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'Chantal Bertrand', 'c.bertrand@acep-cape.ca', 'member', 'active', 'Labour Relations', 'Labour Relations Officer', 'CAPE-2020-004', '2020-03-01', 4),
  ('cape-user-005', 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'Mike Savard', 'm.savard@acep-cape.ca', 'member', 'active', 'Legal', 'Staff Lawyer', 'CAPE-2017-005', '2017-09-15', 7),
  ('cape-user-006', 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'Nadia Ouellet', 'n.ouellet@acep-cape.ca', 'member', 'active', 'Finance', 'Controller', 'CAPE-2021-006', '2021-01-10', 3),
  ('cape-user-007', 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'Daniel Kim', 'd.kim@acep-cape.ca', 'member', 'active', 'Membership Services', 'Membership Coordinator', 'CAPE-2022-007', '2022-05-01', 2),
  ('cape-user-008', 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'Sarah Lefebvre', 's.lefebvre@acep-cape.ca', 'member', 'active', 'Stewards', 'Chief Steward - NCR', 'CAPE-2016-008', '2016-07-20', 8),
  ('cape-user-009', 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'Alexandre Moreau', 'a.moreau@acep-cape.ca', 'member', 'active', 'Stewards', 'Steward - Pacific Region', 'CAPE-2023-009', '2023-03-01', 1),
  ('cape-user-010', 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'Jennifer Walsh', 'j.walsh@acep-cape.ca', 'member', 'active', 'Communications', 'Digital Communications Lead', 'CAPE-2019-010', '2019-11-01', 5),
  ('cape-user-011', 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'Pierre Desmarais', 'p.desmarais@acep-cape.ca', 'member', 'active', 'Research', 'Senior Economist', 'CAPE-2014-011', '2014-08-01', 10),
  ('cape-user-012', 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'Amira Hassan', 'a.hassan@acep-cape.ca', 'member', 'active', 'IT', 'Systems Analyst', 'CAPE-2024-012', '2024-01-15', 0)
ON CONFLICT DO NOTHING;

-- ============================================================
-- CLC Grievances
-- ============================================================
INSERT INTO grievances (grievance_number, type, status, priority, step, title, description, organization_id, grievant_name, grievant_email, employer_name, workplace_name, incident_date, filed_date, background, desired_outcome)
VALUES
  ('CLC-GRV-2025-001', 'contract', 'filed', 'high', 'step_1',
   'Overtime Pay Calculation Dispute',
   'Employer calculating overtime at 1.0x instead of 1.5x for hours exceeding 40/week as per Article 14.3 of the collective agreement.',
   '873cf59b-cef5-4d51-9a62-151512810449',
   'James Nguyen', 'j.nguyen@clc-ctc.ca', 'Treasury Board of Canada', 'CLC National Office',
   '2025-01-15', '2025-01-20',
   'The employer began applying a new payroll system in December 2024 that miscalculates overtime rates for salaried employees.',
   'Retroactive overtime payments at the correct 1.5x rate for all affected pay periods.'),

  ('CLC-GRV-2025-002', 'harassment', 'investigating', 'urgent', 'step_2',
   'Workplace Harassment - Hostile Environment',
   'Ongoing pattern of intimidation by a supervisor including public belittling, unreasonable workload assignments, and exclusion from team meetings.',
   '873cf59b-cef5-4d51-9a62-151512810449',
   'Rebecca Martin', 'r.martin@clc-ctc.ca', 'Treasury Board of Canada', 'CLC National Office',
   '2024-12-01', '2025-01-05',
   'Multiple incidents documented since October 2024. Informal resolution attempted and failed in November 2024.',
   'Formal investigation, supervisor reassignment, and anti-harassment training.'),

  ('CLC-GRV-2025-003', 'discipline', 'escalated', 'high', 'step_3',
   'Unjust Suspension Without Pay',
   'Member suspended for 5 days without pay for alleged insubordination. No prior progressive discipline applied. Union argues the suspension is without just cause.',
   '873cf59b-cef5-4d51-9a62-151512810449',
   'Patrick O''Connor', 'p.oconnor@clc-ctc.ca', 'Treasury Board of Canada', 'CLC National Office',
   '2025-02-10', '2025-02-12',
   'Member questioned a directive they believed violated safety protocols. Employer issued immediate 5-day suspension.',
   'Rescind suspension, restore full pay, remove from personnel file.'),

  ('CLC-GRV-2025-004', 'seniority', 'mediation', 'medium', 'step_3',
   'Seniority Bypass in Promotion',
   'Senior qualified member passed over for promotion in favour of a less senior candidate. Alleged violation of Article 21.7 seniority provisions.',
   '873cf59b-cef5-4d51-9a62-151512810449',
   'Louis Picard', 'l.picard@clc-ctc.ca', 'Treasury Board of Canada', 'CLC Regional Office - Montreal',
   '2025-01-28', '2025-02-01',
   'The position of Senior Policy Analyst (PE-05) was posted and filled January 2025. Grievant has 8 years seniority vs successful candidate with 3 years.',
   'Award the position to the grievant with retroactive pay and benefits.'),

  ('CLC-GRV-2025-005', 'safety', 'settled', 'urgent', 'final',
   'Unsafe Ergonomic Conditions - Remote Workers',
   'Employer refusing to provide ergonomic assessments and equipment for remote workers as required under the Canada Labour Code and collective agreement.',
   '873cf59b-cef5-4d51-9a62-151512810449',
   'Fatima Al-Rashid', 'f.alrashid@clc-ctc.ca', 'Treasury Board of Canada', 'CLC - Remote Workers Unit',
   '2024-11-15', '2024-11-20',
   'Over 30 remote workers reported musculoskeletal issues. Employer stated remote ergonomic assessments were optional.',
   'Mandatory ergonomic assessments for all remote workers, equipment reimbursement up to $2,000.')
ON CONFLICT DO NOTHING;

-- ============================================================
-- CLC Collective Agreements
-- ============================================================
INSERT INTO collective_agreements (organization_id, cba_number, title, jurisdiction, employer_name, union_name, effective_date, expiry_date, signed_date, industry_sector, status, language, employee_coverage, bargaining_unit_description)
VALUES
  ('873cf59b-cef5-4d51-9a62-151512810449', 'CLC-CBA-2023-001',
   'CLC Staff Collective Agreement 2023-2027',
   'federal', 'Treasury Board of Canada', 'Canadian Labour Congress', '2023-06-01', '2027-05-31', '2023-07-15',
   'public_administration', 'active', 'bilingual', 185,
   'All employees of the CLC National Office in the bargaining unit including policy analysts, researchers, communications staff, and administrative support.'),

  ('873cf59b-cef5-4d51-9a62-151512810449', 'CLC-CBA-2019-002',
   'CLC Regional Staff Agreement 2019-2023',
   'federal', 'Treasury Board of Canada', 'Canadian Labour Congress', '2019-09-01', '2023-08-31', '2019-10-01',
   'public_administration', 'expired', 'en', 42,
   'Regional office staff including education coordinators, organizers, and support staff across all provincial offices.')
ON CONFLICT DO NOTHING;

-- ============================================================
-- CLC Settlement (for the resolved safety grievance)
-- ============================================================
INSERT INTO settlements (grievance_id, settlement_type, status, monetary_amount, non_monetary_terms, organization_id, implemented_at, approved_by_grievant, approved_by_union, approved_by_employer)
SELECT g.id, 'monetary'::settlement_type, 'implemented', 65000.00,
  '["Mandatory ergonomic assessments for all remote workers within 90 days", "Reimburse equipment up to 2000 per worker", "Establish Remote Work Health and Safety Committee"]'::jsonb,
  '873cf59b-cef5-4d51-9a62-151512810449',
  '2025-03-01', true, true, true
FROM grievances g WHERE g.grievance_number = 'CLC-GRV-2025-005'
AND NOT EXISTS (SELECT 1 FROM settlements s WHERE s.grievance_id = g.id);

-- ============================================================
-- Update member_count on organizations
-- ============================================================
UPDATE organizations SET
  member_count = (SELECT count(*) FROM organization_members WHERE organization_id = organizations.id::text AND status = 'active'),
  active_member_count = (SELECT count(*) FROM organization_members WHERE organization_id = organizations.id::text AND status = 'active');

COMMIT;
