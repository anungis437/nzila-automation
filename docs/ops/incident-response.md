# Incident Response Playbook

**Owner:** CISO / Platform Engineering
**Review Cadence:** After every P1/P2 incident; quarterly review
**Last Updated:** 2026-03-03

---

## 1. Severity Rubric

| Sev | Name | Examples | Response SLA | Comms Cadence | Postmortem |
|-----|----------|-------------------------------------------|-------------|------------------|------------|
| P1 | Critical | Full outage, data breach, integrity loss | 15 min ack | Every 30 min | Required (5 BD) |
| P2 | Major | Degraded service, failed control, DLQ spike | 1 hr ack | Every 2 hr | Required (10 BD) |
| P3 | Minor | Single-user impact, cosmetic, non-blocking | 4 hr ack | Daily | Optional |
| P4 | Info | Improvement opportunity, low-priority alert | Next BD | None | No |

> **BD** = business days.

---

## 2. Incident Lifecycle

```
Detect → Triage → Contain → Eradicate → Recover → PIR
```

### 2.1 Detect & Triage
1. Alert fires via PagerDuty / Slack `#ops-alerts` / Teams `Ops Alerts`.
2. On-call acknowledges within SLA (see [on-call.md](on-call.md)).
3. Create incident ticket: `INC-{YYYY}-{NNN}`.
4. Assign severity using rubric above.
5. Open a dedicated Slack channel: `#inc-{id}`.

### 2.2 Contain
- Isolate affected tenant(s) via `@nzila/platform-isolation`.
- Disable the faulty integration / feature flag.
- Preserve logs & audit trail snapshot **before** any mutation.

### 2.3 Eradicate
- Identify root cause (code, config, infra).
- Deploy hotfix or rollback (`pnpm build:<app>`, re-deploy).
- Rotate any compromised credentials **immediately**.

### 2.4 Recover
- Restore from last known-good state.
- Verify data integrity via hash-chain audit.
- Re-enable isolated tenants / flags.
- Monitor for 30 min before declaring resolved.

### 2.5 Post-Incident Review (PIR)
- Complete within 5 BD (P1) / 10 BD (P2).
- Template: `/ops/incident-response/templates/pir-template.md`.
- Archive evidence pack to `evidence/{org_id}/incident-response/`.

---

## 3. Communication Templates

### 3.1 Initial Notification (Internal)

```
Subject: [P{SEV}] INC-{ID} — {Short description}

Status: INVESTIGATING
Impact: {Affected apps / tenants / regions}
On-call: {Name}
Channel: #inc-{id}
Next update: {time}
```

### 3.2 Status Update

```
Subject: [P{SEV}] INC-{ID} — UPDATE #{N}

Status: INVESTIGATING | IDENTIFIED | MITIGATED | RESOLVED
Root cause: {Known / TBD}
Actions taken: {List}
Next update: {time}
```

### 3.3 Customer Notification (External)

```
Subject: Service Incident — {Short description}

We are aware of an issue affecting {service}.
Current status: {status}.
We are actively working to resolve this and will provide updates every {cadence}.

If you have questions, contact support@nzila.io.
```

### 3.4 Resolution Notification

```
Subject: [RESOLVED] INC-{ID} — {Short description}

The incident has been resolved at {timestamp}.
Root cause: {summary}.
Duration: {duration}.
A detailed postmortem will be published within {N} business days.
```

---

## 4. Escalation Matrix

| Condition | Escalate To | Method |
|-----------|-------------|--------|
| P1 not ack'd in 15 min | Tech Lead + CTO | Phone + Slack |
| P2 not ack'd in 1 hr | Tech Lead | Slack DM |
| Data breach suspected | CISO + Legal | Phone + Email |
| Customer-facing outage >30 min | VP Ops + Comms | Slack + Email |

---

## 5. Evidence Requirements

Every P1/P2 incident **must** produce:

| Artifact | Format | Storage Path |
|----------|--------|-------------|
| Postmortem | PDF | `evidence/{org_id}/incident-response/{YYYY}/{MM}/postmortem/{inc_id}/` |
| Audit trail export | JSON | `evidence/{org_id}/incident-response/{YYYY}/{MM}/audit-trail/{inc_id}/` |
| Containment log | JSON | `evidence/{org_id}/incident-response/{YYYY}/{MM}/containment-log/{inc_id}/` |
| Remediation tracker | JSON | `evidence/{org_id}/incident-response/{YYYY}/{MM}/remediation/{inc_id}/` |

All artifacts uploaded via `@nzila/blob` with SHA-256 hashing and 7-year retention.

---

## 6. Console Integration

Operators can access incident tooling from **Console → System Health**:
- View active incidents and status
- Trigger isolation for affected tenants
- Export audit trail for incident window
- Link to runbooks: [runbooks/](runbooks/)

---

## Related Documents

- [On-Call Rotation](on-call.md)
- [Runbooks](runbooks/)
- [SLO Policy](../../ops/slo-policy.yml)
- [Proof Pack](../../apps/console/app/(dashboard)/proof-pack/)
