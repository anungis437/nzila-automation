/**
 * Server-side data access — wraps platform packages with seed fallback.
 *
 * Every function returns zod-validated data.
 * Uses live platform package APIs where possible (in-memory event stores
 * populated during app lifecycle). Falls back to deterministic seed data
 * when the live layer has no events yet (first boot / dev).
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
import {
  governanceStatusSchema,
  governanceAuditTimelineEntrySchema,
  getGovernanceStatus as liveGovernanceStatus,
  buildGovernanceAuditTimeline,
} from "@nzila/platform-governance";
import {
  crossAppInsightSchema,
  operationalSignalSchema,
  generateCrossAppInsights,
  getAggregatedEvents,
  detectOperationalSignals,
} from "@nzila/platform-intelligence";
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
  // Try live governance status from in-memory audit timeline
  try {
    const live = liveGovernanceStatus({
      policyEngineAvailable: true,
      evidencePackAvailable: true,
      complianceSnapshotAvailable: true,
    });
    const parsed = governanceStatusSchema.safeParse(live);
    if (parsed.success) return parsed.data as GovernanceStatus;
  } catch { /* fall through to seed */ }

  const raw = seedGovernanceStatus();
  return governanceStatusSchema.parse(raw) as GovernanceStatus;
}

export async function getGovernanceTimeline(): Promise<GovernanceAuditTimelineEntry[]> {
  // Try live audit timeline
  try {
    const live = buildGovernanceAuditTimeline({});
    if (live.length > 0) {
      return z.array(governanceAuditTimelineEntrySchema).parse(live) as GovernanceAuditTimelineEntry[];
    }
  } catch { /* fall through to seed */ }

  const raw = seedGovernanceTimeline();
  return z.array(governanceAuditTimelineEntrySchema).parse(raw) as GovernanceAuditTimelineEntry[];
}

// ── Intelligence ────────────────────────────────────────

export async function getInsights(): Promise<CrossAppInsight[]> {
  // Try live cross-app insights from aggregated events
  try {
    const events = getAggregatedEvents({});
    if (events.length > 0) {
      const live = generateCrossAppInsights(events);
      const parsed = z.array(crossAppInsightSchema).safeParse(live);
      if (parsed.success && parsed.data.length > 0) return parsed.data as CrossAppInsight[];
    }
  } catch { /* fall through to seed */ }

  const raw = seedInsights();
  return z.array(crossAppInsightSchema).parse(raw) as CrossAppInsight[];
}

export async function getSignals(): Promise<OperationalSignal[]> {
  // Try live operational signals from aggregated events
  try {
    const events = getAggregatedEvents({});
    if (events.length > 0) {
      const metrics = events.map((e) => ({
        app: e.app,
        metric: e.eventType,
        value: 1,
        baseline: 0,
        timestamp: e.timestamp,
      }));
      const live = detectOperationalSignals(metrics);
      const parsed = z.array(operationalSignalSchema).safeParse(live);
      if (parsed.success && parsed.data.length > 0) return parsed.data as OperationalSignal[];
    }
  } catch { /* fall through to seed */ }

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
    intelligenceActive: getAggregatedEvents({}).length > 0,
    activeAnomalies: anomalies.length,
    totalModules: modules.length,
    healthyModules,
    procurementPackReady: procurement.signatureStatus === "verified",
    generatedAt: new Date().toISOString(),
  };

  return overviewSummarySchema.parse(summary) as OverviewSummary;
}
