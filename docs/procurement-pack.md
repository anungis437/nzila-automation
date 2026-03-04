# Procurement Pack

> One-click evidence bundling for enterprise procurement teams.

## Overview

The Procurement Pack is a signed, verifiable ZIP bundle that aggregates
platform proof artifacts across five domains: **Security**, **Data Lifecycle**,
**Operational**, **Governance**, and **Sovereignty**.

## Export Formats

| Format | Content-Type | Signing |
|--------|-------------|---------|
| **ZIP** (default) | `application/zip` | Ed25519 + SHA-256 |
| **JSON** (legacy) | `application/json` | SHA-256 checksums |

## ZIP Bundle Contents

```
Nzila-Procurement-Pack-YYYY-MM-DD.zip
├── MANIFEST.json          # File listing with SHA-256 hashes
├── procurement-pack.json  # Full pack payload
├── signatures.json        # Ed25519 signature + key ID
├── verification.json      # How to verify + expected hashes
└── sections/
    ├── security.json
    ├── dataLifecycle.json
    ├── operational.json
    ├── governance.json
    └── sovereignty.json
```

## Verification

1. Extract the zip
2. Compute SHA-256 of `MANIFEST.json`
3. Verify the Ed25519 signature in `signatures.json` against that digest
4. For each file in `MANIFEST.json.files`, verify its SHA-256 hash matches
5. Confirm `keyId` matches the expected signing key

## API

```
POST /api/proof-center/export
  Body: { "format": "zip" | "json", "includeRfp": boolean }
  → application/zip (default) or application/json
```

## Response Headers (ZIP)

| Header | Purpose |
|--------|---------|
| `Content-Type` | `application/zip` |
| `Content-Disposition` | `attachment; filename="Nzila-Procurement-Pack-YYYY-MM-DD.zip"` |
| `X-Pack-Id` | Unique pack identifier |
| `X-Signature-Key-Id` | Ed25519 key ID (first 16 hex chars of SHA-256 of public key) |
| `X-Signature-Algorithm` | `Ed25519` |

## Packages

- **`@nzila/platform-procurement-proof`** — Collector, exporter, zip-exporter
- **`@nzila/os-core/evidence/seal`** — HMAC sealing primitives

## Security Properties

- **Integrity** — SHA-256 per-file hashes in MANIFEST.json
- **Authenticity** — Ed25519 digital signature over manifest digest
- **Non-repudiation** — Signature tied to key ID; audit event emitted on export
- **Tamper evidence** — Any modification invalidates both file hashes and signature
