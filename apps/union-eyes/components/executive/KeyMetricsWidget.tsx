"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricData {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  format?: "number" | "currency" | "percentage";
}

interface KeyMetricsWidgetProps {
  metrics: MetricData[];
  title?: string;
}

export default function KeyMetricsWidget({ metrics, title = "Key Metrics" }: KeyMetricsWidgetProps) {
  const formatValue = (value: string | number, format?: string) => {
    if (typeof value === "string") return value;
    
    switch (format) {
      case "currency":
        return `$${value.toLocaleString()}`;
      case "percentage":
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  const getTrendIcon = (change?: number) => {
    if (change === undefined || change === 0) return <Minus className="h-3 w-3" />;
    return change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = (change?: number) => {
    if (change === undefined || change === 0) return "text-muted-foreground";
    return change > 0 ? "text-green-500" : "text-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-bold">{formatValue(metric.value, metric.format)}</p>
              </div>
              {metric.change !== undefined && (
                <div className={`flex items-center space-x-1 ${getTrendColor(metric.change)}`}>
                  {getTrendIcon(metric.change)}
                  <span className="text-sm font-medium">
                    {metric.change > 0 ? "+" : ""}{metric.change}%
                  </span>
                  {metric.changeLabel && (
                    <span className="text-xs text-muted-foreground ml-1">
                      {metric.changeLabel}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
