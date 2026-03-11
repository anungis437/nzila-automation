-- ============================================================================
-- CBA DOMAIN: SEED DATA
-- ============================================================================
-- Seeds realistic CAPE-ACEP demo data for CBA features
-- Prerequisite: cba-tables.sql must be run first
-- Run: Get-Content cba-seed-data.sql | docker exec -i nzila-postgres psql -U nzila -d nzila_automation
-- ============================================================================

BEGIN;

-- ============================================================================
-- KNOWN IDs (from prior seeding)
-- ============================================================================
-- CAPE-ACEP org:  c09173ad-5ba4-498e-a483-b371fb5e248e
-- CLC org:        873cf59b-cef5-4d51-9a62-151512810449

-- Fixed UUIDs for cross-referencing
-- CBA #1 (PA Group active):     a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
-- CBA #2 (EC Group expired):    b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e
-- CBA #3 (TC Group negotiation):c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f
-- Negotiation #1:               d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80
-- Grievance #1 (filed):         e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091
-- Grievance #2 (escalated):     f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102
-- Grievance #3 (settled):       07b8c9d0-e1f2-4a3b-4c5d-6e7f80910213
-- Grievance #4 (arbitration):   18c9d0e1-f2a3-4b4c-5d6e-7f8091021324
-- Grievance #5 (investigating): 29d0e1f2-a3b4-4c5d-6e7f-809102132435
-- Arb Decision #1:              3ae1f2a3-b4c5-4d6e-7f80-910213243546
-- Arb Decision #2:              4bf2a3b4-c5d6-4e7f-8091-021324354657
-- Arb Decision #3:              5ca3b4c5-d6e7-4f80-9102-132435465768

-- ============================================================================
-- 1. COLLECTIVE AGREEMENTS (3 CBAs)
-- ============================================================================

-- CBA #1: PA Group (Active) — Treasury Board / CAPE
INSERT INTO collective_agreements (
  id, organization_id, cba_number, title, jurisdiction, language,
  employer_name, employer_id, union_name, union_local, union_id,
  effective_date, expiry_date, signed_date, ratification_date,
  industry_sector, sector, employee_coverage, bargaining_unit_description,
  status, is_public, version, summary_generated, key_terms
) VALUES (
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  'c09173ad-5ba4-498e-a483-b371fb5e248e',
  'PA-CAPE-2021-001',
  'Collective Agreement between the Treasury Board and the Canadian Association of Professional Employees — PA Group',
  'federal', 'bilingual',
  'Treasury Board of Canada Secretariat', 'TB-001',
  'Canadian Association of Professional Employees (CAPE)', 'National', 'CAPE-001',
  '2021-06-22', '2025-06-21', '2021-09-15', '2021-08-28',
  'Federal Public Service', 'public', 14500,
  'All employees in the Programme and Administrative Services (PA) Group, including EC (Economics and Social Science Services), TR (Translation) and SI (Social Science Support) sub-groups.',
  'active', true, 1,
  'Four-year collective agreement covering approximately 14,500 CAPE members in the PA Group. Key improvements include economic increases of 2.8% annually, enhanced telework provisions, expanded mental health benefits, and strengthened anti-harassment protections.',
  '["economic_increase", "telework", "mental_health", "anti_harassment", "pay_equity", "retroactive_pay", "overtime", "bilingual_bonus"]'::jsonb
);

-- CBA #2: EC Group (Expired — previous agreement)
INSERT INTO collective_agreements (
  id, organization_id, cba_number, title, jurisdiction, language,
  employer_name, union_name, union_local,
  effective_date, expiry_date, signed_date, ratification_date,
  industry_sector, sector, employee_coverage, bargaining_unit_description,
  status, is_public, version, superseded_by
) VALUES (
  'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  'c09173ad-5ba4-498e-a483-b371fb5e248e',
  'EC-CAPE-2018-001',
  'Collective Agreement between the Treasury Board and CAPE — EC Group (2018-2021)',
  'federal', 'bilingual',
  'Treasury Board of Canada Secretariat',
  'Canadian Association of Professional Employees (CAPE)', 'National',
  '2018-06-22', '2021-06-21', '2018-11-20', '2018-10-15',
  'Federal Public Service', 'public', 12800,
  'Economics and Social Science Services (EC) sub-group of the PA Group.',
  'expired', true, 1,
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
);

-- CBA #3: TC Group (Under Negotiation)
INSERT INTO collective_agreements (
  id, organization_id, cba_number, title, jurisdiction, language,
  employer_name, union_name, union_local,
  effective_date, expiry_date,
  industry_sector, sector, employee_coverage, bargaining_unit_description,
  status, is_public, version
) VALUES (
  'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
  'c09173ad-5ba4-498e-a483-b371fb5e248e',
  'TC-CAPE-2025-001',
  'Collective Agreement between the Treasury Board and CAPE — TC Group (2025 Renewal)',
  'federal', 'bilingual',
  'Treasury Board of Canada Secretariat',
  'Canadian Association of Professional Employees (CAPE)', 'National',
  '2025-06-22', '2029-06-21',
  'Federal Public Service', 'public', 1200,
  'Translation (TR) sub-group, currently in active negotiations for renewal.',
  'under_negotiation', false, 1
);

-- ============================================================================
-- 2. CBA CLAUSES (20 key clauses for the active PA Group CBA)
-- ============================================================================

-- Article 1: Purpose
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '1.01', 'other', 'Purpose of Agreement',
  'The purpose of this Agreement is to maintain harmonious and mutually beneficial relationships between the Employer, the employees and the Alliance, to set forth certain terms and conditions of employment relating to pay, hours of work, employee benefits, and general working conditions affecting employees covered by this Agreement.',
  'Article 1', 1);

-- Article 7: Union Rights
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '7.01', 'union_rights', 'Recognition of the Alliance',
  'The Employer recognizes the Canadian Association of Professional Employees (CAPE) as the exclusive bargaining agent for all employees described in the certificate issued by the Federal Public Sector Labour Relations and Employment Board.',
  'Article 7', 2);

-- Article 10: Management Rights
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '10.01', 'management_rights', 'Management Rights',
  'Except to the extent provided herein, this Agreement in no way restricts the authority of those charged with managerial responsibilities in the Federal Public Service.',
  'Article 10', 3);

-- Article 14: Hours of Work
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '14.01', 'hours_scheduling', 'Hours of Work — Day Workers',
  'The normal work week shall be thirty-seven and one-half (37.5) hours from Monday to Friday inclusive, and the normal work day shall be seven and one-half (7.5) consecutive hours, exclusive of a lunch period, between the hours of 6:00 a.m. and 6:00 p.m. The Employer shall endeavour to schedule flexible hours of work within the normal work day.',
  'Article 14', 4);

-- Article 15: Overtime
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '15.01', 'overtime', 'Overtime Compensation',
  'An employee who is required to work overtime shall be compensated as follows: (a) on a normal working day, at time and one-half (1 1/2) for each hour of overtime worked; (b) on a first day of rest, at time and one-half (1 1/2) for the first seven and one-half (7.5) hours and double (2) time thereafter; (c) on a second or subsequent day of rest or on a designated paid holiday, at double (2) time for each hour of overtime worked.',
  'Article 15', 5);

-- Article 17: Leave General
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '17.01', 'vacation_leave', 'Vacation Leave Entitlement',
  'An employee shall earn vacation leave credits for each calendar month during which the employee receives pay for at least seventy-five (75) hours at the following rate: (a) nine decimal three seven five (9.375) hours per month up to and including the eighth year of continuous employment; (b) twelve decimal five (12.5) hours per month from the ninth year up to and including the sixteenth year; (c) fourteen decimal three seven five (14.375) hours per month from the seventeenth year up to and including the twenty-seventh year; (d) fifteen decimal six two five (15.625) hours per month after the twenty-seventh year.',
  'Article 17', 6);

-- Article 18: Sick Leave
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '18.01', 'vacation_leave', 'Sick Leave with Pay',
  'An employee shall earn sick leave credits at the rate of nine decimal three seven five (9.375) hours for each calendar month for which the employee receives pay for at least seventy-five (75) hours.',
  'Article 18', 7);

