---
id: sec-001
title: Data Breach Response Runbook
severity: P1
owner: "@nzila/security"
review_cycle: quarterly
last_reviewed: 2026-02-20
---

# Data Breach Response Runbook

## Triage Checklist (First 15 Minutes)

- [ ] **Confirm** the breach is real (not a false positive) — check audit logs, access logs
- [ ] **Identify** affected data types: PII, financial, credentials, audit events, Org data
- [ ] **Scope** affected entities (Orgs) by querying `audit_events` with the suspected timeframe
- [ ] **Page** the on-call engineer and CISO via PagerDuty (`P1` escalation)
- [ ] **Preserve** evidence — snapshot Azure Monitor logs, download relevant `audit_events`
- [ ] **Do NOT** alert affected users yet — await CISO sign-off on the breach scope

---

## Detection Sources

| Source | How to Check |
|--------|-------------|
| Azure Monitor anomaly | Azure Portal → Monitor → Alerts |
| Audit chain broken | `SELECT * FROM audit_events WHERE hash != compute_expected_hash()` |
| Gitleaks secret found | GitHub Security tab → Secret scanning alerts |
| Stripe suspicious activity | Stripe Dashboard → Radar → Reviews |
| Unusual login pattern | Clerk dashboard → User activity |

---

## Containment (First Hour)

### If credentials are compromised

```bash
# Rotate Clerk API keys
# The new key must be set in Azure Key Vault BEFORE redeploying
az keyvault secret set --vault-name nzila-kv --name CLERK-SECRET-KEY --value "new_key"

# Trigger a rolling deploy to pick up the new secret
gh workflow run release-train.yml
```

### If database is compromised

```bash
# Revoke all DB connections immediately
az postgres flexible-server restart --resource-group nzila-rg --name nzila-db

# Rotate database password
az keyvault secret set --vault-name nzila-kv --name DATABASE-URL --value "postgres://..."

# Verify audit chain integrity
psql $DATABASE_URL -c "SELECT verify_audit_chain();"
```

### If Azure Blob storage is compromised

```bash
# Rotate SAS tokens (they expire — verify the expiry)
az storage account keys renew --account-name nzilablob --key primary

# Lock the evidence container (immutable already, but confirm)
az storage container immutability-policy show \
  --account-name nzilablob \
  --container-name evidence
```

---

## Eradication

1. Identify and patch the root cause (vulnerability, misconfiguration, credential exposure)
2. Scan all secrets in the repo: `pnpm gitleaks detect --source .`
3. Verify no backdoors were introduced in recent commits: `git log --diff-filter=A --name-only main~50..HEAD`
4. Re-run CodeQL on the affected codebase: trigger `codeql.yml` workflow manually

---

## Notification Requirements

| Regulation | Deadline | Trigger |
|------------|----------|---------|
| GDPR (EU users) | 72 hours to DPA | Any PII breach |
| CCPA (CA users) | Expedient notice | Unencrypted personal information |
| PCI DSS | Immediately | Cardholder data compromise |
| SOC 2 | Per contractual obligations | All material breaches |

**Draft notification template**: `ops/incident-response/templates/breach-notification.md`

---

## Post-Incident

- [ ] Document timeline in `ops/incident-response/incidents/` with date prefix
- [ ] File a post-mortem (5 whys) within 48 hours of resolution
- [ ] Update this runbook if any step was unclear or missing
- [ ] Review and tighten relevant CODEOWNERS and permission grants

---

## Contacts

| Role | Contact |
|------|---------|
| On-call engineer | PagerDuty rotation |
| CISO | ciso@nzila.app |
| Legal | legal@nzila.app |
| PR/Communications | comms@nzila.app |
| Stripe security | security@stripe.com |
| Clerk security | security@clerk.dev |
