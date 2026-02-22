# Week 12: Testing Issues & Resolution

## Date: 2025-01-27

## Summary

Created comprehensive test suites for workflows and analytics endpoints, but encountered schema mismatches between test expectations and actual database structure.

## Test Suites Created

### 1. workflows.test.ts (902 lines)

- **Purpose**: End-to-end testing for 4 financial workflows
- **Coverage**: 19 tests across 5 suites
- **Status**: ❌ Failed - Schema mismatches

### 2. analytics.test.ts (708 lines)

- **Purpose**: API endpoint testing for analytics
- **Coverage**: 25+ tests across 10 suites
- **Status**: ⏸️ Not yet executed

## Critical Issues Discovered

### Issue 1: Schema Table Name Mismatches

**Problem**: Tests reference tables that don't exist or have different names:

| Test Reference | Actual Schema Name | Status |
|---------------|-------------------|--------|
| `duesAssignments` | `memberDuesAssignments` | ❌ Wrong name |
| `arrears` | `arrearsCases` | ❌ Wrong name |
| `payments` | (doesn't exist) | ❌ Missing table |
| `members` | (not in this schema) | ❌ External table |

**Root Cause**: The `payments` table doesn't exist in the financial-service schema. Payment processing likely happens differently than expected.

### Issue 2: Strike Funds Schema Mismatch

**Problem**: Database column name mismatch

- **Drizzle Schema**: Uses `isActive` (camelCase)
- **Actual Database**: Uses `is_active` (snake_case)

**Error Message**:

```
PostgresError: column "is_active" of relation "strike_funds" does not exist
```

**Root Cause**: Drizzle ORM schema definition doesn't match actual database column names.

### Issue 3: Missing Balance Field

**Problem**: Strike funds table doesn't have `currentBalance` or `balance` field

- **Schema Fields**: `targetAmount`, `weeklyStipendAmount`, etc.
- **No Balance Field**: Balance must be calculated from donations/expenses

### Issue 4: Members Table Location

**Problem**: `members` table not defined in financial-service schema

- **Likely Location**: Shared schema or auth service
- **Impact**: Can't test member-related workflows without proper imports

## Required Actions

### Priority 1: Database Schema Investigation

1. **Check actual database schema**:

   ```sql
   \d strike_funds
   \d members
   \d+ public.*
   ```

2. **Verify column names**: Determine if database uses snake_case or camelCase
3. **Find payments table**: Locate where payment data is stored
4. **Identify members table**: Find correct import path for members schema

### Priority 2: Schema Synchronization

1. **Update Drizzle schema** to match database:
   - Fix `isActive` vs `is_active`
   - Add missing tables (`payments`, `members`)
   - Correct table name references
2. **Or update database** to match Drizzle schema (less preferred)
3. **Run migration** if needed to align schemas

### Priority 3: Test Refactoring

1. **Fix table imports**:

   ```typescript
   // OLD (Wrong)
   import { arrears, duesAssignments, payments } from '../db/schema';
   
   // NEW (Correct)
   import { arrearsCases, memberDuesAssignments } from '../db/schema';
   // Import members from shared schema
   import { members } from '@union-claims/types' or '../../../packages/types/...';
   ```

2. **Update test data creation**:
   - Remove `currentBalance` from strike funds
   - Add donations/expenses to create balance
   - Use correct table names throughout

3. **Handle missing payments table**:
   - Option A: Create payments schema if it should exist
   - Option B: Refactor tests to use actual payment model
   - Option C: Mock payment data if external service

### Priority 4: Configuration Fixes

1. **Jest config warnings**:
   - Update jest.config.ts to use new ts-jest syntax
   - Add `isolatedModules: true` to tsconfig.json
   - Remove deprecated `globals` config

2. **Test environment**:
   - Configure test database connection
   - Add cleanup logic for open handles
   - Set proper test timeouts

## Recommended Approach

### Step 1: Schema Discovery (15 minutes)

```bash
# Connect to database
psql $DATABASE_URL

# List all tables
\dt

# Describe key tables
\d strike_funds
\d members
\d dues_transactions
\d arrears_cases

# Check for payments-related tables
\dt *payment*
```

### Step 2: Update Drizzle Schema (30 minutes)

- Add missing tables to schema.ts
- Fix column name mappings
- Import shared schemas (members, etc.)
- Validate with `drizzle-kit introspect`

### Step 3: Refactor Tests (45 minutes)

- Update all table references
- Fix test data creation
- Handle balance calculations
- Add proper cleanup

### Step 4: Execute Tests (30 minutes)

- Run workflows.test.ts
- Fix any remaining issues
- Run analytics.test.ts
- Document results

## Lessons Learned

1. **Schema-First Testing**: Always verify actual database schema before writing tests
2. **Import Validation**: Check that all imported tables actually exist in schema files
3. **ORM Configuration**: Ensure Drizzle column names match database (snake_case vs camelCase)
4. **Cross-Service Dependencies**: Identify shared tables and import from correct locations
5. **Test Data Modeling**: Understand data relationships before creating test fixtures

## Next Steps

1. ✅ Created this documentation
2. ⏸️ Investigate actual database schema
3. ⏸️ Fix Drizzle schema definitions
4. ⏸️ Refactor test files
5. ⏸️ Execute and validate tests
6. ⏸️ Move to security audit once tests pass

## Time Estimate

- **Schema Discovery & Fixes**: 2-3 hours
- **Test Refactoring**: 1-2 hours
- **Total**: 3-5 hours

---

**Status**: Blocked on schema investigation
**Blocker**: Need to verify actual database structure and locate missing tables
**Owner**: Development Team
**Priority**: High (blocks Week 12 progress)
