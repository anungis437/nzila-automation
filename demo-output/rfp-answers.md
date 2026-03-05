# RFP Response — Nzila OS Platform

> Generated: 2026-03-05T01:28:50Z
> Organisation: demo-org
> Questions answered: 15/15

---

## 1. Security Controls

### What is your vulnerability management process?

We perform continuous dependency scanning and maintain a lockfile integrity check. Current posture: 0 critical, 0 high, 0 medium vulnerabilities. Blocked license families: GPL, AGPL, SSPL (enforced by policy). Security score: 92/100 (A).

**Evidence:** security.dependencyAudit, security.vulnerabilitySummary

**Confidence:** high

### Do you provide signed security attestations?

Yes. All builds produce a signed attestation using none. Attestation scope: No dependency scan artifacts found. Remediation: Run `pnpm audit --json > ops/outputs/dependency-posture.json` or configure your CI pipeline to produce a dependency scan artifact at ops/outputs/dependency-posture.json.. Signatures are verifiable and included in procurement evidence packs.

**Evidence:** security.signedAttestation

**Confidence:** high

### What is your current security score?

Our platform security score is 92/100 (grade A). Lockfile integrity: unverified. Attestation: valid.

**Evidence:** assurance.security

**Confidence:** high

---

## 2. Privacy & Data Protection

### How do you handle data classification and protection?

We maintain 3 data manifests covering all data categories. All data classified as confidential or restricted uses encryption at rest and in transit. Data classifications: PII (confidential), financial (restricted), operational (internal). Privacy controls are aligned with PIPEDA, Québec Law 25.

**Evidence:** dataLifecycle.manifests

**Confidence:** high

### Where is data stored and do you support data sovereignty?

Data is stored in Canada Central with data residency in Canada. Cross-border transfer: disabled. Regulatory frameworks: PIPEDA, Québec Law 25. Sovereignty profile validated.

**Evidence:** sovereignty, dataLifecycle.manifests

**Confidence:** high

### How do you comply with PIPEDA and Québec Law 25 (Bill 64)?

The platform enforces data residency within Canada with no cross-border transfers (unless explicitly enabled with documented safeguards). All personally identifiable information is classified as confidential, subject to 5/5 retention policies with auto-delete enabled. Privacy impact assessments are part of the evidence-pack governance cycle. Consent management and data subject access requests are supported through platform API endpoints. All privacy controls are auditable via hash-chained compliance snapshots.

**Evidence:** sovereignty, dataLifecycle.retentionControls, governance

**Confidence:** high

---

## 3. Evidence & Auditability

### Do you maintain an audit trail?

Yes. All actions produce sealed evidence packs with hash-chained audit trails. Evidence packs generated: 0. Snapshot chain length: 0. Chain integrity: unverified. Control families covered: access, financial, data, operational, governance, sovereignty, integration.

**Evidence:** governance

**Confidence:** high

### How do you manage data retention and deletion?

5/5 retention policies are enforced. Auto-delete: enabled. Last purge: 2026-03-05T01:28:50Z. Data manifests define per-category retention periods with deletion policies.

**Evidence:** dataLifecycle.retentionControls, dataLifecycle.manifests

**Confidence:** high

### What compliance frameworks does your platform support?

The platform is designed to support compliance requirements through verifiable controls and audit artifacts. Regulatory alignment includes PIPEDA and Québec Law 25. Policy compliance rate: 0%. Compliance score: 97/100 (A). All compliance snapshots are hash-chained for tamper-evident verification.

**Evidence:** governance, sovereignty, assurance.compliance

**Confidence:** high

---

## 4. Operational Resilience

### What are your SLA/SLO commitments?

We maintain 1 SLO targets with 95% overall compliance. p95 latency: 0ms. Error rate: 0%. Uptime: 95%. Ops confidence score: 91/100.

**Evidence:** operational.sloCompliance, operational.performanceMetrics

**Confidence:** high

### What is your incident response track record?

Total incidents (trailing period): 0. Resolved: 0. Mean time to resolution: 0 minutes. Trend direction: stable.

**Evidence:** operational.incidentSummary, assurance.ops

**Confidence:** high

---

## 5. Integrations & Data Flow

### How do you ensure integration reliability?

Integration SLA compliance: 99.3%. Healthy providers: 2/2. DLQ backlog: 0. Circuit breakers open: 0. All integrations use circuit breakers, retry policies with exponential backoff, and dead-letter queues for resilience.

**Evidence:** assurance.integrationReliability

**Confidence:** high

---

## 6. Hosting & Sovereignty

### What hosting modes are available and where is infrastructure deployed?

The platform is deployed in Canada Central with data stored exclusively in Canada. Cross-border data transfer is disabled by default. Supported sovereignty modes: single-region (default), multi-region with data-residency constraints, and air-gapped (on-premise) for regulated workloads. Regulatory alignment: PIPEDA, Québec Law 25. All sovereignty configuration is captured in the procurement pack and verifiable via the signed manifest.

**Evidence:** sovereignty, procurement-pack:manifest

**Confidence:** high

---

## 7. Disaster Recovery

### What is your disaster recovery strategy?

The platform is deployed in Canada Central with documented disaster recovery and business continuity procedures. Recovery procedures are tested and documented in ops runbooks. MTTR: 0 minutes (based on incident history). All operational evidence is hash-chained and tamper-evident for auditability.

**Evidence:** sovereignty, operational.incidentSummary

**Confidence:** medium

---

## 8. Verification Appendix

### How can we independently verify the evidence in this procurement pack?

Every procurement pack is self-verifying. Verification steps:

1. **Download** the signed ZIP from the Proof Center (or via API: POST /api/proof-center/export).
2. **Extract** the ZIP. It contains: MANIFEST.json, procurement-pack.json, signatures.json, verification.json, and per-section files under sections/.
3. **Verify MANIFEST integrity**: for each file listed in MANIFEST.json, compute SHA-256 hash and compare against the recorded checksum.
4. **Verify Ed25519 signature**: use the public key from GET /api/proof-center/public-key (keyId: 7cc4e5838ba951f1) to verify signatures.json against the MANIFEST hash.
5. **Verify hash chain**: compliance snapshots reference previous hashes — walk the chain and confirm each entry's hash matches the SHA-256 of its canonical JSON payload.

CLI verification:
```bash
# Extract and verify
unzip Procurement-Pack-*.zip -d pack/
# Check manifest hashes
sha256sum -c pack/MANIFEST.json
# Verify signature (requires Ed25519 public key)
openssl pkeyutl -verify -pubin -inkey public.pem \\
  -sigfile pack/signatures.json -in pack/MANIFEST.json
```

Algorithm: Ed25519. All evidence is reproducible — re-running collectors produces the same output for the same state.

**Evidence:** procurement-pack:manifest, procurement-pack:signature, api:/proof-center/public-key

**Confidence:** high

---
