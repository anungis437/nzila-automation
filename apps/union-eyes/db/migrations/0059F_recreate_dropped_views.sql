-- Migration 0059F: Recreate Views Dropped During User ID Conversion
-- Date: 2026-02-08
-- Recreates 9 views that were dropped during migration 0059E

BEGIN;

-- =============================================================================
-- View 1: Critical Deadlines
-- Overdue and near-term deadlines from claim_deadlines table
-- =============================================================================

CREATE OR REPLACE VIEW v_critical_deadlines AS
SELECT 
  cd.*,
  c.claim_number,
  c.claim_type,
  c.status as claim_status,
  c.priority as claim_priority,
  c.assigned_to as assigned_to_id,
  CASE 
    WHEN cd.is_overdue THEN 'overdue'
    WHEN cd.days_until_due = 0 THEN 'due_today'
    WHEN cd.days_until_due <= 3 THEN 'due_soon'
    ELSE 'upcoming'
  END as urgency_status
FROM claim_deadlines cd
JOIN claims c ON cd.claim_id = c.claim_id
WHERE cd.status = 'pending'
  AND cd.due_date <= CURRENT_DATE + INTERVAL '3 days'
ORDER BY cd.due_date, cd.priority DESC;

-- =============================================================================
-- View 2: Member Training Transcript
-- Comprehensive view of all training activities per member
-- =============================================================================

CREATE OR REPLACE VIEW v_member_training_transcript AS
SELECT 
  cr.member_id,
  u.first_name,
  u.last_name,
  u.email,
  cr.id AS registration_id,
  cr.course_id,
  cr.registration_status,
  cr.registration_date,
  cr.completion_date,
  cr.completion_percentage,
  cr.post_test_score AS final_score,
  cr.certificate_issue_date,
  pe.program_id,
  pe.enrollment_status,
  pe.enrollment_date AS program_start_date,
  pe.completion_date AS program_completion_date,
  mc.id AS certification_id,
  mc.certification_name,
  mc.issue_date AS cert_issue_date,
  mc.expiry_date AS cert_expiry_date,
  mc.certification_status AS cert_status,
  mc.verified_by,
  verifier.email AS verified_by_email
FROM public.users u
LEFT JOIN course_registrations cr ON u.user_id = cr.member_id
LEFT JOIN program_enrollments pe ON u.user_id = pe.member_id
LEFT JOIN member_certifications mc ON u.user_id = mc.member_id
LEFT JOIN public.users verifier ON mc.verified_by = verifier.user_id
WHERE u.is_active = true
ORDER BY u.user_id, cr.registration_date DESC;

-- =============================================================================
-- View 3: Member Education Summary
-- Aggregated education/training statistics per member
-- =============================================================================

CREATE OR REPLACE VIEW v_member_education_summary AS
SELECT 
  u.user_id AS member_id,
  u.first_name,
  u.last_name,
  u.email,
  COUNT(DISTINCT cr.course_id) AS total_courses,
  COUNT(DISTINCT CASE WHEN cr.completed = true THEN cr.course_id END) AS completed_courses,
  COUNT(DISTINCT CASE WHEN cr.registration_status = 'registered' AND cr.completed = false THEN cr.course_id END) AS active_courses,
  COUNT(DISTINCT pe.program_id) AS total_programs,
  COUNT(DISTINCT CASE WHEN pe.completed = true THEN pe.program_id END) AS completed_programs,
  COUNT(DISTINCT mc.id) AS total_certifications,
  COUNT(DISTINCT CASE WHEN mc.certification_status = 'active' AND (mc.expiry_date IS NULL OR mc.expiry_date > CURRENT_DATE) THEN mc.id END) AS active_certifications,
  AVG(cr.post_test_score) AS avg_course_score,
  MAX(cr.completion_date) AS last_course_completion,
  MAX(pe.completion_date) AS last_program_completion
