"use client";

import { cn } from "@/lib/utils";

type DecisionSeverityValue = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

const severityColors: Record<DecisionSeverityValue, string> = {
  LOW: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface DecisionSeverityBadgeProps {
  severity: DecisionSeverityValue;
  className?: string;
}

export function DecisionSeverityBadge({ severity, className }: DecisionSeverityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        severityColors[severity],
        className,
      )}
    >
      {severity}
    </span>
  );
}
