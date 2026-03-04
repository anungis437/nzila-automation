# HSM Key Rotation for PII Encryption

**Document ID:** SEC-HSM-2026-001  
**Version:** 1.0  
**Classification:** CONFIDENTIAL  
**Created:** 2026-03-04  
**Owner:** Security Lead  
**Status:** PLANNED  
**Severity:** HIGH — Currently app-level encryption only, no automated key rotation

---

## 1. Current State

- PII fields (names, emails, ID numbers) are encrypted at application level
- Encryption keys are stored as environment variables
- No key rotation mechanism exists
- No HSM-backed key protection

## 2. Target Architecture

Use **Azure Key Vault with HSM-backed keys** (Premium tier or Managed HSM) for:
- Envelope encryption of PII fields
- Automated key rotation with configurable policy
- Key version tracking for decrypt-on-read
- FIPS 140-2 Level 2 (Premium) or Level 3 (Managed HSM) compliance

### Encryption Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Application │────▶│ Azure KV HSM │────▶│ Data Encryption  │
│  (os-core)  │     │  (KEK)       │     │  Key (DEK)       │
│             │◀────│              │◀────│                  │
└─────────────┘     └──────────────┘     └─────────────────┘
                         │
                    ┌────▼────┐
                    │ Wrapped │  DEK encrypted by KEK
                    │  DEK    │  stored alongside ciphertext
                    └─────────┘
```

## 3. Azure Key Vault Configuration

### 3.1 Create Key Vault (Premium for HSM-backed keys)

```bicep
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'nzila-kv-${environment}'
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'premium'  // Required for HSM-backed keys
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true  // Prevent accidental permanent deletion
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      virtualNetworkRules: [
        { id: containerAppsSubnetId }
      ]
    }
  }
}
```

### 3.2 Create HSM-Backed Encryption Key

```bicep
resource piiEncryptionKey 'Microsoft.KeyVault/vaults/keys@2023-07-01' = {
  parent: keyVault
  name: 'nzila-pii-encryption'
  properties: {
    kty: 'RSA-HSM'  // HSM-backed RSA key
    keySize: 4096
    keyOps: ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    rotationPolicy: {
      attributes: {
        expiryTime: 'P90D'  // Expire after 90 days
      }
      lifetimeActions: [
        {
          action: { type: 'Rotate' }
          trigger: { timeBeforeExpiry: 'P30D' }  // Rotate 30 days before expiry
        }
        {
          action: { type: 'Notify' }
          trigger: { timeBeforeExpiry: 'P14D' }  // Alert 14 days before expiry
        }
      ]
    }
  }
}
```

### 3.3 RBAC for Container Apps Managed Identity

```bicep
// Grant the Container App's managed identity access to the key
resource kvCryptoUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: piiEncryptionKey
  name: guid(keyVault.id, containerAppIdentity.id, 'Key Vault Crypto User')
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '12338af0-0e69-4776-bea7-57ae8d297424'  // Key Vault Crypto User
    )
    principalId: containerAppIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}
```

## 4. Application Integration

### 4.1 Key Vault Crypto Client (os-core)

```typescript
// packages/os-core/src/crypto/hsmKeyProvider.ts
import { KeyClient, CryptographyClient } from '@azure/keyvault-keys'
import { DefaultAzureCredential } from '@azure/identity'

const credential = new DefaultAzureCredential()
const keyVaultUrl = process.env.AZURE_KEY_VAULT_URL!

const keyClient = new KeyClient(keyVaultUrl, credential)

/**
 * Envelope encryption: encrypt DEK with HSM-backed KEK,
 * then encrypt data with DEK.
 */
export async function encryptPiiField(
  plaintext: string,
  keyName = 'nzila-pii-encryption',
): Promise<{ ciphertext: Buffer; wrappedDek: Buffer; keyVersion: string }> {
  // Get the latest key version
  const key = await keyClient.getKey(keyName)
  const cryptoClient = new CryptographyClient(key, credential)

  // Generate a random DEK
  const dek = crypto.getRandomValues(new Uint8Array(32))

  // Wrap (encrypt) the DEK with the HSM key
  const { result: wrappedDek } = await cryptoClient.wrapKey('RSA-OAEP-256', dek)

  // Encrypt data with DEK (AES-256-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw', dek, 'AES-GCM', false, ['encrypt'],
  )
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, cryptoKey, new TextEncoder().encode(plaintext),
  )

  return {
    ciphertext: Buffer.concat([Buffer.from(iv), Buffer.from(encrypted)]),
    wrappedDek: Buffer.from(wrappedDek),
    keyVersion: key.properties.version!,
  }
}

