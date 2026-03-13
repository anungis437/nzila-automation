# Route Governance — Control Plane

> Every Control Plane page must be documented here with its purpose,
> bucket assignment, and operational justification.
> See also: docs/CONTROL_PLANE_PRINCIPLES.md

## Route Registry

| Route | Page Name | Bucket | Primary User | Actionability | Source Data |
|-------|-----------|--------|--------------|---------------|-------------|
| `/overview` | Overview | HEALTH | Platform Operator | View platform health summary | Aggregated from all subsystems |
| `/governance` | Governance | HEALTH | Platform Operator | Review governance posture, export compliance reports | `@nzila/platform-governance` |
| `/environments` | Environments | HEALTH | Platform Operator | View environment status, trigger health checks | `@nzila/platform-environment` |
| `/changes` | Changes | ATTENTION | Platform Operator | Review pending changes, approve/reject | `@nzila/platform-change-management` |
| `/change-calendar` | Change Calendar | HEALTH | Platform Operator | View change schedule, identify conflicts | `@nzila/platform-change-management` |
| `/decisions` | Decisions | ATTENTION | Platform Operator | Review pending decisions, approve/escalate | `@nzila/platform-decision-engine` |
| `/decision-summary` | Decision Summary | ATTENTION | Platform Operator | View decision trends, identify bottlenecks | `@nzila/platform-decision-engine` |
| `/intelligence` | Intelligence | ATTENTION | Platform Operator | Review AI insights, triage signals | `@nzila/platform-intelligence` |
| `/anomalies` | Anomalies | ATTENTION | Platform Operator | Triage anomalies, acknowledge/investigate | `@nzila/platform-anomaly-engine` |
| `/agents` | Agents | ACTION | Platform Operator | Review agent recommendations, approve/dismiss | `@nzila/platform-agent-workflows` |
| `/modules` | Modules | HEALTH | Platform Operator | View module status, feature coverage | Module registry |
| `/procurement` | Procurement | ACTION | Platform Operator | Generate procurement packs, validate evidence | `@nzila/platform-procurement-proof` |
| `/architecture` | Architecture | HEALTH | Platform Operator | View architecture health, package ownership, contract status | Architecture check scripts |

## Adding New Routes

1. Add entry to this table with all fields filled
2. Add entry to `route.meta.json`
3. Assign exactly one bucket: HEALTH, ATTENTION, or ACTION
4. Identify primary user/persona
5. Document what action the user can take
6. Run `pnpm control-plane:check` to validate
