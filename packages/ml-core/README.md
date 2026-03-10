# @nzila/ml-core

Server-side ML subsystem for the NzilaOS platform. Manages model registry, versioned activation, datasets, and ML evidence collection.

## Exports

| Export | Purpose |
|--------|---------|
| `getActiveModel(name)` | Retrieve the currently active model version |
| `listModels(filter?)` | List registered models with optional filtering |
| `activateModel(id)` | Activate a specific model version |
| `retireModel(id)` | Retire a model from production |
| `getDataset(id)` | Retrieve training/evaluation dataset |
| `collectMlEvidence(run)` | Collect evidence artifacts from ML runs |

## Source Layout

```
src/
├── evidence/    # ML evidence collection
└── index.ts     # Barrel exports
```

## Dependencies

- `@nzila/db`, `@nzila/os-core`, `@nzila/blob` — platform integration
- `zod` — schema validation

## Note

Apps should use `@nzila/ml-sdk` (the public SDK) rather than importing `@nzila/ml-core` directly.
