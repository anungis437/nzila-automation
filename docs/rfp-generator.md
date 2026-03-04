# RFP Generator

> Automated RFP response generation from live platform proof artifacts.

## Overview

The RFP Generator produces a complete Markdown RFP response document from
platform evidence, assurance scores, and policy compliance data. It answers
common procurement questions across 8 domains with evidence references.

## Usage

```bash
# Default: writes to docs/rfp/answers.md
pnpm rfp:generate

# Custom output path
pnpm rfp:generate -- --out path/to/output.md
```

## Output

The generator produces a structured Markdown document with:

- **Section headers** for each domain
- **Question/answer pairs** with evidence references
- **Confidence ratings** (high / medium / low) per answer

## Sections Covered

| Section | Questions | Topics |
|---------|-----------|--------|
| Security | 2 | Controls, vulnerability management |
| Privacy | 2 | PII protection, data residency |
| Operations | 1 | SLA/SLO targets |
| Disaster Recovery | 1 | DR procedures, testing |
| Data Governance | 1 | Policy enforcement, evidence packs |
| Compliance | 1 | Frameworks, scores |
| Integration | 1 | Marketplace, webhook signing |
| Cost Management | 1 | Budget gates, spend tracking |

## Evidence References

Each answer includes `evidenceRefs` pointing to:

- **Evidence packs** — `evidence-pack:security-posture`
- **Compliance snapshots** — `compliance-snapshot:latest`
- **Policy files** — `ops/policies/financial-policies.yml`
- **Operational docs** — `ops/disaster-recovery/`, `ops/incident-response/`

## Integration with Procurement Pack

The RFP sections can be included in the signed Procurement Pack
by setting `includeRfp: true` in the export request:

```
POST /api/proof-center/export
Body: { "format": "zip", "includeRfp": true }
```

## Packages

- **`@nzila/platform-rfp-generator`** — Section definitions and rendering
- **`scripts/rfp-generate.ts`** — CLI entry point

## File Output

Default output: `docs/rfp/answers.md`

The script creates the output directory automatically if it doesn't exist.
