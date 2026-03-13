import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "healthy" | "degraded" | "offline" | "unknown" | "verified" | "current" | "stale" | "missing" | "valid" | "expired" | "unsigned" | "failed" | "warning" | "critical";
  label?: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  healthy: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  verified: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  current: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  valid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  degraded: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  stale: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  offline: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  missing: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  expired: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  unsigned: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  unknown: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusColors[status] ?? statusColors.unknown,
        className
      )}
    >
      {label ?? status}
    </span>
  );
}
