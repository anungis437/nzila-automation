# Runbook: Hash Chain / Audit Integrity Failure

**ID:** RB-009
**Severity:** P1
**Category:** Security / Governance
**Owner:** CISO / Platform Engineering
**Last Updated:** 2026-03-03

---

## Symptoms

- Contract test `hash-chain-drift.test.ts` fails
- Console → Audit Insights shows integrity warning
- Audit verification API returns `integrity: false`
- Evidence seal validation fails

## Impact

- **Critical**: Tamper-evidence compromised for audit trail
- Regulatory compliance risk (SOC2, POPIA)
- Proof packs may be invalid

## Diagnosis

1. **Run hash chain verification:**
   ```sql
   SELECT id, prev_hash, hash,
     CASE WHEN hash = encode(
       sha256(concat(prev_hash, ':', action, ':', actor_id, ':', org_id, ':', created_at::text)::bytea),
       'hex'
     ) THEN 'valid' ELSE 'BROKEN' END AS chain_status
   FROM audit_events
   ORDER BY id DESC LIMIT 100;
   ```

2. **Find the break point:**
   ```sql
   WITH chained AS (
     SELECT id, hash, prev_hash,
       LAG(hash) OVER (ORDER BY id) AS expected_prev
     FROM audit_events
   )
   SELECT * FROM chained
   WHERE prev_hash != expected_prev
   ORDER BY id LIMIT 5;
   ```

3. **Check for direct DB mutations** (bypassing application layer):
   - Review pg_stat_activity for non-application connections.
   - Check audit_events for gaps in sequence.

## Remediation

1. **Immediate: Isolate the evidence window.**
   - Mark affected audit events as `integrity_suspect`.
   - Do NOT delete or modify any records.

2. **Determine root cause:**
   - If direct DB mutation: identify who/what made the change.
   - If application bug: identify the code path that skipped hashing.
   - If race condition: check for concurrent writes without proper ordering.

3. **Re-seal from last known-good:**
   - Identify the last verified-good event.
   - Re-compute chain from that point forward (append-only, preserve originals).
   - Document the re-seal in a compliance note.

4. **If evidence packs affected:**
   - Re-generate affected proof packs.
   - Notify governance team.

## Prevention

- `hash-chain-drift.test.ts` runs on every PR.
- All mutations must go through `@nzila/db` which enforces hash chaining.
- No direct DB access in production (application-only connections).
- Weekly automated integrity audit.

## Audit

- This incident itself must be fully documented.
- Evidence pack: audit trail export, integrity verification results.
- CISO sign-off required before closing.
