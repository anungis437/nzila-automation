# Decision Layer — Procurement Appendix

> Technical and governance evidence for inclusion in procurement packs, RFP responses, and compliance assessments.

---

## 1. System Architecture Summary

| Component | Description |
|-----------|------------|
| Decision Engine | Rule-based pipeline: 8 decision rules, evidence enrichment, policy filtering, ranking |
| Storage | File-backed JSON records under `ops/decisions/`, `ops/decision-feedback/`, `ops/decision-audit/` |
| Control Plane | Next.js dashboard for viewing, reviewing, and managing decisions |
| Export | Structured JSON packs with SHA-256 hash for integrity verification |
| Integration | Consumes from Anomaly Engine, Intelligence Engine, Governance, Change Management |

### Data Flow

```
Anomalies / Insights / Signals
        ↓
  Decision Rules (8 rules)
        ↓
  Evidence Enrichment
        ↓
  Policy Filtering
        ↓
  Ranking (severity × confidence)
        ↓
  Decision Record (persisted)
        ↓
  Human Review (Control Plane)
        ↓
  Audit Trail / Export Pack
```

---

## 2. Decision Record Schema

Each decision record contains:

| Field | Type | Purpose |
|-------|------|---------|
| `decision_id` | String | Unique identifier (format: `DEC-YYYY-NNNN`) |
| `org_id` | String | Organisation scope |
| `category` | Enum (10 values) | Business domain (STAFFING, RISK, FINANCIAL, etc.) |
| `type` | Enum (4 values) | RECOMMENDATION, ESCALATION, REVIEW_REQUEST, PRIORITIZATION |
| `severity` | Enum (4 values) | LOW, MEDIUM, HIGH, CRITICAL |
| `title` | String | Human-readable title |
| `summary` | String | Concise description |
| `explanation` | String | Detailed reasoning |
| `confidence_score` | Number (0–1) | Engine confidence |
| `generated_by` | Object | Source engine, version |
| `evidence_refs` | Array | Links to anomalies, insights, metrics, policies |
| `recommended_actions` | Array | Ordered list of suggested actions |
| `required_approvals` | Array | Roles that must review before execution |
| `review_required` | Boolean | Whether human review is mandatory |
| `policy_context` | Object | Execution allowed flag + policy reasons |
| `environment_context` | Object | Environment + protection status |
| `status` | Enum (8 values) | Lifecycle state |
| `generated_at` | ISO 8601 | Timestamp |
| `expires_at` | ISO 8601 (optional) | Expiry timestamp |
| `reviewed_by` | Array (optional) | Reviewer identifiers |
| `review_notes` | Array (optional) | Review comments |
| `outcome` | Object (optional) | Final disposition |

---

## 3. Decision Rules Inventory

| # | Rule | Trigger | Category | Type |
|---|------|---------|----------|------|
| 1 | Staffing Anomaly | Anomaly with metric matching staffing keywords | STAFFING | RECOMMENDATION |
| 2 | Risk Escalation | HIGH/CRITICAL anomaly with >2 evidence refs | RISK | ESCALATION |
| 3 | Financial Review | Anomaly with metric matching finance keywords | FINANCIAL | REVIEW_REQUEST |
| 4 | Governance Impact | Active governance status indicates issues | GOVERNANCE | REVIEW_REQUEST |
| 5 | Compliance Gap | Compliance-related insights detected | COMPLIANCE | REVIEW_REQUEST |
| 6 | Operations Alert | Operational signals above threshold | OPERATIONS | RECOMMENDATION |
| 7 | Partner Performance | Partner-related anomalies detected | PARTNER | RECOMMENDATION |
| 8 | Deployment Gate | Pre-deployment changes detected in protected environment | DEPLOYMENT | REVIEW_REQUEST |

---

## 4. Governance Controls

### Immutable Principles

1. **No autonomous execution** — Decisions are recommendations; humans decide
2. **Evidence-backed only** — Every decision links to verifiable data
3. **Policy-filtered** — Organisational policies gate what can be recommended
4. **Auditable** — Full lifecycle in machine-readable audit trail
5. **Exportable** — Decision packs with integrity hashes for external review

### Safety Boundaries

| Capability | Included | Excluded |
|-----------|----------|----------|
| Generate recommendations | Yes | — |
| Present evidence | Yes | — |
| Suggest actions | Yes | — |
| Auto-execute actions | — | Explicitly excluded |
| Override human decisions | — | Explicitly excluded |
| Access production systems directly | — | Explicitly excluded |
| Make financial transactions | — | Explicitly excluded |

### Lifecycle States

```
GENERATED → PENDING_REVIEW → APPROVED → EXECUTED
                           → REJECTED
                           → DEFERRED → (re-enters review)
         → EXPIRED
         → CLOSED
```

---

## 5. Export Pack Format

Decision export packs contain:

```json
{
  "decision_record": { /* full record */ },
  "evidence_refs": [ /* linked evidence */ ],
  "policy_context": { "execution_allowed": true, "reasons": [] },
  "governance_status_snapshot": { /* point-in-time governance state */ },
  "change_status_snapshot": { /* related change records */ },
  "output_hash": "sha256:...",
  "exported_at": "2026-01-15T10:00:00Z"
}
```

The `output_hash` is a SHA-256 digest of the pack contents, enabling tamper detection.

---

## 6. Compliance Mapping

| Requirement | How the Decision Layer Addresses It |
|------------|--------------------------------------|
| Audit trail | Every state change produces a `DecisionAuditEntry` with actor, timestamp, detail |
| Data provenance | Evidence refs link to source anomalies, insights, and metrics |
| Access control | Required approvals enforce reviewer requirements |
| Non-repudiation | Export packs include SHA-256 integrity hashes |
| Separation of duties | Engine generates; humans review; policy gates execution |
| Incident response | Critical decisions surface immediately with review banners |
| Data retention | Decision records persisted with full history; export for long-term archival |

---

## 7. Integration Points

| System | Integration | Direction |
|--------|------------|-----------|
| Anomaly Engine | Anomalies feed decision rules | Input |
| Intelligence Engine | Insights and signals feed decision rules | Input |
| Governance Engine | Governance status gates policy filtering | Input |
| Change Management | Change records inform deployment decisions | Input |
| Control Plane | Dashboard for viewing and reviewing decisions | Output |
| Procurement Pack | Decision summaries included in evidence packs | Output |
| RFP Generator | Decision Layer capabilities feed RFP responses | Output |

---

## 8. Deployment Requirements

| Requirement | Detail |
|------------|--------|
| Runtime | Node.js 20+ |
| Dependencies | Zod (validation), platform packages |
| Storage | File system (ops/ directory) — no external database required |
| Network | No outbound network calls |
| Secrets | None required |
| Infrastructure | Runs within existing Control Plane deployment |

---

## 9. Verification Checklist

For procurement evaluation, verify:

- [ ] Decision records are persisted and retrievable
- [ ] Each decision has evidence refs linking to source data
- [ ] Policy context correctly gates HIGH/CRITICAL decisions
- [ ] Audit entries are created for all state transitions
- [ ] Export packs produce valid SHA-256 hashes
- [ ] The Control Plane displays all decisions with correct status/severity badges
- [ ] No decision is auto-executed — all require human action
- [ ] The Decision Summary page shows live governance metrics
