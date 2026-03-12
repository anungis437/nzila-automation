"use client";

import type { DecisionSummary } from "@nzila/platform-decision-engine";
import { SummaryCard } from "@/components/ui/summary-card";
import {
  Scale,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";

interface DecisionSummaryCardsProps {
  summary: DecisionSummary;
}

export function DecisionSummaryCards({ summary }: DecisionSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Total Decisions"
        icon={<Scale className="h-5 w-5" />}
        value={summary.total}
      />
      <SummaryCard
        title="Pending Review"
        icon={<Clock className="h-5 w-5" />}
        value={summary.pending_review}
      />
      <SummaryCard
        title="Critical Open"
        icon={<AlertTriangle className="h-5 w-5" />}
        value={summary.critical_open}
      />
      <SummaryCard
        title="Executed"
        icon={<CheckCircle className="h-5 w-5" />}
        value={summary.by_status.EXECUTED}
      />
    </div>
  );
}
