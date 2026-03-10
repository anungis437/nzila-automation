# @nzila/platform-deploy

Deployment profile management and validation for NzilaOS. Supports managed, sovereign, and hybrid deployment topologies with egress allowlist enforcement.

## Domain context

Enterprise customers may require sovereign deployments with strict data residency, egress control, and integration approval workflows. This package validates deployment configurations against declared profiles and enforces egress allowlists for sovereign/hybrid modes.

## Public API surface

### Profiles — `@nzila/platform-deploy`

| Export | Description |
|---|---|
| `validateDeploymentProfile(config, env)` | Validate environment against declared deployment profile |
| `validateAndPersistProfile(config, env, ports)` | Validate and persist profile to database |
| `detectDeploymentProfile(env)` | Auto-detect profile from environment variables |
| `buildDeploymentProofSection(config)` | Generate proof section for procurement pack |
| `DEPLOYMENT_PROFILES` | `managed`, `sovereign`, `hybrid` |
| `DeploymentProfileConfigSchema` | Zod schema for profile configuration |

### Sovereign mode — `@nzila/platform-deploy/sovereign`

| Export | Description |
|---|---|
| `checkEgress(host, port, allowlist)` | Validate outbound connection against egress allowlist |
| `EgressRule` | Host, port, reason, approvedBy, approvedAt |
| `EgressAllowlist` | Enforced flag + rules array |
| `EgressAuditEntry` | Audit log for egress check results |

### Profile configuration

```ts
{
  profile: 'managed' | 'sovereign' | 'hybrid',
  environment: string,
  region?: string,
  dataResidency?: string,
  selfHostedDb: boolean,      // sovereign/hybrid modes
  egressAllowlistEnforced: boolean,
  egressAllowlist: string[],
  integrationApprovalRequired: boolean,
}
```

## Dependencies

- `@nzila/db` — Drizzle ORM for persistence
- `drizzle-orm` — Query builder
- `zod` — Configuration schema validation

## Example usage

```ts
import { validateDeploymentProfile } from '@nzila/platform-deploy'
import { checkEgress } from '@nzila/platform-deploy/sovereign'

const result = validateDeploymentProfile(config, process.env)
const egressCheck = checkEgress('api.stripe.com', 443, allowlist)
```

## Related apps

- `apps/console` — Deployment configuration UI
- `apps/platform-admin` — Sovereign deployment management

## Maturity

Production-grade — Validation engine with egress enforcement. Has tests.
