/**
 * Employer Risk Card
 *
 * Displays the AI-generated risk score for an employer,
 * with band badge, trend indicator, and signal breakdown.
 *
 * @module components/ai/employer-risk-card
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AiDisclaimer } from "./ai-disclaimer";
import { AlertTriangle, Loader2, RefreshCw, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useFeatureFlag } from "@/lib/hooks/use-feature-flags";

interface RiskSignal {
  signal: string;
  value: number;
  weight: number;
  description: string;
}

interface EmployerRiskCardProps {
  employerId: string;
  data?: {
    available: boolean;
    data?: {
      overallScore: number;
      riskBand: "low" | "moderate" | "elevated" | "high" | "critical";
      trendDirection: "improving" | "stable" | "worsening";
      signals: RiskSignal[];
      summary: string;
    };
    confidence: number;
    explanation: string;
    modelVersion: string;
    auditRef: string;
  } | null;
  onRecalculate?: () => void;
  loading?: boolean;
}

const bandColors: Record<string, string> = {
  low: "bg-green-100 text-green-700 border-green-200",
  moderate: "bg-yellow-100 text-yellow-700 border-yellow-200",
  elevated: "bg-orange-100 text-orange-700 border-orange-200",
  high: "bg-red-100 text-red-700 border-red-200",
  critical: "bg-red-200 text-red-900 border-red-400",
};

const trendIcons: Record<string, React.ReactNode> = {
  improving: <TrendingDown className="h-4 w-4 text-green-600" />,
  stable: <Minus className="h-4 w-4 text-gray-500" />,
  worsening: <TrendingUp className="h-4 w-4 text-red-600" />,
};

export function EmployerRiskCard({
  employerId,
  data,
  onRecalculate,
  loading,
}: EmployerRiskCardProps) {
  const enabled = useFeatureFlag("ai_employer_risk");

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Employer Risk Score
          </CardTitle>
          {data?.available && (
            <Button variant="ghost" size="icon" onClick={onRecalculate} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!data && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Risk score has not been calculated yet.
            </p>
            <Button onClick={onRecalculate} disabled={loading} size="sm">
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              Calculate Risk
            </Button>
          </div>
        )}

        {data?.available && data.data && (
          <>
            {/* Score + band + trend */}
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold tabular-nums">
                {data.data.overallScore.toFixed(0)}
              </div>
              <Badge variant="outline" className={bandColors[data.data.riskBand]}>
                {data.data.riskBand.toUpperCase()}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {trendIcons[data.data.trendDirection]}
                {data.data.trendDirection}
              </div>
            </div>

            {/* Summary */}
            <p className="text-sm text-muted-foreground">{data.data.summary}</p>

            {/* Signal breakdown */}
            {data.data.signals.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Signal Breakdown</p>
                {data.data.signals.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span>{s.description || s.signal}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {s.value.toFixed(1)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${Math.min(s.value, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <AiDisclaimer
              confidence={data.confidence}
              modelVersion={data.modelVersion}
              auditRef={data.auditRef}
              compact
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
