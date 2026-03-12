# Decision Layer — Competitive Positioning

> How the Decision Layer compares to alternative approaches in the market.

---

## Positioning Matrix

| Capability | Nzila Decision Layer | Generic BI/Dashboards | Alert Management (PagerDuty etc.) | AI Copilots (ChatGPT etc.) | Workflow Automation (Zapier etc.) |
|-----------|---------------------|----------------------|----------------------------------|---------------------------|----------------------------------|
| Evidence-backed recommendations | **Yes** — every decision links to anomalies, insights, metrics | No — shows data, user interprets | No — delivers alerts, no recommendation | Partial — generates text, no evidence chain | No — executes rules, no recommendations |
| Human review workflow | **Yes** — approve/reject/defer with named reviewers | No | No | No | No |
| Policy filtering | **Yes** — org policies gate execution | No | No | No | Partial — rule conditions |
| Audit trail | **Yes** — full lifecycle with actor, timestamp, detail | Partial — access logs only | Partial — incident history | No | Partial — execution logs |
| Confidence scoring | **Yes** — 0–1 confidence per decision | No | No | No | No |
| Export packs with integrity hashes | **Yes** — SHA-256 per pack | No | No | No | No |
| No autonomous execution | **By design** — all decisions require human action | N/A | N/A | Variable — can be configured to act | **Executes automatically by design** |
| Governed by immutable principles | **Yes** — 5 principles, documented boundaries | No | No | No | No |
| Regulatory-ready documentation | **Yes** — procurement appendix, compliance mapping | No | Partial | No | No |

---

## Head-to-Head Comparisons

### vs Dashboards / BI Tools

**They show data.** The Decision Layer tells you what to do about it.

- Dashboards present charts and metrics. The Decision Layer generates a specific, evidence-backed recommendation with a confidence score, ordered actions, and required approvals.
- A dashboard says "this metric is high." The Decision Layer says "investigate this anomaly with this evidence, here are recommended actions, and your compliance officer needs to approve."

**When dashboards are better:** When the user needs to explore data freely without structured recommendations.

**When Decision Layer is better:** When the organisation needs governed, auditable, evidence-backed decision support.

---

### vs Alert Management (PagerDuty, OpsGenie)

**They deliver alerts.** The Decision Layer generates recommendations.

- Alert tools notify you when something crosses a threshold. The Decision Layer evaluates multiple signals, enriches with evidence, applies policy filters, and produces a ranked recommendation with approval requirements.
- Alert fatigue is a real problem. The Decision Layer ranks and prioritises — reviewers see a curated queue, not raw alerts.

**When alerting is better:** For high-frequency, low-context operational notifications (server down, disk full).

**When Decision Layer is better:** For cross-domain decisions requiring evidence, context, and human judgement.

---

### vs AI Copilots (ChatGPT, Copilot, Claude)

**They generate text.** The Decision Layer generates governed decisions.

- AI copilots can answer questions and generate content. They don't produce structured decision records, audit trails, evidence chains, or approval workflows.
- The Decision Layer has explicit governance boundaries: no autonomous execution, policy-filtered, evidence-required. AI copilots have no built-in governance framework.
- AI copilots are general-purpose. The Decision Layer is domain-specific — it understands the organisation's data, policies, and review requirements.

**When copilots are better:** General-purpose knowledge queries, document generation, code assistance.

**When Decision Layer is better:** Structured operational decisions requiring evidence, governance, and auditability.

---

### vs Workflow Automation (Zapier, Power Automate, n8n)

**They execute actions.** The Decision Layer recommends actions.

- Workflow tools automate: "when X happens, do Y." The Decision Layer recommends: "based on this evidence, consider doing Y — but you need to approve first."
- This is the fundamental difference: automation vs advisory. In regulated environments, the advisory model with human approval is often required.
- Workflow tools don't produce audit trails of human review. The Decision Layer does.

**When automation is better:** For routine, low-risk, high-frequency tasks where automatic execution is safe and appropriate.

**When Decision Layer is better:** For decisions requiring human judgement, evidence review, and governance compliance.

---

## Summary: When to Choose the Decision Layer

Choose the Decision Layer when your organisation needs:

1. **Evidence-backed** recommendations, not just data or alerts
2. **Human review** workflows with named approvals
3. **Audit trails** that satisfy regulators and boards
4. **Governed AI** with documented boundaries and immutable principles
5. **Exportable proof** that decisions were properly reviewed and authorised

The Decision Layer is not a replacement for dashboards, alerting, or automation. It fills the gap between "we detected something" and "we made a governed decision about it."
