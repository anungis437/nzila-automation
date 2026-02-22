-- Migration 0056: Add Missing FK Constraints for Training/Certification
-- Adds FK constraints for course_registrations, member_certifications, and program_enrollments
-- These tables' member_id columns now reference public.users.user_id (varchar)

BEGIN;

-- =============================================================================
-- Add FK constraints for training/certification tables
-- =============================================================================

-- Course registrations: member_id references users table
ALTER TABLE course_registrations
  ADD CONSTRAINT course_registrations_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES public.users(user_id)
  ON DELETE CASCADE;

-- Member certifications: member_id and verified_by reference users table
ALTER TABLE member_certifications
  ADD CONSTRAINT member_certifications_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES public.users(user_id)
  ON DELETE CASCADE;

ALTER TABLE member_certifications
  ADD CONSTRAINT member_certifications_verified_by_fkey
  FOREIGN KEY (verified_by) REFERENCES public.users(user_id)
  ON DELETE SET NULL;

-- Program enrollments: member_id references users table
ALTER TABLE program_enrollments
  ADD CONSTRAINT program_enrollments_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES public.users(user_id)
  ON DELETE CASCADE;

COMMIT;

-- =============================================================================
-- Migration complete!
-- All training/certification member relationships now enforced via FK
-- =============================================================================
