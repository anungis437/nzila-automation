# @nzila/ai-sdk

Public AI SDK for NzilaOS applications. Thin client that calls AI endpoints — apps import this instead of `@nzila/ai-core`.

## Usage

```ts
import { createAiClient } from '@nzila/ai-sdk'

const ai = createAiClient({ baseUrl: '/api/ai' })

// Text generation
const result = await ai.generate({ prompt: 'Summarize this document...' })

// Streaming chat
const stream = await ai.chatStream({ messages: [...] })
for await (const chunk of consumeStream(stream)) {
  process.stdout.write(chunk.text)
}

// Embedding
const embedding = await ai.embed({ text: 'Search query' })
```

## Exports

| Export | Purpose |
|--------|---------|
| `createAiClient` | Factory for AI client instance |
| `consumeStream` | Async iterator for streaming responses |
| `collectStream` | Collect full stream response into a single result |
| `toReadableStream` | Convert to Web ReadableStream |

## Types

`GenerateOptions`, `ChatOptions`, `EmbedOptions`, `AiResponse`, `StreamChunk`

## Dependencies

- `zod` — request/response validation (only dependency)
