import { SummaryCard } from "@/components/ui/summary-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Activity } from "lucide-react";

interface Props {
  platformHealthy: boolean;
  healthyModules: number;
  totalModules: number;
}

export function PlatformHealthCard({ platformHealthy, healthyModules, totalModules }: Props) {
  return (
    <SummaryCard
      title="Platform Health"
      icon={<Activity className="h-5 w-5" />}
      value={
        <StatusBadge
          status={platformHealthy ? "healthy" : "degraded"}
          label={platformHealthy ? "All systems nominal" : "Issues detected"}
        />
      }
      subtitle={`${healthyModules}/${totalModules} modules healthy`}
    />
  );
}
