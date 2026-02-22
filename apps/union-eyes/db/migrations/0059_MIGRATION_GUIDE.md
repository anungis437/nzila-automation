# Migration 0059: Convert Remaining User ID Columns - Execution Guide

**Migration Date:** 2026-02-08  
**Status:** ⚠️ READY FOR EXECUTION  
**Estimated Duration:** 5-10 minutes  
**Risk Level:** MEDIUM (reversible with rollback script)

---

## Overview

This migration completes the Clerk user ID alignment started in migration 0055. It converts **52+ remaining UUID user ID columns to VARCHAR(255)** across **40+ tables** that were not included in the initial migration.

### Affected Modules

- ✅ Per-Capita Remittances (CLC)
- ✅ Communication Analytics
- ✅ ERP Integration (Financial Audit, Connectors, Journal Entries)
- ✅ Deadlines Management
- ✅ Reports & Reporting
- ✅ Recognition & Rewards
- ✅ Collective Bargaining
- ✅ Education & Training (additional columns)
- ✅ Organizing & Politics
- ✅ Pension & Benefits
- ✅ Voting & Governance

---

## Prerequisites

### 1. Database Backup

```bash
# Create full database backup before proceeding
pg_dump -h unioneyes-staging-db.postgres.database.azure.com \
  -U unionadmin \
  -d unioneyes \
  -F c \
  -f backup_before_migration_0059_$(date +%Y%m%d_%H%M%S).dump
```

### 2. Maintenance Window

- **Recommended:** 15-minute maintenance window
- **Required:** Application shutdown during migration
- **Reason:** Prevent concurrent writes during schema changes

### 3. Testing

- ✅ Migration tested on development environment
- ⏳ Ready for staging execution
- ⏳ Production deployment pending staging success

---

## Pre-Migration Checklist

- [ ] Full database backup completed and verified
- [ ] Application instances shut down (all environments)
- [ ] Migration script reviewed and approved
- [ ] Rollback script available (see below)
- [ ] Team notified of maintenance window
- [ ] Monitoring dashboard open

---

## Execution Steps

### Step 1: Verify Current State

Check how many UUID columns still exist:

```sql
SELECT COUNT(*) as uuid_user_columns
FROM information_schema.columns
WHERE column_name IN (
  'user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by',
  'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
  'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by'
) AND data_type = 'uuid';
```

**Expected Result:** 52 rows

### Step 2: Execute Migration

```bash
# Set password securely
export PGPASSWORD='UnionEyes2026!Staging'

# Execute migration script
psql -h unioneyes-staging-db.postgres.database.azure.com \
  -U unionadmin \
  -d unioneyes \
  -p 5432 \
  -f db/migrations/0059_convert_remaining_user_ids.sql
```

### Step 3: Verify Completion

```sql
-- Should return 0 for UUID columns after migration
SELECT COUNT(*) as remaining_uuid_columns
FROM information_schema.columns
WHERE column_name IN (
  'user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by',
  'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
  'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by'
) AND data_type = 'uuid';

-- Should show 52+ varchar(255) columns
SELECT COUNT(*) as converted_columns
FROM information_schema.columns
WHERE column_name IN (
  'user_id', 'created_by', 'updated_by', 'approved_by', 'rejected_by',
  'approver_user_id', 'completed_by', 'escalated_to', 'requested_by',
  'recipient_id', 'executed_by', 'shared_by', 'shared_with', 'reconciled_by'
) AND data_type = 'character varying'
  AND character_maximum_length = 255;
```

### Step 4: Verify Foreign Keys

```sql
-- Check that FK constraints were recreated
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users'
  AND ccu.column_name = 'user_id'
ORDER BY tc.table_name;
```

### Step 5: Test Data Integrity

