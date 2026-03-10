# @nzila/platform-decision-graph

Explainable decision trail system for NzilaOS — every platform decision is a node in an auditable, traversable graph with full evidence and policy linkage.

## Purpose

Provides a structured way to record, link, and traverse decisions made across the platform — whether by users, AI models, policy engines, or automated workflows. Every decision references the policies that governed it, the evidence that informed it, and can be traversed upstream to explain **why** any outcome occurred.

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Decision Node** | A recorded decision with type, actor, outcome, confidence, policy/evidence refs |
| **Decision Edge** | A relationship between decisions (depends_on, overrides, escalated_to, etc.) |
| **Decision Trail** | A complete traversal of connected decisions forming an audit trail |
| **Actor** | Who/what made the decision — user, system, AI model, policy engine, workflow |

## Decision Types

`approval`, `rejection`, `escalation`, `recommendation`, `classification`, `routing`, `risk_assessment`, `pricing`, `allocation`, `compliance_check`, `ai_inference`, `policy_evaluation`

## Usage

```typescript
import {
  createDecisionNode,
  linkDecisions,
  executeDecision,
  getDecisionTrail,
  createInMemoryDecisionStore,
  DecisionTypes,
  ActorTypes,
  DecisionEdgeTypes,
} from '@nzila/platform-decision-graph'

const store = createInMemoryDecisionStore()

// Create a risk assessment decision
const risk = await createDecisionNode(store, {
  tenantId: 'tenant-uuid',
  decisionType: DecisionTypes.RISK_ASSESSMENT,
  actorType: ActorTypes.AI_MODEL,
  actorId: 'risk-model-v2',
  entityType: 'case',
  entityId: 'case-uuid',
  summary: 'Risk score: 0.12 (low)',
  outcome: { riskScore: 0.12, category: 'low' },
  confidence: 0.95,
  policyRefs: ['policy-risk-001'],
  evidenceRefs: ['doc-id-scan', 'credit-check'],
  knowledgeRefs: [],
})

// Create an approval that depends on the risk assessment
const approval = await createDecisionNode(store, { /* ... */ })
await linkDecisions(store, {
  fromDecisionId: approval.id,
  toDecisionId: risk.id,
  edgeType: DecisionEdgeTypes.DEPENDS_ON,
})

// Execute and get the full trail
await executeDecision(store, approval.id)
const trail = await getDecisionTrail(store, approval.id)
// trail.nodes, trail.edges, trail.totalDepth
```

## Drizzle Schema

Exports tables: `decisionNodes`, `decisionEdges`.
