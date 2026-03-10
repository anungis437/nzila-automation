# @nzila/platform-governed-ai

Governed AI operations for NzilaOS — every AI invocation is policy-checked, evidence-grounded, and fully audited.

## Purpose

Ensures that all AI operations across the platform follow a governed lifecycle:

1. **Policy Pre-check** — evaluate tenant and regulatory policies before model invocation
2. **Model Invocation** — call the AI model with structured input and context
3. **Evidence Grounding** — attach evidence chain (documents, events, decisions)
4. **Audit Persistence** — record the full AI run with confidence, reasoning, token usage

## Key Concepts

| Concept | Description |
|---------|-------------|
| **AI Run Record** | Complete audit trail of an AI operation |
| **Evidence Item** | A source reference that grounds the AI output |
| **Policy Constraint** | A policy evaluation result (satisfied/blocked) |
| **AI Model Provider** | Interface for invoking AI models |
| **Policy Evaluator** | Interface for pre-checking policies |

## AI Operation Types

`recommendation`, `classification`, `extraction`, `summarization`, `risk_scoring`, `anomaly_detection`, `generation`, `grounded_retrieval`, `reasoning`

## Usage

```typescript
import {
  executeGovernedAIRun,
  createInMemoryAIRunStore,
  createNullPolicyEvaluator,
  AIOperationTypes,
} from '@nzila/platform-governed-ai'

const run = await executeGovernedAIRun({
  store: createInMemoryAIRunStore(),
  provider: {
    modelId: 'gpt-4o',
    modelVersion: '2024-08-06',
    invoke: async (input, ctx) => ({
      output: { recommendation: 'approve' },
      confidence: 0.92,
      reasoning: 'Low risk based on credit history',
    }),
  },
  policyEvaluator: createNullPolicyEvaluator(),
  request: {
    tenantId: 'tenant-uuid',
    operationType: AIOperationTypes.RECOMMENDATION,
    modelId: 'gpt-4o',
    entityType: 'case',
    entityId: 'case-uuid',
    input: { caseData: {} },
    requestedBy: 'user-1',
  },
  evidence: [
    { id: 'ev-1', sourceType: 'document', sourceId: 'doc-1', excerpt: '...', relevanceScore: 0.9 },
  ],
})
// run.status, run.output, run.confidence, run.reasoning
```

## Drizzle Schema

Exports table: `aiRunRecords`.
