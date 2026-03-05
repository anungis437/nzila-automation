# Infrastructure — GitOps Configuration
#
# Environment-based deployment configuration for Nzila OS.
# Uses Azure Container Apps with Bicep IaC templates.
#
# Structure:
#   environments/          — Per-environment config
#   deployment-manifests/  — Container App templates
#   README.md              — This file

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitOps Deployment Flow                        │
│                                                                 │
│  GitHub PR ──► CI Tests ──► Build Images ──► Deploy to Env      │
│                                                                 │
│  main branch     → staging (auto-deploy)                        │
│  release/* tags  → production (manual approval)                 │
│  feature/*       → preview environment (auto-teardown)          │
└─────────────────────────────────────────────────────────────────┘
```

## Environments

| Environment | Purpose | Auto-Deploy | Approval |
|-------------|---------|-------------|----------|
| development | Feature testing | On PR | None |
| staging | Integration testing | On merge to main | None |
| production | Live traffic | On release tag | Required (2 reviewers) |

## Usage

```bash
# Deploy to staging
gh workflow run gitops-deploy.yml -f environment=staging -f version=latest

# Promote to production
gh workflow run gitops-deploy.yml -f environment=production -f version=v1.2.3
```
