"use client";

import type { DecisionRecord } from "@nzila/platform-decision-engine";
import { BarChart3, Layers, AlertCircle, CheckCircle2 } from "lucide-react";

interface DecisionBusinessImpactCardProps {
  decisions: DecisionRecord[];
}

export function DecisionBusinessImpactCard({
  decisions,
}: DecisionBusinessImpactCardProps) {
  // Group by category and count
  const categoryGroups: Record<string, number> = {};
  for (const d of decisions) {
    categoryGroups[d.category] = (categoryGroups[d.category] ?? 0) + 1;
  }
  const sortedCategories = Object.entries(categoryGroups)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const criticalCount = decisions.filter(
    (d) => d.severity === "CRITICAL" && d.status !== "CLOSED" && d.status !== "EXPIRED",
  ).length;

  const executed = decisions.filter((d) => d.status === "EXECUTED").length;

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-base font-semibold text-foreground">
          Business Impact
        </h3>
      </div>

      {/* Category distribution */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">
          Decisions by Domain
        </p>
        <div className="space-y-2">
          {sortedCategories.map(([cat, count]) => {
            const percentage = Math.round((count / decisions.length) * 100);
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24 truncate">
                  {cat}
                </span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key counters */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-lg font-bold text-card-foreground">
              {decisions.length}
            </p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <div>
            <p className="text-lg font-bold text-card-foreground">
              {criticalCount}
            </p>
            <p className="text-xs text-muted-foreground">Critical open</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <div>
            <p className="text-lg font-bold text-card-foreground">
              {executed}
            </p>
            <p className="text-xs text-muted-foreground">Executed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