-- Article 22: Designated Paid Holidays
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '22.01', 'working_conditions', 'Designated Paid Holidays',
  'Subject to clause 22.02, the following days shall be designated paid holidays for employees: (a) New Year''s Day, (b) Good Friday, (c) Easter Monday, (d) the day fixed by proclamation for the celebration of the Sovereign''s Birthday, (e) Canada Day, (f) Labour Day, (g) the National Day for Truth and Reconciliation, (h) Thanksgiving Day, (i) Remembrance Day, (j) Christmas Day, (k) Boxing Day, and (l) one additional day in each year that, in the opinion of the Employer, is recognized to be a provincial or civic holiday.',
  'Article 22', 8);

-- Article 25: Grievance Procedure
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index,
  key_terms)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '25.01', 'grievance_arbitration', 'Right to Present Grievances',
  'An employee who believes that he or she has been treated unjustly or considers himself or herself aggrieved by any action or lack of action by the Employer in matters other than those arising from the classification process is entitled to present a grievance in the manner prescribed in this Article, except that: (a) where there is another administrative procedure provided by or under any Act of Parliament to deal with the employee''s specific complaint, that procedure must be followed; and (b) where the grievance relates to the interpretation or application of this collective agreement or an arbitral award, the employee is not entitled to present the grievance unless he or she has the approval of and is represented by the Alliance.',
  'Article 25', 9,
  '["grievance_procedure", "25_days_time_limit", "three_step_process", "alliance_representation"]'::jsonb);

-- Article 25 Step 1
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index,
  section_hierarchy)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '25.06', 'grievance_arbitration', 'Grievance Procedure — Step 1',
  'The employee shall first discuss the matter with his or her immediate supervisor within twenty-five (25) days after the date on which he or she is notified orally or in writing or on which he or she first becomes aware of the action or circumstances giving rise to the grievance. If the discussion does not resolve the matter to the satisfaction of the employee, the employee may present a grievance at the first level of the grievance procedure.',
  'Article 25', 10,
  '["Article 25", "Section 25.06", "Step 1"]'::jsonb);

-- Article 25 Step 2
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index,
  section_hierarchy)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '25.07', 'grievance_arbitration', 'Grievance Procedure — Step 2',
  'If the grievance is not satisfactorily settled at Step 1, the employee may, within twenty (20) days after receipt of the Step 1 response, present a grievance at Step 2, which shall be the Deputy Head or the latter''s representative. The Deputy Head or designee shall reply within twenty (20) days of receipt of the grievance.',
  'Article 25', 11,
  '["Article 25", "Section 25.07", "Step 2"]'::jsonb);

-- Article 25 Final Step
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index,
  section_hierarchy)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '25.08', 'grievance_arbitration', 'Grievance Procedure — Final Step',
  'If the grievance is not satisfactorily settled at Step 2, the employee may refer the grievance to adjudication in accordance with the provisions of the Federal Public Sector Labour Relations Act. The Alliance may also refer policy grievances to adjudication.',
  'Article 25', 12,
  '["Article 25", "Section 25.08", "Final Step / Adjudication"]'::jsonb);

-- Article 30: Pay Administration
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '30.01', 'wages_compensation', 'Pay Administration — Rates of Pay',
  'Employees shall be paid in accordance with the rates of pay set out in Appendix A. Effective on the dates specified: (a) June 22, 2021: 2.8% economic increase; (b) June 22, 2022: 2.8% economic increase; (c) June 22, 2023: 2.8% economic increase; (d) June 22, 2024: 2.8% economic increase. In addition, employees shall receive a one-time lump sum signing bonus equivalent to $2,500.',
  'Article 30', 13);

-- Article 31: Bilingual Bonus
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '31.01', 'wages_compensation', 'Bilingual Bonus',
  'An employee who occupies a bilingual position and who meets the language requirements of that position shall receive a bilingual bonus of eight hundred dollars ($800) per annum.',
  'Article 31', 14);

-- Article 33: Health and Safety
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '33.01', 'health_safety', 'Occupational Health and Safety',
  'The Employer shall continue to make all reasonable provisions for the occupational health and safety of employees. The Employer will welcome suggestions on the subject from the Alliance and the parties undertake to consult with a view to adopting and expeditiously carrying out reasonable procedures and techniques designed or intended to prevent or reduce the risk of employment injury.',
  'Article 33', 15);

-- Article 35: Seniority
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '35.01', 'seniority_promotion', 'Seniority',
  'Seniority is defined as the length of unbroken service in the bargaining unit. In the event of layoff, employees shall be laid off in reverse order of seniority, provided the remaining employees are qualified and able to perform the available work.',
  'Article 35', 16);

-- Article 36: Job Security
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '36.01', 'job_security', 'Job Security — Workforce Adjustment',
  'The Employer shall make every reasonable effort to deploy affected employees to other positions through the Workforce Adjustment Directive (WAD). Employees affected by workforce adjustment shall have priority for appointment over external applicants for a period of twelve (12) months.',
  'Article 36', 17);

-- Article 38: Disciplinary Procedures
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '38.01', 'disciplinary_procedures', 'Disciplinary Action',
  'When an employee is required to attend a meeting with the Employer that could result in discipline being imposed, the employee shall be informed of the purpose of the meeting and shall be entitled to have an Alliance representative present at the meeting. The Employer shall notify the employee in writing of any disciplinary action and provide the reasons therefor.',
  'Article 38', 18);

-- Article 40: Benefits
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '40.01', 'benefits_insurance', 'Employee Benefits — Insurance Plans',
  'The Employer shall continue to pay its share of the premiums for the Public Service Health Care Plan (PSHCP), the Disability Insurance Plan, the Dental Care Plan, and the Public Service Pension Plan as provided by applicable legislation. Effective 2022, mental health coverage under the PSHCP shall increase from $2,000 to $5,000 per year per family member.',
  'Article 40', 19);

-- Article 42: Telework
INSERT INTO cba_clauses (id, organization_id, cba_id, clause_number, clause_type, title, content, article_number, order_index)
VALUES (gen_random_uuid(), 'c09173ad-5ba4-498e-a483-b371fb5e248e', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '42.01', 'working_conditions', 'Telework Arrangements',
  'Subject to operational requirements, the Employer shall not unreasonably deny requests for telework arrangements. Employees in designated telework-eligible positions may work remotely for up to three (3) days per week. The Employer shall provide or reimburse reasonable costs for home office equipment necessary for telework (up to $500 one-time allowance). All telework arrangements shall be documented in a written agreement between the employee and their manager.',
  'Article 42', 20);

-- ============================================================================
-- 3. CBA CONTACTS
-- ============================================================================

INSERT INTO cba_contacts (cba_id, contact_type, name, title, organization, email, phone, is_primary) VALUES
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'union_rep', 'Greg Phillips', 'President', 'CAPE', 'president@acep-cape.ca', '613-236-9181', true),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'chief_negotiator', 'Isabelle Roy', 'Director of Negotiations', 'CAPE', 'i.roy@acep-cape.ca', '613-236-9181', false),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'employer_rep', 'Marie-Chantal Girard', 'Chief Human Resources Officer', 'Treasury Board Secretariat', 'marie-chantal.girard@tbs-sct.gc.ca', '613-957-2400', true),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'employer_rep', 'David Prest', 'Senior Labour Relations Advisor', 'Treasury Board Secretariat', 'd.prest@tbs-sct.gc.ca', '613-957-2401', false);

-- ============================================================================
-- 4. CBA VERSION HISTORY
-- ============================================================================

INSERT INTO cba_version_history (cba_id, version, change_description, change_type, created_by) VALUES
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 1, 'Initial ratification of 2021-2025 PA Group collective agreement. Key changes: 2.8% annual economic increase, enhanced mental health coverage to $5,000, telework provisions (Article 42), Truth and Reconciliation Day added as holiday.', 'renewal', 'system');

-- ============================================================================
-- 5. WAGE PROGRESSIONS (EC Sub-group — 7 steps)
-- ============================================================================

