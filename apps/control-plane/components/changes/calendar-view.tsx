"use client";

import type { ChangeRecord } from "@nzila/platform-change-management/types";
import { formatDateTime } from "@/lib/utils";

interface CalendarViewProps {
  staging: ChangeRecord[];
  production: ChangeRecord[];
}

export function CalendarView({ staging, production }: CalendarViewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <EnvironmentColumn title="Staging" env="STAGING" records={staging} />
      <EnvironmentColumn title="Production" env="PROD" records={production} />
    </div>
  );
}

function EnvironmentColumn({
  title,
  env,
  records,
}: {
  title: string;
  env: string;
  records: ChangeRecord[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <span
          className={
            env === "PROD"
              ? "h-2 w-2 rounded-full bg-red-500"
              : "h-2 w-2 rounded-full bg-blue-500"
          }
        />
        {title}
      </h3>
      {records.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">No upcoming changes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <div
              key={r.change_id}
              className="rounded-lg border border-border bg-card p-4 hover:bg-muted/30"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.change_id} · {r.service} · {r.change_type}
                  </p>
                </div>
                <span
                  className={
                    r.change_type === "EMERGENCY"
                      ? "text-xs font-medium text-red-600"
                      : "text-xs text-muted-foreground"
                  }
                >
                  {r.risk_level}
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {formatDateTime(r.implementation_window_start)} →{" "}
                {formatDateTime(r.implementation_window_end)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