FROM public.users u
LEFT JOIN course_registrations cr ON u.user_id = cr.member_id
LEFT JOIN program_enrollments pe ON u.user_id = pe.member_id
LEFT JOIN member_certifications mc ON u.user_id = mc.member_id
WHERE u.is_active = true
GROUP BY u.user_id, u.first_name, u.last_name, u.email;

-- =============================================================================
-- View 4: Member Certification Status
-- Current certification status with expiry tracking
-- =============================================================================

CREATE OR REPLACE VIEW v_member_certification_status AS
SELECT 
  mc.member_id,
  u.first_name,
  u.last_name,
  u.email,
  mc.id AS certification_id,
  mc.certification_name,
  mc.certification_status AS cert_status,
  mc.issue_date,
  mc.expiry_date,
  CASE 
    WHEN mc.expiry_date IS NULL THEN 'no_expiry'
    WHEN mc.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN mc.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    WHEN mc.expiry_date < CURRENT_DATE + INTERVAL '90 days' THEN 'expiring_warning'
    ELSE 'valid'
  END AS expiry_status,
  CASE 
    WHEN mc.expiry_date IS NOT NULL THEN mc.expiry_date - CURRENT_DATE
    ELSE NULL
  END AS days_until_expiry,
  mc.verified_by,
  verifier.email AS verified_by_email,
  mc.organization_id
FROM member_certifications mc
JOIN public.users u ON mc.member_id = u.user_id
LEFT JOIN public.users verifier ON mc.verified_by = verifier.user_id
WHERE u.is_active = true;

-- =============================================================================
-- View 5: Member Course History
-- Detailed course enrollment and completion history
-- =============================================================================

CREATE OR REPLACE VIEW v_member_course_history AS
SELECT 
  cr.member_id,
  u.first_name,
  u.last_name,
  u.email,
  cr.id AS registration_id,
  cr.course_id,
  cr.registration_status,
  cr.registration_date,
  cr.completion_date,
  cr.completion_percentage,
  cr.post_test_score AS final_score,
  cr.certificate_issue_date,
  cr.organization_id,
  CASE 
    WHEN cr.completion_date IS NOT NULL THEN DATE_PART('day', cr.completion_date - cr.registration_date)
    WHEN cr.registration_date IS NOT NULL THEN DATE_PART('day', CURRENT_TIMESTAMP - cr.registration_date)
    ELSE NULL
  END AS duration_days
FROM course_registrations cr
JOIN public.users u ON cr.member_id = u.user_id
WHERE u.is_active = true
ORDER BY cr.registration_date DESC;

-- =============================================================================
-- View 6: Member Skills
-- Aggregated skills derived from certifications and courses
-- =============================================================================

CREATE OR REPLACE VIEW v_member_skills AS
SELECT 
  u.user_id AS member_id,
  u.first_name,
  u.last_name,
  u.email,
  mc.certification_name,
  mc.certification_status AS cert_status,
  mc.issue_date,
  mc.expiry_date,
  COUNT(DISTINCT cr.course_id) AS related_courses_completed,
  mc.organization_id
FROM public.users u
LEFT JOIN member_certifications mc ON u.user_id = mc.member_id
LEFT JOIN course_registrations cr ON u.user_id = cr.member_id AND cr.completed = true
WHERE u.is_active = true
GROUP BY u.user_id, u.first_name, u.last_name, u.email, mc.certification_name, mc.certification_status, mc.issue_date, mc.expiry_date, mc.organization_id;

-- =============================================================================
-- View 7: Certification Expiry Tracking
-- Specialized view for managing certification renewals
-- =============================================================================

