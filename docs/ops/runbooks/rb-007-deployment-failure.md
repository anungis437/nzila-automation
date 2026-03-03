# Runbook: Deployment Failure / Rollback

**ID:** RB-007
**Severity:** P2
**Category:** Deployment
**Owner:** Platform Engineering
**Last Updated:** 2026-03-03

---

## Symptoms

- CI/CD pipeline fails during build or deploy step
- SLO gate (`scripts/slo-gate.ts`) blocks deployment
- Release attestation (`scripts/release-attestation.ts`) fails
- App is deployed but health checks fail
- Console → System Health shows deployment status `failed`

## Impact

- New features / fixes not reaching users
- If partially deployed: inconsistent state between services
- If pilot env: blocks pilot timeline

## Diagnosis

1. **Check CI/CD logs** for the failure point:
   - Build failure → check TypeScript errors, missing deps.
   - SLO gate failure → check which SLO was violated.
   - Attestation failure → check contract test or secret scan results.

2. **If deployed but unhealthy:**
   ```bash
   # Check app health endpoint
   curl https://{app-url}/api/health
   ```

3. **Check for environment variable issues:**
   - Compare `.env.example` with deployed env vars.
   - Check for missing secrets (DB URL, API keys).

4. **Check for migration issues:**
   ```bash
   npx drizzle-kit check
   ```

## Remediation

### Build Failure
1. Fix the failing code/config.
2. Run locally: `pnpm build:<app>` to verify.
3. Push fix and re-trigger pipeline.

### SLO Gate Failure
1. Check which SLO is violated: `npx tsx scripts/slo-gate.ts --env <env>`.
2. If legitimate regression → fix the performance/reliability issue first.
3. If false positive → investigate metric source, adjust thresholds if justified.

### Unhealthy After Deploy
1. **Rollback immediately:**
   ```bash
   # Azure App Service
   az webapp deployment slot swap --name <app> --resource-group <rg> \
     --slot staging --target-slot production --action preview
   # Or revert to previous container image
   ```
2. Investigate the diff between current and previous deploy.
3. Fix and redeploy via normal pipeline.

### Partial Deploy (Multi-Service)
1. Identify which services deployed successfully.
2. Check API version compatibility between services.
3. Either roll forward the remaining services or roll back all.

## Prevention

- SLO gate in CI catches regressions before deploy.
- Release attestation ensures all checks pass.
- Staging environment mirrors production config.
- `pnpm pilot:check` for pre-deploy validation.

## Audit

- All rollbacks create deployment audit events.
- Failed deployments logged with root cause.
- Release attestation artifacts archived regardless of outcome.
