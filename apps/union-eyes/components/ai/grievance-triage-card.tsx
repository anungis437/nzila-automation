/**
 * Grievance Triage Card
 *
 * Displays AI triage recommendation for a grievance:
 * priority, category, complexity, estimated days, and explanation.
 * Includes accept/reject controls.
 *
 * @module components/ai/grievance-triage-card
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiDisclaimer } from "./ai-disclaimer";
import { Brain, CheckCircle2, XCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { useFeatureFlag } from "@/lib/hooks/use-feature-flags";

interface TriageData {
  suggestedPriority: string;
  suggestedCategory: string;
  complexity: string;
  estimatedDaysToResolve: number | null;
  suggestedStep: string | null;
  factors: Array<{ name: string; weight: number; description: string }>;
}

interface GrievanceTriageCardProps {
  grievanceId: string;
  triage?: {
    available: boolean;
    data?: TriageData;
    confidence: number;
    explanation: string;
    modelVersion: string;
    auditRef: string;
    disclaimer: string;
  } | null;
  onRequestTriage?: () => void;
  onAccept?: (notes?: string) => void;
  onReject?: (notes?: string) => void;
  loading?: boolean;
}

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const complexityColors: Record<string, string> = {
  routine: "bg-green-100 text-green-700",
  moderate: "bg-yellow-100 text-yellow-700",
  complex: "bg-orange-100 text-orange-700",
  unprecedented: "bg-red-100 text-red-700",
};

export function GrievanceTriageCard({
  grievanceId,
  triage,
  onRequestTriage,
  onAccept,
  onReject,
  loading,
}: GrievanceTriageCardProps) {
  const enabled = useFeatureFlag("ai_grievance_triage");
  const [reviewNotes, setReviewNotes] = useState("");
  const [showFactors, setShowFactors] = useState(false);

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4 text-purple-600" />
          AI Triage Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!triage && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">No AI triage available yet.</p>
            <Button onClick={onRequestTriage} disabled={loading} size="sm">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
              Run AI Triage
            </Button>
          </div>
        )}

        {triage?.available && triage.data && (
          <>
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className={priorityColors[triage.data.suggestedPriority] ?? "bg-gray-100"}>
                Priority: {triage.data.suggestedPriority}
              </Badge>
              <Badge variant="outline">
                Category: {triage.data.suggestedCategory}
              </Badge>
              <Badge className={complexityColors[triage.data.complexity] ?? "bg-gray-100"}>
                {triage.data.complexity}
              </Badge>
              {triage.data.estimatedDaysToResolve && (
                <Badge variant="outline" className="bg-blue-50">
                  <Clock className="h-3 w-3 mr-1" />
                  ~{triage.data.estimatedDaysToResolve}d
                </Badge>
              )}
              {triage.data.suggestedStep && (
                <Badge variant="outline">
                  Next: {triage.data.suggestedStep.replace("_", " ")}
                </Badge>
              )}
            </div>

            {/* Explanation */}
            <div className="text-sm text-muted-foreground bg-muted/30 rounded-md p-3">
              <p className="font-medium mb-1">AI Reasoning:</p>
              <p>{triage.explanation}</p>
            </div>

            {/* Factors (expandable) */}
            {triage.data.factors.length > 0 && (
              <div>
                <button
                  onClick={() => setShowFactors(!showFactors)}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  {showFactors ? "Hide" : "Show"} factors ({triage.data.factors.length})
                </button>
                {showFactors && (
                  <div className="mt-2 space-y-1">
                    {triage.data.factors.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div
                          className="h-2 rounded bg-purple-400"
                          style={{ width: `${f.weight * 100}%`, maxWidth: "120px" }}
                        />
                        <span className="font-medium">{f.name}</span>
                        <span className="text-muted-foreground">{f.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <AiDisclaimer
              confidence={triage.confidence}
              modelVersion={triage.modelVersion}
              auditRef={triage.auditRef}
            />

            {/* Accept / Reject */}
            <div className="space-y-2 pt-2 border-t">
              <Textarea
                placeholder="Optional review notes…"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="text-sm h-16"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onAccept?.(reviewNotes)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReject?.(reviewNotes)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
