"use client";

import { cn } from "@/lib/utils";

type DecisionStatusValue =
  | "GENERATED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "DEFERRED"
  | "EXECUTED"
  | "EXPIRED"
  | "CLOSED";

const statusColors: Record<DecisionStatusValue, string> = {
  GENERATED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  PENDING_REVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  DEFERRED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  EXECUTED: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  EXPIRED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

interface DecisionStatusBadgeProps {
  status: DecisionStatusValue;
  className?: string;
}

export function DecisionStatusBadge({ status, className }: DecisionStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusColors[status] ?? "bg-gray-100 text-gray-800",
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
