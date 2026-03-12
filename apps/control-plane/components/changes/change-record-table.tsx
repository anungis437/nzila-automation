"use client";

import { ChangeStatusBadge } from "./change-status-badge";
import { formatDateTime } from "@/lib/utils";
import type { ChangeRecord } from "@nzila/platform-change-management/types";

interface ChangeRecordTableProps {
  records: ChangeRecord[];
  title?: string;
}

export function ChangeRecordTable({ records, title }: ChangeRecordTableProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No change records found.</p>
      </div>
    );
  }

  return (
    <div>
      {title && (
        <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      )}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Env</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Risk</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Approval</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Window</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.change_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{r.change_id}</td>
                <td className="px-4 py-3 max-w-[200px] truncate">{r.title}</td>
                <td className="px-4 py-3">{r.service}</td>
                <td className="px-4 py-3">
                  <span className={r.environment === "PROD" ? "text-red-600 font-medium" : "text-blue-600"}>
                    {r.environment}
                  </span>
                </td>
                <td className="px-4 py-3">{r.change_type}</td>
                <td className="px-4 py-3">
                  <RiskBadge level={r.risk_level} />
                </td>
                <td className="px-4 py-3">
                  <ChangeStatusBadge status={r.approval_status} />
                </td>
                <td className="px-4 py-3">
                  <ChangeStatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateTime(r.implementation_window_start)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    LOW: "text-emerald-600",
    MEDIUM: "text-amber-600",
    HIGH: "text-orange-600 font-medium",
    CRITICAL: "text-red-600 font-bold",
  };
  return <span className={colors[level] ?? ""}>{level}</span>;
}
