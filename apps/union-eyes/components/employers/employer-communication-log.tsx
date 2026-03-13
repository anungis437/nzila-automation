/**
 * Employer Communication Log
 *
 * Displays all communications with an employer, filterable
 * by type and linked to grievances. Every interaction is visible
 * in grievance history.
 *
 * @module components/employers/employer-communication-log
 */

"use client";

import * as React from "react";
import {
  Mail,
  Phone,
  Users,
  FileText,
  Paperclip,
  ExternalLink,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

export type CommunicationType = "email" | "phone" | "meeting" | "letter" | "other";
export type CommunicationStatus = "draft" | "sent" | "received" | "acknowledged";

export interface CommunicationAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface CommunicationEntry {
  id: string;
  type: CommunicationType;
  status: CommunicationStatus;
  subject: string;
  body: string;
  summary?: string;
  senderName: string;
  recipientName: string;
  grievanceId?: string;
  grievanceNumber?: string;
  attachments?: CommunicationAttachment[];
  sentAt?: string;
  createdAt: string;
}

export interface EmployerCommunicationLogProps {
  communications: CommunicationEntry[];
  onViewDetail?: (id: string) => void;
  onViewGrievance?: (grievanceId: string) => void;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────

const TYPE_META: Record<CommunicationType, { icon: React.ElementType; label: string; color: string }> = {
  email: { icon: Mail, label: "Email", color: "text-blue-600" },
  phone: { icon: Phone, label: "Phone", color: "text-green-600" },
  meeting: { icon: Users, label: "Meeting", color: "text-purple-600" },
  letter: { icon: FileText, label: "Letter", color: "text-amber-600" },
  other: { icon: MessageSquare, label: "Other", color: "text-gray-600" },
};

const STATUS_STYLES: Record<CommunicationStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  received: "bg-green-100 text-green-700",
  acknowledged: "bg-emerald-100 text-emerald-700",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ────────────────────────────────────────────────

export function EmployerCommunicationLog({
  communications,
  onViewDetail,
  onViewGrievance,
  className,
}: EmployerCommunicationLogProps) {
  const [typeFilter, setTypeFilter] = React.useState<CommunicationType | "all">("all");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    let result = communications;
    if (typeFilter !== "all") {
      result = result.filter((c) => c.type === typeFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.subject.toLowerCase().includes(term) ||
          c.body.toLowerCase().includes(term) ||
          c.senderName.toLowerCase().includes(term) ||
          c.recipientName.toLowerCase().includes(term)
      );
    }
    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [communications, typeFilter, searchTerm]);

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Communication Log</h3>
        <Badge variant="secondary">{communications.length} total</Badge>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search communications…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as CommunicationType | "all")}
        >
          <SelectTrigger className="w-[130px] h-8 text-sm">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="letter">Letter</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No communications found"
          description={
            communications.length === 0
              ? "No employer communications have been recorded yet."
              : "No communications match your current filters."
          }
        />
      ) : (
        <div className="space-y-1">
          {filtered.map((comm) => {
            const meta = TYPE_META[comm.type];
            const Icon = meta.icon;
            const isExpanded = expandedId === comm.id;

            return (
              <div
                key={comm.id}
                className="border rounded-md overflow-hidden"
              >
                {/* Summary row */}
                <button
                  type="button"
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : comm.id)}
                  aria-expanded={isExpanded}
                >
                  <div className={cn("p-1.5 rounded-full bg-muted", meta.color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {comm.subject}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn("text-[10px]", STATUS_STYLES[comm.status])}
                      >
                        {comm.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {comm.senderName} → {comm.recipientName}
                      {comm.sentAt && ` · ${formatDate(comm.sentAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {comm.attachments && comm.attachments.length > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Paperclip className="h-3 w-3" />
                        {comm.attachments.length}
                      </span>
                    )}
                    {comm.grievanceNumber && (
                      <Badge variant="outline" className="text-[10px]">
                        {comm.grievanceNumber}
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t p-3 bg-muted/10 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Type:</span>{" "}
                        <span className="font-medium">{meta.label}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>{" "}
                        <span className="font-medium capitalize">{comm.status}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">From:</span>{" "}
                        <span className="font-medium">{comm.senderName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">To:</span>{" "}
                        <span className="font-medium">{comm.recipientName}</span>
                      </div>
                      {comm.sentAt && (
                        <div>
                          <span className="text-muted-foreground">Sent:</span>{" "}
                          <span className="font-medium">{formatDate(comm.sentAt)}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Created:</span>{" "}
                        <span className="font-medium">{formatDate(comm.createdAt)}</span>
                      </div>
                    </div>

                    {comm.summary && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Summary</p>
                        <p className="text-sm">{comm.summary}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Content</p>
                      <div className="text-sm whitespace-pre-wrap bg-background rounded p-2 border max-h-48 overflow-y-auto">
                        {comm.body}
                      </div>
                    </div>

                    {comm.attachments && comm.attachments.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Attachments ({comm.attachments.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {comm.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              <Paperclip className="h-3 w-3" />
                              {att.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {onViewDetail && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => onViewDetail(comm.id)}
                        >
                          View Full Detail
                        </Button>
                      )}
                      {comm.grievanceId && onViewGrievance && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => onViewGrievance(comm.grievanceId!)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Grievance
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
