/**
 * Incident Detail View Component
 * 
 * Displays full incident details with:
 * - Complete incident information
 * - Timeline of updates
 * - Attachments and evidence
 * - Status management
 * - Assignment tracking
 * - Action buttons
 * 
 * @module components/health-safety/IncidentDetailView
 */

"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Calendar,
  MapPin,
  User,
  AlertTriangle,
  FileText,
  Edit,
  Download,
  XCircle
} from "lucide-react";
import { IncidentStatusBadge } from "./IncidentStatusBadge";
import { IncidentTimelineViewer } from "./IncidentTimelineViewer";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface IncidentDetail {
  id: string;
  incidentNumber: string;
  status: "open" | "investigating" | "resolved" | "closed";
  severity: "minor" | "major" | "critical";
  incidentDate: Date;
  incidentTime: string;
  reportedDate: Date;
  location: string;
  department?: string;
  type: string;
  description: string;
  immediateCause: string;
  rootCause?: string;
  injuriesOccurred: boolean;
  injuryDetails?: string;
  witnessesPresent: boolean;
  witnessNames?: string;
  witnessContacts?: string;
  correctiveActions?: string;
  preventiveMeasures?: string;
  reportedBy: string;
  reporterContact: string;
  assignedTo?: string;
  attachments?: string[];
  timeline?: Array<{
    id: string;
    timestamp: Date;
    action: string;
    user: string;
    notes?: string;
  }>;
}

export interface IncidentDetailViewProps {
  incidentId: string;
  onEdit?: () => void;
  onClose?: () => void;
}

export function IncidentDetailView({
  incidentId,
  onEdit,
  onClose
}: IncidentDetailViewProps) {
  const { toast } = useToast();
  const [incident, setIncident] = React.useState<IncidentDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadIncidentDetails = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/health-safety/incidents/${incidentId}`);

      if (!response.ok) {
        throw new Error("Failed to load incident details");
      }

      const data = await response.json();
      if (data.success) {
        setIncident(data.incident);
      } else {
        throw new Error(data.error);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load incident details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [incidentId, toast]);

  React.useEffect(() => {
    loadIncidentDetails();
  }, [loadIncidentDetails]);

  async function downloadReport() {
    try {
      const response = await fetch(`/api/health-safety/incidents/${incidentId}/export`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incident-${incident?.incidentNumber}.pdf`;
      a.click();

      toast({
        title: "Success",
        description: "Incident report downloaded"
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive"
      });
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 dark:bg-red-950/30";
      case "major":
        return "text-orange-600 bg-orange-50 dark:bg-orange-950/30";
      case "minor":
        return "text-green-600 bg-green-50 dark:bg-green-950/30";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-950/30";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!incident) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Incident not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">
                Incident #{incident.incidentNumber}
              </CardTitle>
              <CardDescription>
                Reported on {format(new Date(incident.reportedDate), "PPP")}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={downloadReport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <IncidentStatusBadge status={incident.status} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Severity:</span>
              <Badge className={cn("capitalize", getSeverityColor(incident.severity))}>
                {incident.severity}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Type:</span>
              <Badge variant="outline">{incident.type}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(incident.incidentDate), "PPP")} at {incident.incidentTime}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{incident.location}</p>
                {incident.department && (
                  <p className="text-xs text-muted-foreground">Department: {incident.department}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Reported By</p>
                <p className="text-sm text-muted-foreground">{incident.reportedBy}</p>
                <p className="text-xs text-muted-foreground">{incident.reporterContact}</p>
              </div>
            </div>

            {incident.assignedTo && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Assigned To</p>
                  <p className="text-sm text-muted-foreground">{incident.assignedTo}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-2">Description</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {incident.description}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Immediate Cause</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {incident.immediateCause}
              </p>
            </div>

            {incident.rootCause && (
              <div>
                <p className="text-sm font-medium mb-2">Root Cause</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {incident.rootCause}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Injuries & Witnesses */}
      {(incident.injuriesOccurred || incident.witnessesPresent) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {incident.injuriesOccurred && incident.injuryDetails && (
              <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:border-red-900 dark:bg-red-950/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      Injuries Occurred
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1 whitespace-pre-wrap">
                      {incident.injuryDetails}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {incident.witnessesPresent && incident.witnessNames && (
              <div>
                <p className="text-sm font-medium mb-2">Witnesses</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {incident.witnessNames}
                </p>
                {incident.witnessContacts && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Contact: {incident.witnessContacts}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions & Prevention */}
      {(incident.correctiveActions || incident.preventiveMeasures) && (
        <Card>
          <CardHeader>
            <CardTitle>Actions & Prevention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {incident.correctiveActions && (
              <div>
                <p className="text-sm font-medium mb-2">Corrective Actions Taken</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {incident.correctiveActions}
                </p>
              </div>
            )}

            {incident.preventiveMeasures && (
              <div>
                <p className="text-sm font-medium mb-2">Preventive Measures</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {incident.preventiveMeasures}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {incident.attachments && incident.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {incident.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">Attachment {index + 1}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {incident.timeline && incident.timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <IncidentTimelineViewer incidentId={incidentId} timeline={incident.timeline} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