INSERT INTO wage_progressions (cba_id, classification, classification_code, step, hourly_rate, annual_salary, effective_date, notes) VALUES
-- EC-01
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-01', 1, 33.52, 65261, '2024-06-22', 'Entry level – includes 2.8% increase'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-01', 2, 34.91, 67970, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-01', 3, 36.34, 70754, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-01', 4, 37.83, 73656, '2024-06-22', NULL),
-- EC-02
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-02', 1, 37.83, 73656, '2024-06-22', 'Overlap with EC-01 Step 4'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-02', 2, 39.35, 76612, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-02', 3, 40.93, 79690, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-02', 4, 42.56, 82862, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-02', 5, 44.28, 86211, '2024-06-22', NULL),
-- EC-03
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-03', 1, 44.28, 86211, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-03', 2, 46.06, 89666, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-03', 3, 47.91, 93268, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-03', 4, 49.84, 97029, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-03', 5, 51.85, 100942, '2024-06-22', NULL),
-- EC-04
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-04', 1, 50.71, 98730, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-04', 2, 52.76, 102720, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-04', 3, 54.89, 106866, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-04', 4, 57.10, 111171, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-04', 5, 59.40, 115647, '2024-06-22', NULL),
-- EC-05
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-05', 1, 57.10, 111171, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-05', 2, 59.40, 115647, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-05', 3, 61.79, 120298, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-05', 4, 64.27, 125126, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-05', 5, 66.88, 130206, '2024-06-22', NULL),
-- EC-06
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-06', 1, 64.27, 125126, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-06', 2, 66.88, 130206, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-06', 3, 69.60, 135490, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-06', 4, 72.43, 141001, '2024-06-22', NULL),
-- EC-07
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-07', 1, 72.43, 141001, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-07', 2, 75.35, 146693, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-07', 3, 78.39, 152610, '2024-06-22', NULL),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Economics and Social Science Services', 'EC-07', 4, 81.56, 158780, '2024-06-22', NULL);

-- TR Sub-group (Translation)
INSERT INTO wage_progressions (cba_id, classification, classification_code, step, hourly_rate, annual_salary, effective_date) VALUES
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Translation', 'TR-01', 1, 36.34, 70754, '2024-06-22'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Translation', 'TR-01', 2, 37.83, 73656, '2024-06-22'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Translation', 'TR-01', 3, 39.35, 76612, '2024-06-22'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Translation', 'TR-02', 1, 44.28, 86211, '2024-06-22'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Translation', 'TR-02', 2, 46.06, 89666, '2024-06-22'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Translation', 'TR-02', 3, 47.91, 93268, '2024-06-22'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Translation', 'TR-03', 1, 51.85, 100942, '2024-06-22'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Translation', 'TR-03', 2, 54.89, 106866, '2024-06-22'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Translation', 'TR-03', 3, 57.10, 111171, '2024-06-22');

-- ============================================================================
-- 6. BENEFIT COMPARISONS
-- ============================================================================

INSERT INTO benefit_comparisons (cba_id, benefit_type, benefit_name, coverage_details, monthly_premium, annual_cost, industry_benchmark, effective_date) VALUES
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'health', 'Public Service Health Care Plan (PSHCP)',
  '{"employeeCoverage": "100%", "dependentCoverage": "100%", "employerPaidPercentage": 75, "employeePaidPercentage": 25, "waitingPeriod": "None for indeterminate", "eligibilityCriteria": ["Indeterminate employee", "Term employee > 6 months"]}'::jsonb,
  125.00, 1500.00, 'excellent', '2024-06-22'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'dental', 'Public Service Dental Care Plan',
  '{"employeeCoverage": "90% basic, 50% major", "dependentCoverage": "90% basic, 50% major", "employerPaidPercentage": 100, "employeePaidPercentage": 0, "waitingPeriod": "None", "exclusions": ["Cosmetic dentistry", "Implants over $3,000"]}'::jsonb,
  0.00, 0.00, 'excellent', '2024-06-22'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'mental_health', 'Mental Health Services Coverage',
  '{"employeeCoverage": "$5,000/year per family member", "dependentCoverage": "$5,000/year per family member", "employerPaidPercentage": 75, "employeePaidPercentage": 25, "eligibilityCriteria": ["Registered psychologist", "Licensed counsellor", "Social worker"]}'::jsonb,
  45.00, 540.00, 'excellent', '2022-06-22'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'disability', 'Disability Insurance Plan (DI)',
  '{"employeeCoverage": "70% of salary", "employerPaidPercentage": 85, "employeePaidPercentage": 15, "waitingPeriod": "13 weeks (after sick leave exhausted)"}'::jsonb,
  38.00, 456.00, 'good', '2024-06-22'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'life', 'Group Life Insurance (Supplementary Death Benefit)',
  '{"employeeCoverage": "2x annual salary", "dependentCoverage": "N/A", "employerPaidPercentage": 67, "employeePaidPercentage": 33}'::jsonb,
  22.00, 264.00, 'good', '2024-06-22'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'pension', 'Public Service Pension Plan',
  '{"employeeCoverage": "Defined benefit", "employerPaidPercentage": 50, "employeePaidPercentage": 50, "eligibilityCriteria": ["All indeterminate employees", "Term > 6 months"], "exclusions": ["Casual employees"]}'::jsonb,
  850.00, 10200.00, 'excellent', '2024-06-22');

-- ============================================================================
-- 7. ARBITRATION DECISIONS (3 PRECEDENT CASES)
-- ============================================================================

-- Decision #1: Termination — Grievance Upheld
INSERT INTO arbitration_decisions (
  id, case_number, case_title, tribunal, decision_type, decision_date, filing_date, hearing_date,
  arbitrator, grievor, "union", employer, outcome, remedy,
  key_findings, issue_types, precedent_value,
  full_text, summary, headnote, reasoning, key_facts,
  sector, jurisdiction, language
) VALUES (
  '3ae1f2a3-b4c5-4d6e-7f80-910213243546',
  'FPSLREB-2024-0147',
  'Phillips v. Treasury Board (Statistics Canada)',
  'fpslreb', 'grievance', '2024-09-15', '2023-06-10', '2024-03-18',
  'Margaret Teitelbaum',
  'Jean-Marc Philippe', 'CAPE', 'Treasury Board (Statistics Canada)',
  'grievance_upheld',
  '{"reinstatement": true, "backPay": {"amount": 45000, "period": "June 2023 to September 2024"}, "correctiveAction": "Removal of all disciplinary documents from personnel file", "interestAwarded": true}'::jsonb,
  '["Employer failed to demonstrate just cause for termination", "Progressive discipline not followed", "Mitigating circumstances not properly considered"]'::jsonb,
  '["termination", "just_cause", "progressive_discipline"]'::jsonb,
  'high',
  'The grievor, an EC-04 economist with twelve years of service, was terminated for alleged insubordination after refusing to attend in-office work three days per week citing medical accommodation needs. The Board found the Employer failed to demonstrate just cause as: (1) the grievor had provided medical documentation supporting a telework accommodation; (2) the Employer did not engage in a meaningful accommodation process as required under the Canadian Human Rights Act; (3) progressive discipline was not followed — the grievor received no prior warnings or suspensions. The Board ordered reinstatement with full back pay and benefits.',
  'Termination overturned due to failure to accommodate and lack of progressive discipline. Full reinstatement with back pay ordered.',
  'Phillips v. Treasury Board (Statistics Canada) — Termination for refusal to return to office overturned. Employer failed duty to accommodate medical needs and did not follow progressive discipline.',
  'The Board applied the well-established three-part test for accommodation under the CHRA: (1) Was the standard rationally connected to job performance? Yes. (2) Was it adopted in an honest and good-faith belief? Uncertain. (3) Was it reasonably necessary and could the employee be accommodated short of undue hardship? No — the Employer made no effort to accommodate. The Board further noted that twelve years of clean discipline record required the Employer to consider alternatives to termination, per Wm. Scott & Co. v. Canadian Food and Allied Workers Union.',
  'The grievor was an EC-04 senior economist at Statistics Canada with twelve years of continuous service and an unblemished disciplinary record. In January 2023, the Employer implemented a mandatory three-day in-office policy. The grievor submitted medical documentation from their physician indicating a need for telework due to anxiety disorder. The Employer rejected the documentation without seeking independent medical evaluation and issued a termination letter in May 2023.',
  'public', 'federal', 'en'
);

