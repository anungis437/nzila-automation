/**
 * Clause Reasoning Panel
 *
 * Displays AI-suggested CBA clauses for a grievance,
 * with relevance scores, reasoning, and strength assessments.
 *
 * @module components/ai/clause-reasoning-panel
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AiDisclaimer } from "./ai-disclaimer";
import { BookOpen, ChevronDown, ChevronRight, Loader2, Scale } from "lucide-react";
import { useFeatureFlag } from "@/lib/hooks/use-feature-flags";

interface SuggestedClause {
  clauseArticle: string;
  clauseSection: string | null;
  clauseTitle: string | null;
  clauseSnippet: string | null;
  relevanceScore: number;
  reasoning: string;
  applicationNotes: string | null;
  strengthAssessment: "strong" | "moderate" | "weak";
  precedentRefs: Array<{ id: string; title: string; relevance: number }>;
}

interface ClauseReasoningPanelProps {
  grievanceId: string;
  data?: {
    available: boolean;
    data?: {
      suggestedClauses: SuggestedClause[];
      overallAnalysis: string;
    };
    confidence: number;
    explanation: string;
    modelVersion: string;
    auditRef: string;
  } | null;
  onRequestAnalysis?: () => void;
  loading?: boolean;
}

const strengthColors: Record<string, string> = {
  strong: "bg-green-100 text-green-700 border-green-200",
  moderate: "bg-yellow-100 text-yellow-700 border-yellow-200",
  weak: "bg-red-100 text-red-700 border-red-200",
};

export function ClauseReasoningPanel({
  grievanceId: _grievanceId,
  data,
  onRequestAnalysis,
  loading,
}: ClauseReasoningPanelProps) {
  const enabled = useFeatureFlag("ai_clause_reasoning");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-4 w-4 text-indigo-600" />
          AI Clause Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!data && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">No clause analysis available yet.</p>
            <Button onClick={onRequestAnalysis} disabled={loading} size="sm">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BookOpen className="h-4 w-4 mr-2" />}
              Suggest Clauses
            </Button>
          </div>
        )}

        {data?.available && data.data && (
          <>
            {/* Overall analysis */}
            {data.data.overallAnalysis && (
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-md p-3">
                {data.data.overallAnalysis}
              </p>
            )}

            {/* Clause list */}
            <div className="space-y-2">
              {data.data.suggestedClauses.map((clause, i) => (
                <div
                  key={i}
                  className="border rounded-md p-3 hover:bg-muted/20 transition-colors"
                >
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  >
                    {expandedIdx === i ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium text-sm">
                      Art. {clause.clauseArticle}
                      {clause.clauseSection ? ` § ${clause.clauseSection}` : ""}
                    </span>
                    {clause.clauseTitle && (
                      <span className="text-sm text-muted-foreground">— {clause.clauseTitle}</span>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      <Badge variant="outline" className={strengthColors[clause.strengthAssessment]}>
                        {clause.strengthAssessment}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {(clause.relevanceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {expandedIdx === i && (
                    <div className="mt-3 ml-6 space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Reasoning: </span>
                        {clause.reasoning}
                      </div>
                      {clause.applicationNotes && (
                        <div>
                          <span className="font-medium text-muted-foreground">Application: </span>
                          {clause.applicationNotes}
                        </div>
                      )}
                      {clause.clauseSnippet && (
                        <blockquote className="border-l-2 border-indigo-300 pl-3 text-xs text-muted-foreground italic">
                          {clause.clauseSnippet}
                        </blockquote>
                      )}
                      {clause.precedentRefs.length > 0 && (
                        <div className="text-xs">
                          <span className="font-medium text-muted-foreground">Precedents: </span>
                          {clause.precedentRefs.map((p, j) => (
                            <Badge key={j} variant="outline" className="text-[10px] mr-1">
                              {p.title} ({(p.relevance * 100).toFixed(0)}%)
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

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
