# Nzila OS Documentation

Welcome to the Nzila OS documentation. This documentation follows the
[Diátaxis framework](https://diataxis.fr/) — four distinct types of documentation,
each serving a different user need.

## 📖 Documentation Map

### [Tutorials](tutorials/README.md)
**Learning-oriented** — Walk through practical exercises to get started.

| Tutorial | Audience | Time |
|----------|----------|------|
| [Your First App](tutorials/first-app.md) | New developer | 15 min |
| [Adding AI to an App](tutorials/adding-ai.md) | Developer | 20 min |
| [Creating a Package](tutorials/creating-package.md) | Developer | 10 min |
| [Setting Up Observability](tutorials/observability-setup.md) | DevOps | 15 min |
| [Multi-Tenant Data Access](tutorials/multi-tenant.md) | Developer | 20 min |

### [How-To Guides](how-to/README.md)
**Task-oriented** — Step-by-step instructions for specific goals.

| Guide | Category |
|-------|----------|
| [Deploy to Azure](how-to/deploy-azure.md) | Deployment |
| [Add a New Tenant](how-to/add-tenant.md) | Operations |
| [Rotate Secrets](how-to/rotate-secrets.md) | Security |
| [Create Model Card](how-to/create-model-card.md) | AI Governance |
| [Run Chaos Tests](how-to/run-chaos-tests.md) | Resilience |
| [Add OPA Policy](how-to/add-opa-policy.md) | Security |
| [Configure SLOs](how-to/configure-slos.md) | Observability |

### [Reference](reference/README.md)
**Information-oriented** — Technical descriptions of the system.

| Reference | Scope |
|-----------|-------|
| [Architecture](reference/architecture.md) | System design |
| [API Reference](reference/api.md) | HTTP endpoints |
| [Package Catalogue](reference/packages.md) | All packages |
| [Database Schema](reference/schema.md) | Drizzle schema |
| [Policy Engine](reference/policy-engine.md) | RBAC & zero-trust |
| [AI Gateway](reference/ai-gateway.md) | AI routing |
| [Evidence System](reference/evidence.md) | Audit trails |
| [Configuration](reference/configuration.md) | Env vars |

### [Explanation](explanation/README.md)
**Understanding-oriented** — Discuss concepts and design decisions.

| Topic | Domain |
|-------|--------|
| [Why Evidence-First](explanation/evidence-first.md) | Architecture |
| [Org Isolation Model](explanation/org-isolation.md) | Security |
| [Stack Authority](explanation/stack-authority.md) | Architecture |
| [AI Risk Management](explanation/ai-risk-management.md) | AI Governance |
| [SLO Philosophy](explanation/slo-philosophy.md) | Observability |
| [Content vs Governance](explanation/content-governance.md) | Architecture |

### [Runbooks](runbooks/README.md)
**Operational** — Incident response and operational procedures.

| Runbook | Trigger |
|---------|---------|
| [Incident Response](runbooks/incident-response.md) | P1/P2 incident |
| [Database Recovery](runbooks/database-recovery.md) | Data corruption |
| [Secret Compromise](runbooks/secret-compromise.md) | Credential leak |
| [AI Model Rollback](runbooks/ai-model-rollback.md) | Bad model behavior |
| [SLO Breach](runbooks/slo-breach.md) | Error budget burn |
| [Tenant Offboarding](runbooks/tenant-offboarding.md) | Tenant exit |

---

## Existing Documentation

The following docs pre-date the Diátaxis restructure and remain canonical:

- [ARCHITECTURE.md](../ARCHITECTURE.md) — System architecture overview
- [CONTRIBUTING.md](../CONTRIBUTING.md) — Contribution guidelines
- [SECURITY.md](../SECURITY.md) — Security policy
- [README.business.md](../README.business.md) — Business context
- [governance/](../governance/) — AI, business, and security governance
- [ops/](../ops/) — Operational policies and runbooks

## Documentation Quality

All documentation follows these standards:

1. **Accuracy**: Code examples are tested or extracted from real code
2. **Currency**: Updated when referenced code changes (CI-enforced)
3. **Completeness**: Every public API has reference documentation
4. **Accessibility**: Written for the target audience skill level