-- Decision #2: Overtime Dispute — Partial Success
INSERT INTO arbitration_decisions (
  id, case_number, case_title, tribunal, decision_type, decision_date, filing_date, hearing_date,
  arbitrator, grievor, "union", employer, outcome, remedy,
  key_findings, issue_types, precedent_value,
  full_text, summary, sector, jurisdiction, language
) VALUES (
  '4bf2a3b4-c5d6-4e7f-8091-021324354657',
  'FPSLREB-2024-0089',
  'Okafor et al. v. Treasury Board (ESDC)',
  'fpslreb', 'grievance', '2024-05-20', '2023-11-15', '2024-02-12',
  'Augustus Richardson',
  'Nkem Okafor (and 12 others)', 'CAPE', 'Treasury Board (ESDC)',
  'partial_success',
  '{"monetaryAward": 28500, "currency": "CAD", "costsAwarded": {"amount": 3500, "party": "employer"}}'::jsonb,
  '["Employer improperly classified after-hours system monitoring as standby rather than overtime", "Article 15 overtime provisions apply to work performed, not designation", "Group grievance properly brought under Article 25"]'::jsonb,
  '["overtime", "classification", "standby_vs_overtime"]'::jsonb,
  'medium',
  'A group of thirteen EC-03 and EC-04 analysts at Employment and Social Development Canada filed a group grievance alleging that mandatory after-hours monitoring of the Labour Market Information system, classified by the Employer as "standby duty," constituted overtime work under Article 15. The Board found that for seven of the thirteen instances documented, the employees performed active work (responding to alerts, running diagnostics, preparing reports) that exceeded the threshold for standby and constituted overtime. The Board awarded overtime compensation for those periods and costs.',
  'Group grievance partially upheld: after-hours system monitoring reclassified as overtime for active work periods. $28,500 awarded plus $3,500 costs.',
  'public', 'federal', 'en'
);

-- Decision #3: Harassment Complaint — Settled
INSERT INTO arbitration_decisions (
  id, case_number, case_title, tribunal, decision_type, decision_date, filing_date, hearing_date,
  arbitrator, "union", employer, outcome, remedy,
  key_findings, issue_types, precedent_value,
  full_text, summary, sector, jurisdiction, language
) VALUES (
  '5ca3b4c5-d6e7-4f80-9102-132435465768',
  'FPSLREB-2023-0312',
  'Confidential v. Treasury Board (PCO)',
  'fpslreb', 'grievance', '2023-12-01', '2023-03-20', '2023-09-05',
  'Bryan R. Gray',
  'CAPE', 'Treasury Board (Privy Council Office)',
  'settled',
  '{"monetaryAward": 15000, "policyChange": "Employer agreed to implement mandatory anti-harassment training for all managers in the affected directorate", "correctiveAction": "Written apology from Director General"}'::jsonb,
  '["Settlement reached through mediation before final hearing", "Employer acknowledged systemic issues in workplace culture", "Agreed-upon preventive measures exceed minimum legal requirements"]'::jsonb,
  '["harassment", "workplace_culture", "mediation"]'::jsonb,
  'low',
  'The grievor, an EC-05 policy analyst, filed a harassment complaint alleging a pattern of bullying behaviour by their director over an eighteen-month period. During the mediation phase of the adjudication process, the parties reached a settlement that included monetary compensation, mandatory training, and a written apology. The terms of the settlement are partially confidential.',
  'Harassment grievance settled through mediation. Monetary compensation plus mandatory anti-harassment training and written apology.',
  'public', 'federal', 'en'
);

-- ============================================================================
-- 8. ARBITRATOR PROFILES
-- ============================================================================

INSERT INTO arbitrator_profiles (name, total_decisions, grievor_success_rate, employer_success_rate,
  average_award_amount, median_award_amount, highest_award_amount,
  specializations, primary_sectors, jurisdictions,
  avg_decision_days, median_decision_days, decision_range_min, decision_range_max,
  decision_patterns, biography, credentials, is_active, last_decision_date) VALUES
('Margaret Teitelbaum', 127, 58.27, 41.73, 32500.00, 18000.00, 185000.00,
  '["termination","duty_to_accommodate","progressive_discipline","human_rights"]'::jsonb,
  '["public"]'::jsonb, '["federal"]'::jsonb,
  145, 120, 60, 365,
  '{"reinstatementRate": 0.72, "backPayAwardRate": 0.85, "costsAwardedRate": 0.35, "settlementEncouragementRate": 0.45}'::jsonb,
  'Former senior labour relations officer with the Federal Public Sector Labour Relations and Employment Board. Appointed as full-time adjudicator in 2008. Known for thorough factual analysis and strong emphasis on progressive discipline principles.',
  '["LL.B., University of Ottawa", "LL.M., Osgoode Hall", "FMCS Mediator Certification"]'::jsonb,
  true, '2024-09-15'),
('Augustus Richardson', 89, 52.81, 47.19, 21000.00, 12500.00, 95000.00,
  '["overtime","classification","pay_equity","standby"]'::jsonb,
  '["public"]'::jsonb, '["federal"]'::jsonb,
  110, 95, 45, 280,
  '{"reinstatementRate": 0.45, "backPayAwardRate": 0.78, "costsAwardedRate": 0.28, "settlementEncouragementRate": 0.52}'::jsonb,
  'Part-time adjudicator specializing in compensation and classification disputes. Previously served as senior counsel in the Department of Justice labour law section for fifteen years.',
  '["B.C.L., McGill University", "Member, Ontario Bar", "Certified Specialist in Labour Law"]'::jsonb,
  true, '2024-05-20'),
('Bryan R. Gray', 156, 49.36, 50.64, 16500.00, 10000.00, 120000.00,
  '["harassment","workplace_culture","duty_of_fair_representation","mediation"]'::jsonb,
  '["public","education"]'::jsonb, '["federal","ontario"]'::jsonb,
  95, 80, 30, 200,
  '{"reinstatementRate": 0.38, "backPayAwardRate": 0.55, "costsAwardedRate": 0.22, "settlementEncouragementRate": 0.68}'::jsonb,
  'Experienced mediator-arbitrator with a strong track record in resolving workplace harassment and culture disputes. Known for encouraging mediated settlements. Over 30 years of experience in federal and Ontario labour relations.',
  '["LL.B., Queen''s University", "C.Med., ADR Institute of Canada", "Former Vice-Chair, Ontario Labour Relations Board"]'::jsonb,
  true, '2023-12-01');

-- ============================================================================
-- 9. GRIEVANCES (5 at different stages)
-- ============================================================================

-- Grievance #1: Filed — Telework denial
INSERT INTO grievances (
  id, grievance_number, type, status, priority, step,
  grievant_name, grievant_email, employer_name, workplace_name,
  cba_id, cba_article, cba_section,
  title, description, background, desired_outcome,
  incident_date, filed_date, response_deadline,
  timeline, organization_id
) VALUES (
  'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091',
  'CAPE-GRV-2026-001', 'contract', 'filed', 'medium', 'step_1',
  'Sarah Chen', 'sarah.chen@statcan.gc.ca',
  'Treasury Board (Statistics Canada)', 'Statistics Canada — RH Coats Building',
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Article 42', '42.01',
  'Unreasonable Denial of Telework Arrangement',
  'The grievant, an EC-03 statistical analyst, submitted a telework request in accordance with Article 42.01 to work from home three days per week. The request was denied by the manager without written justification, stating only that "the team needs to be together." The grievor contends this violates Article 42.01 which provides that telework shall not be unreasonably denied.',
  'The grievor has been performing telework successfully since March 2020. All deliverables have been met or exceeded. Performance evaluations for 2023-24 and 2024-25 rated the grievor as "succeeded+" in all competencies. The team of 8 analysts currently operates on a hybrid schedule with 4 colleagues already approved for 3-day telework.',
  'That the Employer approve the telework arrangement as requested, and that the denial be removed from all records.',
  '2026-01-15', '2026-02-01', '2026-02-21',
  '[{"date": "2026-01-15", "action": "Telework request submitted", "actor": "Sarah Chen", "notes": "Formal request via GCDocs TW-2026-0142"},
    {"date": "2026-01-22", "action": "Request denied verbally", "actor": "Manager J. Thompson", "notes": "No written reason provided"},
    {"date": "2026-01-25", "action": "Written denial requested by grievor", "actor": "Sarah Chen"},
    {"date": "2026-01-28", "action": "Written denial received", "actor": "Manager J. Thompson", "notes": "Cited operational requirements without specifics"},
    {"date": "2026-02-01", "action": "Grievance filed at Step 1", "actor": "CAPE representative"}]'::jsonb,
  'c09173ad-5ba4-498e-a483-b371fb5e248e'
);

