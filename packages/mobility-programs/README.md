# @nzila/mobility-programs

Programme eligibility evaluation and comparison engine. Evaluates client profiles against citizenship/residency programme requirements and ranks options by suitability.

## Domain context

NzilaOS supports multiple investment migration programmes (CBI, RBI, golden visa, etc.) across jurisdictions. This package encodes programme requirements and evaluates whether a client profile meets eligibility criteria based on nationality, investment budget, wealth tier, risk profile, and family size.

## Public API surface

### Engine — `@nzila/mobility-programs/engine`

| Export | Description |
|---|---|
| `evaluateProgramEligibility(profile, program)` | Evaluate a client against a single programme's requirements |
| `rankProgramOptions(profile, programs)` | Rank all programmes by eligibility score |
| `comparePrograms(programs)` | Side-by-side comparison across key dimensions |
| `ClientProfile` | Nationality, residence, wealth tier, risk profile, family size, investment budget, preferred regions |

### Data — `@nzila/mobility-programs/data`

| Export | Description |
|---|---|
| `PROGRAM_CATALOG` | Reference data for programmes (Malta, Portugal, Grenada, St Kitts, UAE, Greece) |
| `ProgramDefinition` | Country code, programme type, minimum investment, citizenship path, required documents, restricted nationalities |

## Dependencies

- `@nzila/mobility-core` — Programme and investment type enums
- `zod` — Input validation

## Example usage

```ts
import { rankProgramOptions, PROGRAM_CATALOG } from '@nzila/mobility-programs'

const ranked = rankProgramOptions(clientProfile, PROGRAM_CATALOG)
ranked.forEach(r => console.log(`${r.program.countryCode}: score ${r.score}`))
```

## Related apps

- `apps/mobility` — Programme selection wizard
- `apps/shop-quoter` — Quote generation for programme options

## Maturity

Pilot-grade — Eligibility engine with 6-programme catalog. No tests yet.
