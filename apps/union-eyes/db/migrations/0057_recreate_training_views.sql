-- Migration 0057: Recreate Training/Certification Views
-- Recreates views dropped in migration 0055, updated for varchar(255) user IDs

BEGIN;

-- =============================================================================
-- View 1: Member Training Transcript
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
-- View 2: Member Education Summary
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
-- View 3: Member Certification Status
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
-- View 4: Member Course History
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
-- View 5: Training Analytics
-- High-level analytics across all training activities
-- =============================================================================

CREATE OR REPLACE VIEW v_training_analytics AS
SELECT 
  cr.organization_id,
  COUNT(DISTINCT cr.member_id) AS total_learners,
  COUNT(DISTINCT cr.course_id) AS unique_courses,
  COUNT(*) AS total_registrations,
  COUNT(CASE WHEN cr.completed = true THEN 1 END) AS completed_registrations,
  COUNT(CASE WHEN cr.registration_status = 'registered' AND cr.completed = false THEN 1 END) AS active_registrations,
  COUNT(CASE WHEN cr.cancellation_date IS NOT NULL THEN 1 END) AS dropped_registrations,
  AVG(cr.completion_percentage) AS avg_completion_rate,
  AVG(cr.post_test_score) AS avg_final_score,
  COUNT(CASE WHEN cr.certificate_issued = true THEN 1 END) AS certificates_issued,
  DATE_TRUNC('month', cr.registration_date) AS enrollment_month
FROM course_registrations cr
WHERE cr.registration_date >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY cr.organization_id, DATE_TRUNC('month', cr.registration_date)
ORDER BY cr.organization_id, enrollment_month DESC;

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
-- View 8: Course Session Dashboard
-- Overview of course sessions and participant progress
-- =============================================================================

CREATE OR REPLACE VIEW v_course_session_dashboard AS
SELECT 
  cr.course_id,
  cr.organization_id,
  COUNT(DISTINCT cr.member_id) AS enrolled_members,
  COUNT(CASE WHEN cr.completed = true THEN 1 END) AS completed_count,
  COUNT(CASE WHEN cr.registration_status = 'registered' AND cr.completed = false THEN 1 END) AS in_progress_count,
  COUNT(CASE WHEN cr.registration_status = 'registered' AND cr.completion_percentage = 0 THEN 1 END) AS not_started_count,
  COUNT(CASE WHEN cr.cancellation_date IS NOT NULL THEN 1 END) AS dropped_count,
  ROUND(AVG(cr.completion_percentage), 2) AS avg_completion_percentage,
  ROUND(AVG(cr.post_test_score), 2) AS avg_score,
  MIN(cr.registration_date) AS first_enrollment,
  MAX(cr.registration_date) AS last_enrollment,
  COUNT(CASE WHEN cr.certificate_issued = true THEN 1 END) AS certificates_issued
FROM course_registrations cr
GROUP BY cr.course_id, cr.organization_id;

-- =============================================================================
-- View 9: Training Program Progress
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

COMMIT;

-- =============================================================================
-- All 9 views recreated successfully with varchar(255) user ID support
-- =============================================================================
