/**
 * Incident Status Badge Component
 * 
 * Visual status indicator for incidents with:
 * - Color-coded badges
 * - Status labels
 * - Dark mode support
 * 
 * @module components/health-safety/IncidentStatusBadge
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface IncidentStatusBadgeProps {
  status: "open" | "investigating" | "resolved" | "closed" | "pending";
  className?: string;
}

const STATUS_CONFIG = {
  open: {
    label: "Open",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
  },
  investigating: {
    label: "Investigating",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
  },
  resolved: {
    label: "Resolved",
    className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
  },
  closed: {
    label: "Closed",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
  }
};

export function IncidentStatusBadge({ status, className }: IncidentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
