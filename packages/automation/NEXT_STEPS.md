# Union Eyes & ABR Insights - Next Steps
*Updated: 2026-02-17 18:20*

## Current Status (19.2% Complete)

### ✅ Phase 1: Completed
- **Schema Extraction** ✅
  - Union Eyes: 512 tables → 11 Django apps
  - ABR Insights: 116 tables → 8 Django apps
- **Code Generation** ✅  
  - All Django models, serializers, views, URLs generated
  - All quality gates passed

### 🔜 Phase 2: Next Steps

## Immediate Actions (Priority 1)

### 1. Complete Analysis Phase
**Status**: 50% complete (missing audit reports completion)

**Action Items**:
- [x] Create comprehensive audit reports
- [x] Document scaffold structures
- [ ] Mark analysis phase as complete in progress tracker

**Command**:
```bash
python packages/automation/generators/update_progress.py --complete-analysis
```

### 2. Populate Repository Scaffolds  
**Status**: Not started (0%)

**Action Items**:
- [ ] Create `nzila-union-eyes` repository  
- [ ] Create `nzila-abr-insights` repository
- [ ] Populate with generated Django apps
- [ ] Add infrastructure files (Docker, CI/CD, IaC)

**Command**:
```bash
python packages/automation/generators/repo_populator.py --platform all
```

**Expected Output**:
```
d:\APPS\
├── nzila-automation/          # Current workspace
├── nzila-union-eyes/          # NEW - Union Eyes backend + frontend
│   ├── backend/
│   │   ├── unions/
│   │   ├── grievances/
│   │   ├── bargaining/
│   │   ├── finance/
│   │   ├── ... (11 apps total)
│   ├── frontend/
│   ├── docker-compose.yml
│   └── README.md
└── nzila-abr-insights/        # NEW - ABR Insights backend + frontend
    ├── backend/
    │   ├── auth_core/
    │   ├── content/
    │   ├── billing/
    │   ├── ... (8 apps total)
    ├── frontend/
    ├── docker-compose.yml
    └── README.md
```

### 3. Dependency Analysis  
**Status**: Blocked - needs legacy codebase access

**Blockers**:
- Union Eyes legacy codebase not in workspace
- ABR Insights legacy codebase not in workspace

**Resolution**:
- Copy `Union_Eyes_app_v1-main` to workspace
- Copy `abr-insights-app-main` to workspace

**Command** (after copying codebases):
```bash
python packages/automation/generators/dependency_analyzer.py --platform ue --source ../Union_Eyes_app_v1-main
python packages/automation/generators/dependency_analyzer.py --platform abr --source ../abr-insights-app-main
```

## Phase 3: Backend Migration (Priority 2)

### 4. Model Migration  
**Tasks**:
- Set up Django projects in populated repos
- Run `python manage.py makemigrations`
- Run `python manage.py migrate`
- Verify schema parity with source databases

**Quality Gates**:
- [ ] Django makemigrations succeeds
- [ ] Django migrate runs cleanly
- [ ] Schema matches source

### 5. Celery + Queue Migration (Union Eyes Only)
**Tasks**:
- Map BullMQ jobs to Celery tasks
- Create task definitions for:
  - `pension_calculation`
  - `ml_model_prediction`  
  - `document_processing`
  - `email_delivery`
  - `analytics_aggregation`
- Set up Celery beat for cron jobs

**Time Estimate**: 2-3 weeks

### 6. ML Pipeline Migration (Union Eyes Only)
**Tasks**:
- Export production TensorFlow.js models
- Retrain in Python (scikit-learn or PyTorch)
- Models to migrate:
  - Pension forecasting
  - Grievance outcome prediction
  - Member churn prediction

**Time Estimate**: 3-4 weeks

## Phase 4: Frontend Migration (Priority 3)

### 7. Remove Drizzle/Supabase Dependencies
**Union Eyes**:
- Remove Drizzle ORM imports
- Replace with Django API client
- Update all data fetching logic

**ABR Insights**:
- Remove Supabase client
- Replace with Django API client  
- Migrate RLS policies to Django permissions

### 8. Auth Migration (ABR Insights: HIGH COMPLEXITY)
**3-Phase Strategy**:
1. **Preparation** (2 weeks)
   - Set up Clerk application
   - Configure SAML/MSAL for institutional SSO
   - Create migration scripts
2. **Migration** (1 week)
   - Export Supabase users
   - Import to Clerk via API
   - Map roles and permissions
