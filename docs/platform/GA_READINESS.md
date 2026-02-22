# GA Readiness Report — Union Eyes & ABR Insights

> **NzilaOS GA Gate v2 — Full Stop Checklist**
> 
> This document is the authoritative GO/NO-GO record for both Union Eyes (`apps/union-eyes`)
> and ABR Insights (`tech-repo-scaffold/django-backbone`) against the NzilaOS GA Gate v2
> criteria.  Each row maps to a CI gate ID, an evidence artifact, and a pass/fail signal.
>
> **Last updated**: Automatically updated by governance CI on every `main` merge.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Gate implemented and passing |
| 🔴 | Gate implemented but blocking (currently failing) |
| ⬜ | Gate not yet implemented — MUST be resolved before GA |
| 🔒 | Security gate — failure is non-negotiable |
| 📦 | Evidence artifact committed to CI |

---

## Section 1 — Shared Platform Gates (NzilaOS monorepo)

These gates apply to the root monorepo and are required for any vertical to ship.

| Gate ID | Check | Status | Evidence Artifact | CI Job |
|---------|-------|--------|-------------------|--------|
| SEC-01 | Secret scanning (gitleaks) — no plaintext secrets | ✅ 🔒 | N/A — blocks PR | `secret-scan` |
| SEC-02 | Dependency audit — no CRITICAL CVEs (`pnpm audit`) | ✅ 🔒 | `audit-report.json` | `dependency-audit` |
| SEC-03 | Trivy FS scan — BLOCKING on CRITICAL (exit-code: 1) | ✅ 🔒 | `trivy-results.sarif` | `trivy` |
| SEC-04 | No `|| true` on security-gating CI steps | ✅ 🔒 | `ga-check` gate `NO-OR-TRUE-GATES` | `governance-gate` |
| OPS-01 | SBOM generated (CycloneDX, no `|| true`) | ✅ 📦 | `sbom.json` | `sbom` |
| OPS-02 | Evidence pack sealed + verified (pack.json + seal.json) | ✅ 📦 | `governance-evidence-<run_id>` | `evidence-pack` |
| OPS-03 | Evidence seal contract tests passing | ✅ | contract-tests suite | `verify-seal` |
| GOV-01 | GA-Check TRIVY-BLOCKING gate passes | ✅ | `governance/ga/` report | `governance-gate` |
| GOV-02 | GA-Check NO-OR-TRUE-GATES gate passes | ✅ | `governance/ga/` report | `governance-gate` |
| GOV-03 | GA-Check EVIDENCE-ARTIFACTS gate passes | ✅ | `governance/ga/` report | `governance-gate` |
| GOV-04 | Org terminology enforced (no "tenant"/"entity" in docs/) | ✅ | Docs reviewed | `governance-gate` |

---

## Section 2 — Union Eyes (apps/union-eyes)

Union Eyes is a Next.js 16 companion app consuming `@nzila/os-core` for evidence sealing.

### 2.1 Evidence Pipeline (PR-UE-01, PR-UE-02)

| Gate ID | Check | Status | Evidence Artifact | CI Job |
|---------|-------|--------|-------------------|--------|
| UE-EVD-01 | Evidence scripts exist (`collect.mjs`, `seal.mjs`, `verify.mjs`) | ✅ 📦 | `apps/union-eyes/scripts/evidence/` | `ue-evidence` |
| UE-EVD-02 | Scripts import `@nzila/os-core/evidence/seal` — NOT custom crypto | ✅ 🔒 | Source code + contract test | `contract-tests` |
| UE-EVD-03 | `package.json` wires evidence scripts (`evidence:collect`, `:seal`, `:verify`, `:all`) | ✅ | `apps/union-eyes/package.json` | `ue-evidence` |
| UE-EVD-04 | `verify.mjs` exits 1 when pack.json is missing | ✅ 🔒 | Contract test UE-EVD-04 | `contract-tests` |
| UE-EVD-05 | `verify.mjs` rejects pack-without-seal | ✅ 🔒 | Contract test UE-EVD-05 | `contract-tests` |
| UE-EVD-06 | `@nzila/os-core` listed as workspace dependency | ✅ | `apps/union-eyes/package.json` | N/A |

### 2.2 CI Governance Wiring (PR-UE-01, PR-UE-03)

