/**
 * Incident Timeline Viewer Component
 * 
 * Displays chronological incident history with:
 * - Status changes
 * - Comments and notes
 * - Action history
 * - User tracking
 * - Timestamps
 * 
 * @module components/health-safety/IncidentTimelineViewer
 */

"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  UserCheck, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Clock
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  action: string;
  user: string;
  notes?: string;
  type?: "status_change" | "assignment" | "comment" | "update";
}

export interface IncidentTimelineViewerProps {
  timeline: TimelineEvent[];
}

export function IncidentTimelineViewer({
  timeline
}: IncidentTimelineViewerProps) {
  const getEventIcon = (type?: string) => {
    switch (type) {
      case "status_change":
        return CheckCircle;
      case "assignment":
        return UserCheck;
      case "comment":
        return MessageSquare;
      case "update":
        return FileText;
      default:
        return AlertCircle;
    }
  };

  const getEventColor = (type?: string) => {
    switch (type) {
      case "status_change":
        return "text-green-600 bg-green-100 dark:bg-green-950";
      case "assignment":
        return "text-blue-600 bg-blue-100 dark:bg-blue-950";
      case "comment":
        return "text-purple-600 bg-purple-100 dark:bg-purple-950";
      case "update":
        return "text-orange-600 bg-orange-100 dark:bg-orange-950";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-800";
    }
  };

  if (timeline.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No timeline events yet</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      {/* Timeline line */}
      <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border" />

      {/* Timeline events */}
      {timeline.map((event, index) => {
        const EventIcon = getEventIcon(event.type);
        const isLatest = index === 0;

        return (
          <div key={event.id} className="relative flex gap-4">
            {/* Icon */}
            <div
              className={cn(
                "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-background",
                getEventColor(event.type)
              )}
            >
              <EventIcon className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-1 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {event.action}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{event.user}</span>
                    <span>•</span>
                    <span title={format(new Date(event.timestamp), "PPpp")}>
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                {isLatest && (
                  <Badge variant="outline" className="text-xs">
                    Latest
                  </Badge>
                )}
              </div>

              {event.notes && (
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                  {event.notes}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