```sql
-- Verify no NULL values were introduced
SELECT 
  'per_capita_remittances' as table_name,
  COUNT(*) as total_rows,
  COUNT(created_by) as non_null_created_by
FROM per_capita_remittances
UNION ALL
SELECT 
  'reports' as table_name,
  COUNT(*) as total_rows,
  COUNT(created_by) as non_null_created_by
FROM reports
UNION ALL
SELECT 
  'deadlines' as table_name,
  COUNT(*) as total_rows,
  COUNT(completed_by) as non_null_completed_by
FROM deadlines;
```

---

## Post-Migration Tasks

### 1. Push Drizzle Schema

```bash
# Push updated schema to match database
pnpm drizzle-kit push
```

### 2. Restart Application

```bash
# Start application instances
# Verify authentication flow works correctly
```

### 3. Smoke Tests

- [ ] User login successful
- [ ] Create new report (tests reports.created_by)
- [ ] Create deadline (tests deadlines.completed_by)
- [ ] View CLC remittances (tests per_capita_remittances fields)
- [ ] Check audit logs (tests financial_audit_log.user_id)

### 4. Monitor for Issues

Check for:

- Foreign key constraint violations
- Authentication failures
- Type mismatch errors in application logs

---

## Rollback Procedure

If issues occur, execute this rollback script:

```sql
BEGIN;

-- Rollback: Convert varchar(255) back to UUID
-- WARNING: This will fail if any non-UUID values exist in these columns

-- Per-Capita Remittances
ALTER TABLE per_capita_remittances 
  ALTER COLUMN approved_by TYPE uuid USING approved_by::uuid,
  ALTER COLUMN rejected_by TYPE uuid USING rejected_by::uuid,
  ALTER COLUMN created_by TYPE uuid USING created_by::uuid;

ALTER TABLE remittance_approvals 
  ALTER COLUMN approver_user_id TYPE uuid USING approver_user_id::uuid;

-- Communication Analytics
ALTER TABLE user_engagement_scores 
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

ALTER TABLE communication_preferences 
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- ERP Integration
ALTER TABLE financial_audit_log 
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

ALTER TABLE erp_connectors 
  ALTER COLUMN created_by TYPE uuid USING created_by::uuid,
  ALTER COLUMN updated_by TYPE uuid USING updated_by::uuid;

ALTER TABLE gl_mappings 
  ALTER COLUMN created_by TYPE uuid USING created_by::uuid,
  ALTER COLUMN updated_by TYPE uuid USING updated_by::uuid;

ALTER TABLE journal_entries 
  ALTER COLUMN created_by TYPE uuid USING created_by::uuid,
  ALTER COLUMN approved_by TYPE uuid USING approved_by::uuid;

ALTER TABLE bank_reconciliations 
  ALTER COLUMN reconciled_by TYPE uuid USING reconciled_by::uuid,
  ALTER COLUMN approved_by TYPE uuid USING approved_by::uuid;

-- Deadlines
ALTER TABLE deadlines 
  ALTER COLUMN completed_by TYPE uuid USING completed_by::uuid,
  ALTER COLUMN escalated_to TYPE uuid USING escalated_to::uuid;

ALTER TABLE deadline_extensions 
  ALTER COLUMN requested_by TYPE uuid USING requested_by::uuid,
  ALTER COLUMN approved_by TYPE uuid USING approved_by::uuid;

ALTER TABLE deadline_alerts 
  ALTER COLUMN recipient_id TYPE uuid USING recipient_id::uuid;

-- Reports
ALTER TABLE reports 
  ALTER COLUMN created_by TYPE uuid USING created_by::uuid,
  ALTER COLUMN updated_by TYPE uuid USING updated_by::uuid;

ALTER TABLE report_templates 
  ALTER COLUMN created_by TYPE uuid USING created_by::uuid;

ALTER TABLE report_executions 
  ALTER COLUMN executed_by TYPE uuid USING executed_by::uuid;

ALTER TABLE scheduled_reports 
  ALTER COLUMN created_by TYPE uuid USING created_by::uuid;

ALTER TABLE report_shares 
  ALTER COLUMN shared_by TYPE uuid USING shared_by::uuid,
  ALTER COLUMN shared_with TYPE uuid USING shared_with::uuid;

-- Recognition & Rewards
ALTER TABLE automation_rules 
  ALTER COLUMN created_by TYPE uuid USING created_by::uuid;

-- (Add additional rollback statements for other tables as needed)

COMMIT;
```

