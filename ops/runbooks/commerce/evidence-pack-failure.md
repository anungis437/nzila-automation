# Evidence Pack Failure

**Severity:** P2  
**Owner:** Platform Engineering / Compliance  
**Last Reviewed:** 2025-07-17  
**Alert:** `commerce-evidence-pack-failure`

---

## Trigger

- Evidence pack generation fails
- Evidence pack validation returns errors
- No evidence packs generated in 24 hours (for active orgs)

---

## Pre-requisites

- Access to evidence blob storage
- Access to commerce metrics dashboard
- `admin` or `owner` OrgRole for the affected org

---

## Diagnosis Steps

### Step 1: Identify the Failure

```kql
customMetrics
| where name == "commerce_evidence_pack_total"
| summarize total = sum(valueSum) by bin(timestamp, 1h),
            tostring(customDimensions.control_family)
| order by timestamp desc
```

### Step 2: Check Validation Errors

```typescript
import { validateCommerceEvidencePack } from '@nzila/commerce-evidence'

const errors = validateCommerceEvidencePack(pack)
// errors is string[] — each entry describes a validation failure
```

Common validation failures:
- Missing required artifacts
- SHA-256 hash mismatch (data corruption)
- Missing audit trail entries
- Invalid control mapping

### Step 3: Check Blob Storage

Verify the blob storage container is accessible:

```bash
az storage blob list \
  --container-name evidence \
  --prefix "{org_id}/commerce/" \
  --account-name $STORAGE_ACCOUNT
```

---

## Resolution Steps

### If Generation Failed

1. Check the error logs for the generation pipeline
2. Common causes:
   - Blob storage access denied → check SAS token / managed identity
   - Audit entries missing → investigate audit gap (see audit-gap-investigation.md)
   - SHA-256 computation failed → check artifact data availability
3. Fix the underlying issue
4. Re-trigger evidence pack generation

### If Validation Failed

1. Identify which validation rules failed
2. Fix the data:
   - Missing artifact → regenerate the artifact
   - Hash mismatch → re-upload the artifact with correct hash
   - Missing audit entries → backfill (see audit-gap-investigation.md)
3. Re-validate the pack

### If No Packs Generated

1. Check if there are active commerce operations for the org
2. If operations exist but no packs: the evidence pipeline trigger may be broken
3. Verify event bus subscriptions are active
4. Re-trigger evidence pack generation manually

---

## Verification

- [ ] Evidence pack generates successfully
- [ ] Evidence pack passes `validateCommerceEvidencePack`
- [ ] Sealable index can be generated via `toSealableIndex`
- [ ] Pack is stored in blob storage at the correct path
- [ ] Metric shows pack generation is recovering

---

## Evidence to Capture

| Artifact | Description |
|----------|-------------|
| Failure logs | Error logs from the generation pipeline |
| Validation results | Output of `validateCommerceEvidencePack` |
| Fix verification | Proof that pack generates and validates |
| Blob storage listing | Verification of storage accessibility |
