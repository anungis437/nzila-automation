# @nzila/platform-context-orchestrator

Context envelope assembler for NzilaOS — pulls from ontology, entity graph, event history, knowledge registry, decision graph, and tenant policies into a single structured envelope.

## Purpose

Before any workflow step, decision, or AI inference, the system needs a **complete picture** of the entity it's operating on. The context orchestrator assembles this from all platform sources in parallel, producing a `ContextEnvelope` that contains everything needed for the next operation.

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Context Envelope** | Complete structured context for an entity at a point in time |
| **Context Purpose** | Why context is needed — workflow, decision, ai_inference, audit, reporting, display |
| **Context Sources** | Provider interfaces for each platform subsystem |
| **Caller** | Who is requesting context — userId, role, permissions |

## Usage

```typescript
import {
  buildContextEnvelope,
  getWorkflowContext,
  getDecisionContext,
  getAIContext,
  ContextPurposes,
} from '@nzila/platform-context-orchestrator'

// Full envelope assembly
const envelope = await buildContextEnvelope(sources, {
  tenantId: 'tenant-uuid',
  purpose: ContextPurposes.DECISION,
  entityType: 'case',
  entityId: 'case-uuid',
  caller: { userId: 'user-1', role: 'case_officer' },
  graphDepth: 2,
  eventLimit: 50,
})

// envelope.entity — the primary entity
// envelope.relatedEntities — neighbors from entity graph
// envelope.recentEvents — event history
// envelope.applicableKnowledge — matching policies/rules
// envelope.decisionHistory — past decisions
// envelope.tenantPolicies — tenant configuration

// Convenience builders
const wfCtx = await getWorkflowContext(sources, tenantId, entityType, entityId, caller)
const decCtx = await getDecisionContext(sources, tenantId, entityType, entityId, caller)
const aiCtx = await getAIContext(sources, tenantId, entityType, entityId, caller, ['risk', 'kyc'])
```

## Context Sources

The orchestrator is agnostic to storage backends — it uses provider interfaces:

- `ContextEntitySource` — ontology entity lookup
- `ContextGraphSource` — entity graph neighbors
- `ContextEventSource` — recent platform events
- `ContextKnowledgeSource` — applicable knowledge assets
- `ContextDecisionSource` — decision history
- `ContextTenantSource` — tenant policies/config

Null implementations are provided for testing via `createNullContextSources()`.
