"use client";

import { cn } from "@/lib/utils";

type ChangeStatusValue =
  | "PROPOSED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "IMPLEMENTING"
  | "COMPLETED"
  | "FAILED"
  | "ROLLED_BACK"
  | "CLOSED";

type ApprovalStatusValue = "PENDING" | "APPROVED" | "REJECTED";

const statusColors: Record<string, string> = {
  PROPOSED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  UNDER_REVIEW: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  SCHEDULED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  IMPLEMENTING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  ROLLED_BACK: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface ChangeStatusBadgeProps {
  status: ChangeStatusValue | ApprovalStatusValue;
  className?: string;
}

export function ChangeStatusBadge({ status, className }: ChangeStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        statusColors[status] ?? statusColors.PROPOSED,
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
