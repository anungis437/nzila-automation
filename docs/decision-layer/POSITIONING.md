# Nzila OS Decision Layer — Positioning

## Market Position

The Nzila OS Decision Layer occupies a unique position in the operational software market: it is the **governed AI recommendation layer** that sits between raw signals and human action.

It is **not** a dashboard. Dashboards show data but do not recommend actions.
It is **not** an alerting system. Alerts notify but do not assess, prioritise, or link evidence.
It is **not** a chatbot. Chatbots generate free-form text without structured governance.
It is **not** a workflow automation engine. Automation engines execute without requiring human review.

The Decision Layer **recommends**, **evidences**, **governs**, and **audits** — then waits for a human to decide.

## Tagline

> **From signal to reviewed decision — governed, evidenced, and auditable.**

## Core Differentiators

### 1. Recommendation-First Architecture

Every output is a recommendation, not an action. The system never modifies organisational state without explicit human approval. This is architecturally enforced through an eight-state lifecycle with required transitions.

### 2. Evidence-Backed Decisions

Every recommendation includes typed evidence refs linking to the specific anomalies, insights, metrics, and policy artefacts that triggered it. Buyers can verify exactly why a decision was generated.

### 3. Confidence Transparency

Every decision carries a 0.0–1.0 confidence score computed from signal strength, evidence density, and rule specificity. The score is visible in every surface — no hidden certainty claims.

### 4. Policy-Aware Execution Gating

The Decision Layer integrates with the Platform Policy Engine. Decisions in protected environments or requiring multi-stakeholder approval cannot proceed without policy satisfaction. This is not advisory — it is enforced.

### 5. Full Lifecycle Audit

Every decision event — generation, viewing, approval, rejection, deferral, execution, expiration — is logged with actor, timestamp, and detail. The audit trail is exportable as a tamper-evident decision pack with SHA-256 integrity hashing.

### 6. Domain-Specific Rules, Not Generic AI

Eight purpose-built rules cover staffing, compliance, finance, governance, partner management, and deployment risk. These rules are deterministic and testable, not probabilistic language model outputs.

## Positioning Matrix

| Capability | Dashboards / BI | Alerting | AI Copilots | Workflow Automation | **Decision Layer** |
|------------|-----------------|----------|-------------|--------------------|--------------------|
| Shows data | ✓ | ✗ | ✗ | ✗ | ✓ |
| Notifies | ✗ | ✓ | ✗ | ✗ | ✓ |
| Recommends actions | ✗ | ✗ | Partial | ✗ | ✓ |
| Links evidence | ✗ | ✗ | ✗ | ✗ | ✓ |
| Scores confidence | ✗ | ✗ | ✗ | ✗ | ✓ |
| Requires approval | ✗ | ✗ | ✗ | ✗ | ✓ |
| Enforces policy | ✗ | ✗ | ✗ | Partial | ✓ |
| Audits lifecycle | ✗ | ✗ | ✗ | Partial | ✓ |
| Exports proof | ✗ | ✗ | ✗ | ✗ | ✓ |

## Buyer Message

**For operations leadership:** "Stop reacting to alerts. Start reviewing prioritised, evidence-backed recommendations with clear next steps and approval workflows."

**For risk / compliance:** "Every decision is auditable, policy-aware, and linked to source evidence. No hidden autonomous actions. Full export for compliance review."

**For procurement / governance:** "Verifiable decision governance with confidence scores, evidence refs, and tamper-evident export packs. This is AI you can explain to regulators."

**For IT / platform:** "Deterministic decision rules you can test and version. Structured schema validation. Full integration with the platform event fabric."

## What This Is Not

To maintain trust, the Decision Layer is explicitly positioned against the following:

| Claim We Never Make | Why |
|---------------------|-----|
| "AI-powered autonomous decisions" | Decisions are recommendations requiring human approval |
| "Replaces human judgment" | The system supports and informs judgment, never replaces it |
| "Guaranteed outcomes" | Confidence scores are transparent about uncertainty |
| "Zero-touch operations" | Every decision requires review; execution requires explicit action |
| "Predictive AI" | Rules are deterministic signal-pattern matching, not predictive models |
