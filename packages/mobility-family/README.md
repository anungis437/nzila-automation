# @nzila/mobility-family

Family graph engine and timeline tracker for dependent-inclusive immigration programmes. Models the applicant's family unit, evaluates dependent eligibility, and monitors passport expiry and age-out deadlines.

## Domain context

Many CBI/RBI programmes allow inclusion of spouse, children, parents, and siblings as dependents. Eligibility rules vary by programme (e.g. Caribbean CBI allows children up to 30 and parents 55+). This package evaluates each family member against programme-specific rules and generates actionable timelines.

## Public API surface

### Graph — `@nzila/mobility-family`

| Export | Description |
|---|---|
| `buildFamilyGraph(clientId, nationality, members, rules?)` | Build a family dependency graph with eligibility evaluation |
| `DEFAULT_DEPENDENT_RULES` | Standard rules: children ≤18, spouse included, no parents/siblings |
| `CARIBBEAN_CBI_RULES` | Extended rules: children ≤30, parents/siblings included |
| `FamilyGraph` | Graph with `members`, `totalDependents`, `eligibleDependents` |
| `FamilyNode` | Member node with `eligible` flag and `blockers[]` |
| `DependentRules` | Programme-specific inclusion rules |

### Timeline — `@nzila/mobility-family/timeline`

| Export | Description |
|---|---|
| `generatePassportTimeline(members)` | Generate passport expiry and renewal events |
| `generateAgeOutWarnings(children, maxAge, warningMonths?)` | Warn when children approach max dependent age |
| `buildTimelineSummary(clientId, events)` | Compile events into upcoming and overdue actions |
| `TIMELINE_EVENT_TYPES` | `passport_expiry`, `age_out_warning`, `citizenship_eligible`, etc. |

## Dependencies

- `@nzila/mobility-core` — `FamilyMember`, `FamilyRelation` types
- `@nzila/mobility-programs` — Programme definitions for rule selection

## Example usage

```ts
import { buildFamilyGraph, CARIBBEAN_CBI_RULES } from '@nzila/mobility-family'
import { generatePassportTimeline, buildTimelineSummary } from '@nzila/mobility-family'

const graph = buildFamilyGraph('client-1', 'NG', familyMembers, CARIBBEAN_CBI_RULES)
console.log(`${graph.eligibleDependents}/${graph.totalDependents} dependents eligible`)

const timeline = generatePassportTimeline(graph.members)
const summary = buildTimelineSummary('client-1', timeline)
```

## Related apps

- `apps/mobility` — Case family tab
- `apps/mobility-client-portal` — Client-facing family view

## Maturity

Pilot-grade — Core graph and timeline logic implemented. No tests yet. Passport expiry checks validate 6-month minimum buffer.