/**
 * Decrypt: unwrap DEK with HSM key (supports any key version),
 * then decrypt data with DEK.
 */
export async function decryptPiiField(
  ciphertext: Buffer,
  wrappedDek: Buffer,
  keyName = 'nzila-pii-encryption',
  keyVersion?: string,
): Promise<string> {
  const keyId = keyVersion
    ? `${keyVaultUrl}/keys/${keyName}/${keyVersion}`
    : keyName
  const key = keyVersion
    ? await keyClient.getKey(keyName, { version: keyVersion })
    : await keyClient.getKey(keyName)

  const cryptoClient = new CryptographyClient(key, credential)
  const { result: dek } = await cryptoClient.unwrapKey('RSA-OAEP-256', wrappedDek)

  // Decrypt data with DEK
  const iv = ciphertext.subarray(0, 12)
  const encrypted = ciphertext.subarray(12)
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw', dek, 'AES-GCM', false, ['decrypt'],
  )
  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, cryptoKey, encrypted,
  )

  return new TextDecoder().decode(decrypted)
}
```

### 4.2 Database Schema Changes

Store the key version alongside encrypted fields for versioned decryption:

```sql
ALTER TABLE org_members
  ADD COLUMN encrypted_email BYTEA,
  ADD COLUMN encrypted_id_number BYTEA,
  ADD COLUMN encryption_key_version VARCHAR(64),
  ADD COLUMN encryption_wrapped_dek BYTEA;
```

### 4.3 Key Rotation Event Handler

```typescript
// packages/os-core/src/crypto/keyRotationHandler.ts
import { EventGridClient } from '@azure/eventgrid'

/**
 * Azure Event Grid handler for Key Vault key rotation events.
 * Re-encrypts active records with the new key version.
 */
export async function handleKeyRotation(event: {
  keyName: string
  newVersion: string
  oldVersion: string
}): Promise<void> {
  // 1. Find all records encrypted with the old key version
  // 2. Decrypt with old version (Key Vault retains all versions)
  // 3. Re-encrypt with new version
  // 4. Audit log the rotation event
  await recordAuditEvent({
    orgId: 'SYSTEM',
    actorClerkUserId: 'system:key-rotation',
    action: 'key.rotate',
    targetType: 'encryption_key',
    targetId: event.keyName,
    afterJson: {
      oldVersion: event.oldVersion,
      newVersion: event.newVersion,
    },
  })
}
```

## 5. Key Rotation Policy

| Setting | Value | Rationale |
|---------|-------|-----------|
| Key type | RSA-HSM 4096-bit | FIPS 140-2 Level 2 compliant |
| Rotation period | 90 days | Aligns with compliance requirements |
| Pre-expiry rotation | 30 days before expiry | Ensures seamless transition |
| Pre-expiry notification | 14 days before expiry | Alert ops team |
| Old key retention | Indefinite (soft-delete protected) | Required for decrypt of historical data |
| Purge protection | Enabled (90-day retention) | Prevent accidental data loss |

## 6. Rollout Plan

| Phase | Action | Timeline |
|-------|--------|----------|
| 1 | Create Key Vault Premium in dev | Week 1 |
| 2 | Implement `hsmKeyProvider.ts` in os-core | Week 1-2 |
| 3 | Add `encryption_key_version` column to schema | Week 2 |
| 4 | Migrate existing encrypted fields (dual-write) | Week 3 |
| 5 | Enable auto-rotation policy | Week 4 |
| 6 | Set up Event Grid handler for re-encryption | Week 4 |
| 7 | Deploy to staging with rotation test | Week 5 |
| 8 | Deploy to production | Week 6 |
| 9 | Verify first automated rotation completes | Week 6 + 90d |

## 7. Monitoring & Alerts

```bicep
// Alert on key expiry approaching
resource keyExpiryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'nzila-key-expiry-warning'
  properties: {
    description: 'PII encryption key approaching expiry'
    severity: 1  // Critical
    scopes: [keyVault.id]
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [{
        name: 'KeyNearExpiry'
        metricName: 'SaturationShoebox'
        operator: 'GreaterThan'
        threshold: 0
        timeAggregation: 'Count'
      }]
    }
    actions: [{ actionGroupId: opsActionGroup.id }]
  }
}
```

## 8. Evidence Artifacts

- Bicep deployment templates in `platform/bicep/`
- Key rotation audit events in `audit_events` table
- Evidence packs under control family `encryption`
- Compliance snapshots capture key vault configuration state
