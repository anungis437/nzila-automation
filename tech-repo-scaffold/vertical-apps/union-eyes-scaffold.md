# Union Eyes — Production-Ready Scaffold

This scaffold creates the `nzila-union-eyes` repository structure for the Union Eyes platform migration.

## Overview

**Union Eyes** is the crown jewel flagship platform for union organizing, member management, grievancetracking, collective bargaining, and compliance. Built for the CLC (Canadian Labour Congress) movement.

## Architecture

- **Frontend:** Next.js 15 (App Router) with Clerk auth
- **Backend:** Django 5.1 with product-specific apps
- **Database:** Azure PostgreSQL (via Django ORM)
- **Cache:** Azure Redis
- **Queue:** Celery + Redis
- **AI:** Azure OpenAI integration via Backbone
- **Infra:** Azure Container Apps (Bicep templates)

## Generated Structure

```
nzila-union-eyes/
├── frontend/                         # Next.js 15 frontend
│   ├── app/
│   │   ├── (public)/                # Landing pages
│   │   ├── (auth)/                  # Clerk auth flows
│   │   ├── (dashboard)/             # Member dashboard
│   │   └── (admin)/                 # Union admin panel
│   ├── components/
│   │   ├── ui/                      # Radix UI components
│   │   └── union/                   # UE-specific components
│   ├── lib/
│   │   ├── api-client.ts            # Backbone API client
│   │   └── types/                   # Generated TypeScript types
│   └── package.json
├── backend/                          # Django backend (UE-specific)
│   ├── unions/                      # Union management
│   ├── grievances/                  # Grievance tracking
│   ├── bargaining/                  # Collective bargaining
│   ├── finance/                     # Dues, strike fund
│   ├── governance/                  # Elections, voting
│   ├── cases/                       # Case management
│   ├── pension/                     # Pension processor
│   ├── insurance/                   # Insurance adapter
│   ├── calendar/                    # Events/scheduling
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
| Schema Extraction | ✅ Complete | 512 tables extracted |
| Model Generation | ✅ Complete | 11 Django apps generated |
| Serializers/Views/URLs | ✅ Complete | DRF code generated |
| Audit Report | ✅ Complete | See packages/automation/data/ue-audit-report.json |
| Dependency Analysis | ⏳ Pending | Needs legacy codebase access |
| Scaffold Population | ⏳ In Progress | This file |
| Backend Migration | 🔜 Next | Celery, ML models, RBAC |
| Frontend Refactor | 🔜 Planned | Remove Drizzle, add API client |
| Testing | 🔜 Planned | Unit, integration, E2E |
| Deployment | 🔜 Planned | Bicep, GitHub Actions |

## Quick Start (After Population)

```bash
# Clone and setup
git clone https://github.com/anungis437/nzila-union-eyes.git
cd nzila-union-eyes

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

### Union Management
- Multi-tenant union hierarchy (congress → federation → union → local)
- 4,773 entities across 512 tables
- 238 RLS policies migrated to Django permissions

### Grievance Tracking
- Complete grievance lifecycle management
- AI-powered outcome prediction (TensorFlow.js → scikit-learn)
- Document management with Azure Blob Storage

### Collective Bargaining
- CBA (Collective Bargaining Agreement) intelligence
- AI-powered clause extraction and analysis
- Negotiation tracking and expiry alerts

### Financial Management
- Dues collection and tracking
- Strike fund management
- Multi-currency support with real-time FX rates
- Stripe integration via Backbone

### Governance
- Elections and voting
- Member engagement tracking
- Compliance and audit trails

### AI Features
- AI Companion (GPT-4)
- Pension forecasting (ML model)
- Grievance outcome prediction
- Member churn prediction
- CBA intelligence

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

# Backbone API
BACKBONE_API_URL=https://api.nzila.com
BACKBONE_API_KEY=
```

## Next Steps

1. ✅ Schema extraction complete
2. ✅ Model generation complete
3. ⏳ Populate this scaffold with generated Django apps
4. 🔜 Migrate BullMQ jobs to Celery tasks
5. 🔜 Migrate TensorFlow.js models to Python (scikit-learn/PyTorch)
6. 🔜 Implement Django RBAC system
7. 🔜 Create frontend API client
8. 🔜 Write comprehensive tests
9. 🔜 Set up CI/CD pipelines
10. 🔜 Deploy to staging environment

## Support

- **Product Lead:** Aubert Nungisa
- **Documentation:** See governance/docs/
- **Issues:** https://github.com/anungis437/nzila-union-eyes/issues