**⚠️ Note:** Rollback will fail if any Clerk-format user IDs ("user_xxxxx") have been written to these columns.

---

## Success Criteria

✅ Migration completes without errors  
✅ All UUID columns converted to VARCHAR(255)  
✅ Foreign key constraints recreated  
✅ Application starts successfully  
✅ User authentication works  
✅ Smoke tests pass  
✅ No constraint violations in logs  

---

## Tables Converted (52 columns across 40+ tables)

### Core Schema Updates

- **per_capita_remittances** (3 columns): approved_by, rejected_by, created_by
- **remittance_approvals** (1 column): approver_user_id
- **organization_contacts** (1 column): user_id
- **user_engagement_scores** (1 column): user_id
- **communication_preferences** (1 column): user_id
- **financial_audit_log** (1 column): user_id
- **erp_connectors** (2 columns): created_by, updated_by
- **gl_mappings** (2 columns): created_by, updated_by
- **journal_entries** (2 columns): created_by, approved_by
- **bank_reconciliations** (2 columns): reconciled_by, approved_by
- **deadlines** (2 columns): completed_by, escalated_to
- **deadline_extensions** (2 columns): requested_by, approved_by
- **deadline_alerts** (1 column): recipient_id
- **reports** (2 columns): created_by, updated_by
- **report_templates** (1 column): created_by
- **report_executions** (1 column): executed_by
- **scheduled_reports** (1 column): created_by
- **report_shares** (2 columns): shared_by, shared_with
- **automation_rules** (1 column): created_by

### Additional Tables (30+ tables)

All `created_by`, `approved_by`, or `recipient_id` columns converted in:

- arbitration_precedents
- bargaining_notes
- cba_footnotes, cba_version_history
- certification_applications
- clause_comparisons, clause_library_tags
- collective_agreements
- course_registrations, course_sessions
- equity_snapshots
- hw_benefit_plans
- jurisdiction_rules
- organization_relationships, organizations
- organizing_activities, organizing_campaigns, organizing_contacts
- pay_equity_complaints
- pension_actuarial_valuations, pension_benefit_claims, pension_plans, pension_trustee_meetings
- political_activities, political_campaigns
- precedent_citations
- shared_clause_library
- signature_workflows
- tax_slips
- training_courses, training_programs
- transaction_clc_mappings
- trusted_certificate_authorities
- voting_auditors, voting_notifications, voting_sessions

---

## Support & Escalation

**During Migration:**

- Primary Contact: Database Administrator
- Backup Contact: DevOps Lead
- Escalation: CTO

**Issue Resolution:**

- Slack Channel: #infrastructure-alerts
- Emergency Hotline: [REDACTED]

---

## References

- **Related Migrations:**
  - Migration 0055: Initial Clerk user ID alignment (16 columns)
  - This migration (0059): Remaining user ID columns (52+ columns)
  
- **Documentation:**
  - [P0_FIXES_IMPLEMENTATION_SUMMARY.md](../P0_FIXES_IMPLEMENTATION_SUMMARY.md)
  - [FINAL_ASSESSMENT_VALIDATION.md](../FINAL_ASSESSMENT_VALIDATION.md)

- **Clerk Documentation:**
  - User ID format: `user_xxxxxxxxxxxxxxxxxxxxx` (28 characters)
  - Always starts with `user_` prefix

---

**Migration prepared by:** GitHub Copilot  
**Review required by:** Database Administrator, Tech Lead  
**Approval required by:** CTO
