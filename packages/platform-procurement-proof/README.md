# @nzila/platform-procurement-proof

Enterprise procurement proof pack generator. Collects security posture, data lifecycle evidence, operational metrics, governance artifacts, and sovereignty profiles into a signed, exportable bundle for buyer due diligence.

## Domain context

Enterprise procurement requires evidence of security controls, data handling policies, operational reliability, and governance practices. This package assembles that evidence from across the platform, signs it cryptographically, and exports it in JSON or signed ZIP format.

## Public API surface

### Collector — `@nzila/platform-procurement-proof/collector`

| Export | Description |
|---|---|
| `collectProcurementPack(orgId, generatedBy, ports)` | Assemble all 5 proof sections with SHA-256 checksums |
| `signProcurementPack(pack)` | Add HMAC signature (requires `PROOF_SIGNING_SECRET`) |

### Exporter — `@nzila/platform-procurement-proof/exporter`

| Export | Description |
|---|---|
| `exportAsJson(pack)` | Export pack as JSON |
| `exportAsBundle(pack)` | Export as structured bundle |
| `exportAsSignedZip(pack)` | Export as signed ZIP archive |
| `verifyZipSignature(zip)` | Verify ZIP signature integrity |

### Section collectors — `@nzila/platform-procurement-proof/collectors`

| Export | Description |
|---|---|
| `collectLatestEvidencePack()` | Latest governance evidence pack |
| `collectLatestComplianceSnapshots()` | Compliance snapshot chain |
| `collectDependencyPosture()` | Vulnerability scan results |
| `collectIntegrationsHealth()` | Integration provider health |
| `collectObservabilitySummary()` | Metrics and alerting status |

### Enterprise hardening — `@nzila/platform-procurement-proof/sections`

| Export | Description |
|---|---|
| `collectSupplyChainIntegrity()` | SBOM and supply chain attestation |
| `collectBuildAttestation()` | Build provenance and reproducibility |

### Proof sections

| Section | Contents |
|---|---|
| Security | Dependency audit, signed attestation, vulnerability score (0–100, A–F) |
| Data lifecycle | Data manifests with classification, encryption, retention, deletion policy |
| Operational | SLO compliance, p50/p95/p99 latency, error rate, uptime, incidents |
| Governance | Evidence pack count, snapshot chain validation, policy compliance rate |
| Sovereignty | Deployment region, data residency, regulatory frameworks, cross-border flag |

## Dependencies

- `@nzila/os-core`, `@nzila/platform-utils`, `@nzila/platform-evidence-pack`, `@nzila/platform-compliance-snapshots`, `@nzila/platform-integrations-control-plane`, `@nzila/platform-observability`, `@nzila/platform-policy-engine`
- `fflate` — ZIP compression
- `zod` — Schema validation

## Example usage

```ts
import { collectProcurementPack, signProcurementPack } from '@nzila/platform-procurement-proof'
import { exportAsSignedZip } from '@nzila/platform-procurement-proof/exporter'

const pack = await collectProcurementPack('org-1', 'admin@company.com', ports)
const signed = signProcurementPack(pack)
const zip = await exportAsSignedZip(signed)
```

## Related apps

- `apps/console` — Procurement pack generation UI

## Maturity

Production-grade — Full collection pipeline with signature verification. Has tests.
