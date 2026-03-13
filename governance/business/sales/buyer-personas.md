# Decision Layer — Buyer Personas

> Detailed profiles of primary buyers, their motivations, pain points, and how the Decision Layer addresses each.

---

## Persona 1: Operations Leader

**Title:** VP Operations, Director of Operations, Head of Service Delivery

**Context:** Manages day-to-day operational workflows across teams. Responsible for service levels, escalation management, and team productivity. Drowning in dashboards and alert noise.

**Pain Points:**
- Too many alerts, not enough actionable intelligence
- Manual triage takes hours; critical issues get buried
- Decisions are made ad-hoc in chat/email — no audit trail
- Board asks "how do we know the right decisions are being made?" — no good answer

**What They Want:**
- A prioritised queue of evidence-backed recommendations
- Clear severity and confidence so they know what to act on first
- An audit trail that proves decisions were reviewed and considered

**Decision Layer Value:**
- Summary cards show what needs attention now (pending review, critical open)
- Each recommendation has specific evidence and ordered actions
- Review workflow captures who decided what and why

**Key Message:** "Stop triaging alerts manually. The Decision Layer gives your team a prioritised, evidence-backed action queue — and proves every decision was reviewed."

---

## Persona 2: CFO / Finance Director

**Title:** Chief Financial Officer, Finance Director, Head of Finance

**Context:** Oversees financial governance, budget compliance, and expenditure approvals. Concerned about financial anomalies going unnoticed and unauthorised spending.

**Pain Points:**
- Financial anomalies discovered too late (quarterly audits, not real-time)
- Manual expense review doesn't scale across business units
- Audit trail for financial decisions is fragmented across systems
- Regulators ask for evidence of financial controls — takes weeks to compile

**What They Want:**
- Automatic flagging of financial deviations as they occur
- Approval workflow for financial decisions with named reviewers
- Exportable evidence packs for auditors and regulators

**Decision Layer Value:**
- FINANCIAL category decisions surface pricing, expense, and budget anomalies
- CRITICAL financial decisions require named approvals (e.g., finance officer + leadership)
- Export packs with SHA-256 hashes satisfy audit requirements

**Key Message:** "Financial anomalies flagged in real-time, reviewed by your finance team, with an audit trail your regulators will accept."

---

## Persona 3: Compliance / Risk Officer

**Title:** Chief Risk Officer, Head of Compliance, Risk & Governance Manager

**Context:** Ensures the organisation meets regulatory requirements and manages risk registers. Needs to demonstrate that decision-making processes are governed, documented, and auditable.

**Pain Points:**
- AI tools in the organisation with no governance framework
- Risk decisions made without documentation or accountability
- Board-level risk reports rely on manual data collection
- Regulators increasingly asking for AI governance evidence

**What They Want:**
- A governed AI system with clear boundaries (what it can and cannot do)
- Immutable audit trails for every AI-generated recommendation
- Evidence that human oversight is maintained at every step
- Exportable governance packs for regulatory review

**Decision Layer Value:**
- 5 immutable governance principles — documented and enforced
- "What This Is Not" table explicitly excludes autonomous execution
- Full lifecycle audit: GENERATED → REVIEWED → APPROVED/REJECTED
- Decision Summary page shows governance metrics in real-time

**Key Message:** "The Decision Layer is the governed AI system your compliance team has been asking for — with the audit trail, oversight, and evidence to prove it."

---

## Persona 4: Procurement Lead

**Title:** Procurement Manager, Head of Procurement, Vendor Management Lead

**Context:** Evaluates platform capabilities during procurement processes. Needs to verify vendor claims, assess governance controls, and provide evidence to evaluation committees.

**Pain Points:**
- Vendor claims don't match actual capabilities
- Governance documentation is vague or marketing-oriented
- No way to independently verify platform controls
- Committee needs structured evidence — not slide decks

**What They Want:**
- Technical documentation that matches live system capabilities
- Self-verifying evidence packs they can validate independently
- Clear pricing and packaging with no hidden costs
- Pilot options with measurable success criteria

**Decision Layer Value:**
- PROCUREMENT_APPENDIX.md provides full schema, rules inventory, and compliance mapping
- Export packs include SHA-256 hashes — independently verifiable
- Pricing tiers are transparent with pilot-to-production pathway
- Pilot docs define specific success metrics and timelines

**Key Message:** "Every claim in our materials maps to a live capability. Export a decision pack and verify it yourself — SHA-256 hashes, full audit trail, no marketing fluff."

---

## Persona 5: IT / Platform Lead

**Title:** CTO, Head of Platform, IT Director, DevOps Lead

**Context:** Responsible for platform architecture, integration, and operational reliability. Evaluates new capabilities for technical fit, deployment complexity, and maintenance burden.

**Pain Points:**
- New "AI" tools require separate infrastructure, databases, and APIs
- Integration complexity increases operational risk
- Unclear what the system actually does vs what the marketing says
- Concerned about vendor lock-in and data portability

**What They Want:**
- Zero-infrastructure add-on — runs within existing deployment
- Clear API and data format documentation
- No external dependencies or network calls
- Exportable data in standard formats

**Decision Layer Value:**
- Runs within the Control Plane — no separate database or infrastructure
- File-backed JSON storage — no external database dependency
- Decision records follow a documented schema (DecisionRecord type)
- Export packs are standard JSON with SHA-256 integrity verification

**Key Message:** "The Decision Layer runs inside the platform you already have. No new infrastructure, no new databases, no new attack surface. File-backed, schema-validated, exportable JSON."
