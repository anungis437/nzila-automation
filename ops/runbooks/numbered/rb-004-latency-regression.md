# Runbook: Latency Regression (P95/P99 Breach)

**ID:** RB-004
**Severity:** P2
**Category:** Performance
**Owner:** Platform Engineering
**Last Updated:** 2026-03-03

---

## Symptoms

- Console → Performance shows P95 or P99 latency above SLO threshold
- Console → Performance → Regressions shows new entries
- ChatOps alert: "P95 latency regression: {app}"
- Health digest flags performance anomaly
- Users report "slow page loads"

## Impact

- Degraded user experience for affected app/routes
- May trigger SLO gate failure, blocking pilot/prod deploys

## Diagnosis

1. **Console → Performance → Regressions**: Identify affected routes.
2. **Check if deploy-correlated:**
   ```bash
   git log --oneline -10  # recent deploys
   ```
3. **Check route-level breakdown:**
   ```sql
   SELECT route, percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95,
          COUNT(*) AS requests
   FROM request_metrics
   WHERE app = '{app}' AND created_at > NOW() - INTERVAL '1 hour'
   GROUP BY route ORDER BY p95 DESC;
   ```
4. **Check database slow queries:**
   ```sql
   SELECT query, calls, mean_exec_time, total_exec_time
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC LIMIT 10;
   ```
5. **Check external dependency latency** (integration health checks).

## Remediation

1. **If deploy-correlated:**
   - Rollback to previous version.
   - Investigate the diff for N+1 queries, missing indexes, large payloads.

2. **If database-related:**
   - Add missing index.
   - Optimize query (check `EXPLAIN ANALYZE`).
   - Consider read replica for heavy queries.

3. **If external dependency:**
   - Enable caching for slow external calls.
   - Add timeout + circuit breaker.

4. **If traffic spike:**
   - Scale horizontally (add instances).
   - Enable CDN caching for static routes.
   - Check for bot/abuse traffic.

## Prevention

- Perf budget gate (`ops/perf-budgets.yml`) catches regressions before deploy.
- PR-level performance review for database-touching changes.
- Automatic slow-query alerting at 1s threshold.

## Audit

- Log rollback decisions in incident ticket.
- Update perf budget if threshold is intentionally adjusted.
