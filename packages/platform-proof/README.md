# @nzila/platform-proof

Hash-signed governance proof pack generator. Produces immutable, cryptographically signed evidence of CI status, contract test integrity, migration state, audit trails, and secret scanning for regulatory and procurement assurance.

## Domain context

Governance-sensitive deployments require tamper-evident proof that CI pipelines passed, contract tests are current, migrations are applied, and no secrets are exposed. This package generates signed proof packs that can be verified by external auditors.

## Public API surface

### Core proof — `@nzila/platform-proof`

| Export | Description |
|---|---|
| `generateGovernanceProofPack()` | Generate and persist a signed governance proof pack |
| `computeSignatureHash(payload)` | SHA-256 HMAC signature (requires `PROOF_SIGNING_SECRET`) |
| `GovernanceProofPack` | Pack with CI status, contract test hash, audit integrity hash, secret scan status, red team summary |

### Domain proof sections

| Subpath | Export | Description |
|---|---|---|
| `./integrations` | `generateIntegrationsProofSection()` | Provider health snapshots |
| `./abr` | `generateAbrProofSection()` | ABR terminal event statistics |
| `./nacp` | `generateNacpIntegrityProofSection()` | Exam seal status and anomaly detection |
| `./data-lifecycle` | `generateDataLifecycleProofSection()` | App data manifest summaries |

### Ports — `@nzila/platform-proof/ports/nacp`

| Export | Description |
|---|---|
| `nacpIntegrityPorts` | Default port implementation for NACP integrity checks |

## Dependencies

- `@nzila/db` — Drizzle ORM for proof pack persistence
- `drizzle-orm` — Query builder

## Example usage

```ts
import { generateGovernanceProofPack } from '@nzila/platform-proof'

const pack = await generateGovernanceProofPack()
// pack.signatureHash is a deterministic HMAC over all pack fields
```

## Related apps

- `apps/console` — Governance proof viewer
- `apps/nacp-exams` — NACP integrity source

## Maturity

Production-grade — Immutable proof generation with HMAC signatures. Has tests (proof, ABR, integrations, NACP).
