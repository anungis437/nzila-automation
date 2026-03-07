/**
 * Resume Draft Modal
 *
 * Shown when the grievance intake form detects an existing draft
 * in sessionStorage. Offers the user a choice to resume or discard.
 *
 * Emits audit events via CAPE audit system.
 *
 * @module components/grievances/resume-draft-modal
 */

"use client";

import * as React from "react";
import { FileText, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────

export interface ResumeDraftModalProps {
  open: boolean;
  draftSavedAt?: string;
  onResume: () => void;
  onDiscard: () => void;
}

// ─── Component ────────────────────────────────────────────────

export function ResumeDraftModal({
  open,
  draftSavedAt,
  onResume,
  onDiscard,
}: ResumeDraftModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onDiscard(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Resume Previous Draft?
          </DialogTitle>
          <DialogDescription>
            You have an unsaved grievance draft
            {draftSavedAt ? ` from ${draftSavedAt}` : ""}. Would you like to
            continue where you left off?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onDiscard}>
            <Trash2 className="h-4 w-4 mr-1.5" />
            Discard Draft
          </Button>
          <Button onClick={onResume}>
            <FileText className="h-4 w-4 mr-1.5" />
            Resume Draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
