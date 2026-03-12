import { SummaryCard } from "@/components/ui/summary-card";
import { Brain } from "lucide-react";

interface Props {
  insightCount: number;
  signalCount: number;
}

export function IntelligenceSummaryCard({ insightCount, signalCount }: Props) {
  return (
    <SummaryCard
      title="Intelligence"
      icon={<Brain className="h-5 w-5" />}
      value={`${insightCount} insights`}
      subtitle={`${signalCount} active signals detected`}
    />
  );
}
