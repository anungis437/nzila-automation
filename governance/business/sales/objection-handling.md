# Decision Layer — Objection Handling

> Common objections and evidence-backed responses for sales conversations.

---

## Category 1: AI Trust & Autonomy

### "We don't trust AI to make decisions for us."

**Response:** The Decision Layer does not make decisions. It generates evidence-backed recommendations that your team reviews and approves. No action is taken without human authorisation. Every decision record explicitly states `review_required: true` and lists the required approvals.

**Proof:** Open any decision in the Control Plane — the policy context shows `execution_allowed` and the required approvals list. The review banner states "no automatic action has been taken."

---

### "How do we know the AI isn't running things behind the scenes?"

**Response:** The audit trail records every state transition with an actor and timestamp. The engine generates a recommendation (status: GENERATED). It cannot move to APPROVED or EXECUTED without a named human reviewer submitting feedback. There is no "auto-approve" or "silent execution" path in the system.

**Proof:** Walk through the DecisionStatus lifecycle: GENERATED → PENDING_REVIEW → APPROVED → EXECUTED. Each transition requires an explicit human action.

---

### "What if the recommendation is wrong or irrelevant?"

**Response:** That's expected and the system is designed for it. Reviewers can reject with notes, and that rejection is part of the audit trail. The confidence score tells the reviewer how reliable the signal is — a 65% score means "worth checking" not "definitely correct." Over time, rejection patterns inform rule refinement.

**Proof:** Show a decision with moderate confidence (e.g., DEC-2026-0003 at 65%). Point out that the reviewer confirmed it was a data entry error — the system flagged correctly, the human identified the root cause.

---

## Category 2: Governance & Compliance

### "Our regulators won't accept AI-generated recommendations."

**Response:** The Decision Layer is designed for regulated environments. Every recommendation is evidence-backed, policy-filtered, and produces a machine-readable audit trail. Export packs include SHA-256 integrity hashes. The system explicitly separates "AI generates" from "human decides" — which is the standard regulatory expectation.

**Proof:** Reference GOVERNANCE_AND_SAFETY.md — 5 immutable principles. Show the PROCUREMENT_APPENDIX.md compliance mapping table.

---

### "We need full audit trails for our board."

**Response:** Every decision has: who generated it (engine version), what evidence supported it, who reviewed it, what they decided, when, and why. Export packs bundle all of this with tamper-evident hashing. The Decision Summary page shows live governance metrics.

**Proof:** Open `/decision-summary` and point to the proof panel (evidence-backed, human-reviewed, approval-gated counts).

---

### "Our procurement team needs to verify this independently."

**Response:** Decision export packs are self-verifying. Each pack includes the full decision record, evidence references, policy context, and a SHA-256 output hash. Your procurement team can compute the hash and confirm the pack hasn't been modified.

**Proof:** Reference the Verification Appendix in the RFP response (Section 9).

---

## Category 3: Technical & Integration

### "How does this fit into our existing systems?"

**Response:** The Decision Layer runs within the Nzila OS Control Plane. It consumes data from the platform's anomaly engine and intelligence engine. Decisions are viewable in the dashboard and exportable as JSON packs. No separate infrastructure or database is required.

**Proof:** Reference the PROCUREMENT_APPENDIX.md deployment requirements table.

---

### "Can we customize the rules?"

**Response:** The 8 built-in rules cover staffing, risk, financial, governance, compliance, operations, partner, and deployment domains. For most use cases, these rules combined with the anomaly and intelligence engines generate relevant recommendations. Custom rules are available in the Enterprise tier.

**Proof:** Reference CAPABILITIES.md decision rules table.

---

### "What's the performance impact?"

**Response:** The Decision Layer is a lightweight rule-based pipeline. It runs during anomaly/signal processing — not in the request path of your applications. Decision records are file-backed JSON. No external database, no network calls, no heavy computation.

**Proof:** Reference the deployment requirements in PROCUREMENT_APPENDIX.md.

---

## Category 4: Cost & Value

### "Why should we pay for this when we already have dashboards?"

**Response:** Dashboards show you data. The Decision Layer tells you what to do about it — with evidence, confidence scores, and approval workflows. The difference is between "here's a chart showing anomalies" and "here's a specific recommendation to investigate X, with this evidence, requiring your approval."

**Proof:** Reference POSITIONING.md positioning matrix — compare Decision Layer vs dashboards/BI.

---

### "What's the ROI?"

**Response:** The value model tracks time saved per decision (manual triage hours vs structured review minutes), compliance cost avoided (fewer audit preparation hours), and risk reduction (critical issues caught before escalation). Pilot metrics prove the ROI before production deployment.

**Proof:** Reference VALUE_MODEL.md ROI framework.

---

### "Can we try before we buy?"

**Response:** Absolutely. We recommend a 30–60 day pilot with your own data. The pilot includes environment setup, user onboarding, live decision generation, and a value measurement report at the end. Pilot pricing is in the PRICING_AND_PACKAGING.md starter tier.

**Proof:** Share the relevant pilot doc (unions-pilot.md, assessments-pilot.md, or agri-trade-pilot.md).
