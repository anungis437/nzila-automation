"use client";

import { cn } from "@/lib/utils";

type EnvironmentName = "LOCAL" | "PREVIEW" | "STAGING" | "PRODUCTION";

const envColors: Record<EnvironmentName, string> = {
  LOCAL: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  PREVIEW: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  STAGING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  PRODUCTION: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

interface EnvironmentBadgeProps {
  environment: EnvironmentName;
  className?: string;
}

export function EnvironmentBadge({ environment, className }: EnvironmentBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        envColors[environment] ?? envColors.LOCAL,
        className,
      )}
    >
      {environment}
    </span>
  );
}
