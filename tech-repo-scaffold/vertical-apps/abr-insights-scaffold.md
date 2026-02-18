# ABR Insights — Production-Ready Scaffold

This scaffold creates the `nzila-abr-insights` repository structure for the ABR Insights platform migration.

## Overview

**ABR Insights** (Anti-Black Racism Insights) is an EdTech/LegalTech platform for anti-racism education, tribunal case analysis, and professional development. Partnership-ready with WCAG 2.1 AA accessibility.

## Architecture

- **Frontend:** Next.js 15 (App Router) with Clerk auth
- **Backend:** Django 5.1 with product-specific apps
- **Database:** Azure PostgreSQL (via Django ORM)
- **Cache:** Azure Redis
- **Queue:** Celery + Redis
- **AI:** Azure OpenAI integration via Backbone
- **Infra:** Azure Container Apps (Bicep templates)
- **i18n:** Bilingual (English/French)

## Generated Structure

```
nzila-abr-insights/
├── frontend/                         # Next.js 15 frontend
│   ├── app/
│   │   ├── (public)/                # Landing pages
│   │   ├── (auth)/                  # Clerk auth flows
│   │   ├── (dashboard)/             # Learner dashboard
│   │   └── (admin)/                 # Organization admin
│   ├── components/
│   │   ├── ui/                      # Radix UI components
│   │   └── abr/                     # ABR-specific components
│   ├── lib/
│   │   ├── api-client.ts            # Backbone API client
│   │   └── types/                   # Generated TypeScript types
│   ├── public/
│   │   └── locales/                 # i18n translations (EN/FR)
│   └── package.json
├── backend/                          # Django backend (ABR-specific)
│   ├── courses/                     # Course management
│   ├── tribunal_cases/              # CanLII case analysis
│   ├── achievements/                # Gamification
│   ├── ce_credits/                  # Continuing education
│   ├── certificates/                # Certificate generation
│   ├── ai_coach/                    # AI learning coach
│   ├── ingestion/                   # CanLII ingestion pipeline
│   ├── quiz/                        # Quiz engine
│   ├── blog/                        # Blog/articles
│   ├── config/                      # Django settings
│   ├── manage.py
│   └── requirements.txt
├── infra/                           # Azure infrastructure
│   ├── bicep/                       # Bicep modules
│   ├── docker-compose.yml
│   └── docker-compose.dev.yml
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── cd-staging.yml
│       └── cd-production.yml
└── README.md
```

## Migration Status

| Phase | Status | Progress |
|-------|--------|----------|
| Schema Extraction | ✅ Complete | 116 tables extracted |
| Model Generation | ✅ Complete | 8 Django apps generated |
| Serializers/Views/URLs | ✅ Complete | DRF code generated |
| Audit Report | ✅ Complete | See packages/automation/data/abr-audit-report.json |
| Dependency Analysis | ⏳ Pending | Needs legacy codebase access |
| Scaffold Population | ⏳ In Progress | This file |
| Auth Migration Plan | 🔜 Next | Supabase → Clerk strategy |
| Backend Migration | 🔜 Next | Ingestion CLI → Django mgmt commands |
| Frontend Refactor | 🔜 Planned | Remove Supabase, add API client |
| Testing | 🔜 Planned | Unit, integration, E2E, WCAG |
| Deployment | 🔜 Planned | Bicep, GitHub Actions |

## Quick Start (After Population)

```bash
# Clone and setup
git clone https://github.com/anungis437/nzila-abr-insights.git
cd nzila-abr-insights

# Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend setup (separate terminal)
cd frontend
pnpm install
pnpm dev

# Open http://localhost:3000
```

## Key Features

### Learning Management
- Course creation and management
- Multi-format content (video, text, interactive)
- Progress tracking and analytics
- Bilingual content (EN/FR)

### Tribunal Case Library
- 10,000+ CanLII anti-racism cases
- AI-powered case analysis and summarization
- Legal precedent extraction
- Semantic search with embeddings

### Professional Development
- Continuing Education (CE) credits
- Professional certificates
- Achievement tracking
- Custom learning paths

### Gamification
- XP/leveling system (behavioral psychology-optimized)
- 80%+ completion rate
- Badges and achievements
- Leaderboards

### AI Features
- AI Learning Coach (GPT-4)
- Personalized recommendations
- Quiz question generation
- Case summarization
- Semantic search

### Accessibility
- WCAG 2.1 AA compliant
- Screen reader optimized
- Keyboard navigation
- High contrast modes

## Environment Variables

```bash
# Django
DJANGO_SECRET_KEY=
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=

# Database
PGHOST=
PGDATABASE=
PGUSER=
PGPASSWORD=
PGSSLMODE=require

# Redis
REDIS_URL=

# Clerk
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

# Stripe (via Backbone)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Azure OpenAI (via Backbone)
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT=

# CanLII API
CANLII_API_KEY=

# Backbone API
BACKBONE_API_URL=https://api.nzila.com
BACKBONE_API_KEY=

# i18n
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_LOCALES=en,fr
```

## Ingestion Pipeline

The CanLII case ingestion has been migrated from Node.js CLI to Django management command:

```bash
# Run ingestion
python manage.py ingest_canlii \
  --start-date=2020-01-01 \
  --end-date=2024-12-31 \
  --category=anti-racism \
  --batch-size=50

# Schedule with celery-beat
python manage.py shell
>>> from django_celery_beat.models import PeriodicTask, CrontabSchedule
>>> schedule, _ = CrontabSchedule.objects.get_or_create(
...     hour=2, minute=0, day_of_week='*'
... )
>>> PeriodicTask.objects.create(
...     crontab=schedule,
...     name='Daily CanLII Ingestion',
...     task='ingestion.tasks.ingest_canlii'
... )
```

## Authentication Migration

### Supabase → Clerk Strategy

**Phase 1: Preparation**
1. Set up Clerk application
2. Configure SAML/MSAL integrations
3. Create user migration scripts
4. Set up parallel auth (feature flag)

**Phase 2: Migration**
1. Export user data from Supabase
2. Create users in Clerk (email verification)
3. Migrate profile metadata
4. Force password reset for all users

**Phase 3: Cutover**
1. Gradual rollout with feature flags
2. Monitor error rates
3. Support user migration issues
4. Deprecate Supabase auth

**Risks:**
- All user sessions invalidated
- SAML/MSAL reconfiguration required
- User communication critical

**Mitigation:**
- Comprehensive user communication
- Staged rollout by organization
- Rollback plan with Supabase backup
- 24/7 support during migration

## Next Steps

1. ✅ Schema extraction complete
2. ✅ Model generation complete
3. ⏳ Populate this scaffold with generated Django apps
4. 🔜 Migrate ingestion CLI to Django management command
5. 🔜 Plan Supabase → Clerk migration
6. 🔜 Migrate AI features to Backbone AI service
7. 🔜 Set up i18n with django-modeltranslation
8. 🔜 Create frontend API client
9. 🔜 Implement WCAG 2.1 AA compliance tests
10. 🔜 Set up CI/CD pipelines

## Support

- **Product Lead:** Aubert Nungisa
- **Documentation:** See governance/docs/
- **Issues:** https://github.com/anungis437/nzila-abr-insights/issues
