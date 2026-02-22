import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, ExternalLink } from "lucide-react";

interface TopItem {
  id: string;
  title: string;
  subtitle?: string;
  metric: number;
  metricLabel: string;
  secondaryMetric?: number;
  secondaryMetricLabel?: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

interface TopItemsListProps {
  title: string;
  items: TopItem[];
  onViewItem?: (id: string) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  maxItems?: number;
}

export function TopItemsList({
  title,
  items,
  onViewItem,
  emptyMessage = "No items to display",
  isLoading = false,
  maxItems = 10,
}: TopItemsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-gray-100 animate-pulse rounded mt-1" />
                </div>
                <div className="h-6 w-16 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayItems = items.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {displayItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <h4 className="text-sm font-medium leading-none truncate">
                      {item.title}
                    </h4>
                    {item.badge && (
                      <Badge variant={item.badgeVariant || "secondary"} className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  {item.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {item.subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium">
                        {item.metric} {item.metricLabel}
                      </span>
                    </div>
                    {item.secondaryMetric !== undefined && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {item.secondaryMetric} {item.secondaryMetricLabel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {onViewItem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onViewItem(item.id)}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View {item.title}</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

