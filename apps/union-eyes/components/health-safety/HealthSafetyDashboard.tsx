/**
 * Health & Safety Dashboard Component
 * 
 * Main H&S dashboard with:
 * - Key safety metrics and KPIs
 * - Incident trends and analytics
 * - Inspection status overview
 * - Critical alerts and notifications
 * - Quick action buttons
 * - Compliance tracking
 * 
 * @module components/health-safety/HealthSafetyDashboard
 */

"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  AlertTriangle, 
  ClipboardCheck,
  Users,
  Calendar,
  FileWarning,
  CheckCircle2,
  RefreshCw,
  Plus,
  Download
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { SafetyMetricsCard } from "./SafetyMetricsCard";
import { IncidentTrendChart } from "./IncidentTrendChart";
import { cn } from "@/lib/utils";

export interface SafetyMetrics {
  totalIncidents: number;
  incidentTrend: "up" | "down" | "stable";
  incidentChange: number;
  openHazards: number;
  hazardTrend: "up" | "down" | "stable";
  inspectionsDue: number;
  inspectionsCompleted: number;
  inspectionComplianceRate: number;
  daysWithoutIncident: number;
  criticalAlerts: number;
  trainingCompliance: number;
  ppeInventoryLow: number;
}

export interface HealthSafetyDashboardProps {
  organizationId: string;
  period?: "7d" | "30d" | "90d" | "12m";
}

export function HealthSafetyDashboard({
  organizationId,
  period = "30d"
}: HealthSafetyDashboardProps) {
  const { toast } = useToast();
  const [metrics, setMetrics] = React.useState<SafetyMetrics | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [selectedPeriod] = React.useState(period);

  const loadDashboardData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/health-safety/dashboard?organizationId=${organizationId}&period=${selectedPeriod}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const data = await response.json();
      if (data.success) {
        setMetrics(data.metrics);
      } else {
        throw new Error(data.error || "Failed to load metrics");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load health & safety dashboard",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, selectedPeriod, toast]);

  React.useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  async function refreshDashboard() {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
    toast({
      title: "Dashboard Refreshed",
      description: "Health & safety data has been updated"
    });
  }

  async function exportReport() {
    try {
      const response = await fetch(
        `/api/health-safety/reports/export?organizationId=${organizationId}&period=${selectedPeriod}`,
        { method: 'POST' }
      );
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-safety-report-${selectedPeriod}.pdf`;
      a.click();
      
      toast({
        title: "Report Exported",
        description: "Your health & safety report has been downloaded"
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "Unable to export report",
        variant: "destructive"
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading health & safety dashboard...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Health & Safety Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor workplace safety metrics and compliance
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDashboard}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {metrics.criticalAlerts > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 dark:text-red-400">
              You have {metrics.criticalAlerts} critical safety alert{metrics.criticalAlerts !== 1 ? 's' : ''} requiring immediate attention.
            </p>
            <Button variant="destructive" size="sm" className="mt-3">
              View Alerts
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SafetyMetricsCard
          title="Total Incidents"
          value={metrics.totalIncidents}
          trend={metrics.incidentTrend}
          trendValue={metrics.incidentChange}
          icon={FileWarning}
          description={`Last ${selectedPeriod}`}
          variant={metrics.incidentTrend === "down" ? "success" : "warning"}
        />
        <SafetyMetricsCard
          title="Open Hazards"
          value={metrics.openHazards}
          trend={metrics.hazardTrend}
          icon={AlertTriangle}
          description="Requires action"
          variant={metrics.openHazards === 0 ? "success" : "warning"}
        />
        <SafetyMetricsCard
          title="Inspection Compliance"
          value={`${metrics.inspectionComplianceRate}%`}
          subtitle={`${metrics.inspectionsCompleted}/${metrics.inspectionsDue + metrics.inspectionsCompleted}`}
          icon={ClipboardCheck}
          description="Completed on time"
          variant={metrics.inspectionComplianceRate >= 90 ? "success" : "warning"}
        />
        <SafetyMetricsCard
          title="Days Without Incident"
          value={metrics.daysWithoutIncident}
          icon={CheckCircle2}
          description="Current streak"
          variant="success"
        />
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="hazards">Hazards</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Incident Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Incident Trends</CardTitle>
              <CardDescription>
                Incident frequency over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IncidentTrendChart 
                organizationId={organizationId} 
                period={selectedPeriod}
              />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Training Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.trainingCompliance}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Members up-to-date with safety training
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Inspections Due</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.inspectionsDue}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Require scheduling or completion
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">PPE Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.ppeInventoryLow > 0 ? (
                    <span className="text-orange-600">{metrics.ppeInventoryLow} Low</span>
                  ) : (
                    <span className="text-green-600">Good</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Items requiring reorder
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Recent Incidents</CardTitle>
              <CardDescription>
                Latest workplace safety incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use the Incident List component to view detailed incident records.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Schedule</CardTitle>
              <CardDescription>
                Upcoming and overdue inspections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use the Inspection Calendar component to manage inspections.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hazards">
          <Card>
            <CardHeader>
              <CardTitle>Hazard Reports</CardTitle>
              <CardDescription>
                Active workplace hazards requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use the Hazards List component to view and manage hazards.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Overview</CardTitle>
              <CardDescription>
                Safety compliance metrics and requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">OH&S Training</span>
                  <Badge variant={metrics.trainingCompliance >= 90 ? "default" : "secondary"}>
                    {metrics.trainingCompliance}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Inspection Compliance</span>
                  <Badge variant={metrics.inspectionComplianceRate >= 90 ? "default" : "secondary"}>
                    {metrics.inspectionComplianceRate}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Report Hazard
            </Button>
            <Button size="sm" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Inspection
            </Button>
            <Button size="sm" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              View Committee Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