-- Grievance #2: Escalated to Step 2 — Classification dispute
INSERT INTO grievances (
  id, grievance_number, type, status, priority, step,
  grievant_name, grievant_email, employer_name, workplace_name,
  cba_id, cba_article,
  title, description, desired_outcome,
  incident_date, filed_date, response_deadline, escalated_at,
  timeline, is_arbitration_eligible, organization_id
) VALUES (
  'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102',
  'CAPE-GRV-2025-047', 'contract', 'escalated', 'high', 'step_2',
  'David Okafor', 'david.okafor@esdc.gc.ca',
  'Treasury Board (ESDC)', 'ESDC — Phase IV, Gatineau',
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Article 30',
  'Incorrect Pay Rate Following Acting Assignment',
  'The grievor, substantive EC-02 Step 5, performed acting EC-04 duties for 14 months. Upon return to EC-02, the Employer failed to apply the correct increment date adjustment per Article 30.07. Payroll records show the grievor is being paid at EC-02 Step 4 instead of Step 5, resulting in an underpayment of approximately $6,150 over 8 months.',
  'That the Employer correct the pay rate to EC-02 Step 5 retroactively and pay all amounts owing plus interest.',
  '2025-04-01', '2025-05-10', '2025-07-15', '2025-06-20',
  '[{"date": "2025-05-10", "action": "Grievance filed at Step 1", "actor": "CAPE representative"},
    {"date": "2025-06-05", "action": "Step 1 response — denied", "actor": "Director HR Operations", "notes": "Employer claims acting pay provisions do not adjust step progression"},
    {"date": "2025-06-20", "action": "Escalated to Step 2", "actor": "CAPE representative"},
    {"date": "2025-07-01", "action": "Step 2 hearing scheduled", "actor": "DG Labour Relations"}]'::jsonb,
  true,
  'c09173ad-5ba4-498e-a483-b371fb5e248e'
);

-- Grievance #3: Settled — Overtime compensation
INSERT INTO grievances (
  id, grievance_number, type, status, priority, step,
  grievant_name, employer_name, workplace_name,
  cba_id, cba_article, cba_section,
  title, description, desired_outcome,
  incident_date, filed_date, resolved_at, closed_at,
  timeline, organization_id
) VALUES (
  '07b8c9d0-e1f2-4a3b-4c5d-6e7f80910213',
  'CAPE-GRV-2025-031', 'contract', 'settled', 'medium', 'step_1',
  'Marie-Claire Dubois',
  'Treasury Board (IRCC)', 'IRCC — 365 Laurier Ave W',
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Article 15', '15.01',
  'Unpaid Overtime for Weekend Processing',
  'The grievor worked 22.5 hours of overtime on two consecutive weekends processing an urgent backlog of immigration applications at the direction of the ADM. The Employer initially refused compensation, claiming the overtime was "voluntary." The grievor produced email evidence showing the work was directed by a supervisor.',
  'Payment of overtime at the applicable rates under Article 15.01(b) and (c).',
  '2025-02-08', '2025-03-01', '2025-04-15', '2025-04-20',
  '[{"date": "2025-02-08", "action": "Overtime performed — Weekend 1 (15 hrs)", "actor": "Marie-Claire Dubois"},
    {"date": "2025-02-15", "action": "Overtime performed — Weekend 2 (7.5 hrs)", "actor": "Marie-Claire Dubois"},
    {"date": "2025-03-01", "action": "Grievance filed at Step 1", "actor": "CAPE representative"},
    {"date": "2025-03-20", "action": "Employer reviews email evidence", "actor": "Manager"},
    {"date": "2025-04-15", "action": "Settlement reached — full overtime payment agreed", "actor": "HR and CAPE"},
    {"date": "2025-04-20", "action": "Grievance closed — payment processed", "actor": "Payroll"}]'::jsonb,
  'c09173ad-5ba4-498e-a483-b371fb5e248e'
);

-- Grievance #4: At Arbitration — Discipline (suspension)
INSERT INTO grievances (
  id, grievance_number, type, status, priority, step,
  grievant_name, employer_name, workplace_name,
  cba_id, cba_article,
  title, description, desired_outcome,
  incident_date, filed_date, escalated_at,
  timeline, is_arbitration_eligible, has_legal_implications, organization_id
) VALUES (
  '18c9d0e1-f2a3-4b4c-5d6e-7f8091021324',
  'CAPE-GRV-2025-012', 'discipline', 'arbitration', 'urgent', 'arbitration',
  'Robert Kamau',
  'Treasury Board (CRA)', 'CRA — 555 MacKenzie Ave',
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Article 38',
  '20-Day Suspension Without Pay — Alleged Unauthorized Disclosure',
  'The grievor, an EC-05 senior analyst at CRA, received a 20-day suspension without pay for alleged unauthorized disclosure of taxpayer information. The grievor contends the information was shared internally within the authorized chain of analysis and that the Employer mischaracterized a routine data handoff between analytical teams. CAPE argues the suspension is disproportionate and that the Employer failed to follow progressive discipline per Article 38.',
  'Rescission of the 20-day suspension, reimbursement of lost pay, and removal of all references from the personnel file.',
  '2025-01-05', '2025-02-01', '2025-04-15',
  '[{"date": "2025-01-05", "action": "Alleged incident occurs", "actor": "Robert Kamau"},
    {"date": "2025-01-20", "action": "Investigation initiated by Employer", "actor": "CRA Internal Affairs"},
    {"date": "2025-01-28", "action": "20-day suspension imposed", "actor": "Director, Compliance Programs"},
    {"date": "2025-02-01", "action": "Grievance filed at Step 1", "actor": "CAPE representative"},
    {"date": "2025-02-28", "action": "Step 1 denied", "actor": "DG Human Resources"},
    {"date": "2025-03-15", "action": "Escalated to Step 2 — denied", "actor": "ADM Corporate Services"},
    {"date": "2025-04-15", "action": "Referred to adjudication (FPSLREB)", "actor": "CAPE Legal"},
    {"date": "2025-09-10", "action": "Pre-hearing conference scheduled", "actor": "FPSLREB"}]'::jsonb,
  true, true,
  'c09173ad-5ba4-498e-a483-b371fb5e248e'
);

-- Grievance #5: Investigating — Harassment
INSERT INTO grievances (
  id, grievance_number, type, status, priority, step,
  grievant_name, employer_name, workplace_name,
  cba_id, cba_article,
  title, description, desired_outcome,
  incident_date, filed_date,
  timeline, is_confidential, organization_id
) VALUES (
  '29d0e1f2-a3b4-4c5d-6e7f-809102132435',
  'CAPE-GRV-2026-003', 'harassment', 'investigating', 'high', 'step_1',
  'Confidential',
  'Treasury Board (PSPC)', 'PSPC — Place du Portage',
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Article 33',
  'Workplace Harassment — Hostile Work Environment',
  'The grievor alleges a pattern of workplace harassment by a supervisor, including excessive micromanagement, public criticism in team meetings, assignment of demeaning tasks outside job description, and exclusion from team communications. A formal complaint was filed under the Employer''s harassment prevention policy, and the investigation is underway.',
  'That the Employer take appropriate corrective action, provide a safe workplace free from harassment, and compensate the grievor for harm suffered.',
  '2025-11-01', '2026-01-10',
  '[{"date": "2025-11-01", "action": "First incident documented by grievor", "actor": "Confidential"},
    {"date": "2025-12-15", "action": "Formal harassment complaint filed", "actor": "Confidential"},
    {"date": "2026-01-05", "action": "Investigation assigned to external investigator", "actor": "HR Director"},
    {"date": "2026-01-10", "action": "Grievance filed concurrently", "actor": "CAPE representative"},
    {"date": "2026-02-15", "action": "Investigation interviews ongoing", "actor": "External Investigator"}]'::jsonb,
  true,
  'c09173ad-5ba4-498e-a483-b371fb5e248e'
);

-- ============================================================================
-- 10. GRIEVANCE RESPONSES
-- ============================================================================

-- Response to Grievance #1 (telework denial)
INSERT INTO grievance_responses (grievance_id, response_number, responding_party, responder_name, responder_title,
  response, position, response_date, accepted_by_grievant, next_deadline, next_step) VALUES
('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091', 1, 'employer', 'Janet Thompson', 'Director, Statistical Analysis Division',
  'The grievance is denied. The operational requirements of the Statistical Analysis Division require in-person collaboration for data validation activities. The team operates on a hybrid model and the current arrangement reflects the need for physical presence during peak review periods.',
  'The Employer maintains that operational requirements, as defined under the direction of the Deputy Head, take precedence and that the telework provisions in Article 42 are subject to such requirements.',
  '2026-02-18', false, '2026-03-10', 'Step 2 escalation');

-- Response to Grievance #2 (pay rate)
INSERT INTO grievance_responses (grievance_id, response_number, responding_party, responder_name, responder_title,
  response, position, response_date, accepted_by_grievant, next_deadline, next_step) VALUES
