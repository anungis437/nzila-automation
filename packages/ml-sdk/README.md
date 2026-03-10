# @nzila/ml-sdk

Public ML SDK for NzilaOS applications. Provides a typed client for model inference, training runs, and scoring endpoints.

## Usage

```ts
import { createMlClient } from '@nzila/ml-sdk'

const ml = createMlClient({ baseUrl: '/api/ml' })

// Get model info
const model = await ml.getModel('stripe-daily-score')

// Run inference
const score = await ml.predict('stripe-daily-score', { date: '2025-01-15' })
```

## Exports

| Export | Purpose |
|--------|---------|
| `createMlClient` | Factory for ML client instance |

## Types

`MlModelResponse`, `MlTrainingRunResponse`, `StripeDailyScoreResponse`, `UEPriorityScoreResponse`

## Dependencies

- `@nzila/db` — database types
- `zod` — schema validation
