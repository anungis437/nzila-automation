"use client";

import type { ChangeRecord } from "@nzila/platform-change-management/types";

interface ApprovalPanelProps {
  record: ChangeRecord;
}

export function ApprovalPanel({ record }: ApprovalPanelProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h4 className="text-sm font-semibold text-foreground mb-3">Approval Status</h4>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Required</span>
          <span className="font-medium">
            {record.approvers_required.length > 0
              ? record.approvers_required.join(", ")
              : "None (auto-approve)"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Approved by</span>
          <span className="font-medium text-emerald-600">
            {record.approved_by.length > 0 ? record.approved_by.join(", ") : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Missing</span>
          <span className="font-medium text-amber-600">
            {record.approvers_required.filter(
              (a) => !record.approved_by.includes(a),
            ).length > 0
              ? record.approvers_required
                  .filter((a) => !record.approved_by.includes(a))
                  .join(", ")
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
