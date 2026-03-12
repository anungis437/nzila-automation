"use client";

import Link from "next/link";
import type { DecisionRecord } from "@nzila/platform-decision-engine";
import { DecisionStatusBadge } from "./decision-status-badge";
import { DecisionSeverityBadge } from "./decision-severity-badge";

interface DecisionTableProps {
  records: DecisionRecord[];
  title?: string;
}

export function DecisionTable({ records, title }: DecisionTableProps) {
  if (records.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No decisions found.
      </div>
    );
  }

  return (
    <div>
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      )}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Severity</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Confidence</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Generated</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.decision_id} className="border-b border-border hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/decisions/${r.decision_id}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {r.decision_id}
                  </Link>
                </td>
                <td className="px-4 py-3 text-foreground">{r.title}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{r.category}</td>
                <td className="px-4 py-3">
                  <DecisionSeverityBadge severity={r.severity} />
                </td>
                <td className="px-4 py-3">
                  <DecisionStatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {(r.confidence_score * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(r.generated_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
