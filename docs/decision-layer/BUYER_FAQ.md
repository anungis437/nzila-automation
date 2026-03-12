# Nzila OS Decision Layer — Buyer FAQ

## General

### What is the Decision Layer?

The Decision Layer is a cross-app operational recommendation system built into Nzila OS. It analyses anomalies, intelligence signals, governance state, and operational events to produce structured, evidence-backed decision recommendations. Every recommendation requires human review before any action is taken.

### Is this an AI chatbot?

No. The Decision Layer is **not** a chatbot. It does not generate free-form text responses. It produces structured decision records with typed evidence, confidence scores, and explicit approval workflows. There is no conversational interface that can be manipulated through prompt injection.

### Does it make decisions automatically?

No. Every decision is a **recommendation**. The system uses an eight-state lifecycle where decisions must be explicitly reviewed, approved, and executed by authorised human operators. No organisational state is modified without human action.

### What kind of decisions does it support?

The system covers ten categories: staffing, risk, financial, governance, compliance, operations, partner management, customer-facing issues, deployment decisions, and emerging patterns. Each category is served by deterministic rules that match specific signal patterns.

### Can we add custom decision rules?

The rules architecture supports extension. Custom rules follow the same interface — they receive platform signals and produce structured decision records with evidence refs. Custom rules inherit the same policy evaluation, audit trail, and approval workflow.

---

## Governance & Safety

### How is governance enforced?

- Every decision is recommendation-first — no autonomous execution
- Evidence refs link each decision to source anomalies, insights, and policies
- Confidence scores (0.0–1.0) are transparent and visible in every surface
- HIGH and CRITICAL decisions require explicit approval
- The Policy Engine can block execution in protected environments
- Full audit trail logs every lifecycle event with actor and timestamp

### What happens if we reject a decision?

Rejected decisions are logged with the rejecting actor, timestamp, and reason. They move to REJECTED status and then CLOSED. The rejection is part of the permanent audit trail. No further action occurs.

### Can the system execute actions without review?

No. The architecture enforces recommendation-first design. Even if a decision is generated with `execution_allowed: true` in the policy context, a human must explicitly move it to APPROVED and then EXECUTED status. There are no bypass mechanisms.

### How is the audit trail protected?

Audit entries are persisted as JSON files with decision ID, event type, actor, timestamp, and detail. Decision export packs include SHA-256 integrity hashes. The audit trail is append-only and cannot be modified through the decision engine API.

### What is the confidence score?

The confidence score (0.0–1.0) reflects the engine's certainty based on signal strength, evidence density, and rule specificity. It is always visible to reviewers. A score of 0.85 means the engine has high confidence but acknowledges uncertainty. The score is never presented as fact.

---

## Technical

### What signals does it consume?

| Signal Source | Package | Signal Type |
|---------------|---------|-------------|
| Anomaly Engine | `@nzila/platform-anomaly-engine` | Anomalies (6 types) |
| Intelligence Layer | `@nzila/platform-intelligence` | Cross-app insights, operational signals |
| Change Management | `@nzila/platform-change-management` | Change records |
| Governance | `@nzila/platform-governance` | Governance status |
| Environment | `@nzila/platform-environment` | Environment protection levels |

### How are decisions stored?

Decisions are persisted as JSON files under `ops/decisions/` with one file per decision record. Feedback is stored under `ops/decision-feedback/` and audit entries under `ops/decision-audit/`. This file-backed storage is inspectable and exportable.

### How does it integrate with the Control Plane?

The Control Plane includes dedicated decision pages:
- `/decisions` — Summary cards, critical decisions table, pending review table, and full decision list
- `/decisions/[id]` — Detail page with evidence panel, recommended actions, policy context, and review history
- `/decision-summary` — Buyer-friendly overview by category, severity, and business domain

### Is the engine deterministic?

Yes. The eight built-in rules are deterministic signal-pattern matchers. Given the same input signals, they produce the same decisions. There is no probabilistic language model in the decision generation path. Confidence scores are computed from signal metrics, not model uncertainty.

### What about data residency?

Decision records are stored locally within the deployment. No decision data leaves the deployment boundary unless explicitly exported. The file-backed storage model means decisions live alongside your operational data, not in a third-party cloud.

---

## Procurement

### Can we include the Decision Layer in RFP responses?

Yes. The Decision Layer is supported in the Nzila OS procurement evidence system. Decision governance can be included in procurement packs with evidence of audit trails, policy enforcement, and confidence transparency.

### Is there an export format for compliance review?

Yes. Decision export packs contain the full decision record, evidence refs, policy context, governance snapshot, and a SHA-256 integrity hash. Packs can be generated on demand for individual decisions or in bulk.

### How do we evaluate the Decision Layer in a pilot?

Pilot programmes are available for each vertical market (unions, assessments, agri/trade). Pilots run 30–90 days with defined decision categories, review workflows, and measurable success metrics. See the pilot documentation for your market.