CREATE OR REPLACE VIEW v_certification_expiry_tracking AS
SELECT 
  mc.member_id,
  u.first_name,
  u.last_name,
  u.email,
  mc.id AS certification_id,
  mc.certification_name,
  mc.issue_date,
  mc.expiry_date,
  CASE 
    WHEN mc.expiry_date IS NULL THEN 99999
    ELSE mc.expiry_date - CURRENT_DATE
  END AS days_until_expiry,
  CASE 
    WHEN mc.expiry_date IS NULL THEN 'no_expiry'
    WHEN mc.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN mc.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'critical'
    WHEN mc.expiry_date < CURRENT_DATE + INTERVAL '90 days' THEN 'warning'
    ELSE 'valid'
  END AS urgency_level,
  mc.verified_by,
  verifier.email AS verified_by_email,
  mc.organization_id
FROM member_certifications mc
JOIN public.users u ON mc.member_id = u.user_id
LEFT JOIN public.users verifier ON mc.verified_by = verifier.user_id
WHERE mc.certification_status = 'active' AND u.is_active = true
ORDER BY days_until_expiry ASC;

-- =============================================================================
-- View 8: Training Program Progress
-- Program-level tracking of member progress and completions
-- =============================================================================

CREATE OR REPLACE VIEW v_training_program_progress AS
SELECT 
  pe.program_id,
  pe.member_id,
  u.first_name,
  u.last_name,
  u.email,
  pe.enrollment_status,
  pe.enrollment_date,
  pe.expected_completion_date,
  pe.completion_date,
  pe.organization_id,
  pe.progress_percentage,
  COUNT(DISTINCT cr.course_id) AS courses_enrolled,
  COUNT(CASE WHEN cr.completed = true THEN 1 END) AS courses_completed,
  AVG(cr.post_test_score) AS avg_course_score
FROM program_enrollments pe
JOIN public.users u ON pe.member_id = u.user_id
LEFT JOIN course_registrations cr ON pe.member_id = cr.member_id
WHERE u.is_active = true
GROUP BY pe.program_id, pe.member_id, u.first_name, u.last_name, u.email, 
         pe.enrollment_status, pe.enrollment_date, pe.expected_completion_date, 
         pe.completion_date, pe.organization_id, pe.progress_percentage;

-- =============================================================================
-- View 9: Pension Funding Summary
-- Pension plan funding status and metrics
-- =============================================================================

CREATE OR REPLACE VIEW v_pension_funding_summary AS
SELECT 
  pp.id as plan_id,
  pp.organization_id,
  pp.plan_name,
  pp.plan_type,
  pp.is_multi_employer,
  pp.current_assets,
  pp.current_liabilities,
  pp.funded_ratio,
  pav.going_concern_funded_ratio as latest_gc_funded_ratio,
  pav.solvency_funded_ratio as latest_solvency_funded_ratio,
  pav.valuation_date as latest_valuation_date,
  pav.created_by,
  COUNT(DISTINCT phb.member_id) as total_active_members,
  SUM(phb.pensionable_hours) as total_pensionable_hours,
  COUNT(DISTINCT pbc.id) as total_benefit_claims,
  SUM(CASE WHEN pbc.claim_status = 'approved' THEN pbc.annual_benefit_amount ELSE 0 END) as total_annual_benefits_approved
FROM pension_plans pp
LEFT JOIN pension_hours_banks phb ON pp.id = phb.pension_plan_id
LEFT JOIN pension_benefit_claims pbc ON pp.id = pbc.pension_plan_id
LEFT JOIN LATERAL (
  SELECT * FROM pension_actuarial_valuations pav2
  WHERE pav2.pension_plan_id = pp.id
  ORDER BY pav2.valuation_date DESC
  LIMIT 1
) pav ON true
GROUP BY 
  pp.id, pp.organization_id, pp.plan_name, pp.plan_type, pp.is_multi_employer,
  pp.current_assets, pp.current_liabilities, pp.funded_ratio,
  pav.going_concern_funded_ratio, pav.solvency_funded_ratio, pav.valuation_date, pav.created_by;

COMMIT;

-- =============================================================================
-- All 9 views recreated successfully
-- =============================================================================
