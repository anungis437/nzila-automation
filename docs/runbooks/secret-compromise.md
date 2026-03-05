# Runbook: Secret Compromise

**Trigger**: Secret/credential exposure detected  
**Severity**: P1  
**Audience**: Security engineer, on-call, platform admin

## Immediate Actions (< 10 min)

### 1. Determine Scope

- **What was exposed?** API key, database password, OAuth secret, certificate?
- **Where?** Committed to git, leaked in logs, exposed in error message?
- **How long?** When was it committed/exposed vs. when detected?

### 2. Rotate Immediately

```bash
# Azure Key Vault — rotate the compromised secret
az keyvault secret set \
  --vault-name nzila-prod \
  --name COMPROMISED_SECRET_NAME \
  --value "$(openssl rand -base64 32)"

# If Clerk key
# → Rotate via Clerk Dashboard → API Keys → Rotate

# If Stripe key
# → Rotate via Stripe Dashboard → Developers → API Keys → Roll key

# If database password
az keyvault secret set \
  --vault-name nzila-prod \
  --name database-password \
  --value "$(openssl rand -base64 32)"
# Then update the database password:
# ALTER USER nzila_app WITH PASSWORD 'new_password';
```

### 3. Invalidate Caches

```typescript
import { KeyVaultClient } from '@nzila/secrets/keyvault';
const client = new KeyVaultClient({ vaultUrl: process.env.AZURE_KEY_VAULT_URL! });
client.clearCache();
```

### 4. Restart Affected Services

```bash
# Restart to pick up new secrets
# Azure Container Apps:
az containerapp update --name SERVICE_NAME --resource-group nzila-prod --set-env-vars ...

# Or force restart:
az containerapp revision restart --name SERVICE_NAME --resource-group nzila-prod
```

## If Committed to Git

### 5. Remove from Git History

```bash
# Use BFG Repo Cleaner (faster than git-filter-branch)
bfg --replace-text passwords.txt nzila-automation.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

### 6. Report to GitHub

- Go to repository Settings → Code security → Secret scanning
- Mark the alert as resolved

## Investigation (< 1 hour)

1. **Check access logs** for the compromised credential:
   - Azure Key Vault audit logs
   - Application access logs
   - Cloud provider activity logs

2. **Check for unauthorized usage**:
   ```bash
   # Clerk: check recent API usage
   # Stripe: check recent charges/events
   # Database: check recent connections from unknown IPs
   ```

3. **Run the secret scanner** to find any other exposures:
   ```bash
   # TruffleHog
   trufflehog git file://. --only-verified

   # Gitleaks
   gitleaks detect --source . --config .gitleaks.toml
   ```

## Record Rotation Event

```typescript
import { SecretRotationManager } from '@nzila/secrets/rotation';

const manager = new SecretRotationManager();
manager.recordRotation({
  secretName: 'compromised-secret',
  rotationType: 'api_key',
  newVersion: 'emergency-rotation-' + Date.now(),
  rotatedAt: new Date(),
  rotatedBy: 'manual',
  evidencePackId: 'incident-YYYY-MM-DD',
});
```

## Post-Incident

- [ ] Compromised secret rotated and old value invalidated
- [ ] All services restarted with new secret
- [ ] Git history cleaned (if committed)
- [ ] Access logs reviewed for unauthorized usage
- [ ] Full repo scanned for additional exposures
- [ ] Incident report written
- [ ] `.gitleaks.toml` updated if new pattern needed
