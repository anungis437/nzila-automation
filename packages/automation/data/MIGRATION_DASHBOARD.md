# Migration Progress Dashboard
*Generated: 2026-02-17 18:51 | Updated: 2026-02-18 01:30*

## ABR Insights
**Overall Progress: 72%**
Started: 2026-02-17T13:32:40.978519 | Last Updated: 2026-02-18 01:30

| Phase | Status | Progress | Tasks | Gates |
|-------|--------|----------|-------|-------|
| analysis | ✅ completed | 100% | 2/2 | 2/2 |
| schema_extraction | ✅ completed | 100% | 116/116 | 3/3 |
| code_generation | ✅ completed | 100% | 8/8 | 4/4 |
| dependency_mapping | ✅ completed | 100% | 83/83 | 3/3 |
| scaffold_population | ✅ completed | 100% | 10/8 | — |
| model_migration | ✅ completed | 100% | 116/116 | 3/3 |
| data_migration | ✅ completed | 100% | 99/99 tables | 2/2 |
| auth_migration | ✅ completed | 100% | configured | 2/3 |
| api_migration | ⬜ not_started | 0% | — | 0/3 |
| queue_migration | ⬜ not_started | 0% | — | — |
| testing | 🟡 in_progress | 20% | 1/5 | 0/4 |
| deployment | ⬜ not_started | 0% | — | 0/3 |
| cutover | ⬜ not_started | 0% | — | — |

### Model Migration Details (ABR)
- ✅ BaseModel inheritance applied to all 8 apps (116 models)
- ✅ Reserved word fields sanitized (`not` → `not_field`, `or` → `or_field`)
- ✅ Long index names truncated for DB compatibility
- ✅ UUID primary keys on all models (BaseModel → UUIDField)
- ✅ Django check: 0 issues
- ✅ Fresh migrations generated with UUID PKs for all 8 apps
- ✅ Migrations applied: 127 tables created in `nzila_abr_insights`
- ✅ OrganizationModel FK reference fixed to `auth_core.Organizations`

### Data Migration Details (ABR)
- ✅ Migration runner built (`migrate_abr.py`)
- ✅ Column renames handled: `not` → `not_field`, `or` → `or_field`
- ✅ Skip columns: `embedding` (pgvector) for `case_embeddings`, `course_embeddings`, `lesson_embeddings`
- ✅ Target DB verified: 127 tables with UUID PKs
- ✅ Source: Supabase pooler (`aws-1-ca-central-1.pooler.supabase.com`)
- ✅ **Migration complete: 99/99 tables (100%), 3,292 rows migrated**
- ✅ **Validation: ALL 99 tables match source row counts ✓**
- ✅ Fixes applied: dict→JSON adaptation, NULL NOT NULL defaults, ARRAY vs JSONB types
- ✅ **Migration Duration: 4.2s dry-run, ~20s live**
- ✅ **Status: ✅ COMPLETE & VALIDATED** (2026-02-17 22:04)

## Union Eyes
**Overall Progress: 72%**
Started: 2026-02-17T13:32:40.994605 | Last Updated: 2026-02-18 01:30

| Phase | Status | Progress | Tasks | Gates |
|-------|--------|----------|-------|-------|
| analysis | ✅ completed | 100% | 2/2 | 2/2 |
| schema_extraction | ✅ completed | 100% | 512/512 | 3/3 |
| code_generation | ✅ completed | 100% | 11/11 | 4/4 |
| dependency_mapping | ✅ completed | 100% | 282/282 | 3/3 |
| scaffold_population | ✅ completed | 100% | 14/11 | — |
| model_migration | ✅ completed | 100% | 512/512 | 3/3 |
| data_migration | ✅ completed | 100% | 265/265 tables | 2/2 |
| auth_migration | ✅ completed | 100% | configured | 2/3 |
| api_migration | ⬜ not_started | 0% | — | 0/3 |
| queue_migration | ⬜ not_started | 0% | — | — |
| testing | 🟡 in_progress | 20% | 1/5 | 0/4 |
| deployment | ⬜ not_started | 0% | — | 0/3 |
| cutover | ⬜ not_started | 0% | — | — |

