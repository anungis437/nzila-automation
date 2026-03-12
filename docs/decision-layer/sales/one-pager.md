# Nzila OS Decision Layer — One-Pager

## What It Is

The Decision Layer is a governed decision-support capability built into the Nzila OS platform. It generates evidence-backed recommendations from anomaly detection, cross-app intelligence, and operational signals — then routes them through a structured human review workflow with full audit trails.

**Tagline:** From signal to reviewed decision — governed, evidenced, and auditable.

---

## How It Works

```
Anomalies + Insights + Signals
        ↓
  8 Decision Rules
        ↓
  Evidence Enrichment
        ↓
  Policy Filtering
        ↓
  Ranking & Prioritisation
        ↓
  Decision Record
        ↓
  Human Review (Control Plane)
        ↓
  Audit Trail + Export Pack
```

Every recommendation includes: evidence references, confidence score, recommended actions, required approvals, and policy context. No decision is auto-executed.

---

## Key Numbers

| Metric | Value |
|--------|-------|
| Decision rules | 8 (staffing, risk, financial, governance, compliance, operations, partner, deployment) |
| Decision categories | 10 |
| Lifecycle statuses | 8 (from GENERATED through EXECUTED/CLOSED) |
| Evidence types | 8 (event, insight, anomaly, metric, policy, snapshot, change, artifact) |
| Export integrity | SHA-256 hash per pack |

---

## Who It's For

| Role | Value |
|------|-------|
| Operations leaders | Prioritised, evidence-backed action queue instead of alert noise |
| Finance / CFO | Financial anomaly review with approval workflows |
| Compliance officers | Auditable decision trail for regulators |
| Procurement teams | Self-verifying evidence packs with integrity hashes |
| IT / Platform admins | Zero-infrastructure add-on — runs within Control Plane |

---

## What Makes It Different

| Differentiator | Detail |
|---------------|--------|
| Evidence-first | Every recommendation links to verifiable anomalies, insights, or metrics |
| Human-reviewed | No autonomous execution — all decisions require human approval |
| Policy-aware | Organisational policies gate which actions can be recommended |
| Auditable | Full lifecycle trail: generated → reviewed → approved → executed |
| Exportable | JSON packs with SHA-256 hashes for independent verification |

---

## Vertical Fit

| Vertical | Key Use Cases |
|----------|--------------|
| **Unions** | Grievance triage, financial irregularity escalation, arbitration review |
| **Assessments** | Scoring variance review, integrity investigation, centre compliance |
| **Agri/Trade** | Shipment risk, pricing anomaly, partner SLA follow-up |

---

## Pricing

| Tier | What's Included |
|------|----------------|
| **Base** | Decision engine, 8 rules, Control Plane integration, audit trail |
| **Add-On** | Export packs, NL query, procurement integration |
| **Enterprise** | Custom rules, multi-org, dedicated support |

Pilot packages available for each vertical (30–60 days).

---

## Next Steps

1. **See it live** — 10-minute demo with seeded decision records
2. **Read the details** — Full capabilities, governance controls, and FAQ
3. **Start a pilot** — 30–60 day scoped deployment with value measurement
