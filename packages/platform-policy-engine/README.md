# @nzila/platform-policy-engine

Centralized policy evaluation engine for the NzilaOS platform. Loads YAML-defined policies, evaluates them against runtime context, and produces auditable decisions.

## Exports

| Export | Purpose |
|--------|---------|
| `loadPolicies(dir)` | Load all policy YAML files from a directory |
| `loadPolicyById(dir, id)` | Load a single policy by ID |
| `evaluatePolicy(policy, context)` | Evaluate one policy against a context |
| `evaluatePolicies(policies, context)` | Evaluate all policies, return decisions |
| `isBlocked(decisions)` | Check if any policy blocks the action |
| `requiresApproval(decisions)` | Check if any policy requires approval |
| `recordPolicyAudit(entry)` | Record a policy decision to the audit trail |
| `getOrgPolicyAudit(orgId)` | Retrieve audit trail for an organization |

## Policy Definition

Policies are defined as YAML files with Zod-validated schemas:

```yaml
id: data-export-approval
type: authorization
effect: require-approval
severity: high
conditions:
  - field: action
    operator: equals
    value: data-export
rules:
  - scope: org
    actors: [admin, compliance-officer]
```

## Dependencies

- `@nzila/os-core` — audit trail integration
- `@nzila/platform-events` — event emission
- `yaml` — YAML parsing
- `zod` — schema validation
