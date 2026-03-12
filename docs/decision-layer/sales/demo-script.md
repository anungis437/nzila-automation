# Decision Layer — Demo Script

> Repeatable 15-minute demo script for sales teams. Covers all three verticals with a single Control Plane instance.

---

## Pre-Demo Checklist

- [ ] Run `pnpm decision:seed-demo` to populate 5 decision records
- [ ] Start Control Plane: `pnpm dev:control-plane` (port 3010)
- [ ] Verify `http://localhost:3010/decisions` shows 5 records
- [ ] Verify `http://localhost:3010/decision-summary` loads the summary page
- [ ] Have the vertical-specific demo doc open for reference

---

## Demo Flow (15 minutes)

### Opening (2 min)

**Say:** "Let me show you how the Decision Layer works in practice. This is a live instance with real decision records — the same interface your team would use."

**Open:** `http://localhost:3010/decision-summary`

**Talk through:**
- Review banner at top (critical/pending status)
- Value cards: acceptance rate, resolved count, awaiting review, human-reviewed
- Business impact card: category distribution, critical open count
- Proof panel: evidence-backed, human-reviewed, approval-gated, policy-restricted

**Key message:** "Every number on this page comes directly from the decision records. Nothing is projected or estimated."

---

### Scenario Walk-Through (8 min)

**Open:** `http://localhost:3010/decisions`

**Talk through the summary cards:** total, pending review, critical open, executed.

#### Pick 2 decisions based on audience vertical:

**For union audiences:** DEC-2026-0001 (grievance/staffing) + DEC-2026-0002 (financial/critical)

**For assessment audiences:** DEC-2026-0002 (financial — reframe as scoring integrity) + DEC-2026-0004 (partner — reframe as centre compliance)

**For agri/trade audiences:** DEC-2026-0003 (pricing outlier) + DEC-2026-0004 (partner SLA drop)

#### For each decision, click into detail and highlight:

1. **Evidence panel** — "Each recommendation links to the specific anomaly or signal that triggered it. You can click through to verify."
2. **Recommended actions** — "These are ordered suggestions. The reviewer decides which to follow."
3. **Policy context** — "This tells you whether execution is allowed and what approvals are needed."
4. **Required approvals** — "For HIGH and CRITICAL decisions, named reviewers must approve before any action."
5. **Review history** — "If someone has reviewed, you see who, when, and their notes."

**Key message:** "The system generates the recommendation. Your team makes the decision. The audit trail proves it."

---

### Governance & Safety (3 min)

**Stay on any decision detail page.**

**Talk through:**
- "No decision is auto-executed — this is a recommendation, not an action."
- "The review_required flag and required_approvals are enforced by the engine, not optional."
- "Every state change is recorded in the audit trail — generated, reviewed, approved, rejected."
- "Export packs include SHA-256 hashes for tamper detection."

**Open:** `http://localhost:3010/decision-summary`

**Point to:** Proof panel showing evidence-backed and human-reviewed counts.

**Key message:** "This is governed AI. You can demonstrate to auditors, regulators, and boards exactly how each decision was made, by whom, and based on what evidence."

---

### Close (2 min)

**Say:** "What you've seen connects directly to the Decision Layer documentation — every claim in our materials matches a live capability in the platform."

**Transition options:**
- "Would you like to see how this maps to your specific workflows?" → Open vertical-specific demo doc
- "Want to explore the pilot structure?" → Reference the pilot doc
- "Interested in the procurement evidence?" → Export a decision pack

---

## Objection Handling During Demo

| Objection | Response |
|-----------|----------|
| "Is this AI making decisions for us?" | "No. The Decision Layer generates evidence-backed recommendations. Your team reviews, approves, or rejects each one. The system never acts on its own." |
| "What if the recommendation is wrong?" | "The confidence score tells you how reliable the signal is. If a reviewer disagrees, they reject with notes — that rejection is part of the audit trail and improves the system." |
| "Can we customize the rules?" | "The 8 built-in rules cover the most common patterns. Custom rules are available in the Enterprise tier." |
| "How does this integrate with our existing tools?" | "The Decision Layer consumes data from the platform's anomaly and intelligence engines. Export packs can be consumed by any system that reads JSON." |

---

## Post-Demo Follow-Up

1. Send the OVERVIEW.md as a one-pager attachment
2. Share the relevant vertical doc (unions/assessments/agri-trade)
3. Propose a pilot timeline from the pilot docs
4. Offer a live trial with the customer's own data