('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102', 1, 'employer', 'Patricia Nguyen', 'Director, HR Operations',
  'The Step 1 grievance is denied. The Employer''s position is that the acting pay provisions under Article 30.07 adjust the rate of pay for the acting period but do not confer advancement in the substantive position''s step progression. The grievor''s return to EC-02 Step 4 reflects the correct application of pay policy.',
  'Denied at Step 1. Employer relies on Pay Administration Manual interpretation.',
  '2025-06-05', false, '2025-07-15', 'Step 2 hearing'),
('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102', 2, 'employer', 'Marc Lefebvre', 'Director General, Labour Relations',
  'The Step 2 grievance is under review. The DG acknowledges that the interaction between acting pay provisions and step progression warrants further examination. A meeting with the Pay Centre is being arranged to clarify the policy application.',
  'Under review at Step 2. Employer examining policy interpretation.',
  '2025-07-10', NULL, '2025-08-15', 'Adjudication if unresolved');

-- Response to Grievance #3 (overtime — settled)
INSERT INTO grievance_responses (grievance_id, response_number, responding_party, responder_name, responder_title,
  response, position, response_date, accepted_by_grievant, accepted_by_employer) VALUES
('07b8c9d0-e1f2-4a3b-4c5d-6e7f80910213', 1, 'employer', 'André Tremblay', 'Manager, Case Processing',
  'Upon review of the email evidence presented by the grievor, the Employer acknowledges that the overtime was directed and not voluntary. The Employer agrees to compensate the grievor at the applicable rates: 15 hours at time and one-half (1.5x) for the first day of rest, and 7.5 hours at double time (2x) for the second day of rest. Total payable: $3,847.50.',
  'Settlement accepted. Employer agrees to full overtime payment per Article 15.01.',
  '2025-04-15', true, true);

-- ============================================================================
-- 11. SETTLEMENTS
-- ============================================================================

-- Settlement for Grievance #3 (overtime)
INSERT INTO settlements (
  grievance_id, settlement_type, status, monetary_amount, monetary_details,
  implemented_at, implementation_notes,
  approved_by_grievant, approved_by_employer, approved_by_union,
  organization_id
) VALUES (
  '07b8c9d0-e1f2-4a3b-4c5d-6e7f80910213',
  'monetary', 'finalized', 3848,
  'Overtime compensation: 15 hrs × $51.85 × 1.5 = $1,166.63 (first rest day) + 7.5 hrs × $51.85 × 2.0 = $777.75 (second rest day). Total: $3,847.50 gross, rounded to $3,848.',
  '2025-04-20', 'Payment processed through Phoenix pay system in the April 30 pay cycle.',
  true, true, true,
  'c09173ad-5ba4-498e-a483-b371fb5e248e'
);

-- ============================================================================
-- 12. ARBITRATIONS (ACTIVE PROCEEDING)
-- ============================================================================

-- Arbitration for Grievance #4 (suspension)
INSERT INTO arbitrations (
  grievance_id, arbitration_number, board_name, board_type,
  arbitrator_names, chair_appointee,
  status, scheduled_date, location,
  submission_deadline, evidence_deadline,
  union_cost_share, employer_cost_share, estimated_cost,
  organization_id
) VALUES (
  '18c9d0e1-f2a3-4b4c-5d6e-7f8091021324',
  'FPSLREB-ADJ-2025-0089',
  'Federal Public Sector Labour Relations and Employment Board', 'grievance',
  ARRAY['Margaret Teitelbaum'],
  'Margaret Teitelbaum',
  'scheduled', '2026-04-14', 'FPSLREB Hearing Room 4, 240 Sparks Street, Ottawa',
  '2026-03-14', '2026-03-28',
  0, 0, 15000,
  'c09173ad-5ba4-498e-a483-b371fb5e248e'
);

-- ============================================================================
-- 13. GRIEVANCE TIMELINE ENTRIES
-- ============================================================================

INSERT INTO grievance_timeline (grievance_id, event_type, event_date, actor, actor_role, description) VALUES
('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091', 'grievance_filed', '2026-02-01', 'CAPE Representative', 'union_rep', 'Formal Step 1 grievance filed regarding telework denial under Article 42.01'),
('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091', 'employer_response', '2026-02-18', 'Janet Thompson', 'manager', 'Step 1 response received — grievance denied'),
('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102', 'grievance_filed', '2025-05-10', 'CAPE Representative', 'union_rep', 'Grievance filed regarding incorrect pay rate after acting assignment'),
('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102', 'escalation', '2025-06-20', 'CAPE Representative', 'union_rep', 'Escalated to Step 2 after Step 1 denial'),
('07b8c9d0-e1f2-4a3b-4c5d-6e7f80910213', 'grievance_filed', '2025-03-01', 'CAPE Representative', 'union_rep', 'Overtime grievance filed — weekend processing not compensated'),
('07b8c9d0-e1f2-4a3b-4c5d-6e7f80910213', 'settlement_reached', '2025-04-15', 'HR and CAPE', 'settlement', 'Full overtime settlement agreed — $3,847.50'),
('18c9d0e1-f2a3-4b4c-5d6e-7f8091021324', 'grievance_filed', '2025-02-01', 'CAPE Legal', 'union_rep', 'Grievance filed against 20-day suspension for alleged unauthorized disclosure'),
('18c9d0e1-f2a3-4b4c-5d6e-7f8091021324', 'referral_to_adjudication', '2025-04-15', 'CAPE Legal', 'union_rep', 'Referred to FPSLREB adjudication after Step 2 denial'),
('29d0e1f2-a3b4-4c5d-6e7f-809102132435', 'grievance_filed', '2026-01-10', 'CAPE Representative', 'union_rep', 'Harassment grievance filed — concurrent with formal complaint'),
('29d0e1f2-a3b4-4c5d-6e7f-809102132435', 'investigation_started', '2026-01-05', 'External Investigator', 'investigator', 'External investigation assigned by HR Director');

-- ============================================================================
-- 14. NEGOTIATIONS (ACTIVE TC GROUP RENEWAL)
-- ============================================================================

INSERT INTO negotiations (
  id, organization_id, expiring_cba_id, title, description,
  union_name, union_local, employer_name, bargaining_unit_size,
  notice_given_date, first_session_date, target_completion_date,
  status, current_round, total_sessions,
  key_issues,
  estimated_cost, maximum_cost,
  progress_summary, last_activity_date,
  tags, created_by
) VALUES (
  'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
  'c09173ad-5ba4-498e-a483-b371fb5e248e',
  'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
  'TC Group Collective Agreement Renewal 2025-2029',
  'Renewal negotiations for the Translation (TR) sub-group collective agreement. The current agreement expired June 21, 2025. Key priorities include compensation parity with EC sub-group, AI impact protections, and enhanced professional development.',
  'CAPE', 'National', 'Treasury Board of Canada Secretariat', 1200,
  '2025-03-15', '2025-07-10', '2026-06-30',
  'active', 2, 4,
  '[{"issue": "Economic increase to match inflation (CPI)", "priority": "high", "status": "unresolved", "notes": "Union proposing 4.5% per year; Employer offering 2.2%"},
    {"issue": "AI impact on translation services", "priority": "high", "status": "unresolved", "notes": "Union seeking language protecting jobs against AI replacement and requiring human review of all machine translations"},
    {"issue": "Professional development fund increase", "priority": "medium", "status": "progress", "notes": "Both parties agree on need; disagreement on amount ($2,500 vs $1,500 per year)"},
    {"issue": "Remote work for translators", "priority": "medium", "status": "resolved", "notes": "Agreed: 4 days/week remote for TR positions"},
    {"issue": "Bilingual bonus increase", "priority": "low", "status": "unresolved", "notes": "Union seeking $1,200 (from $800); Employer offering $900"}]'::jsonb,
  45000000.00, 68000000.00,
  'Four sessions completed. Telework provisions largely agreed. Main open items: economic increase, AI protections, bilingual bonus. Next session scheduled for March 2026.',
  '2026-02-10',
  '["tc_group", "renewal", "2025_round", "ai_impact"]'::jsonb,
  'system'
);

-- ============================================================================
-- 15. BARGAINING PROPOSALS
-- ============================================================================