### Model Migration Details (UE)
- ✅ BaseModel inheritance applied to all 11 apps (512 models)
- ✅ Custom PK fields converted to unique (13 fields across 3 apps)
- ✅ Organizations model added to auth_core
- ✅ UUID primary keys on all models (BaseModel → UUIDField)
- ✅ Django check: 0 issues
- ✅ Fresh migrations generated with UUID PKs for all 11 apps
- ✅ Migrations applied: 524 tables created in `nzila_union_eyes`
- ✅ OrganizationModel FK reference fixed to `auth_core.Organizations`

### Data Migration Details (UE)
- ✅ Migration runner built (`migrate_ue.py`)
- ✅ 514 custom tables mapped (1:1 with source via `db_table`)
- ✅ 153 tables with FK dependencies — topological sort verified
- ✅ Target DB verified: 524 tables with UUID PKs
- ✅ Source: Azure PostgreSQL (`unioneyes-staging-db.postgres.database.azure.com`)
- ✅ **Migration complete: 265/265 tables (100%), 3,689 rows migrated**
- ✅ **Validation: ALL 265 tables match source row counts ✓**
- ✅ Fixes applied: dict→JSON, NULL defaults, ARRAY vs JSONB, UUID generation for target-only PKs
- ✅ **Migration Duration: 13.0s dry-run, ~45s live (including retries)**
- ✅ **Status: ✅ COMPLETE & VALIDATED** (2026-02-17 22:04)

## Data Migration Engine
- ✅ Core engine built (`data_migrator.py`, ~1,120 lines)
- ✅ Pure PostgreSQL-to-PostgreSQL (psycopg2, zero Supabase SDK)
- ✅ Table mapping report: 2052 lines (`TABLE_MAPPING_REPORT.md`)
- ✅ FK dependency ordering via topological sort
- ✅ Column matching with rename handling (reserved words)
- ✅ Batch inserts with `ON CONFLICT DO NOTHING` (idempotent)
- ✅ Progress checkpointing & resume support
- ✅ Dry-run mode and validation mode
- ✅ `search_vector` (TSVECTOR) and `embedding` (pgvector) columns auto-skipped
- ✅ Type-aware row adaptation (ARRAY vs JSONB, dict/list wrapping)
- ✅ Auto-fills target-only NOT NULL columns with type-based defaults
- ✅ Callable defaults support (e.g., `lambda: str(uuid4())` for generated PKs)
- ✅ URL-encoded password parsing via `unquote()`
- ✅ **Total migrated: 364 tables, 6,981 rows across both platforms**
- ✅ **Validation: 100% row count match on all 364 tables**

## Code Generator Improvements
- ✅ All models default to `BaseModel` inheritance (no more `models.Model` fallback)
- ✅ Non-id primary key fields auto-converted to `unique=True`
- ✅ Python reserved words (`not`, `or`, etc.) auto-suffixed with `_field`
- ✅ Constraint/index names auto-truncated to 30 chars
- ✅ OrganizationModel FK correctly references `auth_core.Organizations`
- ✅ Admin always includes `id` and `created_at` in `list_display` (BaseModel provides them)
- ✅ Ordering always set to `['-created_at']` (BaseModel guarantees field exists)
- ✅ BaseModel template includes UUID PK field

