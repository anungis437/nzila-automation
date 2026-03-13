/**
 * Forecast Card
 *
 * Displays an AI-generated insight / forecast item
 * for the executive insights dashboard.
 *
 * @module components/ai/forecast-card
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AiDisclaimer } from "./ai-disclaimer";
import {
  BarChart3,
  _Building2,
  Flame,
  Scale,
  TrendingUp,
  Users,
} from "lucide-react";

interface Prediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  changePercent: number;
  direction: "up" | "down" | "stable";
  rationale: string;
}

interface Recommendation {
  priority: "high" | "medium" | "low";
  action: string;
  expectedImpact: string;
}

interface ForecastCardProps {
  reportType: string;
  title?: string;
  summary?: string;
  predictions?: Prediction[];
  recommendations?: Recommendation[];
  confidence: number;
  modelVersion: string;
  auditRef: string;
  timeframe?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  trend_forecast: <TrendingUp className="h-4 w-4 text-blue-600" />,
  employer_hotspots: <Flame className="h-4 w-4 text-red-600" />,
  steward_capacity: <Users className="h-4 w-4 text-green-600" />,
  arbitration_escalation: <Scale className="h-4 w-4 text-amber-600" />,
  executive_summary: <BarChart3 className="h-4 w-4 text-violet-600" />,
};

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

export function ForecastCard({
  reportType,
  title,
  summary,
  predictions,
  recommendations,
  confidence,
  modelVersion,
  auditRef,
  timeframe,
}: ForecastCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            {typeIcons[reportType] ?? <BarChart3 className="h-4 w-4" />}
            {title ?? reportType.replace(/_/g, " ")}
          </CardTitle>
          {timeframe && (
            <Badge variant="outline" className="text-[10px]">
              {timeframe}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && <p className="text-sm text-muted-foreground">{summary}</p>}

        {/* Predictions */}
        {predictions && predictions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Predictions</p>
            {predictions.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b pb-1">
                <span>{p.metric}</span>
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="text-muted-foreground">{p.currentValue}</span>
                  <span>→</span>
                  <span className="font-medium">{p.predictedValue}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${p.direction === "up" ? "text-red-600" : p.direction === "down" ? "text-green-600" : "text-gray-500"}`}
                  >
                    {p.direction === "up" ? "↑" : p.direction === "down" ? "↓" : "—"}
                    {Math.abs(p.changePercent).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Recommendations</p>
            {recommendations.map((r, i) => (
              <div key={i} className="p-2 bg-muted/20 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={`text-[10px] ${priorityColors[r.priority]}`}>
                    {r.priority}
                  </Badge>
                  <span className="text-sm font-medium">{r.action}</span>
                </div>
                <p className="text-xs text-muted-foreground">{r.expectedImpact}</p>
              </div>
            ))}
          </div>
        )}

        <AiDisclaimer
          confidence={confidence}
          modelVersion={modelVersion}
          auditRef={auditRef}
          compact
        />
      </CardContent>
    </Card>
  );
}
