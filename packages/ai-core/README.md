# @nzila/ai-core

AI control plane for the NzilaOS platform. Manages model routing, budget enforcement, prompt resolution, and governed AI operations with full audit trails.

## Capabilities

| Area | Functions |
|------|-----------|
| **Gateway** | `generate`, `chat`, `chatStream`, `embed` — unified model interface |
| **Profiles** | `resolveProfile`, `resolveDeployment`, `resolvePrompt` — per-app AI configuration |
| **Budget** | `checkBudget`, `recordSpend` — token/cost budget enforcement |
| **Audit** | `logAiRequest` — structured logging of AI operations |
| **RAG** | Retrieval-augmented generation support under `rag/` |
| **Tools** | Tool-calling runtime under `tools/` |

## Request Schemas (Zod)

- `AiGenerateRequestSchema` — text generation requests
- `AiChatStreamRequestSchema` — streaming chat requests
- `AiEmbedRequestSchema` — embedding requests
- `AiRagQueryRequestSchema` — RAG query requests

## Source Layout

```
src/
├── actions/     # AI action handlers
├── evidence/    # AI evidence collection
├── policy/      # AI policy enforcement
├── providers/   # Provider adapters (OpenAI, etc.)
├── rag/         # Retrieval-augmented generation
├── tools/       # Tool-calling runtime
└── index.ts     # Barrel exports
```

## Dependencies

- `openai` — OpenAI provider
- `zod` — schema validation
- `@nzila/os-core`, `@nzila/db`, `@nzila/blob`, `@nzila/payments-stripe`, `@nzila/tools-runtime`

## Note

Apps should use `@nzila/ai-sdk` (the public SDK) rather than importing `@nzila/ai-core` directly.
