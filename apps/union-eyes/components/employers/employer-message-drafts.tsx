/**
 * Employer Message Drafts
 *
 * Draft workflow for employer communications:
 * generate from template, edit, save, mark sent.
 * No outbound communication happens automatically — human review required.
 *
 * @module components/employers/employer-message-drafts
 */

"use client";

import * as React from "react";
import {
  FileEdit,
  Send,
  Save,
  Copy,
  Trash2,
  FileText,
  Check,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

export type TemplateCategory =
  | "initial_notification"
  | "request_response"
  | "request_documentation"
  | "meeting_request"
  | "resolution_proposal"
  | "escalation_notice"
  | "general";

export interface MessageTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  subject: string;
  body: string;
  variables?: string[];
}

export interface DraftMessage {
  id: string;
  subject: string;
  body: string;
  recipientName: string;
  recipientEmail?: string;
  communicationType: string;
  grievanceId?: string;
  grievanceNumber?: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GrievanceContext {
  id: string;
  grievanceNumber: string;
  title: string;
  employerName: string;
  grievantName: string;
  type?: string;
  status?: string;
}

export interface EmployerMessageDraftsProps {
  drafts: DraftMessage[];
  templates: MessageTemplate[];
  grievanceContext?: GrievanceContext;
  recipientName?: string;
  recipientEmail?: string;
  onSaveDraft: (draft: Partial<DraftMessage>) => Promise<void>;
  onDeleteDraft: (id: string) => Promise<void>;
  onMarkSent: (id: string) => Promise<void>;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────

const TEMPLATE_LABELS: Record<TemplateCategory, string> = {
  initial_notification: "Initial Notification",
  request_response: "Request for Response",
  request_documentation: "Request for Documentation",
  meeting_request: "Meeting Request",
  resolution_proposal: "Resolution Proposal",
  escalation_notice: "Escalation Notice",
  general: "General",
};

function applyVariables(
  text: string,
  context?: GrievanceContext,
  recipientName?: string
): string {
  if (!context) return text;
  return text
    .replace(/\{\{grievanceNumber\}\}/g, context.grievanceNumber ?? "")
    .replace(/\{\{grievantName\}\}/g, context.grievantName ?? "")
    .replace(/\{\{employerName\}\}/g, context.employerName ?? "")
    .replace(/\{\{grievanceTitle\}\}/g, context.title ?? "")
    .replace(/\{\{recipientName\}\}/g, recipientName ?? "")
    .replace(/\{\{date\}\}/g, new Date().toLocaleDateString("en-CA"));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ────────────────────────────────────────────────

export function EmployerMessageDrafts({
  drafts,
  templates,
  grievanceContext,
  recipientName,
  recipientEmail,
  onSaveDraft,
  onDeleteDraft,
  onMarkSent,
  className,
}: EmployerMessageDraftsProps) {
  const [editingDraft, setEditingDraft] = React.useState<DraftMessage | null>(null);
  const [showNewDraft, setShowNewDraft] = React.useState(false);
  const [confirmSentId, setConfirmSentId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // ─── New draft from template ──────────────────

  const [selectedTemplate, setSelectedTemplate] = React.useState<string>("");
  const [draftSubject, setDraftSubject] = React.useState("");
  const [draftBody, setDraftBody] = React.useState("");
  const [draftRecipient, setDraftRecipient] = React.useState(recipientName ?? "");
  const [draftEmail, setDraftEmail] = React.useState(recipientEmail ?? "");
  const [draftType, setDraftType] = React.useState<string>("email");

  const resetDraftForm = () => {
    setSelectedTemplate("");
    setDraftSubject("");
    setDraftBody("");
    setDraftRecipient(recipientName ?? "");
    setDraftEmail(recipientEmail ?? "");
    setDraftType("email");
  };

  const applyTemplate = (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return;
    setSelectedTemplate(templateId);
    setDraftSubject(applyVariables(tmpl.subject, grievanceContext, recipientName));
    setDraftBody(applyVariables(tmpl.body, grievanceContext, recipientName));
  };

  const handleSaveNewDraft = async () => {
    setSaving(true);
    try {
      await onSaveDraft({
        subject: draftSubject,
        body: draftBody,
        recipientName: draftRecipient,
        recipientEmail: draftEmail,
        communicationType: draftType,
        grievanceId: grievanceContext?.id,
        grievanceNumber: grievanceContext?.grievanceNumber,
        templateId: selectedTemplate || undefined,
      });
      setShowNewDraft(false);
      resetDraftForm();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingDraft) return;
    setSaving(true);
    try {
      await onSaveDraft({
        id: editingDraft.id,
        subject: draftSubject,
        body: draftBody,
        recipientName: draftRecipient,
        recipientEmail: draftEmail,
        communicationType: draftType,
      });
      setEditingDraft(null);
      resetDraftForm();
    } finally {
      setSaving(false);
    }
  };

  const openEditDraft = (draft: DraftMessage) => {
    setDraftSubject(draft.subject);
    setDraftBody(draft.body);
    setDraftRecipient(draft.recipientName);
    setDraftEmail(draft.recipientEmail ?? "");
    setDraftType(draft.communicationType);
    setEditingDraft(draft);
  };

  const handleConfirmSent = async () => {
    if (!confirmSentId) return;
    setSaving(true);
    try {
      await onMarkSent(confirmSentId);
      setConfirmSentId(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Message Drafts</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            resetDraftForm();
            setShowNewDraft(true);
          }}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          New Draft
        </Button>
      </div>

      {/* Existing drafts */}
      {drafts.length === 0 ? (
        <EmptyState
          icon={FileEdit}
          title="No drafts"
          description="Create a new draft to start composing a message to the employer."
        />
      ) : (
        <div className="space-y-2">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="flex items-start gap-3 p-3 rounded-md border hover:bg-muted/30 transition-colors"
            >
              <div className="p-1.5 rounded-full bg-muted">
                <FileEdit className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{draft.subject}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  To: {draft.recipientName}
                  {draft.grievanceNumber && ` · ${draft.grievanceNumber}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Updated {formatDate(draft.updatedAt)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => openEditDraft(draft)}
                  title="Edit draft"
                >
                  <FileEdit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-green-600"
                  onClick={() => setConfirmSentId(draft.id)}
                  title="Mark as sent"
                >
                  <Send className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-600"
                  onClick={() => onDeleteDraft(draft.id)}
                  title="Delete draft"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Draft Dialog */}
      <Dialog
        open={showNewDraft}
        onOpenChange={(open) => {
          if (!open) resetDraftForm();
          setShowNewDraft(open);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Communication Draft</DialogTitle>
            <DialogDescription>
              Compose a message to the employer. No message is sent automatically — mark as sent after manual delivery.
            </DialogDescription>
          </DialogHeader>
          <DraftFormFields
            templates={templates}
            selectedTemplate={selectedTemplate}
            onTemplateChange={applyTemplate}
            subject={draftSubject}
            onSubjectChange={setDraftSubject}
            body={draftBody}
            onBodyChange={setDraftBody}
            recipient={draftRecipient}
            onRecipientChange={setDraftRecipient}
            email={draftEmail}
            onEmailChange={setDraftEmail}
            type={draftType}
            onTypeChange={setDraftType}
            grievanceContext={grievanceContext}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDraft(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveNewDraft}
              disabled={!draftSubject || !draftBody || saving}
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {saving ? "Saving…" : "Save Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Draft Dialog */}
      <Dialog
        open={!!editingDraft}
        onOpenChange={(open) => {
          if (!open) {
            setEditingDraft(null);
            resetDraftForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Draft</DialogTitle>
          </DialogHeader>
          <DraftFormFields
            templates={templates}
            selectedTemplate={""}
            onTemplateChange={() => {}}
            subject={draftSubject}
            onSubjectChange={setDraftSubject}
            body={draftBody}
            onBodyChange={setDraftBody}
            recipient={draftRecipient}
            onRecipientChange={setDraftRecipient}
            email={draftEmail}
            onEmailChange={setDraftEmail}
            type={draftType}
            onTypeChange={setDraftType}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingDraft(null);
                resetDraftForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!draftSubject || !draftBody || saving}
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Sent Confirmation */}
      <Dialog
        open={!!confirmSentId}
        onOpenChange={(open) => {
          if (!open) setConfirmSentId(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Communication Sent</DialogTitle>
            <DialogDescription>
              Mark this draft as sent? This records the communication in the employer log.
              Ensure you have already delivered the message through your preferred channel.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              This does not send any email or message. It only updates the internal record.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSentId(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSent} disabled={saving}>
              <Check className="h-3.5 w-3.5 mr-1" />
              {saving ? "Updating…" : "Mark as Sent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Draft Form Fields ────────────────────────────────────────

function DraftFormFields({
  templates,
  selectedTemplate,
  onTemplateChange,
  subject,
  onSubjectChange,
  body,
  onBodyChange,
  recipient,
  onRecipientChange,
  email,
  onEmailChange,
  type,
  onTypeChange,
  grievanceContext,
}: {
  templates: MessageTemplate[];
  selectedTemplate: string;
  onTemplateChange: (id: string) => void;
  subject: string;
  onSubjectChange: (v: string) => void;
  body: string;
  onBodyChange: (v: string) => void;
  recipient: string;
  onRecipientChange: (v: string) => void;
  email: string;
  onEmailChange: (v: string) => void;
  type: string;
  onTypeChange: (v: string) => void;
  grievanceContext?: GrievanceContext;
}) {
  return (
    <div className="space-y-4 py-2">
      {/* Template selector */}
      {templates.length > 0 && (
        <div className="space-y-1.5">
          <Label>Start from template</Label>
          <Select value={selectedTemplate} onValueChange={onTemplateChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a template…" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((tmpl) => (
                <SelectItem key={tmpl.id} value={tmpl.id}>
                  <span>{tmpl.name}</span>
                  <span className="ml-2 text-muted-foreground text-xs">
                    ({TEMPLATE_LABELS[tmpl.category]})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Grievance context badge */}
      {grievanceContext && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-3 w-3" />
          Linked to: {grievanceContext.grievanceNumber} — {grievanceContext.title}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Recipient Name</Label>
          <Input
            value={recipient}
            onChange={(e) => onRecipientChange(e.target.value)}
            placeholder="Name"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Recipient Email</Label>
          <Input
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            type="email"
            placeholder="email@employer.ca"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Communication Type</Label>
        <Select value={type} onValueChange={onTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="letter">Letter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Subject</Label>
        <Input
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Subject line"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Body</Label>
        <Textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          rows={8}
          placeholder="Compose your message…"
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}
