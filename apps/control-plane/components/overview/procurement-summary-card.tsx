import { SummaryCard } from "@/components/ui/summary-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { FileCheck } from "lucide-react";
import type { ProcurementSummary } from "@/types";

interface Props {
  procurement: ProcurementSummary;
}

export function ProcurementSummaryCard({ procurement }: Props) {
  return (
    <SummaryCard
      title="Procurement"
      icon={<FileCheck className="h-5 w-5" />}
      value={
        <StatusBadge
          status={procurement.signatureStatus}
          label={
            procurement.signatureStatus === "verified"
              ? "Pack verified"
              : `Pack ${procurement.signatureStatus}`
          }
        />
      }
      subtitle={`Pack: ${procurement.packId} · Attestation: ${procurement.attestationStatus}`}
    />
  );
}
