# Pilot Playbook — Nzila OS Control Plane

## Purpose

This playbook guides a pilot team through deploying, configuring, and
evaluating the Control Plane for a real organisation.

## Week 1 — Setup

1. **Deploy**: `pnpm build:control-plane && pnpm --filter @nzila/control-plane start`
2. **Seed demo data**: `pnpm --filter @nzila/control-plane demo:seed`
3. **Verify access**: Open the control plane on port 3010 and confirm all 7 pages render.
4. **Connect data sources**: Replace demo seed with real adapters in `server/data.ts`.

## Week 2 — Baseline

1. Run the governance check and record the baseline score.
2. Review the anomaly page daily — triage any critical anomalies.
3. Review agent recommendations — mark each as "accepted" or "dismissed" in your tracking tool.
4. Export the procurement pack and share with your compliance team.

## Week 3 — Iterate

1. Tune anomaly thresholds using `platform-anomaly-engine` rule configuration.
2. Add custom intelligence queries via the query box.
3. Integrate the modules page with your CI/CD pipeline for health reporting.
4. Review agent confidence scores and adjust the model if needed.

## Week 4 — Evaluate

1. Compare governance scores against the Week 2 baseline.
2. Measure time-to-detection for anomalies vs. the previous process.
3. Gather feedback from operators on the dashboard layout and information density.
4. Write a summary report with recommendations for GA rollout.

## Go/No-Go Criteria

| Criterion | Target |
|---|---|
| All 7 pages render with real data | ✅ |
| Governance score ≥ 75 | ✅ |
| Anomaly detection MTTD < 15 min | ✅ |
| Zero critical vulnerabilities in procurement pack | ✅ |
| Operator NPS ≥ 7 | ✅ |
