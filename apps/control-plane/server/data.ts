/**
 * Server-side data access — wraps platform packages and falls back to demo seed.
 *
 * Every function returns zod-validated data.
 * In production these will call live platform package APIs;
 * for demo / dev they return deterministic seed data.
 */
import "server-only";

import {
  seedGovernanceStatus,
  seedGovernanceTimeline,
  seedInsights,
  seedSignals,
  seedAnomalies,
  seedRecommendations,
  seedModules,
  seedProcurement,
} from "@/lib/demoSeed";
import { governanceStatusSchema, governanceAuditTimelineEntrySchema } from "@nzila/platform-governance";
import { crossAppInsightSchema, operationalSignalSchema } from "@nzila/platform-intelligence";
import { anomalySchema } from "@nzila/platform-anomaly-engine";
import { recommendationSchema } from "@nzila/platform-agent-workflows";
import { moduleStatusSchema, overviewSummarySchema, procurementSummarySchema } from "@/types";
import type {
  GovernanceStatus,
  GovernanceAuditTimelineEntry,
} from "@nzila/platform-governance/types";
import type { CrossAppInsight, OperationalSignal } from "@nzila/platform-intelligence/types";
import type { Anomaly } from "@nzila/platform-anomaly-engine/types";
import type { Recommendation } from "@nzila/platform-agent-workflows/types";
import type { ModuleStatus, OverviewSummary, ProcurementSummary } from "@/types";
import { z } from "zod";

// ── Governance ──────────────────────────────────────────

export async function getGovernanceStatusData(): Promise<GovernanceStatus> {
  const raw = seedGovernanceStatus();
  return governanceStatusSchema.parse(raw) as GovernanceStatus;
}

export async function getGovernanceTimeline(): Promise<GovernanceAuditTimelineEntry[]> {
  const raw = seedGovernanceTimeline();
  return z.array(governanceAuditTimelineEntrySchema).parse(raw) as GovernanceAuditTimelineEntry[];
}

// ── Intelligence ────────────────────────────────────────

export async function getInsights(): Promise<CrossAppInsight[]> {
  const raw = seedInsights();
  return z.array(crossAppInsightSchema).parse(raw) as CrossAppInsight[];
}

export async function getSignals(): Promise<OperationalSignal[]> {
  const raw = seedSignals();
  return z.array(operationalSignalSchema).parse(raw) as OperationalSignal[];
}

// ── Anomalies ───────────────────────────────────────────

export async function getAnomalies(): Promise<Anomaly[]> {
  const raw = seedAnomalies();
  return z.array(anomalySchema).parse(raw) as Anomaly[];
}

export async function getAnomalyById(id: string): Promise<Anomaly | undefined> {
  const all = await getAnomalies();
  return all.find((a) => a.id === id);
}

// ── Agent Recommendations ───────────────────────────────

export async function getRecommendations(): Promise<Recommendation[]> {
  const raw = seedRecommendations();
  return z.array(recommendationSchema).parse(raw) as Recommendation[];
}

// ── Modules ─────────────────────────────────────────────

export async function getModules(): Promise<ModuleStatus[]> {
  const raw = seedModules();
  return z.array(moduleStatusSchema).parse(raw) as ModuleStatus[];
}

// ── Procurement ─────────────────────────────────────────

export async function getProcurementSummary(): Promise<ProcurementSummary> {
  const raw = seedProcurement();
  return procurementSummarySchema.parse(raw) as ProcurementSummary;
}

// ── Overview ────────────────────────────────────────────

export async function getOverviewSummary(): Promise<OverviewSummary> {
  const [governance, anomalies, modules, procurement] = await Promise.all([
    getGovernanceStatusData(),
    getAnomalies(),
    getModules(),
    getProcurementSummary(),
  ]);

  const healthyModules = modules.filter((m) => m.health === "healthy").length;

  const summary: OverviewSummary = {
    platformHealthy:
      governance.policy_engine === "healthy" &&
      governance.evidence_pack === "verified",
    governanceCompliant:
      governance.compliance_snapshot === "current" && governance.sbom_current,
    intelligenceActive: true,
    activeAnomalies: anomalies.length,
    totalModules: modules.length,
    healthyModules,
    procurementPackReady: procurement.signatureStatus === "verified",
    generatedAt: new Date().toISOString(),
  };

  return overviewSummarySchema.parse(summary) as OverviewSummary;
}