| Gate ID | Check | Status | Evidence Artifact | CI Job |
|---------|-------|--------|-------------------|--------|
| UE-CI-01 | `ue-evidence` job runs collect → seal → verify in CI | ✅ 🔒 | CI run log | `ue-evidence` |
| UE-CI-02 | `ue-evidence` job uploads pack.json + seal.json as retained artifact | ✅ 📦 | `ue-evidence-<run_id>` | `ue-evidence` |
| UE-CI-03 | `governance-gate` fails if `ue-evidence` fails | ✅ 🔒 | CI run log | `governance-gate` |
| UE-CI-04 | `ue-evidence` seal key sourced from CI secret `EVIDENCE_SEAL_KEY` | ✅ 🔒 | `.github/workflows/nzila-governance.yml` | `ue-evidence` |

### 2.3 Open Items

| ID | Description | Owner | Target |
|----|-------------|-------|--------|
| UE-OPEN-01 | `workflow_call` migration documentation for consuming apps | Platform | Pre-GA |

---

## Section 3 — ABR Insights (tech-repo-scaffold/django-backbone)

ABR Insights is the strictest NzilaOS vertical:
- `requiresDualControl: true`
- `requiresConfidentialReporting: true`
- Org-scoped identity vault with AES-256-GCM encryption

### 3.1 Identity Vault (PR-ABR-02, PR-ABR-03)

| Gate ID | Check | Status | Evidence Artifact | CI Job |
|---------|-------|--------|-------------------|--------|
| ABR-VAULT-01 | `AbrReporterIdentity` table exists with `vault_id` (opaque UUID) | ✅ | Migration `0001_initial.py` | `abr-evidence` |
| ABR-VAULT-02 | `reporter_vault_id` on `AbrCase` is a plain UUIDField (not FK) | ✅ 🔒 | Contract test ABR-VAULT-01 | `contract-tests` |
| ABR-VAULT-03 | `encryptIdentity` / `decryptIdentity` — no plaintext in ciphertext output | ✅ 🔒 | Contract test ABR-VAULT-01 | `contract-tests` |
| ABR-VAULT-04 | Random IV → different ciphertext per call | ✅ 🔒 | Contract test ABR-VAULT-02 | `contract-tests` |
| ABR-VAULT-05 | Wrong-key decryption throws (no silent failure) | ✅ 🔒 | Contract test ABR-VAULT-03 | `contract-tests` |
| ABR-VAULT-06 | Round-trip encrypt → decrypt produces original identity | ✅ | Contract test ABR-VAULT-04 | `contract-tests` |

### 3.2 Dual-Control (PR-ABR-05)

| Gate ID | Check | Status | Evidence Artifact | CI Job |
|---------|-------|--------|-------------------|--------|
| ABR-DC-01 | Self-approval rejected for all 3 sensitive actions | ✅ 🔒 | Contract test ABR-DC-01 | `contract-tests` |
| ABR-DC-02 | `AbrSensitiveActionApproval.clean()` enforces self-approval ban | ✅ 🔒 | Django model test ABR-MDL-05 | `abr-evidence` |
| ABR-DC-03 | No-approval attempt is rejected | ✅ 🔒 | Contract test ABR-DC-02 | `contract-tests` |
| ABR-DC-04 | Valid 2-actor approval succeeds | ✅ | Contract test ABR-DC-03 | `contract-tests` |
| ABR-DC-05 | All 3 sensitive actions covered: `case-close`, `severity-change`, `identity-unmask` | ✅ 🔒 | Contract test ABR-DC-06 | `contract-tests` |

### 3.3 Need-to-Know (PR-ABR-04)

| Gate ID | Check | Status | Evidence Artifact | CI Job |
|---------|-------|--------|-------------------|--------|
| ABR-NTK-01 | `evaluateCaseAccess` tiers: `metadata`, `case-details`, `identity-access` | ✅ 🔒 | Contract tests ABR-NTK-01 through ABR-NTK-03 | `contract-tests` |
| ABR-NTK-02 | Expired grants are denied | ✅ 🔒 | Contract test ABR-NTK-07 + Django test ABR-MDL-06 | `contract-tests` |
| ABR-NTK-03 | Grants are non-transferable (cross-user grant rejected) | ✅ 🔒 | Contract test ABR-NTK-08 | `contract-tests` |
| ABR-NTK-04 | `AbrCaseTeamMember` (case, user) uniqueness enforced at DB level | ✅ 🔒 | Django test ABR-MDL-07 | `abr-evidence` |

