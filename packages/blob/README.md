# @nzila/blob

Azure Blob Storage utilities for the NzilaOS platform.

## Exports

| Export | Purpose |
|--------|---------|
| `container(name)` | Get a container client for the given blob container |
| `uploadBuffer(container, path, buffer)` | Upload a buffer to blob storage |
| `downloadBuffer(container, path)` | Download blob content as a buffer |
| `generateSasUrl(container, path, opts)` | Generate a time-limited SAS URL |
| `computeSha256(buffer)` | Compute SHA-256 hash of blob content |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AZURE_STORAGE_ACCOUNT_NAME` | Yes | Azure Storage account name |
| `AZURE_STORAGE_ACCOUNT_KEY` | Yes | Azure Storage account key |

## Usage

```ts
import { container, uploadBuffer, generateSasUrl } from '@nzila/blob'

const docs = container('documents')
await uploadBuffer('documents', 'reports/2025-Q1.pdf', pdfBuffer)
const url = await generateSasUrl('documents', 'reports/2025-Q1.pdf', { expiresIn: 3600 })
```

## Dependencies

- `@azure/storage-blob` — Azure SDK
- `zod` — env validation
