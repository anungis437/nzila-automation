import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SummaryCardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
}

export function SummaryCard({ title, value, subtitle, icon, className }: SummaryCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-bold text-card-foreground">{value}</div>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