### 3.4 Migrations (PR-ABR-03)

| Gate ID | Check | Status | Evidence Artifact | CI Job |
|---------|-------|--------|-------------------|--------|
| ABR-MIG-01 | `0001_initial.py` creates all 7 ABR tables | ✅ 📦 | Migration file | `abr-evidence` |
| ABR-MIG-02 | All ABR tables have `org_id` field + compound index | ✅ 🔒 | Migration + Django model tests ABR-MDL-02 | `abr-evidence` |
| ABR-MIG-03 | `apps.compliance` in `INSTALLED_APPS` | ✅ | `config/settings/base.py` | N/A |

### 3.5 Security Gates (PR-ABR-01)

| Gate ID | Check | Status | Evidence Artifact | CI Job |
|---------|-------|--------|-------------------|--------|
| ABR-SEC-01 | `pip-audit` runs blocking on CRITICAL CVEs (no `|| true`) | ✅ 🔒 | `ci-outputs/audit-report.json` | `abr-evidence` |
| ABR-SEC-02 | Trivy FS scan BLOCKING on CRITICAL (exit-code: 1) | ✅ 🔒 | `abr-trivy-results.sarif` | `abr-evidence` |
| ABR-SEC-03 | ABR evidence collect → seal → verify pipeline runs in CI | ✅ 🔒 | `abr-evidence-<run_id>` | `abr-evidence` |
| ABR-SEC-04 | ABR evidence seal key from CI secret only (`EVIDENCE_SEAL_KEY`) | ✅ 🔒 | Workflow YAML | `abr-evidence` |
| ABR-SEC-05 | `governance-gate` fails if `abr-evidence` fails | ✅ 🔒 | CI run log | `governance-gate` |

### 3.6 Open Items

| ID | Description | Owner | Target |
|----|-------------|-------|--------|
| ABR-OPEN-01 | ABR evidence export endpoint (`/api/abr/evidence/export/`) | ABR Squad | Sprint +1 |
| ABR-OPEN-02 | ABR Django views for dual-control workflow (request + approve) | ABR Squad | Sprint +1 |
| ABR-OPEN-03 | ABR need-to-know middleware guard (enforce team membership per request) | ABR Squad | Sprint +1 |
| ABR-OPEN-04 | Contract test for ABR evidence export response schema | Platform | Sprint +2 |

---

## Section 4 — Evidence Artifact Paths

All artifacts are retained for **365 days** in GitHub Actions.

| Vertical | Artifact Name | Contents |
|----------|--------------|----------|
| Monorepo | `governance-evidence-<run_id>` | `evidence-output/pack.json`, `seal.json` |
| Union Eyes | `ue-evidence-<run_id>` | `apps/union-eyes/evidence-output/pack.json`, `seal.json` |
| ABR Insights | `abr-evidence-<run_id>` | `evidence-output/pack.json`, `seal.json`, `ci-outputs/audit-report.json` |

CI secret required: `EVIDENCE_SEAL_KEY` (≥ 32 bytes, stored as GitHub Actions secret).

---

## Section 5 — GA Gate v2 GO/NO-GO Summary

| Vertical | Open Blockers | Status |
|----------|--------------|--------|
| **NzilaOS Monorepo** | 0 | ✅ **GO** |
| **Union Eyes** | 1 (UE-OPEN-01 — docs only, non-blocking) | ✅ **GO** |
| **ABR Insights** | 4 (ABR-OPEN-01 through ABR-OPEN-04 — views/endpoint, not gate infra) | 🟡 **CONDITIONAL GO** — evidence pipeline and all security gates are wired; business-logic views are deferred to Sprint +1 |

> **GA Gate v2 verdict**: The evidence pipeline, dual-control contracts, need-to-know contracts, identity vault contracts, all `|| true` removals, Trivy blocking mode, and Org terminology are complete.  The four open ABR items are feature work (not gate failures) and must ship before the compliance capability is user-facing.

---

*Generated by: NzilaOS governance tooling — `tooling/ga-check/ga-check.ts`*
*Managed in: `docs/platform/GA_READINESS.md`*
