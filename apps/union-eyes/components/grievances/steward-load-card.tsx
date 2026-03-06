/**
 * Steward Load Card
 *
 * Shows workload visibility for the current steward:
 * active cases, overdue count, average days in current state.
 *
 * @module components/grievances/steward-load-card
 */

"use client";

import * as React from "react";
import {
  Briefcase,
  Clock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

export interface StewardWorkload {
  activeCases: number;
  overdueCases: number;
  avgDaysInState: number;
  casesThisWeek: number;
}

export interface StewardLoadCardProps {
  stewardName: string;
  workload: StewardWorkload;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────

export function StewardLoadCard({
  stewardName,
  workload,
  className,
}: StewardLoadCardProps) {
  const loadLevel =
    workload.activeCases >= 20
      ? "heavy"
      : workload.activeCases >= 10
        ? "moderate"
        : "light";

  const loadColors = {
    light: "text-green-600 bg-green-50 dark:bg-green-950/20",
    moderate: "text-amber-600 bg-amber-50 dark:bg-amber-950/20",
    heavy: "text-red-600 bg-red-50 dark:bg-red-950/20",
  };

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Steward Workload</p>
          <p className="text-sm font-semibold mt-0.5">{stewardName}</p>
        </div>
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
            loadColors[loadLevel]
          )}
        >
          {loadLevel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric
          icon={Briefcase}
          label="Active Cases"
          value={workload.activeCases}
        />
        <Metric
          icon={AlertTriangle}
          label="Overdue"
          value={workload.overdueCases}
          alert={workload.overdueCases > 0}
        />
        <Metric
          icon={Clock}
          label="Avg. Days in State"
          value={workload.avgDaysInState}
          suffix="d"
        />
        <Metric
          icon={TrendingUp}
          label="Assigned This Week"
          value={workload.casesThisWeek}
        />
      </div>
    </Card>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  suffix,
  alert,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  alert?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("p-1.5 rounded", alert ? "bg-red-100 dark:bg-red-900/30" : "bg-muted")}>
        <Icon className={cn("h-3.5 w-3.5", alert ? "text-red-600" : "text-muted-foreground")} />
      </div>
      <div>
        <p className={cn("text-lg font-bold tabular-nums", alert && "text-red-600")}>
          {value}{suffix}
        </p>
        <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
      </div>
    </div>
  );
}
