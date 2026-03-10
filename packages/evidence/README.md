# @nzila/evidence

Evidence pack sealing and verification utilities. Provides Merkle-root computation and cryptographic seal generation for tamper-evident audit artifacts.

## Exports

| Export | Purpose |
|--------|---------|
| `computeMerkleRoot(entries)` | Compute Merkle tree root hash from evidence entries |
| `generateSeal(pack)` | Generate a cryptographic seal over an evidence pack |
| `verifySeal(pack, seal)` | Verify seal integrity against pack contents |

## Usage

```ts
import { computeMerkleRoot, generateSeal, verifySeal } from '@nzila/evidence'

const root = computeMerkleRoot(entries)
const seal = generateSeal({ entries, root, metadata })
const valid = verifySeal(pack, seal) // true if untampered
```

## Dependencies

None — uses Node.js `crypto` module only.

## Notes

This package provides the low-level sealing primitives. For higher-level evidence lifecycle management, see `@nzila/os-core/evidence` and `@nzila/platform-evidence-pack`.
