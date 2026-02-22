/**
 * Phase 5B: Precedent Compare View Component
 * Side-by-side comparison of 2-10 arbitration precedents with analysis
 */

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

interface ComparePrecedent {
  id: string;
  caseNumber: string;
  caseTitle: string;
  decisionDate: string;
  grievanceType: string;
  outcome: string;
  arbitratorName?: string;
  jurisdiction?: string;
  precedentLevel: string;
  issueSummary?: string;
  decisionSummary?: string;
  reasoning?: string;
  keyFindings?: string;
  unionName?: string;
  employerName?: string;
  tribunal?: string;
  sector?: string;
  sharingLevel: string;
  viewCount?: number;
  citationCount?: number;
  sourceOrganization: {
    name: string;
    organizationLevel: string;
  };
  tags?: Array<{ tagName: string }>;
}

interface ComparisonAnalysis {
  commonKeywords: string[];
  differences: {
    grievanceTypes: string[];
    outcomes: string[];
    jurisdictions: string[];
    precedentLevels: string[];
    arbitrators: string[];
    dateRanges: string;
    sharingLevels: string[];
  };
  statistics: {
    totalPrecedents: number;
    averageSummaryLength: number;
    uniqueGrievanceTypes: number;
    uniqueOutcomes: number;
    uniqueJurisdictions: number;
  };
}

interface PrecedentCompareViewProps {
  precedents: ComparePrecedent[];
  analysis?: ComparisonAnalysis;
  onRemovePrecedent: (precedentId: string) => void;
  onExport?: () => void;
  comparisonNotes?: string;
  onNotesChange?: (notes: string) => void;
}

const GRIEVANCE_TYPE_LABELS: Record<string, string> = {
  discipline: "Discipline",
  discharge: "Discharge",
  suspension: "Suspension",
  policy_grievance: "Policy Grievance",
  harassment: "Harassment",
  discrimination: "Discrimination",
  health_safety: "Health & Safety",
  job_classification: "Job Classification",
  layoff: "Layoff",
  recall: "Recall",
  overtime: "Overtime",
  hours_of_work: "Hours of Work",
  leave: "Leave",
  benefits: "Benefits",
  seniority: "Seniority",
  transfer: "Transfer",
  promotion: "Promotion",
  demotion: "Demotion",
  contracting_out: "Contracting Out",
  technological_change: "Technological Change",
  union_security: "Union Security",
  union_business: "Union Business",
  strikes_lockouts: "Strikes & Lockouts",
  grievance_procedure: "Grievance Procedure",
  other: "Other",
};

const OUTCOME_LABELS: Record<string, string> = {
  upheld: "Upheld",
  dismissed: "Dismissed",
  partially_upheld: "Partially Upheld",
  settled: "Settled",
  withdrawn: "Withdrawn",
};

