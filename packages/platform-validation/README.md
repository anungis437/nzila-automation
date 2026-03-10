# @nzila/platform-validation

Automated validation suite for the NzilaOS platform. Scans code, docs, and architecture for consistency, produces graded scorecards.

## Audits

| Function | Purpose |
|----------|---------|
| `runPackageAudit(root)` | Package maturity — deps, tests, structure, circular deps |
| `runArchitectureAudit(root)` | Architecture consistency — middleware, env validation, correlation IDs |
| `runClaimVerification(root)` | Claim integrity — verify procurement/architecture claims against code |
| `runDocConsistency(root)` | Documentation quality — stale refs, broken links, naming consistency |

## Usage

```bash
# Run all audits with unified scorecard
pnpm validate:all

# Individual audits
pnpm validate:arch
pnpm validate:claims
pnpm validate:docs
```

## Grading

The scorecard grades each dimension using an error/warning count:

| Grade | Criteria |
|-------|----------|
| A+ | 0 errors, 0 warnings |
| A | 0 errors, ≤3 warnings |
| A- | 0 errors, ≤10 warnings |
| B+ | 0 errors, ≤25 warnings |
| B | 0 errors, >25 warnings |
| C+ | ≤3 errors |
| C | ≤10 errors |
| D | ≤20 errors |
| F | >20 errors |

Reports are written to `reports/` as JSON and Markdown.
