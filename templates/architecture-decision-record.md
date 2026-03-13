# Architecture Decision Record

> Use this template when creating a new package, platform service, or
> major shared abstraction. See docs/PLATFORM_VS_APP_DECISION_RULE.md.

---

## ADR-XXXX: [Title]

**Date**: YYYY-MM-DD
**Status**: PROPOSED | ACCEPTED | SUPERSEDED
**Author**: [Name]

---

### Context

_What is the problem or need? What triggered this decision?_

### Decision

_What was decided? Where does this capability live (platform service / shared package / app)?_

### Why Platform vs App

_Why does this belong where it was placed?_

- [ ] Cross-app reuse expected
- [ ] Governance or compliance related
- [ ] AI/intelligence related
- [ ] Observability or identity related
- [ ] Control-plane visibility required
- [ ] Domain-specific (app-local)

### Reuse Expectation

_Which apps or packages are expected to consume this?_

### Governance Impact

_Does this affect governance checks, compliance, evidence, or policy enforcement?_

### Alternatives Considered

_What other approaches were evaluated and why were they rejected?_

---

### Metadata

- **Package name**: `@nzila/<name>`
- **Category**: PLATFORM_CORE | DOMAIN_SHARED | APP_SUPPORT | AI_INTELLIGENCE
- **Owner**: [team/vertical]
- **Initial stability**: EXPERIMENTAL | EVOLVING
