# Database Schema Analysis - Financial Service

**Date**: Week 12 Testing Phase  
**Purpose**: Document actual database structure vs code expectations

## Executive Summary

After comprehensive database investigation, discovered **significant disconnect** between:

- ✅ **Actual Azure PostgreSQL database schema** (verified via psql)
- ❌ **Drizzle ORM schema** (schema.ts)
- ❌ **Service/Route implementations** (expecting fields that don't exist)
- ❌ **Test suites** (creating data with non-existent fields)

**Impact**: 192 TypeScript errors across 24 files. Tests cannot run. Services may fail at runtime.

**Root Cause**: Feature development added code expecting new database fields, but migrations were never created/applied.

## Database Tables - Actual vs Expected

### ✅ CORRECTLY MATCHED TABLES

#### strike_funds

- **Database**: 28 columns including `current_balance`, `fund_code`, `fund_type`, `strike_status`, `daily_picket_bonus`, etc.
- **Schema**: NOW FIXED ✅ (updated in this session)
- **Status**: Schema matches database

#### organization_members (members)

- **Database**: 21 columns including `name`, `email`, `role`, `status`, `membership_number`, etc.
- **Schema**: NOW FIXED ✅ (added in this session)
- **Alias**: Exported as `members` for backward compatibility
- **Status**: Schema matches database

#### arrears (simple version)

- **Database**: 22 columns including `total_owed`, `arrears_status`, `payment_plan_active`, etc.
- **Schema**: NOW FIXED ✅ (added in this session)
- **Status**: Schema matches database

---

### ⚠️ PARTIALLY MATCHED TABLES

#### dues_transactions

**Database Has (17 columns)**:

```sql
id, tenant_id, member_id, assignment_id, rule_id, 
transaction_type, amount, period_start, period_end, due_date,
status, payment_date, payment_method, payment_reference,
notes, metadata, created_at, updated_at
```

**Code Expects But Don't Exist**:

- ❌ `remittance_id` (used in remittances.ts lines 293, 556, 629)
- ❌ `stripe_payment_intent_id` (used in payment-processing.ts lines 131, 500, 534, 550)
- ❌ `late_fee_amount` (used in arrears-detection.ts line 228)
- ❌ `total_amount` (used in arrears-detection.ts line 215)
- ❌ `paid_date` (used in remittances.ts line 651)

**Schema Errors**:

- References `billingPeriodStart/End` (don't exist) in indexes
- References `paymentStatus` (should be `status`) in indexes

**Impact**: Services fail when trying to insert/query these fields

---

#### stipend_disbursements

**Database Has (18 columns)**:

```sql
id, tenant_id, strike_fund_id, member_id,
week_start_date, week_end_date, hours_worked,
base_stipend_amount, bonus_amount, total_amount,
status, payment_date, payment_method, payment_reference,
approved_by, approved_at, notes, created_at, updated_at
```

**Code Expects But Don't Exist**:

- ❌ `transaction_id` (used in payment-processing.ts lines 200, 280)
- ❌ `days_worked` (used in workflows.test.ts lines 609)
- ❌ `calculated_amount` (used in workflows.test.ts lines 610, 678)
- ❌ `approval_notes` (used in stipend-calculation.ts line 198)
- ❌ `paid_at` (used in stipend-calculation.ts line 245)

**Database Has But Code Doesn't Use**:

- ✅ `base_stipend_amount` (code should use this)
- ✅ `bonus_amount` (code should use this)
- ✅ `total_amount` (code should use this instead of calculated_amount)

**Schema Matches**: ✅ Current Drizzle schema is correct

**Impact**: Tests fail, some service methods fail when expecting different field names

---

#### employer_remittances

**Database Has (20 columns)**:

```sql
id, tenant_id, employer_name, employer_id,
remittance_period_start, remittance_period_end, remittance_date,
total_amount, member_count, file_url, file_hash, status,
reconciliation_status, reconciliation_date, reconciled_by,
variance_amount, variance_reason, notes, metadata,
created_at, updated_at
```

**Code Expects But Don't Exist**:

- ❌ `billing_period_start` (should be `remittance_period_start`)
- ❌ `billing_period_end` (should be `remittance_period_end`)
- ❌ `total_members` (should be `member_count`)
- ❌ `matched_transactions` (doesn't exist - computed value?)
- ❌ `total_variance` (should be `variance_amount`)
- ❌ `processing_status` (should be `status`)

**Status Enum Issues**:

- **Database**: `pending`, `processing`, `reconciled`, `partial`, `discrepancy`
- **Code Expects**: `uploaded`, `matched`, `completed`, `needs_review`, `reconciled`, `variance_detected`
- **Mismatch**: Code uses status values not in database constraint

**Schema Issues**:

- Uses `processingStatus` (wrong)
- Missing `remittanceDate`, `memberCount`, `varianceAmount` fields
- Wrong field names throughout

**Impact**: remittances.ts has 32 errors, reconciliation completely broken

---

#### picket_attendance

**Database Has (23 columns)**:

```sql
id, tenant_id, strike_fund_id, member_id,
check_in_time, check_out_time,
check_in_latitude, check_in_longitude, check_out_latitude, check_out_longitude,
location_verified, check_in_method, nfc_tag_uid, qr_code_data,
device_id, duration_minutes, hours_worked,
coordinator_override, override_reason, verified_by,
notes, created_at, updated_at
```

**Code/Tests Expect But Don't Exist**:

- ❌ `date` (should be `check_in_time`)
- ❌ `approved` (not a database field)

**Required Fields Missing in Tests**:

- ❌ `strike_fund_id` (REQUIRED NOT NULL in DB)
- ❌ `check_in_method` (needed for attendance)

**Schema Status**: Partially correct, has most fields

**Impact**: Tests fail with missing required fields

---

#### dues_rules

**Database Has (19 columns)**:

```sql
id, tenant_id, rule_name, rule_code, description,
calculation_type, percentage_rate, base_field, flat_amount,
hourly_rate, hours_per_period, tier_structure, custom_formula,
billing_frequency, is_active, effective_date, end_date,
created_by, created_at, updated_at
```

**Code/Tests Expect But Don't Exist**:

- ❌ `rule_type` (used in workflows.test.ts line 86)
- Note: `calculation_type` exists and serves same purpose

**Schema Status**: ✅ Correct

**Impact**: Minor - test just needs to use `calculation_type` instead

---

### ❌ MISSING TABLE DEFINITIONS

#### payments

- **Status**: ❌ Table does NOT exist in database
- **Reason**: Payments tracked via `dues_transactions` with `payment_date`, `payment_method`, `payment_reference`
- **Impact**: Tests importing `payments` fail
- **Solution**: Remove `payments` references, use `duesTransactions` for payment tracking

#### strike_expenses

- **Status**: ❌ Not defined in schema, unknown if exists in database
- **Impact**: analytics.test.ts line 24 imports it
- **Solution**: Check database, either add to schema or remove import

---

## Critical Missing Fields Summary

### dues_transactions (5 fields)

1. `remittance_id uuid` - FK to employer_remittances
2. `stripe_payment_intent_id varchar(255)` - Stripe integration
3. `late_fee_amount numeric(10,2)` - Separate late fee tracking
4. `total_amount numeric(10,2)` - Total with fees?
5. `paid_date timestamp` - Different from payment_date?

### stipend_disbursements (5 fields)

1. `transaction_id uuid` - Link to transaction?
2. `days_worked integer` - Separate from hours?
3. `calculated_amount numeric(10,2)` - vs total_amount?
4. `approval_notes text` - Different from notes?
5. `paid_at timestamp` - Different from payment_date?

### employer_remittances (2 fields + enum fixes)

1. `matched_transactions integer` - Count of matched?
2. `total_variance numeric(10,2)` - Alias for variance_amount?
3. **Enum Values**: Need to allow `uploaded`, `matched`, `completed`, `needs_review`, `variance_detected`

---

## Resolution Strategy

### Option 1: Fix Code to Match Database ✅ RECOMMENDED

**Approach**: Update services, routes, tests to use actual database fields
**Pros**:

- No database migrations needed
- Works with existing data
- Faster to implement
- Lower risk

**Cons**:

- May lose some functionality (if fields were intended to exist)
- Need to refactor ~24 files

**Tasks**:

1. Update remittances.ts to use `remittance_period_start/end`, `member_count`, `variance_amount`
2. Update remittances status enum in schema
3. Update tests to use correct field names
4. Remove references to non-existent fields
5. Fix picket_attendance tests to use `check_in_time`, add `strike_fund_id`
6. Update stipend tests to use `base_stipend_amount`, `total_amount`

### Option 2: Add Missing Fields to Database ⚠️ REQUIRES MIGRATIONS

**Approach**: Create migrations to add expected fields
**Pros**:

- Code works as written
- Preserves intended functionality

**Cons**:

- Requires database migrations (risky)
- Need to test migrations thoroughly
- May affect other systems
- Takes longer

**Tasks**:

1. Write migration to add 12+ fields across 3 tables
2. Update status enums
3. Test migration on staging
4. Update schema.ts to match
5. Verify all code works

### Option 3: Hybrid Approach 🤔

**Approach**: Fix obvious mismatches (field name differences), add only critical missing fields
**Pros**:

- Minimal migrations
- Fixes most errors quickly

**Cons**:

- Still requires some migration work
- Partial solution

---

## Immediate Action Plan

**Recommended**: Option 1 (Fix Code to Match Database)

### Phase 1: Fix Schema Definitions (10 minutes)

1. ✅ strike_funds - DONE
2. ✅ organization_members - DONE
3. ✅ arrears - DONE
4. ⚠️ dues_transactions - Fix indexes (remove references to non-existent fields)
5. ⚠️ employer_remittances - Complete rewrite to match database
6. ⚠️ picket_attendance - Verify fields match
7. ✅ stipend_disbursements - Already correct
8. Add `duesAssignments` alias for `memberDuesAssignments`

### Phase 2: Fix Routes/Services (30-45 minutes)

1. remittances.ts (32 errors) - Use correct field names
2. payment-processing.ts (7 errors) - Remove stripe_payment_intent_id references
3. arrears-detection.ts (5 errors) - Use correct field names
4. stipend-calculation.ts (5 errors) - Use base_stipend_amount, total_amount
5. Other services with minor issues

### Phase 3: Fix Test Files (30 minutes)

1. workflows.test.ts (28 errors) - Fix all test data creation
2. analytics.test.ts (5 errors) - Fix test data creation
3. Remove payments table references
4. Add required fields to picket_attendance

### Phase 4: Verify & Test (15 minutes)

1. Run `pnpm build` - should have 0 errors
2. Run `pnpm test:workflows` - should pass
3. Run `pnpm test:analytics` - should pass

**Total Estimated Time**: 1.5-2 hours

---

## Database Migration Needs (If Option 2 Chosen)

```sql
-- Add to dues_transactions
ALTER TABLE dues_transactions ADD COLUMN remittance_id uuid REFERENCES employer_remittances(id);
ALTER TABLE dues_transactions ADD COLUMN stripe_payment_intent_id varchar(255);
ALTER TABLE dues_transactions ADD COLUMN late_fee_amount numeric(10,2) DEFAULT 0.00;

-- Add to stipend_disbursements  
ALTER TABLE stipend_disbursements ADD COLUMN days_worked integer;
-- Note: Don't add calculated_amount, use total_amount
-- Note: Don't add approval_notes, use notes

-- Fix employer_remittances enum
ALTER TABLE employer_remittances DROP CONSTRAINT employer_remittances_status_check;
ALTER TABLE employer_remittances ADD CONSTRAINT employer_remittances_status_check 
  CHECK (status IN ('pending', 'processing', 'uploaded', 'matched', 'completed', 
                    'reconciled', 'partial', 'discrepancy', 'needs_review', 'variance_detected'));

-- Add computed columns (or handle in application)
-- matched_transactions - compute from COUNT of linked dues_transactions
-- total_variance - alias for variance_amount in queries
```

---

## Conclusion

**Decision**: Proceed with **Option 1** (Fix Code to Match Database)

**Rationale**:

- Database schema is production (Azure PostgreSQL staging)
- Code/tests are development artifacts that need to align
- Faster resolution (1.5-2 hours vs days for migrations)
- Lower risk (no schema changes)
- Can revisit later if fields truly needed

**Next Steps**:

1. Fix Drizzle schema to match database exactly
2. Update all routes/services to use correct field names
3. Fix all test data creation
4. Verify tests pass
5. Document any lost functionality for future enhancement