## Auth Migration Details (ABR + UE)
- ✅ Auth migration strategy documented (`AUTH_MIGRATION_PLAN.md`, `AUTH_IMPLEMENTATION_SUMMARY.md`)
- ✅ Production Clerk auth backend built (~700 lines): `authentication.py`, `middleware.py`, `views.py`, `urls.py`
- ✅ **Union Eyes Backend Configured** (`D:\APPS\nzila-union-eyes\backend\`)
  - ✅ auth_core files installed (4 files, ~700 lines)
  - ✅ Django settings.py updated: REST_FRAMEWORK, MIDDLEWARE, CORS, Redis cache, Clerk env vars
  - ✅ views.py extended: Clerk webhook handlers (~230 lines), /me/ endpoint, /health/ endpoint
  - ✅ urls.py updated: 3 Clerk endpoints added
  - ✅ .env created with **LIVE Clerk credentials** (known-hagfish-67.clerk.accounts.dev)
  - ✅ requirements.txt updated: django-redis>=5.4.0
  - ✅ Setup guide created: `CLERK_SETUP_COMPLETE.md` (~300 lines)
- ✅ **ABR Insights Backend Configured** (`D:\APPS\nzila-abr-insights\backend\`)
  - ✅ auth_core files installed (4 files, ~700 lines)
  - ✅ Django settings.py updated: REST_FRAMEWORK, MIDDLEWARE, CORS, Redis cache, Clerk env vars
  - ✅ views.py extended: Clerk webhook handlers (~230 lines), /me/ endpoint, /health/ endpoint
  - ✅ urls.py updated: 3 Clerk endpoints added
  - ✅ .env created with **LIVE Clerk credentials** (endless-fowl-82.clerk.accounts.dev)
  - ✅ requirements.txt updated: django-redis>=5.4.0
- ✅ **Both backends READY FOR TESTING** (see `CLERK_AUTH_COMPLETE.md` for instructions)

## Next Steps
- [x] ~~Provide source DB credentials to run data migration~~ ✅ DONE
- [x] ~~Run data migration for both platforms~~ ✅ DONE (364 tables, 6,981 rows)
- [x] ~~Validate migrations~~ ✅ DONE (100% match on all 364 tables)
- [x] ~~Plan auth migration strategy~~ ✅ DONE (documented in `AUTH_MIGRATION_PLAN.md`)
- [x] ~~Build production-ready Clerk auth backend~~ ✅ DONE (see `tech-repo-scaffold/django-backbone/apps/auth_core/`)
- [x] ~~Union Eyes Auth Integration~~ ✅ DONE (backend configured with live Clerk credentials)
- [x] ~~ABR Insights Auth Integration~~ ✅ DONE (backend configured with live Clerk credentials)
- [ ] **Local Testing** (PRIORITY: HIGH, ~30-45 minutes) — **CURRENT STEP**
  - [ ] Install dependencies: `pip install -r requirements.txt` (both backends)
  - [ ] Start Redis server: `redis-server`
  - [ ] Test UE locally: `python manage.py runserver` (port 8000)
  - [ ] Test ABR locally: `python manage.py runserver 8001` (port 8001)
  - [ ] Verify health endpoints work
  - [ ] Test JWT authentication with /me/ endpoints
  - [ ] Configure Clerk webhooks (use ngrok for local testing)
  - [ ] Test webhook signature verification
- [ ] **Frontend Integration** (PRIORITY: HIGH, ~1-2 weeks)
  - [ ] Replace Supabase Auth with Clerk in frontends
  - [ ] Update API calls to use new Django backends
  - [ ] Test sign-in/sign-up flows
  - [ ] Test organization switching (multi-tenant)
- [ ] **API Migration** (PRIORITY: MEDIUM, ~2-3 weeks)
  - [ ] Map all API endpoints (UE: 130+, ABR: 18 groups)
  - [ ] Generate DRF viewsets for business logic
  - [ ] Write integration tests
  - [ ] Migrate frontend API calls
- [ ] **Deployment** (PRIORITY: MEDIUM, ~1 week)
  - [ ] Deploy to Azure Container Apps (staging first)
  - [ ] Configure production Clerk webhooks
  - [ ] Load testing
  - [ ] Blue-green production deployment
- [ ] **Delete legacy Azure resources** (7 resource groups — after final verification)
- [ ] **Delete Supabase projects** (court_lens_app immediate, abr_app_v1 & union_eyes_app post-migration)
- [ ] Azure resource consolidation (see inventory below)

---

## Azure & Supabase Resource Inventory
*Captured: 2026-02-17 | Subscription: Azure subscription 1 Nzila*

### Supabase Projects (3)
| Project | Ref ID | Region | Created | Status |
|---------|--------|--------|---------|--------|
| `court_lens_app` | qzkopgqmymorpngpabvq | Canada Central | 2025-09-14 | 🔴 Legacy — predecessor to ABR |
| `abr_app_v1` | zdcmugkafbczvxcyofiz | Canada Central | 2026-01-12 | 🟡 Source for ABR data migration |
| `union_eyes_app` | xryvcdbmljxlsrfanvrv | Canada Central | 2026-02-07 | 🟡 Source for UE data migration |

### Azure PostgreSQL Flexible Servers (8)
| Server | Resource Group | Location | PG Ver | SKU | Recommendation |
|--------|---------------|----------|--------|-----|----------------|
| `unioneyes-staging-db` | unioneyes-staging-rg | Canada Central | 16 | B2s | 🟡 **UE source** — migrate data then decommission |
| `unioneyes-prod-db` | unioneyes-prod-rg | Canada Central | 16 | B2s | 🟡 Keep until cutover complete |
| `union-eyes-db-1771184129` | union-eyes-rg | Canada Central | 16 | B2s | 🔴 **Remove** — orphaned/duplicate |
| `psql-union-claims-dev-4x25` | rg-union-claims-dev-4x25 | East US 2 | 13 | B1ms | 🔴 **Remove** — legacy dev, PG 13 |
| `nzila-staging-db` | nzila-staging-rg | Canada Central | 15 | B2s | 🟢 **Keep** — Nzila platform staging |
| `psql-nzilaexport-stg` | nzilaexport-staging-rg | Canada Central | 15 | B1ms | 🔴 **Remove** — legacy export tool |
| `congowave-db` | congowave-rg | Canada Central | 15 | B2s | 🟢 Keep — separate product |
| `congowave-db-staging` | congowave-staging-rg | West US 2 | 15 | B2s | 🟢 Keep — separate product |

### Resource Groups by Product (25 total)

#### 🟡 Union Eyes (migrating to Django)
| Resource Group | Location | Resources | Action |
|---------------|----------|-----------|--------|
| `unioneyes-staging-rg` | Canada Central | DB, App Plan, App, ACR, Storage, KV, Speech, OpenAI x2 | 🟡 Migrate data → decommission |
| `unioneyes-prod-rg` | Canada Central | DB, App Plan, App, ACR, Storage, Speech, OpenAI x2 | 🟡 Keep until cutover |
| `union-eyes-rg` | Canada Central | 1 orphaned DB | 🔴 **Delete entire RG** |

#### 🟡 ABR Insights (migrating to Django)
| Resource Group | Location | Resources | Action |
|---------------|----------|-----------|--------|
| `rg-abr-insights` | Canada Central | Static Web App | 🟡 Frontend — keep or migrate |
| `abr-insights-rg` | East US | OpenAI, ACR, Container Env, Container App, Logs | 🟡 Migrate → decommission |

#### 🔴 CourtLens (legacy ABR predecessor)
| Resource Group | Location | Resources | Action |
|---------------|----------|-----------|--------|
| `court_lens` | Canada East | ML Workspace, Storage, ACR, KV, App Insights, OpenAI | 🔴 **Delete entire RG** |
| `courtlens-rg` | Canada Central | KV, ACR, App Plan, **11 web apps** | 🔴 **Delete entire RG** |
| `rg-support-7310` | Canada East | Cognitive Services | 🔴 **Delete entire RG** |

#### 🔴 Union Claims (legacy UE predecessor)
| Resource Group | Location | Resources | Action |
|---------------|----------|-----------|--------|
| `rg-union-claims-dev-4x25` | East US 2 | Redis, Storage, KV, DB, ACR, AKS, Logs, App Insights | 🔴 **Delete entire RG** |
| AKS managed RG | East US 2 | IPs, LB, NSG, VNet, VMSS, Identities | 🔴 Auto-deleted with AKS |

#### 🟡 NzilaExport (legacy export tool)
| Resource Group | Location | Resources | Action |
|---------------|----------|-----------|--------|
| `nzilaexport-staging-rg` | Canada Central | KV x2, Logs, Redis, DB, Storage, ACR, Plan, NSG, VNet, 2 Apps, Insights | 🔴 **Delete entire RG** |

#### 🟢 Nzila Platform (new unified platform)
| Resource Group | Location | Resources | Action |
|---------------|----------|-----------|--------|
| `nzila-staging-rg` | East US + CA Central | VNet, Logs, DB, Redis, Storage, KV, ACR, Container Env, API app, Web app | 🟢 **Keep — target platform** |
| `ME_nzila-staging-env_...` | East US | Load balancer, Public IP (managed) | 🟢 Keep (auto-managed) |

#### 🟢 CongoWave (separate product)
| Resource Group | Location | Resources | Action |
|---------------|----------|-----------|--------|
| `congowave-rg` | East US + CA Central | Storage, CDN, DB, VNet, AppGW, Public IP | 🟢 Keep |
| `congowave-terraform-rg` | East US | Terraform state storage | 🟢 Keep |
| `congowave-prod-rg` | East US | ACR | 🟢 Keep |
| `congowave-staging-rg` | West US 2 | Logs, DB, Redis, Storage, Container Env, 2 Apps | 🟢 Keep |

#### 🟡 CyberLearn (separate product — evaluate)
| Resource Group | Location | Resources | Action |
|---------------|----------|-----------|--------|
| `cyberlearn-rg` | East US | Static Web App, Bot Service, OpenAI | 🟡 Evaluate — keep or unify |
| `cyberlearn-container-rg` | East US | ACR, Logs, Container Env, Container App | 🟡 Evaluate |
| `cyber-learn-rg` | East US | Storage, Speech, Function App, Insights, Plan | 🟡 Evaluate |

#### ⚪ Infrastructure / Shared
| Resource Group | Location | Resources | Action |
|---------------|----------|-----------|--------|
| `cloud-shell-storage-eastus` | East US | Storage | ⚪ Keep (Cloud Shell) |
| `DefaultResourceGroup-EUS` | East US | Default Log Analytics | ⚪ Keep |
| `NetworkWatcherRG` | East US 2 | Network Watchers | ⚪ Keep |
| `pondu-ops-rg` | East US | KeyVault | 🟡 Keep or merge into nzila-staging |

### Consolidation Summary

| Category | RGs | Recommendation |
|----------|-----|----------------|
| 🔴 **Delete (legacy/duplicate)** | 7 | court_lens, courtlens-rg, rg-support-7310, rg-union-claims-dev-4x25 + AKS managed, union-eyes-rg, nzilaexport-staging-rg |
| 🟡 **Migrate then decommission** | 5 | unioneyes-staging-rg, unioneyes-prod-rg, rg-abr-insights, abr-insights-rg, pondu-ops-rg |
| 🟢 **Keep** | 10 | nzila-staging-rg, congowave-*, infrastructure RGs |
| 🟡 **Evaluate** | 3 | cyberlearn-* (3 RGs — consolidate into 1?) |

### Estimated Monthly Cost Savings (deletions)
- 7 resource groups with ~8 databases, AKS cluster, Redis instances, storage accounts
- **PostgreSQL alone**: ~$25-50/mo each × 4 deletable = **~$100-200/mo**
- **AKS cluster**: ~$70-150/mo
- **Redis instances**: ~$15-50/mo each
- **Total estimated savings: ~$200-450/mo**

### Supabase Consolidation
| Project | Action | Timeline |
|---------|--------|----------|
| `court_lens_app` | 🔴 **Delete** after confirming no active users | Immediate |
| `abr_app_v1` | 🟡 Keep until ABR data migration complete → delete | Post-migration |
| `union_eyes_app` | 🟡 Keep until UE data migration complete → delete | Post-migration |
