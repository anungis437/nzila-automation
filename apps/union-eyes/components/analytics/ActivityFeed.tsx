import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Download, GitCompare, Scale, FileText, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  accessType: string;
  resourceTitle: string;
  resourceType: string;
  userOrganization: string;
  resourceOwnerOrganization: string;
  timestamp: Date | string;
}

interface ActivityFeedProps {
  title: string;
  activities: ActivityItem[];
  isLoading?: boolean;
  maxHeight?: number;
}

const ACCESS_TYPE_CONFIG = {
  view: {
    icon: Eye,
    label: "Viewed",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  download: {
    icon: Download,
    label: "Downloaded",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  compare: {
    icon: GitCompare,
    label: "Compared",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  cite: {
    icon: Scale,
    label: "Cited",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  search: {
    icon: FileText,
    label: "Searched",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
};

export function ActivityFeed({
  title,
  activities,
  isLoading = false,
  maxHeight = 500,
}: ActivityFeedProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-gray-100 animate-pulse rounded mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        ) : (
          <ScrollArea style={{ maxHeight: `${maxHeight}px` }}>
            <div className="space-y-3 pr-4">
              {activities.map((activity) => {
                const config = ACCESS_TYPE_CONFIG[activity.accessType as keyof typeof ACCESS_TYPE_CONFIG] || ACCESS_TYPE_CONFIG.view;
                const Icon = config.icon;
                const timestamp = typeof activity.timestamp === "string" 
                  ? new Date(activity.timestamp) 
                  : activity.timestamp;

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className={`p-2 rounded-full ${config.bgColor}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none">
                            {config.label}{" "}
                            <Badge variant="outline" className="text-xs ml-1">
                              {activity.resourceType}
                            </Badge>
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {activity.resourceTitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="font-medium truncate max-w-[150px]">
                          {activity.userOrganization}
                        </span>
                        <span>→</span>
                        <span className="truncate max-w-[150px]">
                          {activity.resourceOwnerOrganization}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

