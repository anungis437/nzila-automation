# @nzila/platform-isolation

Isolation Certification Engine for the NzilaOS platform. Audits org-level tenant isolation guarantees including row-level security, org context resolution, and cross-org query prevention.

## Exports

| Export | Purpose |
|--------|---------|
| `runIsolationAudit(root)` | Audit codebase for isolation violations |
| `computeIsolationScore(result)` | Compute numerical isolation score |
| `runMultiOrgStress(config)` | Stress-test multi-tenant isolation |
| `computeStressIsolationScore(result)` | Score stress test results |
| `generateOrgProfiles(count)` | Generate test org profiles for stress testing |

## Usage

```ts
import { runIsolationAudit, computeIsolationScore } from '@nzila/platform-isolation'

const result = runIsolationAudit(repoRoot)
const score = computeIsolationScore(result)
// score: 0-100, violations listed in result.violations
```

## Dependencies

- `@nzila/db` — schema introspection
- `drizzle-orm` — query analysis