-- Union demand: Economic increase
INSERT INTO bargaining_proposals (negotiation_id, proposal_number, title, description, proposal_type, status,
  clause_category, current_language, proposed_language, rationale,
  estimated_cost, union_position, management_position,
  submitted_date, created_by) VALUES
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 'U-001', 'Economic Increase — 4.5% Per Year',
  'CAPE proposes an annual economic increase of 4.5% for each year of the four-year agreement (cumulative 19.25%), reflecting inflation, recruitment/retention challenges, and pay comparability with private sector translation services.',
  'union_demand', 'submitted',
  'wages', 'Effective June 22, 2021: 2.8% economic increase per year.',
  'Effective June 22, 2025: 4.5% economic increase. Effective June 22, 2026: 4.5% economic increase. Effective June 22, 2027: 4.5% economic increase. Effective June 22, 2028: 4.5% economic increase.',
  'Consumer Price Index (CPI) averaged 4.1% over the past three years. Private sector translation services compensation has increased an average of 5.2% annually. Current rates are below market for bilingual professionals.',
  54000000.00, 'must_have', 'rejected',
  '2025-07-10', 'system');

-- Management counter: Economic increase
INSERT INTO bargaining_proposals (negotiation_id, proposal_number, title, description, proposal_type, status,
  clause_category, proposed_language, rationale,
  estimated_cost, union_position, management_position,
  submitted_date, created_by) VALUES
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 'M-001', 'Economic Increase — 2.2% Per Year',
  'Treasury Board offers an annual economic increase of 2.2% for each year, consistent with the government''s fiscal framework and comparable federal settlements.',
  'management_offer', 'submitted',
  'wages',
  'Effective June 22, 2025: 2.2% economic increase. Effective June 22, 2026: 2.2% economic increase. Effective June 22, 2027: 2.2% economic increase. Effective June 22, 2028: 2.2% economic increase.',
  'Consistent with the government''s fiscal framework. Comparable to settlements reached with other bargaining agents in the 2024-2025 round.',
  26400000.00, 'rejected', 'must_have',
  '2025-08-15', 'system');

-- Union demand: AI protection
INSERT INTO bargaining_proposals (negotiation_id, proposal_number, title, description, proposal_type, status,
  clause_category, proposed_language, rationale,
  union_position, management_position,
  submitted_date, created_by) VALUES
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 'U-002', 'AI Impact Protection — New Article',
  'CAPE proposes new contract language to protect translation professionals from displacement by AI/machine translation tools.',
  'union_demand', 'submitted',
  'technological_change',
  'New Article XX — Artificial Intelligence and Machine Translation: (a) No employee shall be laid off, have their position reclassified, or suffer a reduction in hours as a direct result of the introduction of AI or machine translation technology. (b) All AI-generated or machine translations used for official purposes shall be reviewed and certified by a qualified TR-classified translator. (c) Employees shall receive training in AI tools and their appropriate use, with a minimum of 40 hours annual professional development dedicated to emerging translation technologies. (d) The Employer shall provide 180 calendar days notice before introducing any AI translation tool that may affect the work of bargaining unit members.',
  'The rapid advancement of AI translation tools (e.g., DeepL, GPT-based translation) poses a direct threat to the employment security and professional identity of translators. CAPE members must be protected against displacement while being equipped to integrate these tools into their professional practice.',
  'must_have', 'counter',
  '2025-07-10', 'system');

-- Joint proposal: Remote work (agreed)
INSERT INTO bargaining_proposals (negotiation_id, proposal_number, title, description, proposal_type, status,
  clause_category, proposed_language,
  union_position, management_position,
  submitted_date, resolved_date, created_by) VALUES
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 'J-001', 'Remote Work for Translation Positions',
  'Joint proposal establishing 4-day remote work for TR positions.',
  'joint_proposal', 'accepted',
  'working_conditions',
  'Article 42 — Telework: For positions classified in the TR sub-group, employees shall be eligible to work remotely for up to four (4) days per week, subject to the employee maintaining a private, secure workspace suitable for handling documents of all classification levels up to Protected B.',
  'accepted', 'accepted',
  '2025-10-20', '2025-11-15', 'system');

-- ============================================================================
-- 16. TENTATIVE AGREEMENTS
-- ============================================================================

INSERT INTO tentative_agreements (
  negotiation_id, agreement_number, title, clause_category,
  agreed_language, previous_language,
  requires_ratification, annual_cost, agreed_date, effective_date,
  union_signed_by, union_signed_date, employer_signed_by, employer_signed_date,
  created_by
) VALUES (
  'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
  'TA-001', 'Remote Work for Translation Positions', 'working_conditions',
  'Article 42 — Telework: For positions classified in the TR sub-group, employees shall be eligible to work remotely for up to four (4) days per week, subject to the employee maintaining a private, secure workspace suitable for handling documents of all classification levels up to Protected B. The Employer shall provide or reimburse reasonable costs for home office equipment necessary for telework (up to $750 one-time allowance, increased from $500).',
  'Article 42 — Subject to operational requirements, the Employer shall not unreasonably deny requests for telework arrangements. Employees in designated telework-eligible positions may work remotely for up to three (3) days per week.',
  true, 450000.00, '2025-11-15', '2025-06-22',
  'Isabelle Roy', '2025-11-15', 'David Prest', '2025-11-15',
  'system'
);

-- ============================================================================
-- 17. NEGOTIATION SESSIONS
-- ============================================================================

INSERT INTO negotiation_sessions (negotiation_id, session_number, session_type, title,
  scheduled_date, actual_start_date, actual_end_date, location, is_virtual,
  summary, next_steps, status, created_by) VALUES
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 1, 'opening', 'Opening Session — Exchange of Proposals',
  '2025-07-10', '2025-07-10 09:00:00-04', '2025-07-10 16:00:00-04',
  'TBS Boardroom, 90 Elgin St, Ottawa', false,
  'Both parties exchanged opening proposals. CAPE presented 12 union demands; Treasury Board presented opening position on 8 items. Key areas of divergence identified: economic increase (4.5% vs 2.2%), AI protections (new article vs no new article), professional development (increase vs status quo).',
  'Parties to review opposing proposals. Next session to focus on non-monetary items. CAPE to provide economic analysis supporting 4.5%.',
  'completed', 'system'),
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 2, 'negotiation', 'Session 2 — Non-Monetary Items',
  '2025-09-15', '2025-09-15 09:30:00-04', '2025-09-15 15:30:00-04',
  'CAPE Offices, 100 Queen St, Ottawa', false,
  'Discussion focused on non-monetary items. Significant progress on telework provisions for TR positions. Both parties agreed in principle on 4-day remote work. Professional development fund discussed — gap narrowed to $2,500 (union) vs $1,500 (employer). AI protection article debated extensively — Employer resistant to job protection guarantees but open to notice period.',
  'Draft joint telework proposal for next session. Employer to provide cost estimates for professional development options. CAPE to refine AI article based on Employer feedback.',
  'completed', 'system'),
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 3, 'negotiation', 'Session 3 — Telework Agreement & AI Discussion',
  '2025-10-20', '2025-10-20 10:00:00-04', '2025-10-20 16:30:00-04',
  'TBS Boardroom, 90 Elgin St, Ottawa', false,
  'Telework provisions for TR positions finalized and signed as TA-001. AI protection article: Employer agreed to 120-day notice period (CAPE requested 180) and mandatory training. Employer still resists job displacement guarantees and mandatory human review clause. Economic increase: No movement — Employer firm at 2.2%, CAPE firm at 4.5%.',
  'Economic mediation may be needed. CAPE to prepare market comparability study. Next session to focus on remaining monetary items and AI article finalization.',
  'completed', 'system'),
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 4, 'negotiation', 'Session 4 — Monetary Items',
  '2026-01-22', '2026-01-22 09:00:00-05', '2026-01-22 17:00:00-05',
  'CAPE Offices, 100 Queen St, Ottawa', false,
  'Extended session on monetary items. CAPE presented private-sector comparability data showing TR salaries lag 12-18% behind equivalent positions. Employer acknowledged the gap but cited fiscal constraints. Employer moved to 2.8% (from 2.2%); CAPE willing to discuss 3.5-4.0% range. Bilingual bonus: Employer moved to $1,000 (from $900). Professional development: tentatively agreed at $2,000.',
  'Potential for mediated resolution on economics. Both parties agreeable to requesting conciliator if no agreement by April 2026.',
  'completed', 'system');

-- Upcoming session
INSERT INTO negotiation_sessions (negotiation_id, session_number, session_type, title,
  scheduled_date, location, is_virtual, status, created_by) VALUES
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 5, 'negotiation', 'Session 5 — Economics & AI Final Package',
  '2026-03-18', 'TBS Boardroom, 90 Elgin St, Ottawa', false,
  'scheduled', 'system');

