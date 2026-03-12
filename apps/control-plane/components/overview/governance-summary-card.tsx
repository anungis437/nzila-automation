import { StatusBadge } from "@/components/ui/status-badge";
import { SummaryCard } from "@/components/ui/summary-card";
import { Shield } from "lucide-react";
import type { GovernanceStatus } from "@nzila/platform-governance/types";

interface Props {
  status: GovernanceStatus;
}

export function GovernanceSummaryCard({ status }: Props) {
  const isHealthy =
    status.policy_engine === "healthy" &&
    status.evidence_pack === "verified" &&
    status.compliance_snapshot === "current";

  return (
    <SummaryCard
      title="Governance"
      icon={<Shield className="h-5 w-5" />}
      value={
        <StatusBadge
          status={isHealthy ? "healthy" : "degraded"}
          label={isHealthy ? "Compliant" : "Attention needed"}
        />
      }
      subtitle={`Policy: ${status.policy_engine} · Evidence: ${status.evidence_pack} · SBOM: ${status.sbom_current ? "current" : "outdated"}`}
    />
  );
}
