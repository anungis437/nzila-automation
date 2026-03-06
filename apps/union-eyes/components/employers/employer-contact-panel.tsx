/**
 * Employer Contact Panel
 *
 * Contact book for employer contacts:
 * main, HR, labour relations, legal, supervisor.
 * CRUD interface with preferred communication method.
 *
 * @module components/employers/employer-contact-panel
 */

"use client";

import * as React from "react";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Star,
  MessageSquare,
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
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

export interface EmployerContactData {
  id: string;
  name: string;
  role: string;
  title?: string;
  email?: string;
  phone?: string;
  preferredMethod?: string;
  isPrimary: boolean;
  notes?: string;
}

export interface EmployerContactPanelProps {
  contacts: EmployerContactData[];
  onAdd: (contact: Omit<EmployerContactData, "id">) => Promise<void>;
  onUpdate: (id: string, contact: Partial<EmployerContactData>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  className?: string;
}

const ROLE_LABELS: Record<string, string> = {
  main: "Main Contact",
  hr: "HR",
  labour_relations: "Labour Relations",
  legal: "Legal",
  supervisor: "Supervisor",
  other: "Other",
};

// ─── Component ────────────────────────────────────────────────

export function EmployerContactPanel({
  contacts,
  onAdd,
  onUpdate,
  onDelete,
  className,
}: EmployerContactPanelProps) {
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<EmployerContactData | null>(null);
  const [saving, setSaving] = React.useState(false);

  const handleSave = async (formData: Omit<EmployerContactData, "id">) => {
    setSaving(true);
    try {
      if (editing) {
        await onUpdate(editing.id, formData);
      } else {
        await onAdd(formData);
      }
      setShowForm(false);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Employer Contacts</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No employer contacts recorded yet.
        </p>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-start gap-3 p-3 rounded-md border hover:bg-muted/30 transition-colors"
            >
              <div className="p-2 rounded-full bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{contact.name}</span>
                  {contact.isPrimary && (
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  )}
                  <Badge variant="secondary" className="text-[10px]">
                    {ROLE_LABELS[contact.role] ?? contact.role}
                  </Badge>
                </div>
                {contact.title && (
                  <p className="text-xs text-muted-foreground mt-0.5">{contact.title}</p>
                )}
                <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                  {contact.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {contact.email}
                    </span>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {contact.phone}
                    </span>
                  )}
                  {contact.preferredMethod && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> Prefers {contact.preferredMethod}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditing(contact);
                    setShowForm(true);
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-600"
                  onClick={() => onDelete(contact.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <ContactFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        initialData={editing}
        onSave={handleSave}
        saving={saving}
      />
    </Card>
  );
}

// ─── Contact Form Dialog ──────────────────────────────────────

function ContactFormDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: EmployerContactData | null;
  onSave: (data: Omit<EmployerContactData, "id">) => Promise<void>;
  saving: boolean;
}) {
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState("main");
  const [title, setTitle] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [preferredMethod, setPreferredMethod] = React.useState("email");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setRole(initialData.role);
      setTitle(initialData.title ?? "");
      setEmail(initialData.email ?? "");
      setPhone(initialData.phone ?? "");
      setPreferredMethod(initialData.preferredMethod ?? "email");
      setNotes(initialData.notes ?? "");
    } else {
      setName("");
      setRole("main");
      setTitle("");
      setEmail("");
      setPhone("");
      setPreferredMethod("email");
      setNotes("");
    }
  }, [initialData, open]);

  const handleSubmit = () => {
    onSave({
      name,
      role,
      title,
      email,
      phone,
      preferredMethod,
      isPrimary: false,
      notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Contact" : "Add Employer Contact"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main Contact</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="labour_relations">Labour Relations</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Director of Labour Relations" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@employer.ca" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(613) 555-0123" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Preferred Communication Method</Label>
            <Select value={preferredMethod} onValueChange={setPreferredMethod}>
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
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Internal notes…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name || saving}>
            {saving ? "Saving…" : initialData ? "Update" : "Add Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
