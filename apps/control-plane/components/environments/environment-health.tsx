"use client";

interface EnvironmentHealthCheck {
  check: string;
  status: "healthy" | "degraded" | "unhealthy";
  detail: string;
  timestamp: string;
}

interface EnvironmentHealthProps {
  checks: EnvironmentHealthCheck[];
}

const statusIcon: Record<string, string> = {
  healthy: "●",
  degraded: "◐",
  unhealthy: "○",
};

const statusColor: Record<string, string> = {
  healthy: "text-emerald-500",
  degraded: "text-amber-500",
  unhealthy: "text-red-500",
};

export function EnvironmentHealth({ checks }: EnvironmentHealthProps) {
  if (checks.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">No health checks available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Health Checks</h3>
      </div>
      <div className="divide-y divide-border">
        {checks.map((check, i) => (
          <div key={i} className="p-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={statusColor[check.status]}>{statusIcon[check.status]}</span>
              <span className="font-medium text-foreground">{check.check}</span>
            </div>
            <span className="text-xs text-muted-foreground">{check.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
