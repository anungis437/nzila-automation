"use client";

import type { DecisionRecord } from "@nzila/platform-decision-engine";
import { DecisionSeverityBadge } from "./decision-severity-badge";
import { DecisionStatusBadge } from "./decision-status-badge";
import { FileText, Users, Shield, Eye } from "lucide-react";

interface DecisionProofPanelProps {
  decisions: DecisionRecord[];
}

export function DecisionProofPanel({ decisions }: DecisionProofPanelProps) {
  const withEvidence = decisions.filter((d) => d.evidence_refs.length > 0);
  const withReview = decisions.filter(
    (d) => d.reviewed_by && d.reviewed_by.length > 0,
  );
  const withApprovals = decisions.filter(
    (d) => d.required_approvals.length > 0,
  );
  const policyRestricted = decisions.filter(
    (d) => !d.policy_context.execution_allowed,
  );

  return (
    <div className="space-y-6">
      {/* Governance proof counters */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xl font-bold text-card-foreground">
              {withEvidence.length}
            </p>
            <p className="text-xs text-muted-foreground">Evidence-backed</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xl font-bold text-card-foreground">
              {withReview.length}
            </p>
            <p className="text-xs text-muted-foreground">Human-reviewed</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xl font-bold text-card-foreground">
              {withApprovals.length}
            </p>
            <p className="text-xs text-muted-foreground">Approval-gated</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xl font-bold text-card-foreground">
              {policyRestricted.length}
            </p>
            <p className="text-xs text-muted-foreground">Policy-restricted</p>
          </div>
        </div>
      </div>

      {/* Recent reviewed decisions as proof */}
      {withReview.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Recent Reviews
          </h3>
          <ul className="space-y-3">
            {withReview.slice(0, 5).map((d) => (
              <li key={d.decision_id} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {d.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Reviewed by {d.reviewed_by?.join(", ")}
                  </p>
                  {d.review_notes && d.review_notes.length > 0 && (
                    <p className="text-xs text-muted-foreground italic mt-0.5">
                      &ldquo;{d.review_notes[0]}&rdquo;
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <DecisionSeverityBadge severity={d.severity} />
                  <DecisionStatusBadge status={d.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
