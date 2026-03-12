"use client";

import type { DecisionSummary } from "@nzila/platform-decision-engine";
import { SummaryCard } from "@/components/ui/summary-card";
import {
  TrendingUp,
  ShieldCheck,
  Clock,
  Target,
} from "lucide-react";

interface DecisionValueCardProps {
  summary: DecisionSummary;
  totalDecisions: number;
}

export function DecisionValueCards({ summary, totalDecisions }: DecisionValueCardProps) {
  const resolved =
    summary.by_status.APPROVED +
    summary.by_status.EXECUTED +
    summary.by_status.REJECTED +
    summary.by_status.CLOSED;

  const acceptanceRate =
    totalDecisions > 0
      ? Math.round(
          ((summary.by_status.APPROVED + summary.by_status.EXECUTED) /
            totalDecisions) *
            100,
        )
      : 0;

  const reviewedCount =
    summary.by_status.APPROVED +
    summary.by_status.REJECTED +
    summary.by_status.DEFERRED +
    summary.by_status.EXECUTED;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Acceptance Rate"
        icon={<TrendingUp className="h-5 w-5" />}
        value={`${acceptanceRate}%`}
        subtitle="Approved or executed vs total"
      />
      <SummaryCard
        title="Decisions Resolved"
        icon={<ShieldCheck className="h-5 w-5" />}
        value={resolved}
        subtitle={`of ${totalDecisions} total`}
      />
      <SummaryCard
        title="Awaiting Review"
        icon={<Clock className="h-5 w-5" />}
        value={summary.pending_review}
        subtitle="Require human decision"
      />
      <SummaryCard
        title="Human-Reviewed"
        icon={<Target className="h-5 w-5" />}
        value={reviewedCount}
        subtitle="Approved, rejected, or deferred by reviewer"
      />
    </div>
  );
}