const OUTCOME_COLORS = {
  upheld: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  dismissed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  partially_upheld: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  settled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  withdrawn: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export function PrecedentCompareView({
  precedents,
  analysis,
  onRemovePrecedent,
  onExport,
  comparisonNotes,
  onNotesChange,
}: PrecedentCompareViewProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const maxScroll = Math.max(0, precedents.length - 2);

  const visiblePrecedents = precedents.slice(scrollPosition, scrollPosition + 2);

  const handleScrollLeft = () => {
    setScrollPosition(Math.max(0, scrollPosition - 1));
  };

  const handleScrollRight = () => {
    setScrollPosition(Math.min(maxScroll, scrollPosition + 1));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Precedent Comparison</h2>
          <p className="text-sm text-muted-foreground">
            Comparing {precedents.length} precedent{precedents.length !== 1 ? "s" : ""}
          </p>
        </div>
        {onExport && (
          <Button variant="outline" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        )}
      </div>

      {/* Analysis Summary */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statistics */}
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-2xl font-bold">{analysis.statistics.totalPrecedents}</div>
                <div className="text-xs text-muted-foreground">Precedents</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{analysis.statistics.averageSummaryLength}</div>
                <div className="text-xs text-muted-foreground">Avg. Length</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{analysis.statistics.uniqueGrievanceTypes}</div>
                <div className="text-xs text-muted-foreground">Grievance Types</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{analysis.statistics.uniqueOutcomes}</div>
                <div className="text-xs text-muted-foreground">Outcomes</div>
              </div>
            </div>

            <Separator />

            {/* Common Keywords */}
            {analysis.commonKeywords.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Common Keywords</div>
                <div className="flex flex-wrap gap-2">
                  {analysis.commonKeywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Differences */}
            <div>
              <div className="text-sm font-medium mb-2">Key Differences</div>
              <div className="space-y-2 text-sm">
                {analysis.differences.grievanceTypes.length > 1 && (
                  <div>
                    <span className="font-medium">Grievance Types:</span>{" "}
                    {analysis.differences.grievanceTypes
                      .map((type) => GRIEVANCE_TYPE_LABELS[type] || type)
                      .join(", ")}
                  </div>
                )}
                {analysis.differences.outcomes.length > 1 && (
                  <div>
                    <span className="font-medium">Outcomes:</span>{" "}
                    {analysis.differences.outcomes
                      .map((outcome) => OUTCOME_LABELS[outcome] || outcome)
                      .join(", ")}
                  </div>
                )}
                {analysis.differences.jurisdictions.length > 1 && (
                  <div>
                    <span className="font-medium">Jurisdictions:</span>{" "}
                    {analysis.differences.jurisdictions.join(", ")}
                  </div>
                )}
                {analysis.differences.arbitrators.length > 1 && (
                  <div>
                    <span className="font-medium">Arbitrators:</span>{" "}
                    {analysis.differences.arbitrators.join(", ")}
                  </div>
                )}
                {analysis.differences.dateRanges && (
                  <div>
                    <span className="font-medium">Date Range:</span>{" "}
                    {analysis.differences.dateRanges}
                  </div>
                )}
                {analysis.differences.sharingLevels.length > 1 && (
                  <div>
                    <span className="font-medium">Sharing Levels:</span>{" "}
                    {analysis.differences.sharingLevels.join(", ")}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Notes */}
      {onNotesChange && (
        <Card>
          <CardHeader>
            <CardTitle>Comparison Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={comparisonNotes || ""}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Add notes about this comparison..."
              rows={3}
            />
          </CardContent>
        </Card>
      )}

      {/* Side-by-Side Comparison */}
      <div className="relative">
        {/* Scroll Controls */}
        {precedents.length > 2 && (
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleScrollLeft}
              disabled={scrollPosition === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Showing {scrollPosition + 1}-{Math.min(scrollPosition + 2, precedents.length)} of{" "}
              {precedents.length}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleScrollRight}
              disabled={scrollPosition >= maxScroll}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Comparison Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {visiblePrecedents.map((precedent) => (
            <Card key={precedent.id} className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6"
                onClick={() => onRemovePrecedent(precedent.id)}
              >
                <X className="h-4 w-4" />
              </Button>

              <CardHeader className="pr-10">
                <div className="space-y-2">
                  <CardTitle className="text-lg">
                    <span className="text-muted-foreground mr-2">
                      {precedent.caseNumber}
                    </span>
                    {precedent.caseTitle}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {GRIEVANCE_TYPE_LABELS[precedent.grievanceType] ||
                        precedent.grievanceType}
                    </Badge>
                    <Badge
                      className={
                        OUTCOME_COLORS[
                          precedent.outcome as keyof typeof OUTCOME_COLORS
                        ] || ""
                      }
                    >
                      {OUTCOME_LABELS[precedent.outcome] || precedent.outcome}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Organization */}
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Organization
                  </div>
                  <div className="text-sm">{precedent.sourceOrganization.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {precedent.sourceOrganization.organizationLevel}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {precedent.decisionDate && (
                    <div>
                      <div className="text-xs text-muted-foreground">Decision Date</div>
                      <div>{format(new Date(precedent.decisionDate), "MMM d, yyyy")}</div>
                    </div>
                  )}
                  {precedent.jurisdiction && (
                    <div>
                      <div className="text-xs text-muted-foreground">Jurisdiction</div>
                      <div>
                        {precedent.jurisdiction === "federal"
                          ? "Federal"
                          : precedent.jurisdiction.toUpperCase()}
                      </div>
                    </div>
                  )}
                  {precedent.arbitratorName && (
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground">Arbitrator</div>
                      <div>{precedent.arbitratorName}</div>
                    </div>
                  )}
                  {precedent.tribunal && (
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground">Tribunal</div>
                      <div>{precedent.tribunal}</div>
                    </div>
                  )}
                  {precedent.precedentLevel && (
                    <div>
                      <div className="text-xs text-muted-foreground">Level</div>
                      <div className="capitalize">{precedent.precedentLevel}</div>
                    </div>
                  )}
                  {precedent.sector && (
                    <div>
                      <div className="text-xs text-muted-foreground">Sector</div>
                      <div className="capitalize">{precedent.sector}</div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Parties */}
                {(precedent.unionName || precedent.employerName) && (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {precedent.unionName && (
                        <div>
                          <div className="text-xs text-muted-foreground">Union</div>
                          <div>{precedent.unionName}</div>
                        </div>
                      )}
                      {precedent.employerName && (
                        <div>
                          <div className="text-xs text-muted-foreground">Employer</div>
                          <div>{precedent.employerName}</div>
                        </div>
                      )}
                    </div>
                    <Separator />
                  </>
                )}

                {/* Issue Summary */}
                {precedent.issueSummary && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Issue Summary
                    </div>
                    <ScrollArea className="h-[150px]">
                      <div className="text-sm whitespace-pre-wrap pr-4">
                        {precedent.issueSummary}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Decision Summary */}
                {precedent.decisionSummary && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Decision Summary
                      </div>
                      <ScrollArea className="h-[150px]">
                        <div className="text-sm whitespace-pre-wrap pr-4">
                          {precedent.decisionSummary}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                )}

                {/* Key Findings */}
                {precedent.keyFindings && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Key Findings
                      </div>
                      <ScrollArea className="h-[150px]">
                        <div className="text-sm whitespace-pre-wrap pr-4">
                          {precedent.keyFindings}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                )}

                {/* Engagement */}
                <Separator />
                <div className="flex gap-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Views</div>
                    <div>{precedent.viewCount || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Citations</div>
                    <div>{precedent.citationCount || 0}</div>
                  </div>
                </div>

                {/* Tags */}
                {precedent.tags && precedent.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Tags
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {precedent.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag.tagName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Comparison Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Attribute</th>
                  {precedents.map((precedent) => (
                    <th key={precedent.id} className="text-left py-2 font-medium">
                      {precedent.caseNumber}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">Grievance Type</td>
                  {precedents.map((precedent) => (
                    <td key={precedent.id} className="py-2">
                      {GRIEVANCE_TYPE_LABELS[precedent.grievanceType] ||
                        precedent.grievanceType}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">Outcome</td>
                  {precedents.map((precedent) => (
                    <td key={precedent.id} className="py-2">
                      <Badge
                        variant="outline"
                        className={
                          OUTCOME_COLORS[
                            precedent.outcome as keyof typeof OUTCOME_COLORS
                          ] || ""
                        }
                      >
                        {OUTCOME_LABELS[precedent.outcome] || precedent.outcome}
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">Organization</td>
                  {precedents.map((precedent) => (
                    <td key={precedent.id} className="py-2">
                      {precedent.sourceOrganization.name}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">Jurisdiction</td>
                  {precedents.map((precedent) => (
                    <td key={precedent.id} className="py-2">
                      {precedent.jurisdiction || "-"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">Arbitrator</td>
                  {precedents.map((precedent) => (
                    <td key={precedent.id} className="py-2">
                      {precedent.arbitratorName || "-"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">Decision Date</td>
                  {precedents.map((precedent) => (
                    <td key={precedent.id} className="py-2">
                      {precedent.decisionDate
                        ? format(new Date(precedent.decisionDate), "MMM d, yyyy")
                        : "-"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">Precedent Level</td>
                  {precedents.map((precedent) => (
                    <td key={precedent.id} className="py-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {precedent.precedentLevel}
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">Sector</td>
                  {precedents.map((precedent) => (
                    <td key={precedent.id} className="py-2 capitalize">
                      {precedent.sector || "-"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground">Engagement</td>
                  {precedents.map((precedent) => (
                    <td key={precedent.id} className="py-2">
                      {precedent.viewCount || 0} views, {precedent.citationCount || 0}{" "}
                      citations
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