-- ============================================================================
-- 18. BARGAINING TEAM MEMBERS
-- ============================================================================

INSERT INTO bargaining_team_members (negotiation_id, name, email, role, is_chief, organization, title, expertise, created_at) VALUES
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 'Isabelle Roy', 'i.roy@acep-cape.ca', 'chief_negotiator', true, 'CAPE', 'Director of Negotiations', '["compensation", "collective_bargaining", "federal_labour_law"]'::jsonb, NOW()),
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 'Martin Gagnon', 'm.gagnon@acep-cape.ca', 'committee_member', false, 'CAPE', 'TR Representative — Translation Bureau', '["translation_services", "ai_tools", "language_technology"]'::jsonb, NOW()),
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 'Priya Sharma', 'p.sharma@acep-cape.ca', 'researcher', false, 'CAPE', 'Research Officer', '["compensation_analysis", "market_comparability", "statistics"]'::jsonb, NOW()),
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 'Jean-François Côté', 'jf.cote@acep-cape.ca', 'legal_counsel', false, 'CAPE', 'Legal Counsel', '["labour_law", "human_rights", "arbitration"]'::jsonb, NOW()),
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 'David Prest', 'd.prest@tbs-sct.gc.ca', 'chief_negotiator', true, 'Treasury Board Secretariat', 'Senior Labour Relations Advisor', '["federal_negotiations", "costing", "pay_policy"]'::jsonb, NOW()),
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 'Karen Armstrong', 'k.armstrong@tbs-sct.gc.ca', 'committee_member', false, 'Treasury Board Secretariat', 'HR Policy Analyst', '["telework_policy", "benefits_administration"]'::jsonb, NOW());

-- ============================================================================
-- 19. BARGAINING NOTES
-- ============================================================================

INSERT INTO bargaining_notes (cba_id, organization_id, session_date, session_type, session_number,
  title, content, attendees, tags, confidentiality_level, key_insights, created_by) VALUES
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'c09173ad-5ba4-498e-a483-b371fb5e248e',
  '2025-07-10', 'negotiation', 1,
  'Opening Session — Strategy Notes',
  'Key observations from the opening session:

1. Treasury Board team appears to have a tight mandate — DM-level approval required for any movement above 2.5% economic increase. This suggests room for movement but within a narrow band (2.5-3.0%).

2. On AI protections: TB counsel seemed genuinely interested in the notice period concept but pushed back hard on job displacement guarantees. Possible compromise: strong notice period (120-150 days) + retraining fund, but accept "best efforts" instead of absolute job guarantees.

3. Telework: Early win possible here. TB team indicated flexibility for translation positions specifically, given the nature of the work. Push for 4-day remote as starting position.

4. Bilingual bonus: TB acknowledged the $800 amount has not changed since 2005. Movement here is likely.

5. Professional development: Both teams agree in principle. Gap is manageable ($1,500 vs $2,500).

STRATEGIC PRIORITY: Secure quick wins on telework and professional development to build momentum. Save economics and AI for later rounds where conciliation pressure may help.',
  '[{"name": "Isabelle Roy", "role": "Chief Negotiator", "organization": "CAPE"},
    {"name": "Martin Gagnon", "role": "TR Representative", "organization": "CAPE"},
    {"name": "Priya Sharma", "role": "Research Officer", "organization": "CAPE"},
    {"name": "Jean-François Côté", "role": "Legal Counsel", "organization": "CAPE"}]'::jsonb,
  '["strategy", "opening_session", "mandate_assessment"]'::jsonb,
  'confidential',
  '["TB mandate appears capped around 2.5-3.0%", "AI notice period concept has traction", "Telework is early win opportunity", "Bilingual bonus increase likely ($900-$1,000 range)"]'::jsonb,
  'system'
),
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'c09173ad-5ba4-498e-a483-b371fb5e248e',
  '2026-01-22', 'negotiation', 4,
  'Session 4 Debrief — Monetary Analysis',
  'Critical session. Employer moved from 2.2% to 2.8% — significant movement suggesting flexibility. CAPE signaled willingness to discuss 3.5-4.0% range.

Market data presented was effective — TB team requested copies of all comparability studies. The TR salary gap data (12-18% lag vs private sector) visibly impacted their position.

Bilingual bonus: $1,000 offered (from $900). Acceptable if economic package is strong.

Professional development: $2,000 tentatively agreed — good middle ground.

NEXT STEPS: Prepare comprehensive costing of a 3.2-3.5% economic package to present at Session 5. Include productivity gains from AI tools as offsetting cost argument. Request conciliation if no movement by April 2026.',
  '[{"name": "Isabelle Roy", "role": "Chief Negotiator", "organization": "CAPE"},
    {"name": "Priya Sharma", "role": "Research Officer", "organization": "CAPE"}]'::jsonb,
  '["monetary", "session_4_debrief", "economic_analysis"]'::jsonb,
  'confidential',
  '["Employer moved to 2.8% from 2.2% — significant gap closure", "Market data driving TB reconsideration", "3.2-3.5% range may be achievable", "Conciliation threat as leverage point"]'::jsonb,
  'system'
);

-- ============================================================================
-- 20. SHARED CLAUSE LIBRARY (BENCHMARK CLAUSES)
-- ============================================================================

INSERT INTO shared_clause_library (source_organization_id, clause_title, clause_text, clause_type,
  sharing_level, sector, province, created_by) VALUES
('c09173ad-5ba4-498e-a483-b371fb5e248e',
  'AI Impact Protection — Model Clause',
  'No employee shall be laid off, reclassified to a lower level, or have their hours of work involuntarily reduced as a direct result of the introduction of artificial intelligence, machine learning, or automated decision-making tools. The Employer shall provide a minimum of [120/150/180] calendar days notice before introducing any such technology that may materially affect the duties, responsibilities, or conditions of employment of bargaining unit members. Employees whose positions are affected shall be offered retraining opportunities with full pay.',
  'technological_change', 'congress', 'public', NULL, 'system'),
('c09173ad-5ba4-498e-a483-b371fb5e248e',
  'Enhanced Mental Health Coverage — Model Clause',
  'Effective [date], the Employer shall provide mental health coverage under the health care plan of not less than $5,000 per calendar year per eligible family member, covering services provided by registered psychologists, licensed clinical counsellors, registered social workers, and certified psychiatric nurses. No prior approval or GP referral shall be required.',
  'benefits_insurance', 'congress', 'public', NULL, 'system'),
('873cf59b-cef5-4d51-9a62-151512810449',
  'Telework — 4-Day Remote for Knowledge Workers',
  'Employees in positions designated as telework-eligible may work remotely for up to four (4) days per week, subject to maintaining a secure and private home workspace. The Employer shall provide a one-time home office allowance of [$500/$750] and ongoing reimbursement for internet and related costs of [$50] per month.',
  'working_conditions', 'public', 'public', NULL, 'system');

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT '--- CBA SEED DATA VERIFICATION ---' AS info;
SELECT 'Collective agreements: ' || count(*) FROM collective_agreements;
SELECT 'CBA clauses: ' || count(*) FROM cba_clauses;
SELECT 'CBA contacts: ' || count(*) FROM cba_contacts;
SELECT 'CBA version history: ' || count(*) FROM cba_version_history;
SELECT 'Wage progressions: ' || count(*) FROM wage_progressions;
SELECT 'Benefit comparisons: ' || count(*) FROM benefit_comparisons;
SELECT 'Arbitration decisions: ' || count(*) FROM arbitration_decisions;
SELECT 'Arbitrator profiles: ' || count(*) FROM arbitrator_profiles;
SELECT 'Grievances: ' || count(*) FROM grievances;
SELECT 'Grievance responses: ' || count(*) FROM grievance_responses;
SELECT 'Grievance timeline: ' || count(*) FROM grievance_timeline;
SELECT 'Settlements: ' || count(*) FROM settlements;
SELECT 'Arbitrations (proceedings): ' || count(*) FROM arbitrations;
SELECT 'Negotiations: ' || count(*) FROM negotiations;
SELECT 'Bargaining proposals: ' || count(*) FROM bargaining_proposals;
SELECT 'Tentative agreements: ' || count(*) FROM tentative_agreements;
SELECT 'Negotiation sessions: ' || count(*) FROM negotiation_sessions;
SELECT 'Bargaining team members: ' || count(*) FROM bargaining_team_members;
SELECT 'Bargaining notes: ' || count(*) FROM bargaining_notes;
SELECT 'Shared clause library: ' || count(*) FROM shared_clause_library;
