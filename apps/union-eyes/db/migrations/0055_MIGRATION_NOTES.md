# Migration 0055: Clerk User ID Alignment - Migration Notes

## Status: ⚠️ REQUIRES MANUAL EXECUTION

This migration cannot be fully automated due to database dependencies (RLS policies, views, and foreign keys).

## What This Migration Does

Converts user identifier columns from `uuid` to `varchar(255)` to align with Clerk's string-based user IDs:

- `claims.member_id`
- `course_registrations.member_id`
- `member_certifications.member_id`
- `program_enrollments.member_id`
- `tenant_management.tenant_configurations.updated_by`
- Grievance tables (if they exist)
- Traditional knowledge registry (if exists)

## Prerequisites

1. **Database Backup**: Full backup completed and verified
2. **Maintenance Window**: 30-60 minutes downtime scheduled  
3. **Application Shutdown**: All app instances stopped to prevent concurrent writes
4. **Testing**: Migration tested on staging/dev environment first

## Dependencies Discovered

The following database objects depend on these columns and must be handled:

### Views

- `v_member_training_transcript` - depends on course_registrations.member_id
- (Others may exist - run discovery query below)

### RLS Policies

- `select_course_registrations`
- `select_member_certifications`
- `manage_member_certifications`
- (Others may exist - run discovery query below)

### Foreign Keys

- `fk_claims_member` → user_management.users(user_id)
- `course_registrations_member_id_fkey` → members(id)
- `member_certifications_member_id_fkey` → members(id)
- `program_enrollments_member_id_fkey` → members(id)

## Manual Migration Steps

### Step 1: Discovery

Run these queries to discover all dependencies:

```sql
-- Find all views that reference the columns
SELECT DISTINCT view_schema, view_name
FROM information_schema.view_column_usage
WHERE column_name IN ('member_id', 'updated_by')
  AND table_schema NOT IN ('pg_catalog', 'information_schema');

-- Find all RLS policies on affected tables
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('claims', 'course_registrations', 'member_certifications', 'program_enrollments')
ORDER BY tablename, policyname;

-- Find all FK constraints
SELECT conname, conrelid::regclass AS table_name, confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE contype = 'f'
  AND (conrelid::regclass::text IN ('claims', 'course_registrations', 'member_certifications', 'program_enrollments')
       OR confrelid::regclass::text IN ('claims', 'course_registrations', 'member_certifications', 'program_enrollments'));
```

### Step 2: Save Definitions

```sql
-- Save view definitions
SELECT table_name, view_definition
FROM information_schema.views
WHERE table_name IN (SELECT DISTINCT view_name FROM information_schema.view_column_usage
                     WHERE column_name IN ('member_id', 'updated_by'));

-- Save RLS policy definitions
SELECT schemaname, tablename, policyname, policydef
FROM pg_policies
WHERE tablename IN ('claims', 'course_registrations', 'member_certifications', 'program_enrollments');
```

### Step 3: Drop Dependencies

```sql
BEGIN;

-- Drop views (example - adjust based on discovery)
DROP VIEW IF EXISTS v_member_training_transcript CASCADE;
-- Add more views as discovered

-- Drop RLS policies
DROP POLICY IF EXISTS select_course_registrations ON course_registrations;
DROP POLICY IF EXISTS select_member_certifications ON member_certifications;
DROP POLICY IF EXISTS manage_member_certifications ON member_certifications;
-- Add more policies as discovered

-- Drop FK constraints
ALTER TABLE claims DROP CONSTRAINT IF EXISTS fk_claims_member;
ALTER TABLE course_registrations DROP CONSTRAINT IF EXISTS course_registrations_member_id_fkey;
ALTER TABLE member_certifications DROP CONSTRAINT IF EXISTS member_certifications_member_id_fkey;
ALTER TABLE program_enrollments DROP CONSTRAINT IF EXISTS program_enrollments_member_id_fkey;

COMMIT;
```

### Step 4: Run Column Type Changes

```sql
-- Now run the SQL from 0055_align_user_ids_to_clerk.sql
-- (Only the ALTER TABLE ... ALTER COLUMN sections)
```

### Step 5: Recreate Dependencies

```sql
-- Recreate FK constraints (adjust based on target table column types)
ALTER TABLE claims
  ADD CONSTRAINT fk_claims_member
  FOREIGN KEY (member_id) REFERENCES user_management.users(user_id);

-- Note: Other FKs to 'members' table may need members table conversion first

-- Recreate RLS policies (use saved definitions from Step 2)
-- Recreate views (use saved definitions from Step 2)
```

### Step 6: Validation

```bash
# Run validation script
pnpm tsx scripts/validate-clerk-user-ids.ts

# Expected result: All columns should be varchar(255)
```

### Step 7: Resume Application

1. Start application instances
2. Run smoke tests
3. Monitor error logs for 30 minutes
4. Verify Clerk authentication works
5. Test user-related operations

## Rollback Plan

If issues occur:

1. Stop all app instances immediately
2. Restore from backup (preferred)
3. OR manually revert column types and recreate dependencies

## Testing Checklist

After migration:

- [ ] Clerk authentication works
- [ ] User profile loading works
- [ ] Claims creation/viewing works
- [ ] Training course registrations work
- [ ] Admin operations work
- [ ] RLS policies enforce correctly
- [ ] No unexpected errors in logs

## Estimated Timing

- Discovery & backup: 10 minutes
- Dependency handling: 15-20 minutes
- Column type changes: 5-10 minutes
- Recreate dependencies: 10-15 minutes
- Validation & testing: 10-15 minutes

**Total: 50-70 minutes**

## Contact

If issues arise, contact database administrator or development team lead immediately.
