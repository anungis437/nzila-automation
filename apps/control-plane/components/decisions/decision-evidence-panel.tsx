"use client";

import type { DecisionRecord } from "@nzila/platform-decision-engine";
import { DecisionStatusBadge } from "./decision-status-badge";
import { DecisionSeverityBadge } from "./decision-severity-badge";

interface DecisionEvidencePanelProps {
  decision: DecisionRecord;
}

export function DecisionEvidencePanel({ decision }: DecisionEvidencePanelProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{decision.title}</h2>
          <p className="text-sm text-muted-foreground mt-1 font-mono">{decision.decision_id}</p>
        </div>
        <div className="flex gap-2">
          <DecisionSeverityBadge severity={decision.severity} />
          <DecisionStatusBadge status={decision.status} />
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Summary</h3>
        <p className="text-foreground">{decision.summary}</p>
        <p className="text-sm text-muted-foreground mt-2">{decision.explanation}</p>
      </div>

      {/* Evidence refs */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Evidence ({decision.evidence_refs.length})
        </h3>
        {decision.evidence_refs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No evidence attached.</p>
        ) : (
          <ul className="space-y-2">
            {decision.evidence_refs.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                  {e.type}
                </span>
                <span className="text-foreground">{e.summary ?? e.ref_id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recommended actions */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Recommended Actions</h3>
        <ol className="list-decimal list-inside space-y-1">
          {decision.recommended_actions.map((a, i) => (
            <li key={i} className="text-sm text-foreground">{a}</li>
          ))}
        </ol>
      </div>

      {/* Policy context */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Policy Context</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-foreground">Execution allowed:</span>
          <span className={decision.policy_context.execution_allowed ? "text-emerald-600" : "text-red-600"}>
            {decision.policy_context.execution_allowed ? "Yes" : "No"}
          </span>
        </div>
        {decision.policy_context.reasons.length > 0 && (
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            {decision.policy_context.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Category:</span>{" "}
          <span className="text-foreground">{decision.category}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Type:</span>{" "}
          <span className="text-foreground">{decision.type}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Confidence:</span>{" "}
          <span className="text-foreground">{(decision.confidence_score * 100).toFixed(0)}%</span>
        </div>
        <div>
          <span className="text-muted-foreground">Environment:</span>{" "}
          <span className="text-foreground">{decision.environment_context.environment}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Generated:</span>{" "}
          <span className="text-foreground">{new Date(decision.generated_at).toLocaleString()}</span>
        </div>
        {decision.expires_at && (
          <div>
            <span className="text-muted-foreground">Expires:</span>{" "}
            <span className="text-foreground">{new Date(decision.expires_at).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Required approvals */}
      {decision.required_approvals.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Required Approvals</h3>
          <div className="flex gap-2 flex-wrap">
            {decision.required_approvals.map((a, i) => (
              <span key={i} className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Review history */}
      {decision.reviewed_by && decision.reviewed_by.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Review History</h3>
          <ul className="space-y-1">
            {decision.reviewed_by.map((r, i) => (
              <li key={i} className="text-sm text-foreground">
                <span className="font-medium">{r}</span>
                {decision.review_notes?.[i] && (
                  <span className="text-muted-foreground"> — {decision.review_notes[i]}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
