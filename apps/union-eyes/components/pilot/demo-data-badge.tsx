/**
 * Demo Data Badge
 *
 * Visual indicator and controls for demo/seed data in the pilot environment.
 * Shows when demo data is active and provides seed/purge controls.
 *
 * @module components/pilot/demo-data-badge
 */

"use client";

import * as React from "react";
import { TestTube2, Sparkles, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

export interface DemoDataset {
  members: number;
  employers: number;
  grievances: number;
  timelines: number;
  resolutions: number;
}

export interface DemoDataBadgeProps {
  isActive: boolean;
  dataset?: DemoDataset;
  onSeed?: () => Promise<void>;
  onPurge?: () => Promise<void>;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────

export function DemoDataBadge({
  isActive,
  dataset,
  onSeed,
  onPurge,
  className,
}: DemoDataBadgeProps) {
  const [loading, setLoading] = React.useState(false);

  const handleAction = async (action: (() => Promise<void>) | undefined) => {
    if (!action) return;
    setLoading(true);
    try {
      await action();
    } finally {
      setLoading(false);
    }
  };

  if (!isActive && !onSeed) return null;

  return (
    <Card className={cn("p-4 space-y-3", className)}>
      <div className="flex items-center gap-2">
        <TestTube2 className="h-4 w-4 text-purple-600" />
        <h3 className="text-sm font-semibold">Demo Environment</h3>
        <Badge
          variant={isActive ? "default" : "secondary"}
          className="text-[10px] ml-auto"
        >
          {isActive ? "Demo Active" : "No Demo Data"}
        </Badge>
      </div>

      {isActive && dataset && (
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { label: "Members", count: dataset.members },
            { label: "Employers", count: dataset.employers },
            { label: "Grievances", count: dataset.grievances },
            { label: "Timelines", count: dataset.timelines },
            { label: "Resolutions", count: dataset.resolutions },
          ].map((item) => (
            <div key={item.label} className="p-2 rounded-md border">
              <span className="block text-lg font-bold">{item.count}</span>
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {isActive
          ? "Demo data is loaded. This data is clearly marked and can be purged at any time."
          : "Seed realistic CAPE-style demo data to explore the platform before going live."}
      </p>

      <div className="flex gap-2">
        {!isActive && onSeed && (
          <Button
            size="sm"
            onClick={() => handleAction(onSeed)}
            disabled={loading}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            {loading ? "Seeding…" : "Load Demo Data"}
          </Button>
        )}
        {isActive && onPurge && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleAction(onPurge)}
            disabled={loading}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            {loading ? "Purging…" : "Remove Demo Data"}
          </Button>
        )}
      </div>
    </Card>
  );
}