3. **Cutover** (1 week)
   - Update frontend auth provider
   - Invalidate Supabase sessions
   - Monitor for issues

**Time Estimate**: 60 hours (4 weeks part-time)

## Phase 5: Testing (Priority 4)

### 9. Automated Testing
**Quality Gates**:
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Code coverage >= 80%
- [ ] No feature regressions

**Tasks**:
- Write unit tests for Django models
- Write API integration tests
- Set up CI/CD testing pipeline

## Phase 6: Deployment (Priority 5)

### 10. Azure Infrastructure
**Components**:
- Azure Container Apps (Django + Celery workers)
- Azure PostgreSQL Flexible Server
- Azure Redis Cache
- Azure Blob Storage
- Azure Application Insights

**Tasks**:
- [ ] Bicep/Terraform IaC templates
- [ ] CI/CD pipelines (GitHub Actions)
- [ ] Staging environment deployment
- [ ] Production deployment

## Timeline Estimates

| Phase | Union Eyes | ABR Insights | Dependencies |
|-------|-----------|--------------|--------------|
| ✅ Schema Extraction | DONE | DONE | — |
| ✅ Code Generation | DONE | DONE | Schema extraction |
| 🔄 Scaffold Population | 1 day | 1 day | — |
| 🔜 Dependency Analysis | 2 days | 1 day | Legacy codebase access |
| 🔜 Model Migration | 1 week | 1 week | Scaffold population |
| 🔜 Queue Migration | 2-3 weeks | N/A | Model migration |
| 🔜 ML Pipeline | 3-4 weeks | N/A | Queue migration |
| 🔜 Auth Migration | 1 week | 4 weeks | Model migration |
| 🔜 API Migration | 3 weeks | 2 weeks | Auth migration |
| 🔜 Frontend Refactor | 4 weeks | 3 weeks | API migration |
| 🔜 Testing | 2 weeks | 2 weeks | Frontend complete |
| 🔜 Deployment | 1 week | 1 week | Testing complete |
| **TOTAL** | **10-12 weeks** | **12-14 weeks** | — |

## Critical Path

1. **Scaffold Population** (1 day) → Enables parallel development
2. **Dependency Analysis** (1-2 days) → Unblocks package migration decisions
3. **Model Migration** (1 week) → Core data layer
4. **Auth Migration** (1-4 weeks) → Critical for user access
5. **API Migration** (2-3 weeks) → Backend-frontend integration
6. **Testing** (2 weeks) → Quality assurance
7. **Deployment** (1 week) → Production launch

## Quick Commands Reference

```bash
# Update progress dashboard
python packages/automation/generators/update_progress.py

# Populate repository scaffolds
python packages/automation/generators/repo_populator.py --platform all

# Run dependency analysis (after copying legacy codebases)
python packages/automation/generators/dependency_analyzer.py --platform ue
python packages/automation/generators/dependency_analyzer.py --platform abr

# Generate audit reports
python packages/automation/generators/audit_report_generator.py

# View progress
cat packages/automation/data/MIGRATION_DASHBOARD.md
```

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Legacy codebase access delayed | HIGH | Proceed with scaffold population in parallel |
| ML model retrain accuracy loss | HIGH | A/B test new models vs old before full cutover |
| Supabase→Clerk auth migration | CRITICAL | Detailed migration plan, staged rollout |
| RLS policy migration complexity | MEDIUM | Map policies to Django permissions meticulously |
| Celery infrastructure setup | MEDIUM | Use managed Azure services, not self-hosted |
| Data migration data loss | CRITICAL | Multiple backup snapshots, dry-run migrations |

## Success Criteria

### Phase Completion:
- ✅ All quality gates passed
- ✅ No critical blockers
- ✅ Documentation updated

### Platform Cutover:
- ✅ All tests passing
- ✅ Zero data loss
- ✅ No feature regressions  
- ✅ Performance meets or exceeds legacy
- ✅ Rollback plan validated

## Support Resources

- **Audit Reports**: `packages/automation/data/{ue,abr}-audit-report.json`
- **Scaffold Docs**: `tech-repo-scaffold/vertical-apps/{union-eyes,abr-insights}-scaffold.md`
- **Refactor Plan**: `packages/automation/UE_ABR_FLAGSHIP_REFACTOR_PLAN.md`
- **Progress Dashboard**: `packages/automation/data/MIGRATION_DASHBOARD.md`
- **Schema Report**: `packages/automation/data/SCHEMA_EXTRACTION_REPORT.md`
