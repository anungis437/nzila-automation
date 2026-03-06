/**
 * Executive AI Insights Page
 *
 * Dashboard page that aggregates all AI insight report types:
 * trend forecasts, employer hotspots, steward capacity,
 * arbitration escalation, and executive summaries.
 *
 * Restricted to officer+ roles.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ForecastCard } from "@/components/ai/forecast-card";
import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { useFeatureFlag } from "@/lib/hooks/use-feature-flags";
import {
  BarChart3,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface InsightEnvelope {
  available: boolean;
  data?: {
    reportType: string;
    title: string;
    summary: string;
    predictions: Array<{
      metric: string;
      currentValue: number;
      predictedValue: number;
      changePercent: number;
      direction: "up" | "down" | "stable";
      rationale: string;
    }>;
    recommendations: Array<{
      priority: "high" | "medium" | "low";
      action: string;
      expectedImpact: string;
    }>;
    timeframe: string;
  };
  confidence: number;
  explanation: string;
  modelVersion: string;
  auditRef: string;
}

const REPORT_TYPES = [
  "trend_forecast",
  "employer_hotspots",
  "steward_capacity",
  "arbitration_escalation",
  "executive_summary",
] as const;

export default function InsightsPage() {
  const enabled = useFeatureFlag("ai_executive_insights");
  const [reports, setReports] = useState<Record<string, InsightEnvelope>>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/insights/summary");
      const json = await res.json();
      if (json.data?.reports) {
        const mapped: Record<string, InsightEnvelope> = {};
        for (const r of json.data.reports) {
          mapped[r.data?.reportType ?? "unknown"] = r;
        }
        setReports(mapped);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchSummary();
    }
  }, [enabled, fetchSummary]);

  const handleGenerate = useCallback(
    async (reportType: string) => {
      setGenerating(reportType);
      try {
        const res = await fetch(`/api/ai/insights/${reportType}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timeframe: "90d" }),
        });
        const json = await res.json();
        if (json.data) {
          setReports((prev) => ({ ...prev, [reportType]: json.data }));
        }
      } finally {
        setGenerating(null);
      }
    },
    [],
  );

  if (!enabled) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <BarChart3 className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
        <p>AI Executive Insights are not enabled for your organization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-violet-600" />
            Executive AI Insights
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-generated forecasts and strategic recommendations — advisory only.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSummary} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh All
        </Button>
      </div>

      {/* Report grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {REPORT_TYPES.map((rt) => {
          const envelope = reports[rt];
          if (envelope?.available && envelope.data) {
            return (
              <ForecastCard
                key={rt}
                reportType={rt}
                title={envelope.data.title}
                summary={envelope.data.summary}
                predictions={envelope.data.predictions}
                recommendations={envelope.data.recommendations}
                confidence={envelope.confidence}
                modelVersion={envelope.modelVersion}
                auditRef={envelope.auditRef}
                timeframe={envelope.data.timeframe}
              />
            );
          }

          return (
            <div
              key={rt}
              className="border rounded-lg p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[180px]"
            >
              <Badge variant="outline" className="text-xs capitalize">
                {rt.replace(/_/g, " ")}
              </Badge>
              <p className="text-sm text-muted-foreground">No report generated yet.</p>
              <Button
                size="sm"
                onClick={() => handleGenerate(rt)}
                disabled={generating === rt}
              >
                {generating === rt ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4 mr-2" />
                )}
                Generate
              </Button>
            </div>
          );
        })}
      </div>

      {/* Global disclaimer */}
      <AiDisclaimer confidence={0} modelVersion="" compact />
    </div>
  );
}
