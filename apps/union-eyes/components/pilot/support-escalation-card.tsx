/**
 * Support & Escalation Card
 *
 * Shows pilot owner, support email, next milestone,
 * and escalation route for pilot organizations.
 *
 * @module components/pilot/support-escalation-card
 */

"use client";

import * as React from "react";
import {
  LifeBuoy,
  Mail,
  User,
  Calendar,
  ArrowUpRight,
  Phone,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

export interface PilotSupportInfo {
  pilotOwner: string;
  pilotOwnerEmail: string;
  pilotOwnerPhone?: string;
  supportEmail: string;
  nextMilestone: string;
  nextMilestoneDate?: string;
  escalationRoute: string;
}

export interface SupportEscalationCardProps {
  info?: PilotSupportInfo;
  className?: string;
}

// ─── Defaults ─────────────────────────────────────────────────

const DEFAULT_INFO: PilotSupportInfo = {
  pilotOwner: "Your assigned pilot lead",
  pilotOwnerEmail: "pilot@nzila.io",
  supportEmail: "support@nzila.io",
  nextMilestone: "Pilot go-live review",
  escalationRoute: "Contact your pilot lead → Support team → Engineering escalation",
};

// ─── Component ────────────────────────────────────────────────

export function SupportEscalationCard({
  info,
  className,
}: SupportEscalationCardProps) {
  const data = info ?? DEFAULT_INFO;

  const rows: Array<{
    icon: React.ElementType;
    label: string;
    value: string;
    href?: string;
  }> = [
    {
      icon: User,
      label: "Pilot Owner",
      value: data.pilotOwner,
    },
    {
      icon: Mail,
      label: "Pilot Lead Email",
      value: data.pilotOwnerEmail,
      href: `mailto:${data.pilotOwnerEmail}`,
    },
    ...(data.pilotOwnerPhone
      ? [
          {
            icon: Phone,
            label: "Pilot Lead Phone",
            value: data.pilotOwnerPhone,
            href: `tel:${data.pilotOwnerPhone}`,
          },
        ]
      : []),
    {
      icon: Mail,
      label: "Support Email",
      value: data.supportEmail,
      href: `mailto:${data.supportEmail}`,
    },
    {
      icon: Calendar,
      label: "Next Milestone",
      value: data.nextMilestoneDate
        ? `${data.nextMilestone} — ${new Date(data.nextMilestoneDate).toLocaleDateString()}`
        : data.nextMilestone,
    },
    {
      icon: ArrowUpRight,
      label: "Escalation Route",
      value: data.escalationRoute,
    },
  ];

  return (
    <Card className={cn("p-5 space-y-4", className)}>
      <div className="flex items-center gap-2">
        <LifeBuoy className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Support & Escalation</h3>
      </div>

      <p className="text-xs text-muted-foreground">
        Your pilot support contacts and escalation path. Reach out any time.
      </p>

      <div className="space-y-3">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-start gap-3">
              <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-muted-foreground block">
                  {row.label}
                </span>
                {row.href ? (
                  <a
                    href={row.href}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {row.value}
                  </a>
                ) : (
                  <span className="text-sm">{row.value}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a href={`mailto:${data.supportEmail}?subject=Pilot%20Support%20Request`}>
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            Contact Support
          </a>
        </Button>
      </div>
    </Card>
  );
}
