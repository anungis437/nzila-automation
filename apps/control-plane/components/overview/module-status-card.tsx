import { SummaryCard } from "@/components/ui/summary-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Boxes } from "lucide-react";
import type { ModuleStatus } from "@/types";

interface Props {
  modules: ModuleStatus[];
}

export function ModuleStatusCard({ modules }: Props) {
  const healthy = modules.filter((m) => m.health === "healthy").length;
  const degraded = modules.filter((m) => m.health === "degraded").length;

  return (
    <SummaryCard
      title="Modules"
      icon={<Boxes className="h-5 w-5" />}
      value={
        <div className="flex items-center gap-2">
          <span>{modules.length} installed</span>
          {degraded > 0 && (
            <StatusBadge status="degraded" label={`${degraded} degraded`} />
          )}
        </div>
      }
      subtitle={`${healthy} healthy · ${degraded} degraded`}
    />
  );
}
